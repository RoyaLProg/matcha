import { Injectable } from '@nestjs/common';
import { Database } from 'src/database/Database';
import Chat from 'src/interface/chat.interface';
import Message from 'src/interface/message.interface';

@Injectable()
class ChatService {
	constructor(
		private database: Database
	) {}

	async createChat({ userId, targetUserId } : { userId: number, targetUserId: number }) : Promise<Chat> {
		const existingChat = await this.database.getFirstRow('chat', [], { $or: [{ userId: userId, targetUserId: targetUserId },{ userId: targetUserId, targetUserId: userId }, ], }, { user: { id: 'userId' }, targetUser: { id: 'targetUserId' } });
		if (existingChat)
			return existingChat as Chat;
		const user = await this.database.getFirstRow('users', [], { id: userId });
		const targetUser = await this.database.getFirstRow('users', [], { id: targetUserId });
		if (!user || !targetUser)
			throw new Error('User not found');
		const newChat = await this.database.addOne('chat', { userId, targetUserId, createdAt: new Date(), });
		return newChat as Chat;
	}

	async deleteChat({ userId, targetUserId } : { userId: number, targetUserId: number }) : Promise<void> {
		await this.database.deleteRows('chat', { $or: [ { userId: userId, targetUserId: targetUserId }, { userId: targetUserId, targetUserId: userId }, ], });
	}

	async sendMessage(message: Partial<Message>) : Promise<Message> {
		const chat = await this.database.getFirstRow('chat', [], { id: message.chat.id }, { user: { id: 'userId' }, targetUser: { id: 'targetUserId' } }) as Chat;
		if (!chat)
			throw new Error('Chat not found');
		if (chat.user.id != message.userId || chat.targetUser.id != message.userId)
			throw new Error('User not authorized');
		const newMessage = await this.database.addOne('message', { chatId: message.chat.id, userId: message.userId, content: message.content, createdAt: new Date(), });
		return newMessage as Message;
	}

	// private async getMessagesByChatId({ chatId } : { chatId: number }) : Promise<Message[] | undefined> {
	// 	const messages = await this.database.getRows( 'message', [], { chatId }, { user: { id: 'userId' } }) as Message[];
	// 	if (!messages || messages.length === 0)
	// 		return undefined;

	// 	return messages as Message[];
	// }

	async getChatsByUserId(userId: number) : Promise<Chat[] | undefined> {
		const chats = await this.database.getRows( 'chat', [], { $or: [{ userId: userId }, { targetUserId: userId }] }) as Chat[];
		console.log(chats)
		if (!chats || chats.length === 0)
			return undefined;
		// for (const chat of chats) {
		// 	chat.messages = await this.getMessagesByChatId({ chatId: chat.id });
		// }
		return chats as Chat[];
	}

}

export default ChatService;