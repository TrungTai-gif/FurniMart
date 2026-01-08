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
exports.AdjustStockDto = exports.WarehouseTransactionDto = exports.CreateWarehouseDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateWarehouseDto {
}
exports.CreateWarehouseDto = CreateWarehouseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID sản phẩm' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWarehouseDto.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID chi nhánh (bắt buộc cho tồn kho chi nhánh)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWarehouseDto.prototype, "branchId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tên sản phẩm' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWarehouseDto.prototype, "productName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Số lượng tồn kho' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateWarehouseDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Vị trí kho' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWarehouseDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Mức tồn kho tối thiểu' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateWarehouseDto.prototype, "minStockLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Mức tồn kho tối đa' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateWarehouseDto.prototype, "maxStockLevel", void 0);
class WarehouseTransactionDto {
}
exports.WarehouseTransactionDto = WarehouseTransactionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WarehouseTransactionDto.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], WarehouseTransactionDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['import', 'export', 'adjustment', 'damaged', 'returned']),
    __metadata("design:type", String)
], WarehouseTransactionDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WarehouseTransactionDto.prototype, "orderId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WarehouseTransactionDto.prototype, "note", void 0);
class AdjustStockDto {
}
exports.AdjustStockDto = AdjustStockDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AdjustStockDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdjustStockDto.prototype, "note", void 0);
