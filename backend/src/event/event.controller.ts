import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Request, UseGuards } from '@nestjs/common';
import AuthGuard from 'src/auth/auth.guard';
import EventService from './event.service';
import EventEntity from 'src/interface/event.interface';

@Controller('event')
class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get()
  @UseGuards(AuthGuard)
  async list(@Request() req): Promise<EventEntity[]> {
    try {
      return await this.eventService.listForUser(req.user.id);
    } catch (e) {
      throw new HttpException('Failed to list events', HttpStatus.BAD_REQUEST);
    }
  }

  @Post()
  @UseGuards(AuthGuard)
  async create(@Request() req, @Body() body: any): Promise<EventEntity> {
    try {
      const title = String(body?.title || '').trim();
      if (!title) throw new Error('title required');
      const description = String(body?.description || '').slice(0, 1000);
      const date = body?.date ? String(body.date) : undefined;
      const time = body?.time ? String(body.time) : undefined;
      const location = String(body?.location || '').slice(0, 255);
      const maxAttendeesRaw = Number(body?.maxAttendees ?? 2);
      const maxAttendees = Math.max(2, Math.min(50, isFinite(maxAttendeesRaw) ? maxAttendeesRaw : 2));
      const isPrivate = Boolean(body?.isPrivate);

      if (date && isNaN(Date.parse(date))) throw new Error('invalid date');
      if (time && !/^\d{2}:\d{2}$/.test(time)) throw new Error('invalid time');

      const payload: Partial<EventEntity> = {
        title: title.slice(0, 255),
        description,
        date,
        time,
        location,
        maxAttendees,
        isPrivate,
        organizerId: req.user.id,
      };
      return await this.eventService.create(payload);
    } catch (e) {
      throw new HttpException(e.message || 'Failed to create event', HttpStatus.BAD_REQUEST);
    }
  }

  @Post(':id/join')
  @UseGuards(AuthGuard)
  async join(@Request() req, @Param('id') id: number) {
    try {
      return await this.eventService.join(Number(id), req.user.id);
    } catch (e) {
      throw new HttpException(e.message || 'Failed to join event', HttpStatus.BAD_REQUEST);
    }
  }

  @Post(':id/leave')
  @UseGuards(AuthGuard)
  async leave(@Request() req, @Param('id') id: number) {
    try {
      return await this.eventService.leave(Number(id), req.user.id);
    } catch (e) {
      throw new HttpException(e.message || 'Failed to leave event', HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async remove(@Request() req, @Param('id') id: number) {
    try {
      await this.eventService.remove(Number(id), req.user.id);
      return { ok: true };
    } catch (e) {
      throw new HttpException(e.message || 'Failed to remove event', HttpStatus.BAD_REQUEST);
    }
  }
}

export default EventController;
