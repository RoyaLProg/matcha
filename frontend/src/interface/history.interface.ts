interface IHistory {
	id?: number;
	userId: number;
	message: string;
	createdAt?: Date;
	isReaded: boolean;
}

export default IHistory;
