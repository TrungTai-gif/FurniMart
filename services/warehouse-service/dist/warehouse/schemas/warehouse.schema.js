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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarehouseSchema = exports.Warehouse = exports.WarehouseTransaction = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let WarehouseTransaction = class WarehouseTransaction {
};
exports.WarehouseTransaction = WarehouseTransaction;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, required: true }),
    __metadata("design:type", String)
], WarehouseTransaction.prototype, "productId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], WarehouseTransaction.prototype, "productName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], WarehouseTransaction.prototype, "quantity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['import', 'export', 'adjustment', 'damaged', 'returned'] }),
    __metadata("design:type", String)
], WarehouseTransaction.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId }),
    __metadata("design:type", String)
], WarehouseTransaction.prototype, "orderId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, required: true }),
    __metadata("design:type", String)
], WarehouseTransaction.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], WarehouseTransaction.prototype, "note", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], WarehouseTransaction.prototype, "createdAt", void 0);
exports.WarehouseTransaction = WarehouseTransaction = __decorate([
    (0, mongoose_1.Schema)({ _id: false, timestamps: true })
], WarehouseTransaction);
let Warehouse = class Warehouse {
};
exports.Warehouse = Warehouse;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, required: true }),
    __metadata("design:type", String)
], Warehouse.prototype, "productId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId }),
    __metadata("design:type", String)
], Warehouse.prototype, "branchId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Warehouse.prototype, "productName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], Warehouse.prototype, "quantity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Warehouse.prototype, "reservedQuantity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Warehouse.prototype, "availableQuantity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [WarehouseTransaction], default: [] }),
    __metadata("design:type", Array)
], Warehouse.prototype, "transactions", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 10 }),
    __metadata("design:type", Number)
], Warehouse.prototype, "minStockLevel", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 100 }),
    __metadata("design:type", Number)
], Warehouse.prototype, "maxStockLevel", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Warehouse.prototype, "location", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Warehouse.prototype, "isActive", void 0);
exports.Warehouse = Warehouse = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Warehouse);
exports.WarehouseSchema = mongoose_1.SchemaFactory.createForClass(Warehouse);
// Compound unique index: productId + branchId (allows same product in different branches)
exports.WarehouseSchema.index({ productId: 1, branchId: 1 }, { unique: true, sparse: true });
// Index for branch filtering
exports.WarehouseSchema.index({ branchId: 1 });
exports.WarehouseSchema.index({ availableQuantity: 1 });
