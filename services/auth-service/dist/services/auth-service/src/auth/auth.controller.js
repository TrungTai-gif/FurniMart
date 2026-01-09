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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const passport_1 = require("@nestjs/passport");
const auth_service_1 = require("./auth.service");
const auth_dto_1 = require("./dtos/auth.dto");
const user_decorator_1 = require("../../../../shared/common/decorators/user.decorator");
const roles_decorator_1 = require("../../../../shared/common/decorators/roles.decorator");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async register(registerDto) {
        return this.authService.register(registerDto);
    }
    async login(loginDto) {
        return this.authService.login(loginDto);
    }
    async getMe(user) {
        return user;
    }
    async refresh(body) {
        return this.authService.refreshToken(body.refreshToken);
    }
    async logout() {
        // JWT is stateless, so logout is handled client-side
        // But we provide this endpoint for consistency and potential future token blacklisting
        return { message: 'Đăng xuất thành công' };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    (0, roles_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Đăng ký tài khoản mới' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Đăng ký thành công', type: RegisterResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, roles_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Đăng nhập' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Đăng nhập thành công', type: LoginResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid credentials' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('me'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy thông tin tài khoản hiện tại' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User info retrieved', type: UserResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getMe", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, roles_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Làm mới access token' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Làm mới token thành công', type: LoginResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid refresh token', type: ErrorResponseDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, swagger_1.ApiOperation)({ summary: 'Đăng xuất' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Đăng xuất thành công' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
