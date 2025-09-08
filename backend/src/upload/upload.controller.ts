import { Controller, Param, Post, Request, UploadedFiles, UseGuards, UseInterceptors, HttpException, HttpStatus, StreamableFile, Get, UploadedFile } from "@nestjs/common";
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
    fileFilter: UploadService.fileFilter(/video\/webm/),
    limits: { fileSize: 50 * 1024 * 1024 },
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
