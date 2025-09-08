import { Injectable } from '@nestjs/common';
import { Database } from 'src/database/Database';
import EventEntity from 'src/interface/event.interface';

@Injectable()
export default class EventService {
  constructor(private readonly database: Database) {}

  async create(data: Partial<EventEntity>): Promise<EventEntity> {
    const maxAttendees = typeof data.maxAttendees === 'number' ? data.maxAttendees : 2;
    const isPrivate = data.isPrivate === true;
    const attendeeIds: number[] = [];
    const payload: any = {
      title: data.title,
      description: data.description ?? '',
      date: data.date ?? null,
      time: data.time ?? null,
      location: data.location ?? '',
      organizerId: data.organizerId,
      maxAttendees,
      isPrivate,
      attendeeIds,
    };
    return (await this.database.addOne('event', payload)) as EventEntity;
  }

  private async getProfileAvatarUrl(userId: number): Promise<string | undefined> {
    const settings = await this.database.getFirstRow('settings', [], { userId });
    if (!settings) return undefined;
    const pics = (await this.database.getRows('picture', [], { settingsId: settings['id'] })) as any[];
    const profile = pics.find((p) => p.isProfile) ?? pics[0];
    return profile ? `/api${profile.url}` : undefined;
  }

  async listForUser(userId: number): Promise<any[]> {
    const all = (await this.database.getRows('event', [])) as EventEntity[];
    const visible = all.filter((e) => {
      if (!e) return false;
      if (!e.isPrivate) return true;
      if (e.organizerId === userId) return true;
      const attendees = Array.isArray(e.attendeeIds) ? e.attendeeIds : [];
      return attendees.includes(userId);
    });
    const enriched = [] as any[];
    for (const ev of visible) {
      const organizer = await this.database.getFirstRow('users', [], { id: ev.organizerId });
      const organizerAvatar = await this.getProfileAvatarUrl(ev.organizerId);
      const attendeeIds = Array.isArray(ev.attendeeIds) ? ev.attendeeIds : [];
      const attendees = [] as any[];
      for (const aid of attendeeIds) {
        const u = await this.database.getFirstRow('users', [], { id: aid });
        const avatar = await this.getProfileAvatarUrl(aid);
        if (u) attendees.push({ id: u['id'], username: u['username'], firstName: u['firstName'], avatar });
      }
      enriched.push({
        ...ev,
        organizer: organizer
          ? {
              id: organizer['id'],
              username: organizer['username'],
              firstName: organizer['firstName'],
              avatar: organizerAvatar,
            }
          : undefined,
        attendees,
      });
    }
    return enriched;
  }

  async getById(id: number): Promise<EventEntity | null> {
    const ev = (await this.database.getFirstRow('event', [], { id })) as EventEntity | undefined;
    return ev ?? null;
  }

  async join(eventId: number, userId: number): Promise<EventEntity> {
    const ev = await this.getById(eventId);
    if (!ev) throw new Error('Event not found');
    if (ev.organizerId === userId) return ev;
    const attendees = Array.isArray(ev.attendeeIds) ? [...ev.attendeeIds] : [];
    if (!attendees.includes(userId)) attendees.push(userId);
    if (typeof ev.maxAttendees === 'number' && attendees.length > ev.maxAttendees) {
      throw new Error('Event full');
    }
    await this.database.updateRows('event', { attendeeIds: attendees }, { id: eventId });
    return (await this.getById(eventId)) as EventEntity;
  }

  async leave(eventId: number, userId: number): Promise<EventEntity> {
    const ev = await this.getById(eventId);
    if (!ev) throw new Error('Event not found');
    let attendees = Array.isArray(ev.attendeeIds) ? [...ev.attendeeIds] : [];
    attendees = attendees.filter((id) => id !== userId);
    await this.database.updateRows('event', { attendeeIds: attendees }, { id: eventId });
    return (await this.getById(eventId)) as EventEntity;
  }

  async remove(eventId: number, requesterId: number): Promise<void> {
    const ev = await this.getById(eventId);
    if (!ev) throw new Error('Event not found');
    if (ev.organizerId !== requesterId) throw new Error('Forbidden');
    await this.database.deleteRows('event', { id: eventId });
  }
}
