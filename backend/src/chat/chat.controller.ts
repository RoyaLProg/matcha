import { Body, Controller, Get, HttpException, HttpStatus, Post, Query, Request, UseGuards } from '@nestjs/common';
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
	async sendMessage(@Body()  message: Partial<Message> ) : Promise<Message> {
		try {
			return await this.chatService.sendMessage(message);
		}catch (err) {
			throw new HttpException(
				err.message || 'Failed to send message',
				HttpStatus.BAD_REQUEST
			)
		}
	}

	@Get('me')
	@UseGuards(AuthGuard)
	async getChatsMe(@Request() req) : Promise<Chat[] | undefined> {
		try {
			console.log(req.user.id)
			return await this.chatService.getChatsByUserId(req.user.id);
		}catch (err) {
			throw new HttpException(
				err.message || 'Failed to get chats',
				HttpStatus.BAD_REQUEST
			)
		}
	}

}

export default ChatController;
