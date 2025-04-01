import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Database } from 'src/database/Database';
import Chat from 'src/interface/chat.interface';
import Message from 'src/interface/message.interface';
import UserService from 'src/user/user.service';
import ChatGateway from './chat.gateway';
import { SocketsService } from 'src/sockets.service';
import HistoryService from 'src/history/history.service';
import Users from 'src/interface/users.interface';

@Injectable()
class ChatService {
	constructor(
		private database: Database,
		private readonly userService: UserService,
		@Inject(forwardRef(() => ChatGateway))
		private readonly chatGateway: ChatGateway,
		private readonly socketService: SocketsService,
		private readonly historyService: HistoryService,
	) {}

	async createChat({ userId, targetUserId } : { userId: number, targetUserId: number }) : Promise<Chat> {
		const existingChat1 = await this.database.getFirstRow('chat', [], { userId: userId, targetUserId: targetUserId });
		const existingChat2 = await this.database.getFirstRow('chat', [], { userId: targetUserId, targetUserId: userId });
		if (existingChat1) return existingChat1 as Chat;
		if (existingChat2) return existingChat2 as Chat;
		const user = await this.database.getFirstRow('users', [], { id: userId });
		const targetUser = await this.database.getFirstRow('users', [], { id: targetUserId });
		if (!user || !targetUser) {
			throw new Error('User not found');
		}
		const newChat = await this.database.addOne('chat', { userId, targetUserId }) as Chat;
		newChat.messages = [];
		newChat.user = await this.userService.findOne(newChat.userId as number);
		newChat.targetUser = await this.userService.findOne(newChat.targetUserId as number);
		['settings', 'password', 'email'].forEach(field => {
			delete newChat.user[field];
			delete newChat.targetUser[field];
		});
		const socketUserId = this.socketService.getSocketByUserId(newChat.userId.toString());
		const socketTargetUserId = this.socketService.getSocketByUserId(newChat.targetUserId.toString());
		delete newChat.userId;
		delete newChat.targetUserId;
		if (socketUserId)
			socketUserId.emit('newChat', newChat );
		if (socketTargetUserId)
			socketTargetUserId.emit('newChat', newChat );
		return newChat;
	}

	async deleteChat({ userId, targetUserId } : { userId: number, targetUserId: number }) : Promise<void> {
		await this.database.deleteRows('chat', { userId: userId, targetUserId: targetUserId });
		await this.database.deleteRows('chat', { userId: targetUserId, targetUserId: userId });
	}

	async sendMessage(message: Partial<Message>) : Promise<Message> {
		const chat = await this.database.getFirstRow('chat', [], { id: message.chatId }) as Chat;
		if (!chat)
			throw new Error('Chat not found');
		const newMessage = await this.database.addOne('message', { chatId: message.chatId, userId: message.userId, content: message.content});
		this.chatGateway.emitMessage(newMessage as Message);
		const senderId = chat.userId === message.userId ? chat.targetUserId : chat.userId;

		const sender = await this.database.getFirstRow('users', [], { id: senderId }) as Users;
		const senderName = sender?.username || '';
		await this.historyService.pushHistory({
			userId: message.userId!,
			fromId: senderId,
			message: `${senderName} sent you a message`,
			isReaded: false,
			createdAt: new Date()
		});

		return newMessage as Message;
	}

	async getMessagesByChatId(chatId: number) : Promise<Message[] | undefined> {
		const messages = await this.database.getRows('message', [], { chatId: chatId }) as Message[];
		if (messages.length == 0)
			return undefined;
		return messages as Message[];
	}

	async getChatsByUserId(userId: number) : Promise<Chat[] | undefined> {
		const chats1 = await this.database.getRows( 'chat', [], { userId: userId  }) as Chat[];
		const chats2 = await this.database.getRows( 'chat', [], { targetUserId: userId }) as Chat[];
		const allChats = [...chats1, ...chats2];
		if (allChats.length === 0)
			return undefined;
		for (const chat of allChats) {
			chat.messages = await this.getMessagesByChatId(chat.id);
			chat.user = await this.userService.findOne(chat.userId as number);
			chat.targetUser = await this.userService.findOne(chat.targetUserId as number);
			delete chat.user.settings
			delete chat.user.password
			delete chat.user.email
			delete chat.targetUser.settings
			delete chat.targetUser.password
			delete chat.targetUser.email
			delete chat.userId
			delete chat.targetUserId
		}
		return allChats as Chat[];
	}

	async getUserIdChat(userId: number, chatId: number) : Promise<boolean>{
		const chat = await this.database.getFirstRow('chat', [], { id: chatId }) as Chat;

		if (!chat) return false;

		return chat.userId === userId || chat.targetUserId === userId;
	}

}

export default ChatService;
