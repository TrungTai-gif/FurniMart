import { Controller, Get, Post, Put, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '@shared/common/decorators/roles.decorator';
import { RolesGuard } from '@shared/common/guards/roles.guard';
import { ChatService } from './chat.service';
import { CreateChatDto, SendMessageDto, UpdateChatStatusDto } from './dtos/chat.dto';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Tạo hoặc lấy cuộc trò chuyện (Customer)' })
  async createOrGetChat(@Request() req: any, @Body() createChatDto?: CreateChatDto) {
    return this.chatService.createOrGetChat(req.user.userId, req.user.name, createChatDto);
  }

  @Post(':chatId/message')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Gửi tin nhắn' })
  async sendMessage(
    @Param('chatId') chatId: string,
    @Request() req: any,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(
      chatId,
      req.user.userId,
      req.user.name,
      req.user.role,
      sendMessageDto,
    );
  }

  @Get('my-chats')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Lấy danh sách chat của tôi' })
  async getMyChats(@Request() req: any) {
    if (req.user.role === 'customer') {
      return this.chatService.getChatsByCustomer(req.user.userId);
    } else {
      return this.chatService.getOpenChats(req.user.userId);
    }
  }

  @Get('open')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('employee', 'admin')
  @ApiOperation({ summary: 'Lấy danh sách chat mở (Employee/Admin)' })
  async getOpenChats(@Request() req: any) {
    return this.chatService.getOpenChats(req.user.role === 'admin' ? undefined : req.user.userId);
  }

  @Get(':chatId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Lấy chi tiết cuộc trò chuyện' })
  async getChatById(@Param('chatId') chatId: string) {
    return this.chatService.getChatById(chatId);
  }

  @Put(':chatId/assign')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('employee', 'admin')
  @ApiOperation({ summary: 'Phân công chat cho nhân viên' })
  async assignToEmployee(@Param('chatId') chatId: string, @Request() req: any) {
    return this.chatService.assignToEmployee(chatId, req.user.userId);
  }

  @Put(':chatId/status')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('employee', 'admin')
  @ApiOperation({ summary: 'Cập nhật trạng thái chat' })
  async updateStatus(
    @Param('chatId') chatId: string,
    @Body() updateStatusDto: UpdateChatStatusDto,
  ) {
    return this.chatService.updateStatus(chatId, updateStatusDto);
  }

  @Put(':chatId/read')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Đánh dấu đã đọc' })
  async markAsRead(@Param('chatId') chatId: string, @Request() req: any) {
    return this.chatService.markAsRead(chatId, req.user.role === 'customer' ? 'customer' : 'employee');
  }
}

