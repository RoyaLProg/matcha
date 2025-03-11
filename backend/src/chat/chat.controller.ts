import { Body, Controller, Get, HttpException, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import ChatService from './chat.service';
import Chat from 'src/interface/chat.interface';
import Message from 'src/interface/message.interface';
import AuthGuard from 'src/auth/auth.guard';
@Controller('chat')
class ChatController {
	constructor(
		private chatService: ChatService
	) {}

	@Post('sendmessage')
	@UseGuards(AuthGuard)
	async sendMessage(@Body() body: any) : Promise<Message> {
		try {
			return await this.chatService.sendMessage(body.message);
		}catch (err) {
			throw new HttpException(
				err.message || 'Failed to send message',
				HttpStatus.BAD_REQUEST
			)
		}
	}

	@Get()
	@UseGuards(AuthGuard)
	async getChatsMe(@Request() req) : Promise<Chat[]> {
		try {
			const chat = await this.chatService.getChatsByUserId(req.user.id) ?? [];
			return chat;
		}catch (err) {
			throw new HttpException(
				err.message || 'Failed to get chats',
				HttpStatus.BAD_REQUEST
			)
		}
	}

}

export default ChatController;
