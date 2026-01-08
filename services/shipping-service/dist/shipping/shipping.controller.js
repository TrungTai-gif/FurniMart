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
exports.ShippingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const passport_1 = require("@nestjs/passport");
const shipping_service_1 = require("./shipping.service");
const shipping_dto_1 = require("./dtos/shipping.dto");
const user_decorator_1 = require("../../../../shared/dist/common/decorators/user.decorator");
const roles_decorator_1 = require("../../../../shared/dist/common/decorators/roles.decorator");
const roles_guard_1 = require("../../../../shared/dist/common/guards/roles.guard");
let ShippingController = class ShippingController {
    constructor(shippingService) {
        this.shippingService = shippingService;
    }
    async getByOrderId(orderId) {
        return this.shippingService.findByOrderId(orderId);
    }
    async getMyDeliveries(userId) {
        return this.shippingService.findByShipperId(userId);
    }
    async updateStatus(orderId, updateDto, user) {
        const performedBy = {
            id: user.userId || user.id,
            name: user.name || user.username || 'Shipper',
            role: user.role || 'shipper',
        };
        return this.shippingService.updateStatus(orderId, updateDto, performedBy);
    }
    async getDeliveryHistory(userId) {
        return this.shippingService.findByShipperId(userId);
    }
};
exports.ShippingController = ShippingController;
__decorate([
    (0, common_1.Get)('order/:orderId'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy thông tin vận chuyển của đơn' }),
    __param(0, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ShippingController.prototype, "getByOrderId", null);
__decorate([
    (0, common_1.Get)('my-deliveries'),
    (0, roles_decorator_1.Roles)('shipper'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách giao hàng của tôi (Shipper)' }),
    __param(0, (0, user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ShippingController.prototype, "getMyDeliveries", null);
__decorate([
    (0, common_1.Put)('order/:orderId/update'),
    (0, roles_decorator_1.Roles)('shipper', 'employee', 'admin', 'branch_manager'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Cập nhật trạng thái vận chuyển (chỉ shipper được assign)' }),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, shipping_dto_1.UpdateShippingDto, Object]),
    __metadata("design:returntype", Promise)
], ShippingController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, roles_decorator_1.Roles)('shipper'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy lịch sử giao hàng (Shipper)' }),
    __param(0, (0, user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ShippingController.prototype, "getDeliveryHistory", null);
exports.ShippingController = ShippingController = __decorate([
    (0, swagger_1.ApiTags)('Shipping'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Controller)('shipping'),
    __metadata("design:paramtypes", [shipping_service_1.ShippingService])
], ShippingController);
