import { Controller, UseGuards, Post, Request, Body, Param, NotFoundException, BadRequestException, Get } from '@nestjs/common';
import AuthGuard from 'src/auth/auth.guard';
import IReport from 'src/interface/report.interface';
import UserService from 'src/user/user.service';
import ReportService from './report.service';

@Controller('report')
class ReportController {
	constructor(
		private readonly userService: UserService,
		private readonly reportService: ReportService,
	){}

	@Post(':id')
	@UseGuards(AuthGuard)
	async report(@Request() req: any, @Body() body: any, @Param('id') id: number){
		try {
			const user = await this.userService.findOne(id);
			if (!user)
				throw new NotFoundException('user does not exist');

			const report: IReport = {
				from: req.user.id,
				userId: id,
				type: body.type,
				moreInfo: body.moreInfo
			}
			return this.reportService.addReport(report);
		} catch (e) {
			throw new BadRequestException('something went wrong');
		}	
	}

	@Get('mine')
	@UseGuards(AuthGuard)
	async listMine(@Request() req: any) {
		try {
			return await this.reportService.getReportsSentBy(req.user.id);
		} catch (e) { throw new BadRequestException('something went wrong'); }
	}

	@Get('received')
	@UseGuards(AuthGuard)
	async listReceived(@Request() req: any) {
		try {
			return await this.reportService.getReportsReceivedBy(req.user.id);
		} catch (e) { throw new BadRequestException('something went wrong'); }
	}

}

export default ReportController;
