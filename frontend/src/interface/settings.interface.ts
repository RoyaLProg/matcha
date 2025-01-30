import Picture from './picture.interface';
import Tag from './tags.interface';

export enum UserGender {
	Man = 'man',
	Woman = 'woman',
	Other = 'other',
	Undefined = 'undefined',
}

export enum UserSexualOrientation {
	Heterosexual = 'heterosexual',
	Bisexual = 'bisexual',
	Homosexual = 'homosexual',
	Undefined = 'undefined',
}

interface ISettings {
	id?: number;
	userId: string;
	country: string;
	city: string;
	latitude?: number;
	longitude?: number;
	maxDistance: number;
	geoloc: boolean;
	minAgePreference: number;
	maxAgePreference: number;
	biography: string;
	gender: UserGender;
	sexualOrientation: UserSexualOrientation;
	pictures: Picture[];
	tags: Tag[];
}

export default ISettings;
