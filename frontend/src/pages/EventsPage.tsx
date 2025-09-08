
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import EventSystem from '../components/EventSystem';
import { useAuth } from '@/contexts/AuthContext';

interface EventEntity {
  id: number;
  title: string;
  description?: string;
  date?: string;
  time?: string;
  location?: string;
  organizerId: number;
  maxAttendees?: number;
  isPrivate?: boolean;
  attendeeIds?: number[];
  organizer?: { id: number; username?: string; firstName?: string; avatar?: string };
  attendees?: { id: number; username?: string; firstName?: string; avatar?: string }[];
}


const EventsPage = () => {
  const [events, setEvents] = useState<EventEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchEvents = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/event`, { credentials: 'include' });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Impossible de charger les événements');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, []);

  const createEvent = async (payload: Partial<EventEntity>) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Creation failed');
    await fetchEvents();
  };

  const joinEvent = async (id: number) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/event/${id}/join`, { method: 'POST', credentials: 'include' });
    if (!res.ok) throw new Error('Join failed');
    await fetchEvents();
  };

  const leaveEvent = async (id: number) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/event/${id}/leave`, { method: 'POST', credentials: 'include' });
    if (!res.ok) throw new Error('Leave failed');
    await fetchEvents();
  };

  const deleteEvent = async (id: number) => {
    const ok = window.confirm('Supprimer cet événement ?');
    if (!ok) return;
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/event/${id}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) throw new Error('Delete failed');
    await fetchEvents();
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EventSystem
          events={events}
          loading={loading}
          error={error}
          onRefresh={fetchEvents}
          onCreate={createEvent}
          onJoin={joinEvent}
          meId={user?.id ? Number(user.id) : undefined}
          onLeave={leaveEvent}
          onDelete={deleteEvent}
        />
      </div>
    </Layout>
  );
};

export default EventsPage;
