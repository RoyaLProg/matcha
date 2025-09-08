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
		try {
			if (history?.userId && history?.fromId) {
				const me = await this.database.getFirstRow('users', [], { id: history.userId });
				const from = await this.database.getFirstRow('users', [], { id: history.fromId });
				if ((Array.isArray(from?.blockedIds) && from.blockedIds.includes(history.userId as number)) || (Array.isArray(me?.blockedIds) && me.blockedIds.includes(history.fromId as number))) {
					return { skipped: true };
				}
			}
			const addHistory = await this.database.addOne("history", history) as History;
			return addHistory;
		} catch (e) {
			return { skipped: true };
		}
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
