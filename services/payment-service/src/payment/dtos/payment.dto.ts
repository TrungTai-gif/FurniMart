import { IsEnum, IsNumber, IsString, IsOptional, IsObject, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Order ID' })
  @IsString()
  orderId!: string;

  @ApiProperty({ description: 'Payment method', enum: ['vnpay'], default: 'vnpay' })
  @IsEnum(['vnpay'])
  method!: string;

  @ApiProperty({ description: 'Payment amount' })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ description: 'Order description', required: false })
  @IsOptional()
  @IsString()
  orderDescription?: string;
}