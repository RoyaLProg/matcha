interface IHistory {
	id?: number;
	fromId: number;
	userId: number;
	message: string;
	createdAt?: Date;
	isReaded: boolean;
}

export default IHistory;
