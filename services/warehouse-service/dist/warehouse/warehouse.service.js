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
exports.WarehouseService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const warehouse_schema_1 = require("./schemas/warehouse.schema");
let WarehouseService = class WarehouseService {
    constructor(warehouseModel) {
        this.warehouseModel = warehouseModel;
    }
    async create(createWarehouseDto, userId) {
        // Check if product already exists in this branch (or globally if no branchId)
        const query = { productId: createWarehouseDto.productId };
        if (createWarehouseDto.branchId) {
            query.branchId = createWarehouseDto.branchId;
        }
        else {
            // If no branchId, check for global inventory (branchId is null/undefined)
            query.$or = [{ branchId: null }, { branchId: { $exists: false } }];
        }
        const existing = await this.warehouseModel.findOne(query).exec();
        if (existing) {
            throw new common_1.BadRequestException(createWarehouseDto.branchId
                ? 'Sản phẩm đã có trong kho chi nhánh này'
                : 'Sản phẩm đã có trong kho');
        }
        try {
            const warehouse = await this.warehouseModel.create({
                ...createWarehouseDto,
                // Ensure branchId is explicitly set or undefined (not null) for sparse index
                branchId: createWarehouseDto.branchId || undefined,
                availableQuantity: createWarehouseDto.quantity,
                reservedQuantity: 0,
            });
            // Add initial transaction
            if (createWarehouseDto.quantity > 0) {
                await this.addTransaction(warehouse._id.toString(), {
                    productId: createWarehouseDto.productId,
                    quantity: createWarehouseDto.quantity,
                    type: 'import',
                    userId,
                });
            }
            return warehouse;
        }
        catch (error) {
            // Handle duplicate key error from MongoDB
            if (error.code === 11000) {
                throw new common_1.BadRequestException(createWarehouseDto.branchId
                    ? 'Sản phẩm đã có trong kho chi nhánh này'
                    : 'Sản phẩm đã có trong kho');
            }
            throw error;
        }
    }
    async findAll(branchId) {
        const query = { isActive: true };
        if (branchId) {
            query.branchId = branchId;
        }
        return this.warehouseModel.find(query).sort({ productName: 1 }).exec();
    }
    async findById(id) {
        const warehouse = await this.warehouseModel.findById(id).exec();
        if (!warehouse) {
            throw new common_1.NotFoundException('Kho không tồn tại');
        }
        return warehouse;
    }
    async findByProductId(productId, branchId) {
        const query = { productId, isActive: true };
        if (branchId) {
            query.branchId = branchId;
        }
        return this.warehouseModel.findOne(query).exec();
    }
    async addTransaction(warehouseId, transaction) {
        const warehouse = await this.findById(warehouseId);
        const newTransaction = {
            productId: transaction.productId,
            productName: warehouse.productName,
            quantity: transaction.quantity,
            type: transaction.type,
            orderId: transaction.orderId,
            userId: transaction.userId,
            note: transaction.note,
            createdAt: new Date(),
        };
        warehouse.transactions.push(newTransaction);
        // Update quantities based on transaction type
        if (transaction.type === 'import') {
            warehouse.quantity += transaction.quantity;
            warehouse.availableQuantity += transaction.quantity;
        }
        else if (transaction.type === 'export') {
            if (warehouse.availableQuantity < Math.abs(transaction.quantity)) {
                throw new common_1.BadRequestException('Không đủ hàng trong kho');
            }
            warehouse.quantity += transaction.quantity; // quantity is negative
            warehouse.availableQuantity += transaction.quantity;
        }
        else if (transaction.type === 'adjustment') {
            warehouse.quantity = transaction.quantity;
            warehouse.availableQuantity = warehouse.quantity - warehouse.reservedQuantity;
        }
        else if (transaction.type === 'damaged' || transaction.type === 'returned') {
            warehouse.quantity += transaction.quantity; // negative
            warehouse.availableQuantity += transaction.quantity;
        }
        return warehouse.save();
    }
    async reserveStock(productId, quantity, branchId) {
        const warehouse = await this.findByProductId(productId, branchId);
        if (!warehouse) {
            throw new common_1.NotFoundException(branchId
                ? 'Sản phẩm không có trong kho chi nhánh này'
                : 'Sản phẩm không có trong kho');
        }
        if (warehouse.availableQuantity < quantity) {
            throw new common_1.BadRequestException('Không đủ hàng trong kho');
        }
        warehouse.reservedQuantity += quantity;
        warehouse.availableQuantity -= quantity;
        return warehouse.save();
    }
    async releaseReservedStock(productId, quantity, branchId) {
        const warehouse = await this.findByProductId(productId, branchId);
        if (!warehouse) {
            throw new common_1.NotFoundException(branchId
                ? 'Sản phẩm không có trong kho chi nhánh này'
                : 'Sản phẩm không có trong kho');
        }
        warehouse.reservedQuantity = Math.max(0, warehouse.reservedQuantity - quantity);
        warehouse.availableQuantity = warehouse.quantity - warehouse.reservedQuantity;
        return warehouse.save();
    }
    async adjustStock(warehouseId, adjustStockDto, userId) {
        const warehouse = await this.findById(warehouseId);
        await this.addTransaction(warehouseId, {
            productId: warehouse.productId.toString(),
            quantity: adjustStockDto.quantity - warehouse.quantity,
            type: 'adjustment',
            userId,
            note: adjustStockDto.note,
        });
        return this.findById(warehouseId);
    }
    async getLowStockItems(threshold) {
        const minStock = threshold || 10;
        return this.warehouseModel
            .find({
            isActive: true,
            availableQuantity: { $lte: minStock },
        })
            .sort({ availableQuantity: 1 })
            .exec();
    }
    async getInventory(branchId, productId) {
        const query = { isActive: true };
        if (branchId) {
            query.branchId = branchId;
        }
        if (productId) {
            query.productId = productId;
        }
        return this.warehouseModel.find(query).sort({ productName: 1 }).exec();
    }
};
exports.WarehouseService = WarehouseService;
exports.WarehouseService = WarehouseService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(warehouse_schema_1.Warehouse.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], WarehouseService);
