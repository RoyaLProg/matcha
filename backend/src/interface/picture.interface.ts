import Settings from './settings.interface';

interface Picture {
	id?: number;
	url: string;
	settings?: Settings;
	isProfile?: boolean;
}

export default Picture;
