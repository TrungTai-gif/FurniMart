import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Standard error response shape across all services - INTERFACE
 */
export interface ErrorResponseDto {
    message: string;
    statusCode: number;
    code?: string;
    details?: any;
    timestamp?: string;
    path?: string;
}

/**
 * Generic paginated response wrapper - INTERFACE
 */
export interface PaginatedResponseDto<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

/**
 * Helper to create paginated response
 */
export function createPaginatedResponse<T>(
    items: T[],
    total: number,
    page: number,
    limit: number,
): PaginatedResponseDto<T> {
    const totalPages = Math.ceil(total / limit);
    return {
        items,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
}

/**
 * Standard pagination query parameters - CLASS for validation
 */
export class PaginationQueryDto {
    @ApiPropertyOptional({
        description: 'Page number (1-indexed)',
        example: 1,
        minimum: 1,
    })
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Number of items per page',
        example: 20,
        minimum: 1,
        maximum: 100,
    })
    limit?: number = 20;
}
