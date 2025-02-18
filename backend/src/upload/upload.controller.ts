import { Controller, Param, Post, Request, UploadedFiles, UseGuards, UseInterceptors, HttpException, HttpStatus, StreamableFile, Get } from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { UploadService } from "./upload.service";
import Users from "src/interface/users.interface";
import Picture from "src/interface/picture.interface";
import Chat from "src/interface/chat.interface";
import Message, { MessageType } from "src/interface/message.interface";
import { Database } from "src/database/Database";
import AuthGuard from "src/auth/auth.guard";
import { createReadStream } from "fs";
import { join } from "path";

@Controller("upload")
class UploadController {
	constructor(
		private database: Database
	) {}

	@Post('picture')
	@UseGuards(AuthGuard)
	@UseInterceptors(FilesInterceptor('files', 5, {
		storage: UploadService.fileStorage('pictures'),
		fileFilter: UploadService.fileFilter(/image\/jpeg|image\/png|image\/gif/),
	}))
	async uploadPictures(@UploadedFiles() files: Express.Multer.File[], @Request() req): Promise<Picture[]> {
		const userId = req.user.id;
		const user = await this.database.getFirstRow('users', [], { id: userId }) as Users;
		if (!user) {
			throw new HttpException('User not found', HttpStatus.NOT_FOUND);
		}
		const uploadedPictures = files.map((file, index) => ({
			url: `/upload/pictures/${file.filename}`,
			isProfile: index === 0,
		}));
		return uploadedPictures;
	}


	@Post(':chatId/video')
@UseGuards(AuthGuard)
@UseInterceptors(FileInterceptor('file', {
    storage: UploadService.fileStorage('videos'),
    fileFilter: UploadService.fileFilter(/video\/webm/), // ✅ Accepte WebM
}))
async uploadVideo(
    @Param('chatId') chatId: number, 
    @UploadedFile() file: Express.Multer.File, 
    @Request() req
) {
    const userId = req.user.id;

    const chat = await this.database.getFirstRow('chat', [], { id: chatId }) as Chat;
	if (!chat || !(chat.userId === userId || chat.targetUserId === userId)) {
        throw new HttpException('You do not have access to this chat', HttpStatus.FORBIDDEN);
    }

    const videoMessage: Partial<Message> = {
        chatId,
        userId, 
        type: MessageType.Video,
        content: null,
        fileUrl: `/uploads/videos/${file.filename}`,
    };

    const savedVideo = await this.database.addOne('message', videoMessage);
    return { message: 'Video uploaded successfully!', video: savedVideo };
}

@Post(':chatId/audio')
@UseGuards(AuthGuard)
@UseInterceptors(FileInterceptor('file', {
    storage: UploadService.fileStorage('audios'),
    fileFilter: UploadService.fileFilter(/audio\/webm/), // ✅ Accepte WebM
}))
async uploadAudio(
    @Param('chatId') chatId: number, 
    @UploadedFile() file: Express.Multer.File, 
    @Request() req
) {
    const userId = req.user.id;
	console.log(userId);
	
    const chat = await this.database.getFirstRow('chat', [], { id: chatId }) as Chat;
	console.log("🔍 Chat récupéré :", chat);
    if (!chat || !(chat.userId === userId || chat.targetUserId === userId)) {
		throw new HttpException('You do not have access to this chat', HttpStatus.FORBIDDEN);
	}
	console.log("oui");
    const audioMessage: Partial<Message> = {
        chatId,
        userId, 
        type: MessageType.Audio,
        content: null,
        fileUrl: `/uploads/audios/${file.filename}`,
    };

    const savedAudio = await this.database.addOne('message', audioMessage);
    return { message: 'Audio uploaded successfully!', audio: savedAudio };
}
}

export default UploadController;
