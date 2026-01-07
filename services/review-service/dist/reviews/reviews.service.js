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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const review_schema_1 = require("./schemas/review.schema");
const base_service_1 = require("../../../../shared/dist/common/base/base.service");
let ReviewsService = class ReviewsService extends base_service_1.BaseService {
    constructor(reviewModel, httpService) {
        super();
        this.reviewModel = reviewModel;
        this.httpService = httpService;
        this.ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:3015';
        this.model = reviewModel;
    }
    // Override create to match base signature but add custom logic
    async create(createDto) {
        // This method is not used, we use createReview instead
        return this.reviewModel.create(createDto);
    }
    async createReview(customerId, createReviewDto) {
        // CUSTOMER constraint: Check if customer has purchased and order is completed
        // Check if customer has any completed order with this product
        try {
            // Use the my-orders endpoint with customerId filter (if available) or get all and filter
            const orderServiceUrl = `${this.ORDER_SERVICE_URL}/api/orders`;
            const ordersResponse = await (0, rxjs_1.firstValueFrom)(this.httpService.get(orderServiceUrl, {
                params: { customerId, limit: 100 }, // Get up to 100 orders to check
            }));
            const orders = ordersResponse.data?.items || ordersResponse.data || [];
            // Filter to only this customer's orders
            const customerOrders = Array.isArray(orders)
                ? orders.filter((order) => order.customerId === customerId || order.customerId?.toString() === customerId)
                : [];
            // 0.5: Find if customer has a DELIVERED or COMPLETED order containing this product
            const hasCompletedOrder = customerOrders.some((order) => {
                const orderStatus = order.status?.toUpperCase();
                // 0.5: Chỉ review nếu đơn DELIVERED hoặc COMPLETED (spec nói DELIVERED nhưng COMPLETED cũng hợp lệ)
                if (orderStatus !== 'DELIVERED' && orderStatus !== 'COMPLETED') {
                    return false;
                }
                return order.items?.some((item) => {
                    const itemProductId = item.productId?.toString() || item.productId;
                    const reviewProductId = createReviewDto.productId?.toString() || createReviewDto.productId;
                    return itemProductId === reviewProductId;
                });
            });
            if (!hasCompletedOrder) {
                throw new common_1.ForbiddenException('Bạn chỉ có thể đánh giá sản phẩm sau khi đã mua và nhận được hàng');
            }
            // 0.5: 1 sản phẩm trong 1 đơn chỉ được review 1 lần
            // Check if customer already reviewed this product (one review per product per customer)
            const existingReview = await this.reviewModel.findOne({
                customerId,
                productId: createReviewDto.productId,
            }).exec();
            if (existingReview) {
                throw new common_1.BadRequestException('Bạn đã đánh giá sản phẩm này rồi');
            }
        }
        catch (error) {
            if (error instanceof common_1.ForbiddenException || error instanceof common_1.BadRequestException) {
                throw error;
            }
            // If order service is unavailable, log warning but allow review (graceful degradation)
            console.warn('Could not validate order completion for review:', error.message);
        }
        return this.reviewModel.create({
            ...createReviewDto,
            customerId,
        });
    }
    async findByProductId(productId) {
        if (!productId || productId === 'undefined' || productId === 'null') {
            return [];
        }
        return this.reviewModel.find({ productId }).sort({ createdAt: -1 });
    }
    async findByCustomerId(customerId) {
        return this.reviewModel.find({ customerId });
    }
    async update(id, updateData) {
        const updated = await this.reviewModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
        if (!updated) {
            throw new common_1.BadRequestException('Review not found');
        }
        return updated;
    }
    async delete(id) {
        return this.reviewModel.findByIdAndDelete(id).exec();
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(review_schema_1.Review.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        axios_1.HttpService])
], ReviewsService);
