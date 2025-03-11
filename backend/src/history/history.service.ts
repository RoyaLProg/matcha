import { Injectable } from "@nestjs/common";
import { Database } from "src/database/Database";
import History from "src/interface/history.interface";
import { SocketsService } from "src/sockets.service";

@Injectable()
class HistoryService {
	constructor(
		private readonly database: Database,
		private readonly socketService: SocketsService
	){}

	async pushHistory(history: History): Promise<Object> {
		const addHistory = await this.database.addOne("history", history) as History;
		if (history.userId) {
			const socket = this.socketService.getSocketByUserId(history.userId.toString());
			if (socket)
				this.setAsReaded(addHistory.id as number, history.userId as number);
		}
		return addHistory;
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

	async getCountUnreaded(userId: number) {
		const history = await this.database.getRows("history", undefined, {userId: userId, isReaded: false});
		return history.length;
	}
}

export default HistoryService;
