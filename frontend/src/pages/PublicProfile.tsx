
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { Heart, X, Flag, Shield, MapPin, Star, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import Users from '@/interface/users.interface';
import { useAuth } from '@/contexts/AuthContext';

const PublicProfile = () => {
  const { id } = useParams();
  const { user: authUser } = useAuth();
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<Users | null>(null);
  const [cityName, setCityName] = useState<string>('');
  const numericId = Number(id);
  const meId = authUser?.id ? Number(authUser.id) : undefined;
  const isSelf = meId !== undefined && numericId === meId;

  const computeAge = (birthday?: string | Date) => {
    if (!birthday) return undefined;
    const birth = new Date(birthday);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  };

  const normalize = (url?: string) => {
    if (!url) return '';
    if (/^https?:/i.test(url)) return url;
    if (url.startsWith('/api/')) return `${import.meta.env.VITE_API_URL}${url}`;
    return `${import.meta.env.VITE_API_URL}/api${url}`;
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const geores = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
      const geoData = await geores.json();
      return `${geoData.city || geoData.locality || geoData.principalSubdivision}, ${geoData.countryName}`;
    } catch (e) {
      return 'Unknown location';
    }
  };

  const photoItems: { url: string; isProfile?: boolean }[] = useMemo(() => {
    const pics = (userData?.settings?.pictures ?? []) as Array<{ url: string; isProfile?: boolean }>;
    const arr = pics.map(p => ({ url: normalize(p.url), isProfile: p.isProfile }));
    arr.sort((a, b) => (b.isProfile ? 1 : 0) - (a.isProfile ? 1 : 0));
    return arr;
  }, [userData]);

  const photos: string[] = photoItems.map(p => p.url);

  useEffect(() => {
    const idx = photoItems.findIndex(p => p.isProfile);
    setCurrentPhoto(idx >= 0 ? idx : 0);
  }, [photoItems.length]);

  useEffect(() => {
    if (userData?.settings?.latitude && userData?.settings?.longitude) {
      reverseGeocode(userData.settings.latitude, userData.settings.longitude)
        .then(cityName => setCityName(cityName));
    }
  }, [userData]);

  const prevPhoto = () => {
    if (photos.length === 0) return;
    setCurrentPhoto((p) => (p - 1 + photos.length) % photos.length);
  };
  const nextPhoto = () => {
    if (photos.length === 0) return;
    setCurrentPhoto((p) => (p + 1) % photos.length);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!numericId || !isFinite(numericId)) return;
      try {
        setLoading(true);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/Users/${numericId}`, { credentials: 'include' });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        if (!cancelled) {
          setUserData(data);
          if (!isSelf) setIsBlocked(!!data?.blocked);
          if (typeof data?.connected === 'boolean') setConnected(!!data.connected);
        }
      } catch (e) {
        console.error('Failed to fetch public profile', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [numericId, isSelf]);

  const profile = {
    id: id || '1',
    name: userData ? `${userData.firstName} ${userData.lastName}` : 'Loading...',
    age: computeAge(userData?.birthday) || 0,
    location: cityName || (userData?.settings?.latitude && userData?.settings?.longitude 
      ? `${userData.settings.latitude.toFixed(2)}, ${userData.settings.longitude.toFixed(2)}` 
      : 'Location not set'),
    bio: userData?.settings?.biography || 'No bio available',
    tags: userData?.settings?.tags?.map((tag: any) => typeof tag === 'string' ? tag : tag.name) || [],
    photos: photos,
    isOnline: userData?.status === 'online',
    lastSeen: userData?.lastconnection ? new Date(userData.lastconnection).toLocaleString() : 'Unknown',
    fameRating: userData?.fameRating || 0,
    mutualMatch: userData?.connected || false,
    distance: 'Unknown distance',
  };

  const handleLike = () => {
    if (isSelf) return;
    (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/action/like`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ targetUserId: numericId, status: 'like' }),
        });
        if (!res.ok) throw new Error(String(res.status));
        setIsLiked(true);
      } catch (e) {
        alert('Failed to like (do you have a profile picture?)');
      }
    })();
  };

  const handleUnlike = () => {
    if (isSelf) return;
    (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/action/unlike`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ targetUserId: numericId }),
        });
        if (!res.ok) throw new Error(String(res.status));
        setIsLiked(false);
        setConnected(false);
      } catch (e) {
        alert('Failed to unlike');
      }
    })();
  };

  const handleBlock = async () => {
    if (isSelf) return;
    if (!numericId || !isFinite(numericId)) return;
    if (!window.confirm('Are you sure you want to block this user?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/Users/${numericId}/block`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(String(res.status));
      setIsBlocked(true);
    } catch (e) {
      alert('Failed to block user');
    }
  };

  const handleUnblock = async () => {
    if (isSelf) return;
    if (!numericId || !isFinite(numericId)) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/Users/${numericId}/unblock`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(String(res.status));
      setIsBlocked(false);
    } catch (e) {
      alert('Failed to unblock user');
    }
  };

  const handleReport = async () => {
    if (isSelf) return;
    if (!numericId || !isFinite(numericId)) return;
    const type = window.prompt('Report type (offensive | bully | fake):', 'offensive')?.trim() || 'offensive';
    const moreInfo = window.prompt('More info (optional):', '') || '';
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/report/${numericId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type, moreInfo }),
      });
      if (!res.ok) throw new Error(String(res.status));
      alert('Report submitted. Thank you for keeping our community safe.');
    } catch (e) {
      alert('Failed to submit report');
    }
  };

  if (!isSelf && isBlocked) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <Shield className="w-16 h-16 text-blue-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User Blocked</h2>
          <p className="text-gray-600 mb-6">You have blocked this user.</p>
          <button onClick={handleUnblock} className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all">Unblock</button>
        </div>
      </Layout>
    );
  }

  if (loading || !userData) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-blue-100">
          <div className="relative h-96 md:h-[500px]">
            {photos.length > 0 ? (
              <img
                src={photos[currentPhoto]}
                alt={`${userData.firstName ?? userData.username}'s photo`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">No photo</div>
            )}
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevPhoto}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 rounded-full p-2 shadow"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={nextPhoto}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 rounded-full p-2 shadow"
                  aria-label="Next"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
            
            {photos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {photos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhoto(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentPhoto ? 'bg-white shadow-lg' : 'bg-white/60 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            )}

            {userData.status === 'online' && (
              <div className="absolute top-4 left-4 flex items-center space-x-2 bg-green-500 text-white px-3 py-1 rounded-full shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Online</span>
              </div>
            )}

            <div className="absolute top-4 right-4 flex items-center space-x-1 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg">
              <Star className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-800">{(userData as any).fameRating ?? 0}</span>
            </div>

            {profile.mutualMatch && (
              <div className="absolute top-16 right-4 bg-gradient-to-r from-blue-500 to-sky-500 text-white px-3 py-1 rounded-full shadow-lg">
                <span className="text-sm font-medium">Mutual Match! 💙</span>
              </div>
            )}
          </div>

          <div className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
                  {userData.firstName ?? userData.username}{userData.lastName ? ` ${userData.lastName}` : ''}{computeAge(userData.birthday) ? `, ${computeAge(userData.birthday)}` : ''}
                </h1>
                {(connected || (userData as any)?.likedYou) && (
                  <div className="mt-2 flex items-center gap-2">
                    {connected && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Connected
                      </span>
                    )}
                    {(userData as any)?.likedYou && !connected && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        Likes you
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center text-gray-600 mt-1">
                  <MapPin className="w-4 h-4 mr-1 text-blue-400" />
                  <span>{profile.location}</span>
                </div>
              </div>
              
              <div className="flex items-center text-gray-500 text-sm">
                <Clock className="w-4 h-4 mr-1" />
                <span>Last seen {profile.lastSeen}</span>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">About</h2>
              <p className="text-gray-600 leading-relaxed">{userData.settings?.biography ?? ''}</p>
            </div>

            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Interests</h2>
              <div className="flex flex-wrap gap-2">
                {(userData.settings?.tags ?? []).map((tag: any, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
                  >
                    #{tag.tag ?? tag}
                  </span>
                ))}
              </div>
            </div>

            {!isSelf && (
              <div className="flex flex-col sm:flex-row gap-4">
                {connected || isLiked ? (
                  <button
                    onClick={handleUnlike}
                    className="flex-1 flex items-center justify-center space-x-2 py-4 rounded-xl font-semibold transition-all shadow-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    <Heart className="w-5 h-5" />
                    <span>Unlike / Disconnect</span>
                  </button>
                ) : (
                  <button
                    onClick={handleLike}
                    className="flex-1 flex items-center justify-center space-x-2 py-4 rounded-xl font-semibold transition-all shadow-lg bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white hover:shadow-blue-200"
                  >
                    <Heart className="w-5 h-5" />
                    <span>Like</span>
                  </button>
                )}

                <div className="flex space-x-2">
                  <button
                    onClick={handleBlock}
                    className="flex items-center justify-center space-x-2 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all"
                  >
                    <X className="w-5 h-5" />
                    <span>Block</span>
                  </button>

                  <button
                    onClick={handleReport}
                    className="flex items-center justify-center space-x-2 px-6 py-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all"
                  >
                    <Flag className="w-5 h-5" />
                    <span>Report</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PublicProfile;
