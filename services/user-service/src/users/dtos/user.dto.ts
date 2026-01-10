import { IsString, IsEmail, IsOptional, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddressDto {
  @ApiProperty({ description: 'Tên người nhận' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Số điện thoại' })
  @IsString()
  phone!: string;

  @ApiProperty({ description: 'Địa chỉ đường' })
  @IsString()
  street!: string;

  @ApiProperty({ description: 'Phường/Xã' })
  @IsString()
  ward!: string;

  @ApiProperty({ description: 'Quận/Huyện' })
  @IsString()
  district!: string;

  @ApiProperty({ description: 'Thành phố' })
  @IsString()
  city!: string;

  @ApiPropertyOptional({ description: 'Địa chỉ mặc định' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Tên người dùng' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Số điện thoại' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Địa chỉ cũ (deprecated)' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'ID chi nhánh (cho employee và shipper)' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Vai trò người dùng' })
  @IsOptional()
  @IsString()
  role?: string;
}

export class AddAddressDto {
  @ApiProperty({ description: 'Thông tin địa chỉ' })
  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto;
}

export class UpdateAddressDto {
  @ApiProperty({ description: 'ID địa chỉ' })
  @IsString()
  addressId!: string;

  @ApiProperty({ description: 'Thông tin địa chỉ cập nhật' })
  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto;
}

