import { BadRequestException, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import HistoryService from "./history.service";
import AuthGuard from "src/auth/auth.guard";

@Controller('history')
class HistoryController {
	constructor(
		private readonly historyService: HistoryService
	){}

	@Post('setAsRead/:id')
	@UseGuards(AuthGuard)
	async setAsRead(@Param('id') id: number, @Req() req) {
		try {
			await this.historyService.setAsReaded(id, req.user.id);
		} catch (e) {
			throw new BadRequestException('something went wrong');
		}

		return ('ok');
	}
	@Post('setAllAsRead')
	@UseGuards(AuthGuard)
	async setAllAsRead(@Req() req) {
		try {
			await this.historyService.setAllAsReaded(req.user.id);
		} catch (e) {
			throw new BadRequestException('something went wrong');
		}

		return ('ok');
	}
	@Get()
	@UseGuards(AuthGuard)
	async getHistory(@Req() req) {
		try {
			return this.historyService.getHistory(req.user.id);
		} catch (e) {
			throw new BadRequestException('invalid request');
		}
	}
}

export default HistoryController
