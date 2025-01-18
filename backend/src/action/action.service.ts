import { Injectable, NotFoundException } from '@nestjs/common';
import ChatService from 'src/chat/chat.service';
import Action, { ActionStatus } from 'src/entities/action.entity';
import Chat from 'src/entities/chat.entity';
import { DataSource } from 'typeorm';

@Injectable()
class ActionService {
	constructor(
		private dataSources: DataSource,
		private readonly chatService: ChatService
	) {}

	async handleLike({ userId, targetUserId, status } : { userId: number, targetUserId: number, status: ActionStatus }) : Promise<Chat | void> {
		if (status === ActionStatus.Like) {
			const userLike = await this.dataSources.getRepository(Action).findOne({ where: { user: { id: userId }, targetUser: { id: targetUserId }, status: ActionStatus.Like } });
			const targetUserLike = await this.dataSources.getRepository(Action).findOne({ where: { user: { id: targetUserId }, targetUser: { id: userId }, status: ActionStatus.Like } });

			if (userLike && targetUserLike) {
				return await this.chatService.createChat({ userId, targetUserId });
			}
		} else if (status === ActionStatus.Dislike) {
			await this.chatService.deleteChat({ userId, targetUserId });
		} else {
			throw new NotFoundException(`Invalid action status: ${status}`);
		}
	}
}

export default ActionService;