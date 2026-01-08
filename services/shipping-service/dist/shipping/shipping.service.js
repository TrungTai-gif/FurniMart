"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ShippingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShippingService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const axios_1 = require("@nestjs/axios");
const mongoose_2 = require("mongoose");
const rxjs_1 = require("rxjs");
const shipping_schema_1 = require("./schemas/shipping.schema");
let ShippingService = ShippingService_1 = class ShippingService {
    constructor(shippingModel, httpService) {
        this.shippingModel = shippingModel;
        this.httpService = httpService;
        this.logger = new common_1.Logger(ShippingService_1.name);
        this.ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:3005';
    }
    async create(orderId, shipperId) {
        return this.shippingModel.create({
            orderId,
            shipperId,
            status: 'pending',
        });
    }
    async findByOrderId(orderId) {
        return this.shippingModel.findOne({ orderId });
    }
    async findByShipperId(shipperId) {
        return this.shippingModel.find({ shipperId });
    }
    async updateStatus(orderId, updateDto, performedBy) {
        const tracking = await this.shippingModel.findOne({ orderId }).exec();
        if (!tracking) {
            throw new common_1.BadRequestException(`Không tìm thấy thông tin vận chuyển cho đơn hàng ${orderId}`);
        }
        // Permission check: Only assigned shipper or staff/admin can update
        if (performedBy) {
            const isAdmin = performedBy.role === 'admin' || performedBy.role === 'branch_manager';
            const isAssignedShipper = tracking.shipperId.toString() === performedBy.id;
            const isStaff = performedBy.role === 'employee' || performedBy.role === 'staff';
            if (!isAdmin && !isAssignedShipper && !isStaff) {
                throw new common_1.ForbiddenException('Bạn không có quyền cập nhật trạng thái giao hàng cho đơn hàng này');
            }
            // For shipper/staff: must be assigned to this order
            if ((performedBy.role === 'shipper' || performedBy.role === 'staff') && !isAssignedShipper) {
                throw new common_1.ForbiddenException('Chỉ shipper được phân công mới có thể cập nhật trạng thái');
            }
        }
        const oldStatus = tracking.status;
        const newStatus = updateDto.status || oldStatus;
        // Validate status transitions
        const validTransitions = {
            'assigned': ['picked_up'],
            'picked_up': ['in_transit'],
            'in_transit': ['out_for_delivery'],
            'out_for_delivery': ['delivered', 'delivery_failed'],
            'delivery_failed': ['out_for_delivery', 'returned'],
            'delivered': [], // Final state
            'returned': [], // Final state
        };
        if (oldStatus !== newStatus) {
            const allowedNextStatuses = validTransitions[oldStatus] || [];
            if (!allowedNextStatuses.includes(newStatus)) {
                throw new common_1.BadRequestException(`Không thể chuyển từ trạng thái "${oldStatus}" sang "${newStatus}". Trạng thái hợp lệ: ${allowedNextStatuses.join(', ')}`);
            }
        }
        // Validation rules for specific statuses
        if (newStatus === 'delivered') {
            // Require at least one proof of delivery
            const hasProof = (updateDto.proofOfDeliveryImages && updateDto.proofOfDeliveryImages.length > 0) ||
                updateDto.proofOfDeliveryImage ||
                updateDto.customerSignature;
            if (!hasProof) {
                throw new common_1.BadRequestException('Bắt buộc phải có ít nhất một bằng chứng giao hàng (ảnh/chữ ký) khi chuyển sang trạng thái DELIVERED');
            }
        }
        if (newStatus === 'delivery_failed') {
            // Require delivery failed reason
            if (!updateDto.deliveryFailedReason || updateDto.deliveryFailedReason.trim() === '') {
                throw new common_1.BadRequestException('Bắt buộc phải có lý do khi chuyển sang trạng thái DELIVERY_FAILED');
            }
        }
        // Add to tracking history
        const historyEntry = {
            status: updateDto.status || tracking.status,
            location: updateDto.currentLocation || tracking.currentLocation,
            note: updateDto.deliveryNote,
            timestamp: new Date(),
        };
        tracking.trackingHistory.push(historyEntry);
        // Update current status and other fields
        if (updateDto.status)
            tracking.status = updateDto.status;
        if (updateDto.currentLocation !== undefined)
            tracking.currentLocation = updateDto.currentLocation;
        // Handle proof of delivery images (support both single and multiple)
        if (updateDto.proofOfDeliveryImages && updateDto.proofOfDeliveryImages.length > 0) {
            tracking.proofOfDeliveryImages = [
                ...(tracking.proofOfDeliveryImages || []),
                ...updateDto.proofOfDeliveryImages,
            ];
        }
        else if (updateDto.proofOfDeliveryImage) {
            // Backward compatibility: single image
            if (!tracking.proofOfDeliveryImages) {
                tracking.proofOfDeliveryImages = [];
            }
            if (!tracking.proofOfDeliveryImages.includes(updateDto.proofOfDeliveryImage)) {
                tracking.proofOfDeliveryImages.push(updateDto.proofOfDeliveryImage);
            }
        }
        if (updateDto.customerSignature)
            tracking.customerSignature = updateDto.customerSignature;
        if (updateDto.deliveryNote)
            tracking.deliveryNote = updateDto.deliveryNote;
        if (updateDto.estimatedDelivery)
            tracking.estimatedDelivery = new Date(updateDto.estimatedDelivery);
        // Handle delivery failed reason and proofs
        if (updateDto.deliveryFailedReason) {
            tracking.deliveryFailedReason = updateDto.deliveryFailedReason;
        }
        if (updateDto.deliveryFailedProofs && updateDto.deliveryFailedProofs.length > 0) {
            tracking.deliveryFailedProofs = [
                ...(tracking.deliveryFailedProofs || []),
                ...updateDto.deliveryFailedProofs,
            ];
        }
        const savedTracking = await tracking.save();
        // Map shipping status to order status and update order
        if (newStatus !== oldStatus) {
            const orderStatusMap = {
                'out_for_delivery': 'OUT_FOR_DELIVERY',
                'delivered': 'DELIVERED',
                'delivery_failed': 'DELIVERY_FAILED',
                'returned': 'RETURNED',
            };
            const mappedOrderStatus = orderStatusMap[newStatus];
            if (mappedOrderStatus) {
                try {
                    await (0, rxjs_1.firstValueFrom)(this.httpService.put(`${this.ORDER_SERVICE_URL}/api/orders/${orderId}/status`, { status: mappedOrderStatus }, {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }));
                    this.logger.log(`Order ${orderId} status updated to ${mappedOrderStatus}`);
                }
                catch (error) {
                    this.logger.error(`Failed to update order status for ${orderId}: ${error.message}`, error);
                }
            }
        }
        // Create audit log via order service
        if (performedBy) {
            try {
                const statusLabels = {
                    assigned: 'Đã phân công',
                    picked_up: 'Đã lấy hàng',
                    in_transit: 'Đang vận chuyển',
                    out_for_delivery: 'Đang giao hàng',
                    delivered: 'Đã giao',
                    delivery_failed: 'Giao hàng thất bại',
                    returned: 'Đã trả hàng',
                };
                const changes = [];
                if (newStatus !== oldStatus) {
                    changes.push({
                        field: 'delivery_status',
                        oldValue: statusLabels[oldStatus] || oldStatus,
                        newValue: statusLabels[newStatus] || newStatus,
                    });
                }
                // Determine action type
                let action = 'DELIVERY_STATUS_UPDATE';
                let description = `Trạng thái giao hàng đã được cập nhật từ "${statusLabels[oldStatus] || oldStatus}" sang "${statusLabels[newStatus] || newStatus}"`;
                if (updateDto.proofOfDeliveryImages?.length || updateDto.proofOfDeliveryImage) {
                    action = 'PROOF_OF_DELIVERY_UPLOAD';
                    description = 'Đã upload bằng chứng giao hàng';
                }
                else if (updateDto.deliveryFailedReason) {
                    action = 'DELIVERY_FAILED';
                    description = `Giao hàng thất bại: ${updateDto.deliveryFailedReason}`;
                }
                const metadata = {
                    deliveryNote: updateDto.deliveryNote,
                    location: updateDto.currentLocation,
                    source: performedBy.role === 'shipper' ? 'mobile' : 'web', // Detect source from role (can be enhanced)
                };
                if (updateDto.proofOfDeliveryImages?.length) {
                    metadata.proofImages = updateDto.proofOfDeliveryImages;
                }
                else if (updateDto.proofOfDeliveryImage) {
                    metadata.proofImage = updateDto.proofOfDeliveryImage;
                }
                if (updateDto.deliveryFailedReason) {
                    metadata.deliveryFailedReason = updateDto.deliveryFailedReason;
                }
                if (updateDto.deliveryFailedProofs?.length) {
                    metadata.deliveryFailedProofs = updateDto.deliveryFailedProofs;
                }
                await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.ORDER_SERVICE_URL}/api/orders/${orderId}/audit-logs`, {
                    orderId,
                    action,
                    performedBy: {
                        id: performedBy.id,
                        name: performedBy.name,
                        role: performedBy.role || 'shipper',
                    },
                    changes: changes.length > 0 ? changes : undefined,
                    metadata,
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }));
                this.logger.log(`Created audit log for order ${orderId}: ${action}`);
            }
            catch (error) {
                this.logger.warn(`Failed to create audit log for order ${orderId}: ${error.message}`, error);
            }
        }
        return savedTracking;
    }
};
exports.ShippingService = ShippingService;
exports.ShippingService = ShippingService = ShippingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(shipping_schema_1.ShippingTracking.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        axios_1.HttpService])
], ShippingService);
