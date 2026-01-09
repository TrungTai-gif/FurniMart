"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const http_exception_filter_1 = require("../../../shared/dist/common/exceptions/http-exception.filter");
const response_interceptor_1 = require("../../../shared/dist/common/interceptors/response.interceptor");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log'],
    });
    app.setGlobalPrefix('api');
    // Enable CORS
    app.enableCors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });
    // Global Pipes
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false, // Allow extra fields that might be sent from frontend
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
        skipMissingProperties: false,
        skipNullProperties: false,
        skipUndefinedProperties: false,
    }));
    // Global Filters & Interceptors
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    // Swagger Documentation
    const config = new swagger_1.DocumentBuilder()
        .setTitle('FurniMart User Service')
        .setDescription('User Service')
        .setVersion('1.0.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const PORT = process.env.PORT || 3003;
    await app.listen(PORT);
    if (process.env.NODE_ENV !== 'production') {
        console.log(`🚀 User Service running on http://localhost:${PORT}/api`);
    }
}
bootstrap().catch((err) => {
    console.error(`❌ Failed to start user-service:`, err);
    process.exit(1);
});
