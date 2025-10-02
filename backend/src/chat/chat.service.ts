import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Database } from 'src/database/Database';
import Chat from 'src/interface/chat.interface';
import Message from 'src/interface/message.interface';
import UserService from 'src/user/user.service';
import ChatGateway from './chat.gateway';
import { SocketsService } from 'src/sockets.service';


@Injectable()
class ChatService {
	constructor(
		private database: Database,
		private readonly userService: UserService,
		@Inject(forwardRef(() => ChatGateway))
		private readonly chatGateway: ChatGateway,
		private readonly socketService: SocketsService,
	) {}

	async createChat({ userId, targetUserId } : { userId: number, targetUserId: number }) : Promise<Chat> {
		const existingChat1 = await this.database.getFirstRow('chat', [], { userId: userId, targetUserId: targetUserId });
		const existingChat2 = await this.database.getFirstRow('chat', [], { userId: targetUserId, targetUserId: userId });

		// If chat already exists, return it with full data
		if (existingChat1 || existingChat2) {
			const existingChat = (existingChat1 || existingChat2) as Chat;
			existingChat.messages = await this.getMessagesByChatId(existingChat.id) || [];
			existingChat.user = await this.userService.findOne(existingChat.userId as number);
			existingChat.targetUser = await this.userService.findOne(existingChat.targetUserId as number);
			if (existingChat.user.settings) {
				delete existingChat.user.settings.latitude;
				delete existingChat.user.settings.longitude;
			}
			delete existingChat.user.password;
			delete existingChat.user.email;
			if (existingChat.targetUser.settings) {
				delete existingChat.targetUser.settings.latitude;
				delete existingChat.targetUser.settings.longitude;
			}
			delete existingChat.targetUser.password;
			delete existingChat.targetUser.email;
			return existingChat;
		}

		const user = await this.database.getFirstRow('users', [], { id: userId });
		const targetUser = await this.database.getFirstRow('users', [], { id: targetUserId });
		if (!user || !targetUser) {
			throw new Error('User not found');
		}

		const newChat = await this.database.addOne('chat', { userId, targetUserId }) as Chat;
		newChat.messages = [];
		newChat.user = await this.userService.findOne(newChat.userId as number);
		newChat.targetUser = await this.userService.findOne(newChat.targetUserId as number);
		if (newChat.user.settings) {
			delete newChat.user.settings.latitude;
			delete newChat.user.settings.longitude;
		}
		delete newChat.user.password;
		delete newChat.user.email;
		if (newChat.targetUser.settings) {
			delete newChat.targetUser.settings.latitude;
			delete newChat.targetUser.settings.longitude;
		}
		delete newChat.targetUser.password;
		delete newChat.targetUser.email;

		// Emit to both users via WebSocket
		const socketUserId = this.socketService.getSocketByUserId(userId.toString());
		const socketTargetUserId = this.socketService.getSocketByUserId(targetUserId.toString());
		if (socketUserId)
			socketUserId.emit('newChat', newChat);
		if (socketTargetUserId)
			socketTargetUserId.emit('newChat', newChat);

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
		const sender = await this.database.getFirstRow('users', [], { id: message.userId });
		const receiverId = chat.userId === message.userId ? chat.targetUserId : chat.userId;
		const receiver = await this.database.getFirstRow('users', [], { id: receiverId });
		if ((Array.isArray(sender?.blockedIds) && sender.blockedIds.includes(receiverId)) || (Array.isArray(receiver?.blockedIds) && receiver.blockedIds.includes(message.userId))) {
			throw new Error('User blocked');
		}
		let sanitized: string | null = null;
		if (typeof message.content === 'string') {
			sanitized = message.content.replace(/<[^>]*>/g, '').slice(0, 5000);
		}
		const newMessage = await this.database.addOne('message', { chatId: message.chatId, userId: message.userId, content: sanitized});
		this.chatGateway.emitMessage(newMessage as Message);
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
			if (chat.user.settings) {
				delete chat.user.settings.latitude;
				delete chat.user.settings.longitude;
			}
			delete chat.user.password;
			delete chat.user.email;
			if (chat.targetUser.settings) {
				delete chat.targetUser.settings.latitude;
				delete chat.targetUser.settings.longitude;
			}
			delete chat.targetUser.password;
			delete chat.targetUser.email;
			delete chat.userId;
			delete chat.targetUserId;
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
