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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bcrypt = __importStar(require("bcryptjs"));
const user_schema_1 = require("./schemas/user.schema");
let UsersService = class UsersService {
    constructor(userModel) {
        this.userModel = userModel;
    }
    async create(userData) {
        return this.userModel.create(userData);
    }
    async findByEmail(email) {
        return this.userModel.findOne({
            email,
            deletedAt: { $exists: false }, // 8: Soft delete
        });
    }
    async findById(id) {
        return this.userModel.findOne({
            _id: id,
            deletedAt: { $exists: false }, // 8: Soft delete
        });
    }
    async findAll(role) {
        const query = { deletedAt: { $exists: false } }; // 8: Soft delete
        if (role) {
            query.role = role;
        }
        return this.userModel.find(query);
    }
    async update(id, userData) {
        // Hash password if provided
        if (userData.password) {
            userData.password = await bcrypt.hash(userData.password, 10);
        }
        return this.userModel.findByIdAndUpdate(id, userData, { new: true });
    }
    async delete(id) {
        // 8: Soft delete - không được xóa đơn hàng đã phát sinh
        // Check if user has orders (via order service if needed)
        // For now, just soft delete
        return this.userModel.findByIdAndUpdate(id, {
            deletedAt: new Date(), // 8: Soft delete
            isActive: false, // Also deactivate
        }, { new: true });
    }
    async addAddress(userId, address) {
        const user = await this.findById(userId);
        if (!user) {
            return null;
        }
        // Nếu đây là địa chỉ đầu tiên hoặc được đặt làm mặc định, đặt làm mặc định
        if (!user.addresses || user.addresses.length === 0 || address.isDefault) {
            if (user.addresses) {
                user.addresses.forEach((addr) => (addr.isDefault = false));
            }
            address.isDefault = true;
        }
        user.addresses = user.addresses || [];
        user.addresses.push(address);
        return user.save();
    }
    async updateAddress(userId, addressId, addressData) {
        const user = await this.findById(userId);
        if (!user || !user.addresses) {
            return null;
        }
        const addressIndex = user.addresses.findIndex((addr, index) => {
            const addrId = addr._id?.toString() || addr.id || String(index);
            return addrId === addressId;
        });
        if (addressIndex === -1) {
            return null;
        }
        // Nếu đặt làm mặc định, bỏ mặc định của các địa chỉ khác
        if (addressData.isDefault) {
            user.addresses.forEach((addr, index) => {
                if (index !== addressIndex) {
                    addr.isDefault = false;
                }
            });
        }
        user.addresses[addressIndex] = { ...user.addresses[addressIndex], ...addressData };
        return user.save();
    }
    async deleteAddress(userId, addressId) {
        const user = await this.findById(userId);
        if (!user || !user.addresses) {
            return null;
        }
        user.addresses = user.addresses.filter((addr, index) => {
            const addrId = addr._id?.toString() || addr.id || String(index);
            return addrId !== addressId;
        });
        return user.save();
    }
    async setDefaultAddress(userId, addressId) {
        const user = await this.findById(userId);
        if (!user || !user.addresses) {
            return null;
        }
        user.addresses.forEach((addr, index) => {
            const addrId = addr._id?.toString() || addr.id || String(index);
            addr.isDefault = addrId === addressId;
        });
        return user.save();
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], UsersService);
