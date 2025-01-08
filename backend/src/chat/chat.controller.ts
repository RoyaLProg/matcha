import { Body, Controller, Get, HttpException, HttpStatus, Post, Query } from '@nestjs/common';
import ChatService from './chat.service';
import Chat from 'src/entities/chat.entity';
import Message from 'src/entities/message.entity';
import e from 'express';

@Controller('chat')
class ChatController {
	constructor(
		private chatService: ChatService
	) {}

	@Post('sendmessage')
	async sendMessage(@Body() { userId, targetUserId, message }) : Promise<Message> {
		try {
			return await this.chatService.sendMessage({ userId, targetUserId, message });
		}catch (err) {
			throw new HttpException(
				err.message || 'Failed to send message',
				HttpStatus.BAD_REQUEST
			)
		}
	}

	@Get()
	async getChatsByUserId(@Query('userId') userId: number) : Promise<Chat[] | undefined> {
		if (!userId) {
			throw new HttpException('UserId is required', HttpStatus.BAD_REQUEST);
		  }
		try {
			return await this.chatService.getChatsByUserId({ userId });
		}catch (err) {
			throw new HttpException(
				err.message || 'Failed to get chats',
				HttpStatus.BAD_REQUEST
			)
		}
	}

	@Get(':id/messages')
	async getMessagesByChatId(@Query('chatId') chatId: number) : Promise<Message[] | undefined> {
		if (!chatId) {
			throw new HttpException('ChatId is required', HttpStatus.BAD_REQUEST);
		  }
		try {
			// return await this.chatService.getMessagesByChatId({ chatId });
			return undefined
		}catch (err) {
			throw new HttpException(
				err.message || 'Failed to get messages',
				HttpStatus.BAD_REQUEST
			)
		}
	}
}

export default ChatController;