"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarehouseModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const warehouse_controller_1 = require("./warehouse.controller");
const warehouse_service_1 = require("./warehouse.service");
const warehouse_schema_1 = require("./schemas/warehouse.schema");
const roles_guard_1 = require("../../../../shared/dist/common/guards/roles.guard");
const auth_module_1 = require("../../../../shared/dist/common/auth/auth.module");
let WarehouseModule = class WarehouseModule {
};
exports.WarehouseModule = WarehouseModule;
exports.WarehouseModule = WarehouseModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: warehouse_schema_1.Warehouse.name, schema: warehouse_schema_1.WarehouseSchema }]),
            auth_module_1.AuthModule,
        ],
        controllers: [warehouse_controller_1.WarehouseController],
        providers: [warehouse_service_1.WarehouseService, roles_guard_1.RolesGuard],
        exports: [warehouse_service_1.WarehouseService],
    })
], WarehouseModule);
