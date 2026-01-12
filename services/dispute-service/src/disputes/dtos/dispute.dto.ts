import { IsString, IsOptional, IsArray, IsEnum, IsNumber, Min } from 'class-validator';

export class CreateDisputeDto {
  @IsString()
  orderId!: string;

  @IsEnum(['quality', 'damage', 'missing', 'wrong_item', 'delivery', 'payment', 'other'])
  type!: string;

  @IsString()
  reason!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

export class UpdateDisputeDto {
  @IsOptional()
  @IsEnum(['pending', 'reviewing', 'resolved', 'rejected', 'escalated'])
  status?: string;

  @IsOptional()
  @IsString()
  reviewNote?: string;

  @IsOptional()
  @IsString()
  resolution?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  refundAmount?: number;
}

