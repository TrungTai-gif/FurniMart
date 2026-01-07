import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dtos/auth.dto';
import { CurrentUser } from '@shared/common/decorators/user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập' })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Lấy thông tin tài khoản hiện tại' })
  async getMe(@CurrentUser() user: any) {
    return user;
  }

  @Post('logout')
  @ApiOperation({ summary: 'Đăng xuất' })
  @ApiResponse({ status: 200, description: 'Đăng xuất thành công' })
  async logout() {
    // JWT is stateless, so logout is handled client-side
    // But we provide this endpoint for consistency and potential future token blacklisting
    return { message: 'Đăng xuất thành công' };
  }
}

