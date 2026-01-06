import { IsString, IsNumber, IsArray, IsOptional, Min, Max } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  productId!: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  comment!: string;

  @IsString()
  customerName!: string;

  @IsOptional()
  @IsArray()
  images?: string[];
}
