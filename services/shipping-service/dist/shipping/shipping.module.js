"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShippingModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const mongoose_1 = require("@nestjs/mongoose");
const shipping_service_1 = require("./shipping.service");
const shipping_controller_1 = require("./shipping.controller");
const shipping_schema_1 = require("./schemas/shipping.schema");
const auth_module_1 = require("../../../../shared/dist/common/auth/auth.module");
let ShippingModule = class ShippingModule {
};
exports.ShippingModule = ShippingModule;
exports.ShippingModule = ShippingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: shipping_schema_1.ShippingTracking.name, schema: shipping_schema_1.ShippingTrackingSchema }]),
            axios_1.HttpModule.register({
                timeout: 5000,
                maxRedirects: 5,
            }),
            auth_module_1.AuthModule,
        ],
        controllers: [shipping_controller_1.ShippingController],
        providers: [shipping_service_1.ShippingService],
        exports: [shipping_service_1.ShippingService],
    })
], ShippingModule);
