import { Controller, Post, Body, HttpException, HttpStatus, Get, UseGuards, Request } from '@nestjs/common';
import ActionService from './action.service';
import Chat from 'src/interface/chat.interface';
import MatchService from './match.service';
import { get } from 'http';
import AuthGuard from 'src/auth/auth.guard';

@Controller('action')
class ActionController {
	constructor(
		private actionService: ActionService,
		private matchService: MatchService
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

	@Get('matches')
	@UseGuards(AuthGuard)
	async getMatches(@Request() req) : Promise<any> {
		console.log('coucvou', req.user.id)
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