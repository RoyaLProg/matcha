
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ProfileCard from '../components/ProfileCard';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ALL_TAGS } from '@/constants/tags';

const HomePage = () => {
  const { user, updateUser } = useAuth();
  const [sortBy, setSortBy] = useState('distance');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    ageRange: [18, 65],
    fameRange: [0, 5],
    distance: 50,
    tags: [] as string[],
  });

  const [profiles, setProfiles] = useState<any[]>([]);
const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (!user?.settings) return;
    console.log(user);
    setFilters({
      ageRange: [user?.settings.minAgePreference, user?.settings.maxAgePreference],
      fameRange: [0, user?.settings.maxFameRating],
      distance: user?.settings.maxDistance,
      tags: [],
    });
  }, [user?.settings]);

  const fetchProfiles = async () => {
  try {
    // Use intelligent suggestions endpoint instead of matches
    const params = new URLSearchParams();
    params.append('sortBy', sortBy);
    params.append('ageMin', String(filters.ageRange[0]));
    params.append('ageMax', String(filters.ageRange[1]));
    params.append('fameMin', String(filters.fameRange[0]));
    params.append('fameMax', String(filters.fameRange[1]));
    params.append('distance', String(filters.distance));
    if (filters.tags.length) params.append('tags', filters.tags.join(','));

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/suggestions?${params.toString()}`, {
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok || !Array.isArray(data)) {
      console.error('getMatches returned non-array or error:', data);
      setProfiles([]);
      setLoading(false);
      return;
    }

    const apiBase = import.meta.env.VITE_API_URL;
    const toAbsolute = (u: string) => {
      if (!u) return u;
      if (/^https?:/i.test(u) || u.startsWith('blob:')) return u;
      return `${apiBase}/api${u.startsWith('/') ? '' : '/'}${u}`;
    };

    const locationCache = new Map<string, string>();
    
    const getLocationFromCache = async (lat: number, lng: number): Promise<string> => {
      const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
      if (locationCache.has(key)) {
        return locationCache.get(key)!;
      }
      
      try {
        const geores = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
        const geoData = await geores.json();
        const location = `${geoData.city || geoData.locality || geoData.principalSubdivision}, ${geoData.countryName}`;
        locationCache.set(key, location);
        return location;
      } catch (e) {
        const fallback = 'Unknown location';
        locationCache.set(key, fallback);
        return fallback;
      }
    };

    const mappedProfiles = await Promise.all(data.map(async (profile: any) => {
      const { user, settings, tags, pictures, age, distance, fameRating, commonTags } = profile;

      const location = settings.latitude && settings.longitude
        ? await getLocationFromCache(settings.latitude, settings.longitude)
        : 'Unknown location';

      return {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        age: age,
        location: location,
        bio: settings.biography,
        tags: tags.map((tag: any) => tag.tag),
        photos: pictures.map((pic: any) => toAbsolute(pic.url)),
        isOnline: user.status === 'online',
        fameRating: fameRating ?? 0,
        distance: Number(distance?.toFixed?.(1) ?? distance ?? 0),
        tagMatch: commonTags ?? 0,
        likedByMe: profile.likedByMe ?? false,
        likedYou: profile.likedYou ?? false,
      };
    }));

    setProfiles(mappedProfiles);
    setLoading(false);
  } catch (err) {
    console.error("Erreur chargement profils:", err);
    setLoading(false);
  }
};

useEffect(() => {
  fetchProfiles();
}, []);

// Refetch when filters or sorting change
useEffect(() => {
  if (user?.settings) {
    fetchProfiles();
  }
}, [sortBy, filters.ageRange[0], filters.ageRange[1], filters.fameRange[0], filters.fameRange[1], filters.distance, filters.tags.join(',')]);

  const sendAction = async (targetUserId: string, status: 'like' | 'dislike') => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/action/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          targetUserId: Number(targetUserId),
          status,
        }),
      });

      if (!response.ok) throw new Error(`Erreur lors de l'envoi du ${status}`);
      const data = await response.json();
      console.log(`Action ${status} envoyée avec succès`, data);
      setProfiles(prev => prev.filter(profile => profile.id !== targetUserId));
    } catch (error) {
      console.error(`Erreur lors de l'envoi du ${status} :`, error);
    }
  };

  const handleLike = (id: string) => {
    sendAction(id, "like");
  };

  const handlePass = (id: string) => {
    sendAction(id, "dislike");
  };

  const toggleTag = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const sendFiltersToBackend = async () => {
    try {
      const payload = {
        minAgePreference: filters.ageRange[0],
        maxAgePreference: filters.ageRange[1],
        maxDistance: filters.distance,
      };

      const formData = new FormData();
      formData.append('data', JSON.stringify(payload));

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/settings`, {
        method: "PATCH",
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) throw new Error("Erreur lors de l'envoi des filtres");

      fetchProfiles();
    } catch (error) {
      console.error("Erreur filtre :", error);
    }
  };

const sortProfiles = (profiles: any[]) => {
  return [...profiles].sort((a, b) => {
    switch (sortBy) {
      case "age":
        return a.age - b.age;
      case "distance":
        return a.distance - b.distance;
      case "fame":
        return b.fameRating - a.fameRating;
      case "commonTags":
        return (b.tagMatch ?? 0) - (a.tagMatch ?? 0);
      case "recent":
        return a.isOnline === b.isOnline ? 0 : a.isOnline ? -1 : 1;
      default:
        return 0;
    }
  });
};

  const filteredProfiles = React.useMemo(() => {
    return profiles.filter((p) => {
      const ageOk = p.age >= filters.ageRange[0] && p.age <= filters.ageRange[1];
      const distOk = typeof p.distance === 'number' ? p.distance <= filters.distance : true;
      const fameOk = typeof p.fameRating === 'number' ? p.fameRating >= filters.fameRange[0] : true;
      const tagsOk = filters.tags.length === 0 || filters.tags.some((t) => p.tags.includes(t));
      return ageOk && distOk && fameOk && tagsOk;
    });
  }, [profiles, filters]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent mb-2">
            Discover People
          </h1>
          <p className="text-gray-600">Find your perfect match based on your preferences</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by interests, location..."
              className="w-full pl-10 pr-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all bg-white/80 backdrop-blur-sm"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-200 ${
                showFilters 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'bg-white/80 border border-blue-200 hover:bg-blue-50 text-gray-700'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span className="font-medium">Filters</span>
            </button>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all bg-white/80 backdrop-blur-sm"
            >
              <option value="distance">Sort by Distance</option>
              <option value="age">Sort by Age</option>
              <option value="fame">Sort by Fame Rating</option>
              <option value="commonTags">Sort by Common Tags</option>
              <option value="recent">Recently Active</option>
            </select>
          </div>
        </div>

        {showFilters && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-100 p-6 mb-8 blue-card-hover">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age Range</label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 w-8">Min:</span>
                    <input
                      type="range"
                      min="18"
                      max="65"
                      value={filters.ageRange[0]}
                      onChange={(e) => setFilters({...filters, ageRange: [parseInt(e.target.value), filters.ageRange[1]]})}
                      className="flex-1 accent-blue-500"
                    />
                    <span className="text-sm text-gray-600 font-medium w-8">{filters.ageRange[0]}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 w-8">Max:</span>
                    <input
                      type="range"
                      min="18"
                      max="65"
                      value={filters.ageRange[1]}
                      onChange={(e) => setFilters({...filters, ageRange: [filters.ageRange[0], parseInt(e.target.value)]})}
                      className="flex-1 accent-blue-500"
                    />
                    <span className="text-sm text-gray-600 font-medium w-8">{filters.ageRange[1]}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fame Rating</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={filters.fameRange[0]}
                    onChange={(e) =>
                      setFilters({ ...filters, fameRange: [Number(e.target.value), filters.fameRange[1]] })
                    }
                    className="flex-1 accent-blue-500"
                  />
                  <span className="text-sm text-gray-600 font-medium">{filters.fameRange[0]}+</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Distance (miles)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="1"
                    max="2000"
                    value={filters.distance}
                    onChange={(e) => setFilters({ ...filters, distance: Number(e.target.value) })}
                    className="flex-1 accent-blue-500"
                  />
                  <span className="text-sm text-gray-600 font-medium">{filters.distance} mi</span>
                </div>
              </div>
              
              <div className="md:col-span-2 lg:col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Interests</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_TAGS.map((tag) => {
                    const active = filters.tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          active
                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        #{tag}
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-2 justify-between items-center mt-4">
                  <div className="text-xs text-gray-500">{filters.tags.length} selected</div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFilters((prev) => ({ ...prev, tags: [] }))}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilters((prev) => ({ ...prev, tags: [...ALL_TAGS] }))}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200"
                    >
                      Select All
                    </button>
                    <button
                      onClick={sendFiltersToBackend}
                      className="px-4 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200 transition-colors font-medium"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        )}

        {(!loading && sortProfiles(filteredProfiles).length === 0) ? (
          <div className="text-center text-gray-600 py-16">
            <p className="text-lg font-medium">Aucun profil correspondant pour le moment.</p>
            <p className="text-sm mt-2">Vérifie tes préférences (âge, distance, tags) et assure-toi d'avoir au moins une photo et des centres d'intérêt.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortProfiles(filteredProfiles).map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                onLike={handleLike}
                onPass={handlePass}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HomePage;
