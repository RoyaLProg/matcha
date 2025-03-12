import { Controller, UseGuards, Post, Request, Body, Param, NotFoundException } from '@nestjs/common';
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
	async report(@Request() req: any, @Body() { type }: any, @Param('id') id: number){
		try {
			const user = await this.userService.findOne(id);
			if (!user)
				throw new NotFoundException('user does not exist');
		} catch (e) {
			throw new NotFoundException('user does not exist');
		}

		const report: IReport = {
			from: req.user.id,
			userId: id,
			type: type,
		}
		
		return this.reportService.addReport(report);
	}

}

export default ReportController;
