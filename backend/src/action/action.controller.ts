import { Controller, Post, Body, HttpException, HttpStatus, Get, UseGuards, Request } from '@nestjs/common';
import ActionService from './action.service';
import Chat from 'src/interface/chat.interface';
import MatchService from './match.service';
import AuthGuard from 'src/auth/auth.guard';
import HistoryService from 'src/history/history.service';

@Controller('action')
class ActionController {
	constructor(
		private actionService: ActionService,
		private matchService: MatchService,
		private historyService: HistoryService
	) {}

	@Post('like')
	async like(@Body() { userId, targetUserId, status }) : Promise<{ message: string, chat: null | Chat}> {
		try {
			console.log({ userId, targetUserId, status });
			const actionResult = await this.actionService.handleLike({ userId, targetUserId, status });
			await this.historyService.pushHistory({
				userId: targetUserId as Number,
				message: "a user liked your profile",	
			});
			if (actionResult)
				return { message: 'Action completed successfully', chat: actionResult };
			return { message: 'Action completed successfully', chat: null };
		}catch (err) {
			throw new HttpException(
				err.message || 'Failed to handle action',
				HttpStatus.BAD_REQUEST
			)
		}
	}

	@Get('matches')
	@UseGuards(AuthGuard)
	async getMatches(@Request() req) : Promise<any> {
		try {
			const matches = await this.matchService.getMatches(req.user.id);
			if (matches)
				return matches;
			return { message: 'No matches found' };
		}catch (err) {
			throw new HttpException(
				err.message || 'Failed to get matches',
				HttpStatus.BAD_REQUEST
			)
		}
	}
}

export default ActionController;
