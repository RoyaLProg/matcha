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
}

export default ReportService;
