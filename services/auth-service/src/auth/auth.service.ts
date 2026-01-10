import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';
import { LoginDto, RegisterDto } from './dtos/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('Email đã được đăng ký');
    }

    // Validate branchId for staff roles
    const staffRoles = ['employee', 'branch_manager', 'shipper'];
    if (registerDto.role && staffRoles.includes(registerDto.role)) {
      if (!registerDto.branchId) {
        throw new BadRequestException(`${registerDto.role} phải được gán cho một chi nhánh`);
      }
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.userService.create({
      ...registerDto,
      password: hashedPassword,
      role: registerDto.role || 'customer',
    });

    const token = this.generateToken(user);

    return {
      accessToken: token,
      refreshToken: token, // TODO: Implement proper refresh token
      user: this.formatUserResponse(user),
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const token = this.generateToken(user);

    return {
      accessToken: token,
      refreshToken: token, // TODO: Implement proper refresh token
      user: this.formatUserResponse(user),
    };
  }

  private generateToken(user: any) {
    return this.jwtService.sign({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      branchId: user.branchId?.toString(),
    });
  }

  async refreshToken(refreshToken: string) {
    try {
      // Verify the refresh token
      const payload = this.jwtService.verify(refreshToken);
      
      // Get user from database
      const user = await this.userService.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Token không hợp lệ');
      }

      // Generate new tokens
      const newToken = this.generateToken(user);

      return {
        accessToken: newToken,
        refreshToken: newToken, // TODO: Implement proper refresh token
        user: this.formatUserResponse(user),
      };
    } catch (error) {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
  }

  private formatUserResponse(user: any) {
    return {
      id: user._id.toString(),
      _id: user._id.toString(),
      email: user.email,
      fullName: user.name,
      name: user.name,
      role: user.role,
      phone: user.phone,
      address: user.address,
      branchId: user.branchId?.toString(),
      addresses: user.addresses,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

