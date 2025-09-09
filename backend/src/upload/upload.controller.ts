import { Controller, Param, Post, Request, UploadedFiles, UseGuards, UseInterceptors, HttpException, HttpStatus, StreamableFile, Get, UploadedFile, Catch, ExceptionFilter, ArgumentsHost } from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { UploadService } from "./upload.service";
import Users from "src/interface/users.interface";
import Picture from "src/interface/picture.interface";
import Chat from "src/interface/chat.interface";
import Message, { MessageType } from "src/interface/message.interface";
import { Database } from "src/database/Database";
import AuthGuard from "src/auth/auth.guard";
import ChatGateway from "src/chat/chat.gateway";
import { createReadStream } from "fs";
import { join } from "path";
import HistoryService from "src/history/history.service";
import { SocketsService } from "src/sockets.service";

@Controller("upload")
class UploadController {
	constructor(
		private database: Database,
		private readonly chatGateway: ChatGateway,
		private readonly historyService: HistoryService,
		private readonly socketService: SocketsService,
	) {}

	@Post('picture')
	@UseGuards(AuthGuard)
    @UseInterceptors(FilesInterceptor('files', 5, {
        storage: UploadService.fileStorage('pictures'),
        fileFilter: UploadService.fileFilter(/image\/jpeg|image\/png|image\/gif/),
        limits: { fileSize: 5 * 1024 * 1024 },
    }))
	async uploadPictures(@UploadedFiles() files: Express.Multer.File[], @Request() req): Promise<Picture[]> {
		try {
			// Vérifier si des fichiers ont été uploadés
			if (!files || files.length === 0) {
				throw new HttpException('No valid image files provided. Supported formats: JPEG, PNG, GIF', HttpStatus.BAD_REQUEST);
			}

			const userId = req.user.id;
			const user = await this.database.getFirstRow('users', [], { id: userId }) as Users;
			if (!user) {
				throw new HttpException('User not found', HttpStatus.NOT_FOUND);
			}

			// Validation supplémentaire côté serveur
			for (const file of files) {
				if (!file.mimetype.match(/^image\/(jpeg|jpg|png|gif)$/)) {
					throw new HttpException(`Invalid file format: ${file.mimetype}. Only JPEG, PNG, and GIF are allowed.`, HttpStatus.BAD_REQUEST);
				}
				
				// Vérifier la taille du fichier
				if (file.size > 5 * 1024 * 1024) {
					throw new HttpException(`File too large: ${file.originalname}. Maximum size is 5MB.`, HttpStatus.BAD_REQUEST);
				}
			}

			const uploadedPictures = files.map((file, index) => ({
				url: `/upload/pictures/${file.filename}`,
				isProfile: index === 0,
			}));
			
			return uploadedPictures;
		} catch (error) {
			// Gérer les erreurs Multer
			if (error.name === 'MulterError') {
				throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
			}
			
			// Réthrow autres HttpException
			if (error instanceof HttpException) {
				throw error;
			}
			
			// Erreur générique
			throw new HttpException('File upload failed', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}


@Post(':chatId/video')
@UseGuards(AuthGuard)
    @UseInterceptors(FileInterceptor('file', {
    storage: UploadService.fileStorage('videos'),
    fileFilter: UploadService.fileFilter(/video\/webm/),
    limits: { fileSize: 50 * 1024 * 1024 },
}))
async uploadVideo(
    @Param('chatId') chatId: number,
    @UploadedFile() file: Express.Multer.File,
    @Request() req
) {
    try {
        if (!file) {
            throw new HttpException('No valid video file provided. Supported format: WebM', HttpStatus.BAD_REQUEST);
        }

        // Validation supplémentaire
        if (!file.mimetype.match(/^video\/webm$/)) {
            throw new HttpException(`Invalid video format: ${file.mimetype}. Only WebM is allowed.`, HttpStatus.BAD_REQUEST);
        }

        if (file.size > 50 * 1024 * 1024) {
            throw new HttpException(`Video file too large: ${file.originalname}. Maximum size is 50MB.`, HttpStatus.BAD_REQUEST);
        }

        const userId = req.user.id;

        const chat = await this.database.getFirstRow('chat', [], { id: chatId }) as Chat;
        if (!chat || !(chat.userId === userId || chat.targetUserId === userId)) {
            throw new HttpException('You do not have access to this chat', HttpStatus.FORBIDDEN);
        }
        const otherId = chat.userId === userId ? chat.targetUserId : chat.userId;
        const me = await this.database.getFirstRow('users', [], { id: userId });
        const other = await this.database.getFirstRow('users', [], { id: otherId });
        if ((Array.isArray(me?.blockedIds) && me.blockedIds.includes(otherId)) || (Array.isArray(other?.blockedIds) && other.blockedIds.includes(userId))) {
          throw new HttpException('User blocked', HttpStatus.FORBIDDEN);
        }

        const videoMessage: Partial<Message> = {
            chatId,
            userId,
            type: MessageType.Video,
            content: null,
            fileUrl: `/api/upload/videos/${file.filename}`,
        };

        const savedVideo = await this.database.addOne('message', videoMessage) as Message;
        this.chatGateway.emitMessage(savedVideo);

        return { message: 'Video uploaded successfully!', video: savedVideo };
    } catch (error) {
        if (error.name === 'MulterError') {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
        
        if (error instanceof HttpException) {
            throw error;
        }
        
        throw new HttpException('Video upload failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

@Post(':chatId/audio')
@UseGuards(AuthGuard)
    @UseInterceptors(FileInterceptor('file', {
    storage: UploadService.fileStorage('audios'),
    fileFilter: UploadService.fileFilter(/audio\/webm/),
    limits: { fileSize: 10 * 1024 * 1024 },
}))
async uploadAudio(
    @Param('chatId') chatId: number,
    @UploadedFile() file: Express.Multer.File,
    @Request() req
) {
    try {
        if (!file) {
            throw new HttpException('No valid audio file provided. Supported format: WebM', HttpStatus.BAD_REQUEST);
        }

        // Validation supplémentaire
        if (!file.mimetype.match(/^audio\/webm$/)) {
            throw new HttpException(`Invalid audio format: ${file.mimetype}. Only WebM audio is allowed.`, HttpStatus.BAD_REQUEST);
        }

        if (file.size > 10 * 1024 * 1024) {
            throw new HttpException(`Audio file too large: ${file.originalname}. Maximum size is 10MB.`, HttpStatus.BAD_REQUEST);
        }

        const userId = req.user.id;

        const chat = await this.database.getFirstRow('chat', [], { id: chatId }) as Chat;
        if (!chat || !(chat.userId === userId || chat.targetUserId === userId)) {
            throw new HttpException('You do not have access to this chat', HttpStatus.FORBIDDEN);
        }
        const otherId = chat.userId === userId ? chat.targetUserId : chat.userId;
        const me = await this.database.getFirstRow('users', [], { id: userId });
        const other = await this.database.getFirstRow('users', [], { id: otherId });
        if ((Array.isArray(me?.blockedIds) && me.blockedIds.includes(otherId)) || (Array.isArray(other?.blockedIds) && other.blockedIds.includes(userId))) {
          throw new HttpException('User blocked', HttpStatus.FORBIDDEN);
        }
        
        const audioMessage: Partial<Message> = {
            chatId,
            userId,
            type: MessageType.Audio,
            content: null,
            fileUrl: `/api/upload/audios/${file.filename}`,
        };

        const savedAudio = await this.database.addOne('message', audioMessage) as Message;
        this.chatGateway.emitMessage(savedAudio);
        return { message: 'Audio uploaded successfully!', audio: savedAudio };
    } catch (error) {
        if (error.name === 'MulterError') {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
        
        if (error instanceof HttpException) {
            throw error;
        }
        
        throw new HttpException('Audio upload failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

	@Get('pictures/:file')
	@UseGuards(AuthGuard)
	async getPicture(@Param('file') file: string) {
		if (!/^[a-f0-9\-]+\.(?:png|jpe?g|gif)$/i.test(file)) {
			throw new HttpException('invalid file', HttpStatus.BAD_REQUEST);
		}
		const data = createReadStream(join(process.cwd(), 'uploads', 'pictures', file));
		return new StreamableFile(data);
	}
	@Get('videos/:file')
    @UseGuards(AuthGuard)
    async getVideo(@Param('file') file: string, @Request() req) {
        if (!/^[a-f0-9\-]+\.webm$/i.test(file)) {
            throw new HttpException('invalid file', HttpStatus.BAD_REQUEST);
        }
        const fileUrl = `/api/upload/videos/${file}`;
        const msg = await this.database.getFirstRow('message', [], { fileUrl });
        if (!msg) throw new HttpException('Not found', HttpStatus.NOT_FOUND);
        const chat = await this.database.getFirstRow('chat', [], { id: msg['chatId'] }) as Chat;
        const userId = Number(req.user.id);
        if (!chat || !(chat.userId === userId || chat.targetUserId === userId)) {
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }
        const data = createReadStream(join(process.cwd(), `/uploads/videos/${file}`));
        return new StreamableFile(data);
    }
	@Get('audios/:file')
    @UseGuards(AuthGuard)
    async getAudio(@Param('file') file: string, @Request() req) {
        if (!/^[a-f0-9\-]+\.webm$/i.test(file)) {
            throw new HttpException('invalid file', HttpStatus.BAD_REQUEST);
        }
        const fileUrl = `/api/upload/audios/${file}`;
        const msg = await this.database.getFirstRow('message', [], { fileUrl });
        if (!msg) throw new HttpException('Not found', HttpStatus.NOT_FOUND);
        const chat = await this.database.getFirstRow('chat', [], { id: msg['chatId'] }) as Chat;
        const userId = Number(req.user.id);
        if (!chat || !(chat.userId === userId || chat.targetUserId === userId)) {
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }
        const data = createReadStream(join(process.cwd(), `/uploads/audios/${file}`));
        return new StreamableFile(data);
    }

}

export default UploadController;
