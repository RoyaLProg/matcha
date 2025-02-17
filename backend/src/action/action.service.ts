import { Injectable, NotFoundException } from '@nestjs/common';
import ChatService from 'src/chat/chat.service';
import { Database } from 'src/database/Database';
import Action, { ActionStatus } from 'src/interface/action.interface';
import Chat from 'src/interface/chat.interface';

@Injectable()
class ActionService {
	constructor(
		private database: Database,
		private readonly chatService: ChatService
	) {}
// function a ameliorer dans le like dislike
	async handleLike({ userId, targetUserId, status } : { userId: number, targetUserId: number, status: ActionStatus }) : Promise<Chat | void> {
		await this.database.addOne('action', { userId, targetUserId, status });
		if (status === ActionStatus.Like) {
			const userLike = await this.database.getFirstRow('action', [], { userId, targetUserId, status: ActionStatus.Like, }) as Action;
			const targetUserLike = await this.database.getFirstRow('action', [], { userId: targetUserId, targetUserId: userId, status: ActionStatus.Like, }) as Action;

			if (userLike && targetUserLike)
				return await this.chatService.createChat({ userId, targetUserId });
		} else if (status === ActionStatus.Dislike) {
			await this.chatService.deleteChat({ userId, targetUserId });
		} else {
			throw new NotFoundException(`Invalid action status: ${status}`);
		}
	}
}

export default ActionService;