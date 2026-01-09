"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcryptjs"));
const user_service_1 = require("../user/user.service");
let AuthService = class AuthService {
    constructor(userService, jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
    }
    async register(registerDto) {
        const existingUser = await this.userService.findByEmail(registerDto.email);
        if (existingUser) {
            throw new common_1.BadRequestException('Email đã được đăng ký');
        }
        // Validate branchId for staff roles
        const staffRoles = ['employee', 'branch_manager', 'shipper'];
        if (registerDto.role && staffRoles.includes(registerDto.role)) {
            if (!registerDto.branchId) {
                throw new common_1.BadRequestException(`${registerDto.role} phải được gán cho một chi nhánh`);
            }
        }
        const hashedPassword = await bcrypt.hash(registerDto.password, 10);
        const user = await this.userService.create({
            ...registerDto,
            password: hashedPassword,
            role: registerDto.role || 'customer',
        });
        const token = this.generateToken(user);
        return {
            accessToken: token,
            refreshToken: token, // TODO: Implement proper refresh token
            user: this.formatUserResponse(user),
        };
    }
    async login(loginDto) {
        const user = await this.userService.findByEmail(loginDto.email);
        if (!user) {
            throw new common_1.UnauthorizedException('Email hoặc mật khẩu không đúng');
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Email hoặc mật khẩu không đúng');
        }
        const token = this.generateToken(user);
        return {
            accessToken: token,
            refreshToken: token, // TODO: Implement proper refresh token
            user: this.formatUserResponse(user),
        };
    }
    generateToken(user) {
        return this.jwtService.sign({
            sub: user._id.toString(),
            email: user.email,
            role: user.role,
            name: user.name,
            branchId: user.branchId?.toString(),
        });
    }
    async refreshToken(refreshToken) {
        try {
            // Verify the refresh token
            const payload = this.jwtService.verify(refreshToken);
            // Get user from database
            const user = await this.userService.findById(payload.sub);
            if (!user || !user.isActive) {
                throw new common_1.UnauthorizedException('Token không hợp lệ');
            }
            // Generate new tokens
            const newToken = this.generateToken(user);
            return {
                accessToken: newToken,
                refreshToken: newToken, // TODO: Implement proper refresh token
                user: this.formatUserResponse(user),
            };
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
        }
    }
    formatUserResponse(user) {
        return {
            id: user._id.toString(),
            _id: user._id.toString(),
            email: user.email,
            fullName: user.name,
            name: user.name,
            role: user.role,
            phone: user.phone,
            address: user.address,
            branchId: user.branchId?.toString(),
            addresses: user.addresses,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_service_1.UserService,
        jwt_1.JwtService])
], AuthService);
