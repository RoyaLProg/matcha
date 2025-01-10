import { Injectable } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
	static fileStorage(folder: string) {
		return diskStorage({
			destination: `./uploads/${folder}`,
			filename: (req, file, cb) => {
			const uniqueSuffix = `${uuidv4()}${extname(file.originalname)}`;
			cb(null, uniqueSuffix);
		},
	});
}

	static fileFilter(allowedTypes: RegExp) {
		return (req: any, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
			const isValid = allowedTypes.test(extname(file.originalname).toLowerCase());
			if (isValid) {
				cb(null, true);
			} else {
				cb(new Error('Unsupported file type'), false);
			}
		};
	}
}
