enum report_status {
	ONGOING = 'ongoing',
	RESOLVED = 'resolved',
	REJECTED = 'rejected',
}

enum report_type {
	OFFENSIVE = 'offensive',
	BULLY = 'bully',
	FAKE = 'fake',
}

export default interface IReport {
	id?: number,
	userId: number,
	from: number,
	moreInfo?: string,
	status?: report_status,
	type: report_type
}
