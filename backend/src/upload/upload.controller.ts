import { Controller, Param, Post, Request, UploadedFiles, UseInterceptors, HttpException, HttpStatus } from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { UploadService } from "./upload.service";
import Users from "src/interface/users.interface";
import Picture from "src/interface/picture.interface";
import Chat from "src/interface/chat.interface";
import Message, { MessageType } from "src/interface/message.interface";
import { Database } from "src/database/Database";

@Controller("upload")
class UploadController {
	constructor(private database: Database) {}

	@Post('picture')
	// @UseGuards(AuthGuard)
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
			url: `/uploads/pictures/${file.filename}`,
			isProfile: index === 0,
		}));
		return uploadedPictures;
	}


	@Post(':chatId/video')
	@UseInterceptors(FileInterceptor('file', {
		storage: UploadService.fileStorage('videos'),
		fileFilter: UploadService.fileFilter(/mp4|mkv|avi/),
	}))
	async uploadVideos(@Param('chatId') chatId: number, @UploadedFiles() file: Express.Multer.File, @Request() req) {
		const userId = req.user.id;
		const chat = await this.database.getFirstRow('chat', [], { id: chatId }, { user: { id: 'userId' }, targetUser: { id: 'targetUserId' } }) as Chat;

		if (!chat || (chat.user.id !== userId && chat.targetUser.id !== userId)) {
			throw new HttpException('You do not have access to this chat', HttpStatus.FORBIDDEN);
		}

		const videoMessage: Partial<Message> = {
			chat: chat,
			sender: userId,
			type: MessageType.Video,
			fileUrl: `/uploads/videos/${file.filename}`,
		};
		const savedVideo = await this.database.addOne('message', videoMessage);
		return { message: 'Videos uploaded successfully!', videos: savedVideo };
	}

	@Post(':chatId/audio')
	@UseInterceptors(FileInterceptor('file', {
		storage: UploadService.fileStorage('audios'),
		fileFilter: UploadService.fileFilter(/mp3|wav|ogg/),
	}))
	async uploadAudios(@Param('chatId') chatId: number, @UploadedFiles() file: Express.Multer.File, @Request() req) {
		const userId = req.user.id;
		const chat = await this.database.getFirstRow('chat', [], { id: chatId }, { user: { id: 'userId' }, targetUser: { id: 'targetUserId' } }) as Chat;

		if (!chat || (chat.user.id !== userId && chat.targetUser.id !== userId)) {
			throw new HttpException('You do not have access to this chat', HttpStatus.FORBIDDEN);
		}

		const audioMessage: Partial<Message> = {
			chat: chat,
			sender: userId,
			type: MessageType.Audio,
			fileUrl: `/uploads/audios/${file.filename}`,
		};
		const savedAudio = await this.database.addOne('message', audioMessage);
		return { message: 'Audios uploaded successfully!', audios: savedAudio };
	}
}

export default UploadController;
