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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const passport_1 = require("@nestjs/passport");
const users_service_1 = require("./users.service");
const user_decorator_1 = require("../../../../shared/dist/common/decorators/user.decorator");
const roles_decorator_1 = require("../../../../shared/dist/common/decorators/roles.decorator");
const roles_guard_1 = require("../../../../shared/dist/common/guards/roles.guard");
const user_dto_1 = require("./dtos/user.dto");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    async getProfile(userId) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('Không tìm thấy người dùng');
        }
        return this.formatUserResponse(user);
    }
    async findAll(role) {
        const users = await this.usersService.findAll(role);
        return users.map((u) => this.formatUserResponse(u));
    }
    async findById(id) {
        const user = await this.usersService.findById(id);
        if (!user) {
            throw new common_1.NotFoundException('Không tìm thấy người dùng');
        }
        return this.formatUserResponse(user);
    }
    async updateProfile(userId, updateDto) {
        const user = await this.usersService.update(userId, updateDto);
        if (!user) {
            throw new common_1.NotFoundException('Không tìm thấy người dùng');
        }
        return this.formatUserResponse(user);
    }
    async update(id, updateDto) {
        const user = await this.usersService.update(id, updateDto);
        if (!user) {
            throw new common_1.NotFoundException('Không tìm thấy người dùng');
        }
        return this.formatUserResponse(user);
    }
    async addAddress(userId, addAddressDto) {
        return this.usersService.addAddress(userId, addAddressDto.address);
    }
    async updateAddress(userId, addressId, updateAddressDto) {
        return this.usersService.updateAddress(userId, addressId, updateAddressDto.address);
    }
    async deleteAddress(userId, addressId) {
        return this.usersService.deleteAddress(userId, addressId);
    }
    async setDefaultAddress(userId, addressId) {
        return this.usersService.setDefaultAddress(userId, addressId);
    }
    async delete(id) {
        const user = await this.usersService.delete(id);
        if (!user) {
            throw new common_1.NotFoundException('Không tìm thấy người dùng');
        }
        return { message: 'Đã xóa người dùng thành công' };
    }
    formatUserResponse(user) {
        const { password, ...rest } = user.toObject?.() || user;
        return rest;
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy thông tin cá nhân' }),
    __param(0, (0, user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('admin', 'branch_manager'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách người dùng (Admin/Manager)' }),
    __param(0, (0, common_1.Query)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy thông tin người dùng theo ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findById", null);
__decorate([
    (0, common_1.Put)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Cập nhật thông tin cá nhân' }),
    __param(0, (0, user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)('admin', 'branch_manager'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Cập nhật thông tin người dùng (Admin/Manager)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('addresses'),
    (0, swagger_1.ApiOperation)({ summary: 'Thêm địa chỉ mới' }),
    __param(0, (0, user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_dto_1.AddAddressDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "addAddress", null);
__decorate([
    (0, common_1.Put)('addresses/:addressId'),
    (0, swagger_1.ApiOperation)({ summary: 'Cập nhật địa chỉ' }),
    __param(0, (0, user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Param)('addressId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, user_dto_1.UpdateAddressDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateAddress", null);
__decorate([
    (0, common_1.Delete)('addresses/:addressId'),
    (0, swagger_1.ApiOperation)({ summary: 'Xóa địa chỉ' }),
    __param(0, (0, user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Param)('addressId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteAddress", null);
__decorate([
    (0, common_1.Put)('addresses/:addressId/set-default'),
    (0, swagger_1.ApiOperation)({ summary: 'Đặt địa chỉ làm mặc định' }),
    __param(0, (0, user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Param)('addressId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "setDefaultAddress", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Xóa người dùng (Admin only)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "delete", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
