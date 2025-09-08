import { Controller, Post, Body, HttpException, HttpStatus, Get, UseGuards, Request, BadRequestException } from '@nestjs/common';
import ActionService from './action.service';
import Chat from 'src/interface/chat.interface';
import MatchService from './match.service';
import AuthGuard from 'src/auth/auth.guard';
import HistoryService from 'src/history/history.service';
import { NotificationType, SocketsService } from 'src/sockets.service';

@Controller('action')
class ActionController {
	constructor(
		private actionService: ActionService,
		private matchService: MatchService,
		private historyService: HistoryService,
		private socketsService: SocketsService,
	) {}

  @Post('like')
  @UseGuards(AuthGuard)
  async like(@Request() req, @Body() { targetUserId, status }) : Promise<{ message: string, chat: null | Chat}> {
    try {
      const userId = Number(req.user.id);
      const me = await this.matchService['database'].getFirstRow('users', [], { id: userId }) as any;
      const other = await this.matchService['database'].getFirstRow('users', [], { id: targetUserId }) as any;
      if ((Array.isArray(me?.blockedIds) && me.blockedIds.includes(Number(targetUserId))) || (Array.isArray(other?.blockedIds) && other.blockedIds.includes(userId)))
        throw new BadRequestException('user blocked');

      if (status === 'like') {
        const mySettings = await this.matchService['database'].getFirstRow('settings', [], { userId }) as any;
        if (!mySettings) throw new BadRequestException('settings not found');
        const myPictures = await this.matchService['database'].getRows('picture', [], { settingsId: mySettings['id'] }) as any[];
        const hasProfile = myPictures?.some(p => p.isProfile === true);
        if (!hasProfile) throw new BadRequestException('you must set a profile picture to like');
      }
			const actionResult = await this.actionService.handleLike({ userId, targetUserId, status });

			if (actionResult) {
				await this.historyService.pushHistory({
					fromId: userId,
					userId: targetUserId,
					message: "you matched with %user%",
				});
				await this.historyService.pushHistory({
					fromId: targetUserId,
					userId: userId,
					message: "you matched with %user%",
				});
				this.socketsService.getNotificationByUserId(String(targetUserId), NotificationType.Success, 'It\'s a match!');
				this.socketsService.getNotificationByUserId(String(userId), NotificationType.Success, 'It\'s a match!');
				return { message: 'Action completed successfully', chat: actionResult };
			}
			await this.historyService.pushHistory({
				fromId: userId,
				userId: targetUserId,
				message: "%user% liked your profile",
			});
			this.socketsService.getNotificationByUserId(String(targetUserId), NotificationType.Info, 'You received a like');
			return { message: 'Action completed successfully', chat: null };
		}catch (err) {
			throw new BadRequestException(err.message || 'Failed to handle action')
		}
	}

	@Post('unlike')
	@UseGuards(AuthGuard)
	async unlike(@Request() req, @Body() { targetUserId }) : Promise<{ message: string }> {
		try {
			const userId = Number(req.user.id);
			const me = await this.matchService['database'].getFirstRow('users', [], { id: userId }) as any;
			const other = await this.matchService['database'].getFirstRow('users', [], { id: targetUserId }) as any;
			if ((Array.isArray(me?.blockedIds) && me.blockedIds.includes(Number(targetUserId))) || (Array.isArray(other?.blockedIds) && other.blockedIds.includes(userId)))
				throw new BadRequestException('user blocked');
			const actionResult = await this.actionService.handleUnlike({ userId, targetUserId });
			await this.historyService.pushHistory({ userId: targetUserId, fromId: userId, message: '%user% unliked you' });
			this.socketsService.getNotificationByUserId(String(targetUserId), NotificationType.Warning, 'Someone unliked you');
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
