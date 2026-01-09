import { Controller, Get, Put, Delete, Post, Param, Body, UseGuards, NotFoundException, Query } from '@nestjs/common';
import { Role } from '@shared/config/rbac-matrix';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CurrentUser } from '@shared/common/decorators/user.decorator';
import { Roles } from '@shared/common/decorators/roles.decorator';
import { RolesGuard } from '@shared/common/guards/roles.guard';
import { UpdateUserDto, AddAddressDto, UpdateAddressDto } from './dtos/user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Lấy thông tin cá nhân' })
  async getProfile(@CurrentUser('userId') userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return this.formatUserResponse(user);
  }

  @Get()
  @Roles(Role.ADMIN, Role.BRANCH_MANAGER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Lấy danh sách người dùng (Admin/Manager)' })
  async findAll(@Query('role') role?: string) {
    const users = await this.usersService.findAll(role);
    return users.map((u) => this.formatUserResponse(u));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin người dùng theo ID' })
  async findById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return this.formatUserResponse(user);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Cập nhật thông tin cá nhân' })
  async updateProfile(@CurrentUser('userId') userId: string, @Body() updateDto: UpdateUserDto) {
    const user = await this.usersService.update(userId, updateDto);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return this.formatUserResponse(user);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.BRANCH_MANAGER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Cập nhật thông tin người dùng (Admin/Manager)' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
    const user = await this.usersService.update(id, updateDto);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return this.formatUserResponse(user);
  }

  @Post('addresses')
  @ApiOperation({ summary: 'Thêm địa chỉ mới' })
  async addAddress(@CurrentUser('userId') userId: string, @Body() addAddressDto: AddAddressDto) {
    return this.usersService.addAddress(userId, addAddressDto.address);
  }

  @Put('addresses/:addressId')
  @ApiOperation({ summary: 'Cập nhật địa chỉ' })
  async updateAddress(
    @CurrentUser('userId') userId: string,
    @Param('addressId') addressId: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(userId, addressId, updateAddressDto.address);
  }

  @Delete('addresses/:addressId')
  @ApiOperation({ summary: 'Xóa địa chỉ' })
  async deleteAddress(@CurrentUser('userId') userId: string, @Param('addressId') addressId: string) {
    return this.usersService.deleteAddress(userId, addressId);
  }

  @Put('addresses/:addressId/set-default')
  @ApiOperation({ summary: 'Đặt địa chỉ làm mặc định' })
  async setDefaultAddress(@CurrentUser('userId') userId: string, @Param('addressId') addressId: string) {
    return this.usersService.setDefaultAddress(userId, addressId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Xóa người dùng (Admin only)' })
  async delete(@Param('id') id: string) {
    const user = await this.usersService.delete(id);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return { message: 'Đã xóa người dùng thành công' };
  }

  private formatUserResponse(user: any) {
    const { password, ...rest } = user.toObject?.() || user;
    return rest;
  }
}
