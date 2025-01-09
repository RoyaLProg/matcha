import { Injectable } from '@nestjs/common';
import Chat from 'src/entities/chat.entity';
import Message from 'src/entities/message.entity';
import Users from 'src/entities/users.entity';
import { DataSource } from 'typeorm';

@Injectable()
class ChatService {
	constructor(
		private dataSources: DataSource
	) {}

	async createChat({ userId, targetUserId } : { userId: number, targetUserId: number }) : Promise<Chat> {
		const existingChat = await this.dataSources.getRepository(Chat).findOne({ where :
			[
				{ user: { id: userId }, targetUser: { id: targetUserId } },
				{ user: { id: targetUserId }, targetUser: { id: userId } },
			],
			relations: ['user', 'targetUser'],
		})
		if (existingChat)
			return existingChat;
		const user = await this.dataSources.getRepository(Users).findOne({ where: { id: userId } });
		const targetUser = await this.dataSources.getRepository(Users).findOne({ where: { id: targetUserId } });
		if (!user || !targetUser)
			throw new Error('User not found');
		const createChat = this.dataSources.getRepository(Chat).create({
			user,
			targetUser
		});
		return await this.dataSources.getRepository(Chat).save(createChat);
	}

	async deleteChat({ userId, targetUserId } : { userId: number, targetUserId: number }) : Promise<void> {
		await this.dataSources.getRepository(Chat).delete({ user: { id: userId }, targetUser: { id: targetUserId } });
		await this.dataSources.getRepository(Chat).delete({ user: { id: targetUserId }, targetUser: { id: userId } });
	}

	async sendMessage({ userId, targetUserId, message } : { userId: number, targetUserId: number, message: string }) : Promise<Message> {
		const chat = await this.dataSources.getRepository(Chat).findOne({
			where: [
				{ user: { id: userId }, targetUser: { id: targetUserId } },
				{ user: { id: targetUserId }, targetUser: { id: userId } }
			],
			relations: ['user', 'targetUser'],
		});
		if (!chat)
			throw new Error('Chat not found');
		if (chat.user.id !== userId && chat.targetUser.id !== userId)
			throw new Error('User not authorized');
		const createMessage = this.dataSources.getRepository(Message).create({
			chat,
			sender: { id: userId },
			message
		});
		return await this.dataSources.getRepository(Message).save(createMessage);
	}

	async getChatsByUserId({ userId } : { userId: number }) : Promise<Chat[] | undefined> {
		const chats = await this.dataSources.getRepository(Chat).find({
			where: [
				{ user: { id: userId } },
				{ targetUser: { id: userId } }
			],
			relations: ['user', 'targetUser', 'messages'],
		});
		if (chats)
			return chats;
		return undefined;
	}
}

export default ChatService;