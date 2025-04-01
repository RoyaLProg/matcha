import { Controller, Post, Body, HttpException, HttpStatus, Get, UseGuards, Request, BadRequestException } from '@nestjs/common';
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
			const actionResult = await this.actionService.handleLike({ userId, targetUserId, status });

			if (actionResult) {
				await this.historyService.pushHistory({
					fromId: userId,
					userId: targetUserId,
					message: "you matched with a %user%",
				});
				await this.historyService.pushHistory({
					fromId: targetUserId,
					userId: userId,
					message: "you matched with a %user%",
				});
				return { message: 'Action completed successfully', chat: actionResult };
			}
			await this.historyService.pushHistory({
				fromId: userId,
				userId: targetUserId,
				message: "%user% liked your profile",
			});
			return { message: 'Action completed successfully', chat: null };
		}catch (err) {
			throw new BadRequestException(err.message || 'Failed to handle action')
		}
	}

	@Post('unlike')
	async unlike(@Body() { userId, targetUserId }) : Promise<{ message: string }> {
		try {
			const actionResult = await this.actionService.handleUnlike({ userId, targetUserId });
			if (actionResult)
				return { message: 'Action completed successfully' };
			return { message: 'Action completed successfully' };
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
