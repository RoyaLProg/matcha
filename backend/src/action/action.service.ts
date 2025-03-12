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

	async handleLike({ userId, targetUserId, status } : { userId: number, targetUserId: number, status: ActionStatus }) : Promise<Chat | void> {
		const userdisLike = await this.database.getFirstRow('action', [], { userId, targetUserId, status: ActionStatus.Dislike, }) as Action;
		if (userdisLike)
			await this.database.deleteRows('action', { id: userdisLike.id });
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

	async handleUnlike({ userId, targetUserId } : { userId: number, targetUserId: number }) : Promise<boolean> {
		const userLike = await this.database.getFirstRow('action', [], { userId, targetUserId, status: ActionStatus.Like, }) as Action;
		const targetUserLike = await this.database.getFirstRow('action', [], { userId: targetUserId, targetUserId: userId, status: ActionStatus.Like, }) as Action;
		if (userLike || targetUserLike) {
			if (userLike)
				await this.database.deleteRows('action', { id: userLike.id });
			if (targetUserLike)
				await this.database.deleteRows('action', { id: targetUserLike.id });
			await this.chatService.deleteChat({ userId, targetUserId });
			return true;
		}
		return false;
	}
}

export default ActionService;