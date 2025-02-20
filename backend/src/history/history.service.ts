import { Injectable } from "@nestjs/common";
import { Database } from "src/database/Database";
import History from "src/interface/history.interface";

@Injectable()
class HistoryService {
	constructor(
		private readonly database: Database
	){}

	async pushHistory(history: History): Promise<Object> {
		return this.database.addOne("history", history);
	}

	async setAsReaded(id: number, userId: number) {
		const h = await this.database.getFirstRow("history", ["userId"], {id: id});
		if (h && h['userId'] != userId) {
			throw "no";
		}
		h['isReaded'] = true;
		return this.database.updateRows("history", {...h}, {id: id});
	}

	async setAllAsReaded(userId: number) {
		return this.database.updateRows("history", {isReaded: true}, {userId: userId});
	}

	async getHistory(userId: number) {
		return this.database.getRows("history", undefined, {userId: userId});
	}
	
}

export default HistoryService;
