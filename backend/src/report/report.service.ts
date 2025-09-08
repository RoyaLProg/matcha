import {Injectable} from '@nestjs/common';
import { Database } from 'src/database/Database';
import IReport from 'src/interface/report.interface';

@Injectable()
class ReportService {
	constructor(
		private readonly database: Database
	){}

	async addReport(report: IReport) {
		return this.database.addOne('report', report);
	}

	async getReportsSentBy(userId: number): Promise<IReport[]> {
		return (await this.database.getRows('report', [], { from: userId })) as IReport[];
	}

	async getReportsReceivedBy(userId: number): Promise<IReport[]> {
		return (await this.database.getRows('report', [], { userId })) as IReport[];
	}
}

export default ReportService;
