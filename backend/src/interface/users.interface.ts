import Settings from "./settings.interface";

export enum UserStatus {
	Offline = "offline",
	Online = "online",
}

interface Users {
	id?: number;
	firstName: string;
	lastName: string;
	email: string;
	birthDate: string;
	username: string;
	password?: string;
	status?: UserStatus;
	isValidated: boolean;
	settings?: Settings;
}

export default Users;
