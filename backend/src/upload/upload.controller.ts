import { Controller, Param, Post, Request, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { UploadService } from "./upload.service";
import Users from "src/interface/users.interface";
import Picture from "src/interface/picture.interface";
import Chat from "src/interface/chat.interface";
import Message, { MessageType } from "src/interface/message.interface";
import { Database } from "src/database/Database";


@Controller("upload")
class UploadController {
	constructor(
		private database: Database
	) {}
	@Post('picture')
	@UseInterceptors(FilesInterceptor('files', 5, {
		storage: UploadService.fileStorage('pictures'),
		fileFilter: UploadService.fileFilter(/jpeg|jpg|png|gif/),
	}))
	async uploadPictures(@UploadedFiles() files: Express.Multer.File[], @Request() req) {
		const userId = req.user.id;
		const user = await this.database.getFirstRow('users', [], { id: userId }, { settings: { id: 'settingsId' } }) as Users;
		if (!user) {
			throw new Error('User not found');
		}
		const savedPictures: Picture[] = [];
		for (const file of files) {
			const picture = {
				url: `/uploads/pictures/${file.filename}`,
				settings: user.settings,
			};
			const savedPicture = await this.database.addOne('pictures', picture);
			savedPictures.push(savedPicture as Picture);
		  }
	return { message: 'Pictures uploaded successfully!', pictures: savedPictures };
	}

	@Post(':chatId/video')
	@UseInterceptors(FileInterceptor('file', {
		storage: UploadService.fileStorage('videos'),
		fileFilter: UploadService.fileFilter(/mp4|mkv|avi/),
	}))
	async uploadVideos(@Param('chatId') chatId: number, @UploadedFiles() file: Express.Multer.File, @Request() req) {
		const userId = req.user.id;
		const chat = await this.database.getFirstRow('chat',[], { id: chatId }, { user: { id: 'userId' }, targetUser: { id: 'targetUserId' } } ) as Chat;
		if (!chat || (chat.user.id !== userId && chat.targetUser.id !== userId))
			throw new Error('You do not have access to this chat');
		const videoMessage = {
			chat: chat.id,
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
	async uploadAudios( @Param('chatId') chatId: number, @UploadedFiles() file: Express.Multer.File, @Request() req ) {
		const userId = req.user.id;
		const chat = await this.database.getFirstRow( 'chat', [], { id: chatId }, { user: { id: 'userId' }, targetUser: { id: 'targetUserId' } } ) as Chat;
		if (!chat || (chat.user.id !== userId && chat.targetUser.id !== userId))
			throw new Error('You do not have access to this chat');
		const audioMessage = {
			chat: chat.id,
			sender: userId,
			type: MessageType.Audio,
			fileUrl: `/uploads/audios/${file.filename}`,
		};
		const savedAudio = await this.database.addOne('message', audioMessage);
		return { message: 'Audios uploaded successfully!', audios: savedAudio };
	}
}

export default UploadController;
