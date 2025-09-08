import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users, Plus, Heart } from 'lucide-react';

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
}

interface Props {
  events: EventEntity[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onCreate?: (payload: Partial<EventEntity>) => Promise<void> | void;
  onJoin?: (id: number) => Promise<void> | void;
  onLeave?: (id: number) => Promise<void> | void;
  onDelete?: (id: number) => Promise<void> | void;
  meId?: number;
}

const EventSystem: React.FC<Props> = ({ events = [], loading, error, onCreate, onJoin, onLeave, onDelete, meId }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<EventEntity>>({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    maxAttendees: 2,
    isPrivate: false,
  });

  const formatDate = (date?: string) => {
    if (!date) return 'Date à définir';
    return new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };
  const attendeesCount = (e: EventEntity) => (Array.isArray(e.attendeeIds) ? e.attendeeIds.length : 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Événements & Rendez-vous</h2>
          <p className="text-gray-600">Organisez ou rejoignez des rencontres IRL</p>
        </div>
        <button onClick={() => setShowCreateForm(true)} className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-sky-500 text-white rounded-xl hover:from-blue-600 hover:to-sky-600 transition-all">
          <Plus className="w-5 h-5" />
          <span>Créer un événement</span>
        </button>
      </div>

      {loading && <div className="text-gray-500">Chargement des événements…</div>}
      {error && <div className="text-red-500">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div key={event.id} className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
            <div className="p-6 pb-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{event.title}</h3>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{event.description}</p>
                </div>
                {event.isPrivate && (
                  <div className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full flex items-center space-x-1">
                    <Heart className="w-3 h-3" />
                    <span>Privé</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(event.date)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>{event.time || 'Heure à définir'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{event.location || 'Lieu à définir'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>{attendeesCount(event)}/{event.maxAttendees ?? 2} personnes</span>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0 flex gap-3">
              {meId === event.organizerId ? (
                <>
                  <button onClick={() => onDelete && onDelete(event.id)} className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 font-medium">Supprimer</button>
                </>
              ) : attendeesCount(event) > 0 && event.attendeeIds?.includes?.(meId!) ? (
                <button onClick={() => onLeave && onLeave(event.id)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium">Quitter</button>
              ) : attendeesCount(event) < (event.maxAttendees ?? 2) ? (
                <button onClick={() => onJoin && onJoin(event.id)} className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-sky-500 text-white rounded-xl hover:from-blue-600 hover:to-sky-600 font-medium">Rejoindre l'événement</button>
              ) : (
                <div className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl text-center font-medium">Événement complet</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-6">Créer un nouvel événement</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Titre de l'événement</label>
                <input type="text" value={newEvent.title || ''} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="Ex: Café au parc" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea value={newEvent.description || ''} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="Décrivez votre événement..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input type="date" value={newEvent.date || ''} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Heure</label>
                  <input type="time" value={newEvent.time || ''} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lieu</label>
                <input type="text" value={newEvent.location || ''} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="Adresse ou nom du lieu" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre max de participants</label>
                  <select value={newEvent.maxAttendees || 2} onChange={(e) => setNewEvent({ ...newEvent, maxAttendees: parseInt(e.target.value) })} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500">
                    <option value={2}>2 personnes</option>
                    <option value={4}>4 personnes</option>
                    <option value={6}>6 personnes</option>
                    <option value={8}>8 personnes</option>
                    <option value={10}>10 personnes</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={!!newEvent.isPrivate} onChange={(e) => setNewEvent({ ...newEvent, isPrivate: e.target.checked })} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-700">Événement privé</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button onClick={() => onCreate && onCreate(newEvent)} className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-sky-500 text-white rounded-xl hover:from-blue-600 hover:to-sky-600 font-medium">Créer l'événement</button>
              <button onClick={() => setShowCreateForm(false)} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventSystem;
