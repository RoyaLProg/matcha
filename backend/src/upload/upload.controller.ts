import { Controller, Param, Post, Request, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { DataSource } from "typeorm";
import { UploadService } from "./upload.service";
import Picture from "src/entities/picture.entity";
import Users from "src/entities/users.entity";
import Chat from "src/entities/chat.entity";
import Message, { MessageType } from "src/entities/message.entity";

@Controller("upload")
class UploadController {
	constructor(
		private dataSource: DataSource
	) {}
	@Post('picture')
	@UseInterceptors(FilesInterceptor('files', 5, {
		storage: UploadService.fileStorage('pictures'),
		fileFilter: UploadService.fileFilter(/jpeg|jpg|png|gif/),
	}))
	async uploadPictures(@UploadedFiles() files: Express.Multer.File[], @Request() req) {
		const userId = req.user.id;
		const user = await this.dataSource.getRepository(Users).findOne({ where: { id: userId } });
		const savedPictures = [];
		for (const file of files) {
			const picture = this.dataSource.getRepository(Picture).create({
				url: `/uploads/pictures/${file.filename}`,
				user: user,
			});
			savedPictures.push(await this.dataSource.getRepository(Picture).save(picture));
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
		const chat = await this.dataSource.getRepository(Chat).findOne({
			where: { id: chatId },
			relations: ['user', 'targetUser'],
		});
		if (!chat || (chat.user.id !== userId && chat.targetUser.id !== userId)) {
			throw new Error('You do not have access to this chat');
		}
		const videoMessage = this.dataSource.getRepository(Message).create({
			chat,
			sender: { id: userId },
			type: MessageType.Video,
			fileUrl: `/uploads/videos/${file.filename}`,
		});
		const savedVideo = await this.dataSource.getRepository(Message).save(videoMessage);
		return { message: 'Videos uploaded successfully!', videos: savedVideo };
	}

	@Post(':chatId/audio')
	@UseInterceptors(FileInterceptor('file', {
		storage: UploadService.fileStorage('audios'),
		fileFilter: UploadService.fileFilter(/mp3|wav|ogg/),
	}))
	async uploadAudios( @Param('chatId') chatId: number, @UploadedFiles() file: Express.Multer.File, @Request() req ) {
		const userId = req.user.id;
		const chat = await this.dataSource.getRepository(Chat).findOne({
			where: { id: chatId },
			relations: ['user', 'targetUser'],
		});
		if (!chat || (chat.user.id !== userId && chat.targetUser.id !== userId)) {
			throw new Error('You do not have access to this chat');
		}
		const audioMessage = this.dataSource.getRepository(Message).create({
			chat,
			sender: { id: userId },
			type: MessageType.Audio,
			fileUrl: `/uploads/audios/${file.filename}`,
		});
		const savedAudio = await this.dataSource.getRepository(Message).save(audioMessage);
		return { message: 'Audios uploaded successfully!', audios: savedAudio };
	}
}

export default UploadController;