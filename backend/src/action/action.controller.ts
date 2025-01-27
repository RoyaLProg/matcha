import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import ActionService from './action.service';
import Chat from 'src/interface/chat.interface';

@Controller('action')
class ActionController {
	constructor(
		private actionService: ActionService
	) {}

	@Post('like')
	async like(@Body() { userId, targetUserId, status }) : Promise<Chat | { message: string }> {
		try {
			const actionResult = await this.actionService.handleLike({ userId, targetUserId, status });
			if (actionResult)
				return actionResult;

			return { message: 'Action completed successfully' };
		}catch (err) {
			throw new HttpException(
				err.message || 'Failed to handle action',
				HttpStatus.BAD_REQUEST
			)
		}
	}

}

export default ActionController;