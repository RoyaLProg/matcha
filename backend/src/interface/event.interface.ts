export default interface EventEntity {
  id?: number;
  title: string;
  description?: string;
  date?: string;
  time?: string;
  location?: string;
  organizerId: number;
  maxAttendees?: number;
  isPrivate?: boolean;
  attendeeIds?: number[];
  createdAt?: Date;
}

