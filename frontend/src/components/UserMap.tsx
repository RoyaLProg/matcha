
import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Users, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface UserLocation {
  id: number;
  name: string;
  avatar?: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  isOnline?: boolean;
}

const UserMap: React.FC = () => {
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<UserLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserLocation | null>(null);
  const [radiusFilter, setRadiusFilter] = useState(10);
  const [debouncedRadius, setDebouncedRadius] = useState(radiusFilter);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const setFromMeSettings = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/Users/me`, { credentials: 'include' });
        if (!res.ok) throw new Error(`me status ${res.status}`);
        const me = await res.json();
        const lat = me?.settings?.latitude;
        const lng = me?.settings?.longitude;
        if (!cancelled && typeof lat === 'number' && typeof lng === 'number') {
          setUserLocation({ lat, lng });
          return true;
        }
      } catch (e) {
      }
      return false;
    };

    if (navigator.geolocation) {
      const timeoutId = setTimeout(async () => {
        if (cancelled) return;
        const usedMe = await setFromMeSettings();
        if (!cancelled && !usedMe) setUserLocation({ lat: 48.8566, lng: 2.3522 });
      }, 5000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (cancelled) return;
          clearTimeout(timeoutId);
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        async (error) => {
          console.error('Geolocation error:', error);
          const usedMe = await setFromMeSettings();
          if (!cancelled && !usedMe) setUserLocation({ lat: 48.8566, lng: 2.3522 });
        }
      );
    } else {
      (async () => {
        const usedMe = await setFromMeSettings();
        if (!cancelled && !usedMe) setUserLocation({ lat: 48.8566, lng: 2.3522 });
      })();
    }
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedRadius(radiusFilter), 250);
    return () => clearTimeout(t);
  }, [radiusFilter]);

  useEffect(() => {
    let cancelled = false;
    const fetchNearby = async () => {
      if (!userLocation) return;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('lat', String(userLocation.lat));
        params.set('lng', String(userLocation.lng));
        params.set('distance', String(debouncedRadius));
        const url = `${import.meta.env.VITE_API_URL}/api/Users/search?${params.toString()}`;
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) {
          if (!cancelled) {
            setNearbyUsers([]);
            setError(`Recherche échouée (${res.status})`);
          }
          return;
        }
        const data = await res.json();
        const mapped: UserLocation[] = (Array.isArray(data) ? data : []).map((item: any) => {
          const u = item.user ?? {};
          const s = item.settings ?? {};
          const pics = (item.pictures ?? []) as Array<{url: string, isProfile: boolean}>;
          const profilePic = pics.find(p => p.isProfile)?.url ?? pics[0]?.url;
          const normalize = (url?: string) => {
            if (!url) return undefined;
            if (/^https?:/i.test(url)) return url;
            if (url.startsWith('/api/')) return `${import.meta.env.VITE_API_URL}${url}`;
            return `${import.meta.env.VITE_API_URL}/api${url}`;
          };
          return {
            id: Number(u.id),
            name: `${u.firstName ?? u.username ?? 'User'}`,
            avatar: normalize(profilePic),
            latitude: s.latitude,
            longitude: s.longitude,
            distance: typeof item.distance === 'number' ? Number(item.distance.toFixed(1)) : undefined,
            isOnline: u.status === 'online',
          } as UserLocation;
        });
        if (!cancelled) setNearbyUsers(mapped);
      } catch (e) {
        if (!cancelled) {
          console.error('Failed to fetch nearby users', e);
          setError('Erreur réseau lors de la recherche');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchNearby();
    return () => { cancelled = true; };
  }, [userLocation, debouncedRadius, refreshKey]);

  const SetView: React.FC<{ center: [number, number] }> = ({ center }) => {
    const map = useMap();
    useEffect(() => {
      map.setView(center, Math.max(map.getZoom(), 12));
    }, [center]);
    return null;
  };

  const handleUserClick = (user: UserLocation) => {
    setSelectedUser(user);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MapPin className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold text-gray-900">Utilisateurs à proximité</h2>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Users className="w-4 h-4" />
          <span>{nearbyUsers.length} personnes trouvées</span>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-blue-500" />
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rayon de recherche: {radiusFilter} km
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={radiusFilter}
              onChange={(e) => setRadiusFilter(parseInt(e.target.value))}
              className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
              disabled={loading}
            >
              {loading ? 'Recherche…' : 'Actualiser'}
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  if (!navigator.geolocation) {
                    setError('La géolocalisation n\'est pas supportée par votre navigateur');
                    return;
                  }
                  setLoading(true);
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      const { latitude, longitude } = pos.coords;
                      if (!isFinite(latitude) || !isFinite(longitude)) {
                        setError('Coordonnées invalides');
                      } else {
                        setUserLocation({ lat: latitude, lng: longitude });
                        setError(null);
                      }
                      setLoading(false);
                    },
                    (err) => {
                      console.error('Geolocation error:', err);
                      setError('Impossible de récupérer votre position (permission refusée ?)');
                      setLoading(false);
                    },
                    { enableHighAccuracy: true, timeout: 5000 }
                  );
                } catch (e) {
                  console.error(e);
                  setError('Erreur inattendue lors de la géolocalisation');
                  setLoading(false);
                }
              }}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
            >
              Me centrer
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="w-full h-96 rounded-xl overflow-hidden shadow-lg">
            {userLocation && (
              <MapContainer center={[userLocation.lat, userLocation.lng]} zoom={13} className="w-full h-96">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <SetView center={[userLocation.lat, userLocation.lng]} />
                <Circle center={[userLocation.lat, userLocation.lng]} radius={radiusFilter * 1000} pathOptions={{ color: '#3b82f6', fillOpacity: 0.1 }} />
                <Marker position={[userLocation.lat, userLocation.lng]}>
                  <Popup>Vous êtes ici</Popup>
                </Marker>
                {nearbyUsers.map((u) => (
                  typeof u.latitude === 'number' && typeof u.longitude === 'number' ? (
                    <Marker position={[u.latitude, u.longitude]} key={u.id} eventHandlers={{ click: () => handleUserClick(u) }}>
                      <Popup>
                        <div className="flex items-center gap-3">
                          <img src={u.avatar ?? '/placeholder.svg'} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                          <div>
                            <div className="font-medium">{u.name}</div>
                            <div className="text-xs text-gray-500">{u.distance !== undefined ? `À ${u.distance} km` : 'Distance inconnue'}</div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ) : null
                ))}
              </MapContainer>
            )}
            {!userLocation && (
              <div className="w-full h-96 flex items-center justify-center text-gray-500">
                Localisation en cours… Veuillez autoriser la géolocalisation ou utiliser le bouton "Me centrer".
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Personnes à proximité</h3>
          <div className="space-y-3">
            {loading && <div className="text-gray-500">Recherche en cours…</div>}
            {error && <div className="text-red-500">{error}</div>}
            {!loading && !error && nearbyUsers.length === 0 && (
              <div className="text-gray-500">Aucun utilisateur trouvé dans ce rayon.</div>
            )}
            {nearbyUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => handleUserClick(user)}
                className={`p-4 bg-white rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                  selectedUser?.id === user.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={user.avatar ?? '/placeholder.svg'}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {user.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{user.name}</h4>
                    <p className="text-sm text-gray-500">{user.distance !== undefined ? `À ${user.distance} km` : 'Distance inconnue'}</p>
                  </div>
                  <MapPin className="w-4 h-4 text-blue-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="text-center">
              <img
                src={selectedUser.avatar}
                alt={selectedUser.name}
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
              />
              <h3 className="text-xl font-semibold text-gray-900">{selectedUser.name}</h3>
              <p className="text-blue-600 mb-4">À {selectedUser.distance} km de vous</p>
              
              <div className="flex space-x-3">
                <button className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-sky-500 text-white rounded-xl hover:from-blue-600 hover:to-sky-600 font-medium" onClick={() => navigate(`/profile/${selectedUser.id}`)}>
                  Voir le profil
                </button>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMap;
