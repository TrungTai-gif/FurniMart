/**
 * Shared Package - Main Export
 * 
 * Central export for all shared modules, types, and utilities
 * used across FurniMart microservices.
 */

// Export types
export * from './types';

// Export common modules
export * from './common/decorators/user.decorator';
export * from './common/decorators/roles.decorator';
export * from './common/exceptions/http-exception.filter';
export * from './common/guards/roles.guard';
export * from './common/interceptors/response.interceptor';
export * from './common/strategies/jwt.strategy';
export * from './common/base/base.controller';
export * from './common/base/base.service';
export * from './common/auth/auth.module';
export * from './common/validators/env.validator';

