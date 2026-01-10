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
exports.WarehouseController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const passport_1 = require("@nestjs/passport");
const roles_decorator_1 = require("../../../../shared/dist/common/decorators/roles.decorator");
const roles_guard_1 = require("../../../../shared/dist/common/guards/roles.guard");
const warehouse_service_1 = require("./warehouse.service");
const warehouse_dto_1 = require("./dtos/warehouse.dto");
let WarehouseController = class WarehouseController {
    constructor(warehouseService) {
        this.warehouseService = warehouseService;
    }
    async create(req, createWarehouseDto) {
        return this.warehouseService.create(createWarehouseDto, req.user.userId);
    }
    async findAll(branchId, productId, req) {
        const user = req?.user;
        // 4: Branch Manager và Employee chỉ được xem inventory của branch mình
        if (user?.role === 'branch_manager' || user?.role === 'employee') {
            if (!user?.branchId) {
                throw new common_1.BadRequestException('User must be assigned to a branch to view inventory.');
            }
            branchId = user.branchId; // Override branchId with user's assigned branch
        }
        if (branchId || productId) {
            return this.warehouseService.getInventory(branchId, productId);
        }
        return this.warehouseService.findAll(branchId);
    }
    async getInventory(branchId, productId, req) {
        const user = req?.user;
        // 4: Branch Manager và Employee chỉ được xem inventory của branch mình
        if (user?.role === 'branch_manager' || user?.role === 'employee') {
            if (!user?.branchId) {
                throw new common_1.BadRequestException('User must be assigned to a branch to view inventory.');
            }
            branchId = user.branchId; // Override branchId with user's assigned branch
        }
        return this.warehouseService.getInventory(branchId, productId);
    }
    async getLowStockItems(threshold) {
        return this.warehouseService.getLowStockItems(threshold ? parseInt(threshold) : undefined);
    }
    async findByProductId(productId) {
        return this.warehouseService.findByProductId(productId);
    }
    async findById(id) {
        return this.warehouseService.findById(id);
    }
    async addTransaction(id, req, transactionDto) {
        return this.warehouseService.addTransaction(id, { ...transactionDto, userId: req.user.userId });
    }
    async adjustStock(id, req, adjustStockDto) {
        return this.warehouseService.adjustStock(id, adjustStockDto, req.user.userId);
    }
    async reserveStock(productId, body) {
        return this.warehouseService.reserveStock(productId, body.quantity, body.branchId);
    }
    async releaseReservedStock(productId, body) {
        return this.warehouseService.releaseReservedStock(productId, body.quantity, body.branchId);
    }
};
exports.WarehouseController = WarehouseController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('branch_manager') // 3: Admin không được chỉnh tồn kho hằng ngày
    ,
    (0, swagger_1.ApiOperation)({ summary: 'Tạo kho mới (Manager only - Admin không được tạo)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, warehouse_dto_1.CreateWarehouseDto]),
    __metadata("design:returntype", Promise)
], WarehouseController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'branch_manager', 'employee'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách kho (Admin/Manager)' }),
    __param(0, (0, common_1.Query)('branchId')),
    __param(1, (0, common_1.Query)('productId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], WarehouseController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('inventory'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'branch_manager', 'employee'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách tồn kho (có thể filter theo branchId và productId)' }),
    __param(0, (0, common_1.Query)('branchId')),
    __param(1, (0, common_1.Query)('productId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], WarehouseController.prototype, "getInventory", null);
__decorate([
    (0, common_1.Get)('low-stock'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'branch_manager'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy sản phẩm sắp hết hàng (Admin/Manager)' }),
    __param(0, (0, common_1.Query)('threshold')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WarehouseController.prototype, "getLowStockItems", null);
__decorate([
    (0, common_1.Get)('product/:productId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'branch_manager'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy thông tin kho theo sản phẩm' }),
    __param(0, (0, common_1.Param)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WarehouseController.prototype, "findByProductId", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'branch_manager'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy chi tiết kho' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WarehouseController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(':id/transaction'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('branch_manager', 'employee') // 3: Admin không được chỉnh tồn kho
    ,
    (0, swagger_1.ApiOperation)({ summary: 'Thêm giao dịch kho (Manager/Employee only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, warehouse_dto_1.WarehouseTransactionDto]),
    __metadata("design:returntype", Promise)
], WarehouseController.prototype, "addTransaction", null);
__decorate([
    (0, common_1.Put)(':id/adjust'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('branch_manager', 'employee') // 3: Admin không được chỉnh tồn kho
    ,
    (0, swagger_1.ApiOperation)({ summary: 'Điều chỉnh tồn kho (Manager/Employee only - Admin view-only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, warehouse_dto_1.AdjustStockDto]),
    __metadata("design:returntype", Promise)
], WarehouseController.prototype, "adjustStock", null);
__decorate([
    (0, common_1.Post)('reserve/:productId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'branch_manager', 'employee'),
    (0, swagger_1.ApiOperation)({ summary: 'Đặt trước hàng (khi tạo đơn hàng)' }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WarehouseController.prototype, "reserveStock", null);
__decorate([
    (0, common_1.Post)('release/:productId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'branch_manager', 'employee'),
    (0, swagger_1.ApiOperation)({ summary: 'Giải phóng hàng đã đặt (khi hủy đơn)' }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WarehouseController.prototype, "releaseReservedStock", null);
exports.WarehouseController = WarehouseController = __decorate([
    (0, swagger_1.ApiTags)('Warehouse'),
    (0, common_1.Controller)('warehouse'),
    __metadata("design:paramtypes", [warehouse_service_1.WarehouseService])
], WarehouseController);
