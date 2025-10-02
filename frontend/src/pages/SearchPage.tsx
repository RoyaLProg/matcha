
import React, { useState } from 'react';
import Layout from '../components/Layout';
import ProfileCard from '../components/ProfileCard';
import { Search, Filter, MapPin, Star, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ALL_TAGS } from '@/constants/tags';

const SearchPage = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    ageMin: 18,
    ageMax: 65,
    fameMin: 0,
    fameMax: 5,
    distance: 50,
    location: '',
    tags: [] as string[],
  });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<'age-asc'|'age-desc'|'distance-asc'|'distance-desc'|'fame-asc'|'fame-desc'>('distance-asc');
  const [loading, setLoading] = useState(false);

  const availableTags = ALL_TAGS;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('query', searchQuery.trim());
      if (filters.ageMin) params.append('ageMin', String(filters.ageMin));
      if (filters.ageMax) params.append('ageMax', String(filters.ageMax));
      if (filters.fameMin) params.append('fameMin', String(filters.fameMin));
      if (filters.fameMax) params.append('fameMax', String(filters.fameMax));
      if (filters.distance) params.append('distance', String(filters.distance));
      if (filters.tags.length) params.append('tags', filters.tags.join(','));
      if (filters.location.trim()) {
        try {
          const geo = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(filters.location)}&limit=1`);
          const arr = await geo.json();
          if (Array.isArray(arr) && arr.length) {
            const { lat, lon } = arr[0];
            params.append('lat', String(lat));
            params.append('lng', String(lon));
          }
        } catch {}
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/search?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to search');
      const data = await res.json();

      const myTags = ((user as any)?.settings?.tags ?? []).map((t: any) => t.tag?.toLowerCase?.() ?? String(t).toLowerCase());
      let mapped = (data as any[]).map((profile: any) => {
          const { user: u, settings, tags, pictures, age, distance, likedByMe } = profile;
          const location = settings?.city && settings?.country
            ? `${settings.city}, ${settings.country}`
            : 'Unknown location';

          const otherTags = (tags || []).map((t: any) => t.tag?.toLowerCase?.() ?? String(t).toLowerCase());
          const tagMatch = myTags.length ? otherTags.filter((t) => myTags.includes(t)).length : 0;
          return {
            id: String(u.id),
            name: `${u.firstName} ${u.lastName}`,
            age: age,
            location: location || `${settings?.city ?? ''}${settings?.country ? ', ' + settings.country : ''}`,
            bio: settings?.biography ?? '',
            tags: (tags || []).map((t: any) => t.tag),
            photos: (pictures || []).map((p: any) => {
              const url = p.url as string;
              if (!url) return undefined;
              if (/^https?:/i.test(url)) return url;
              if (url.startsWith('/api/')) return `${import.meta.env.VITE_API_URL}${url}`;
              return `${import.meta.env.VITE_API_URL}/api${url}`;
            }).filter(Boolean),
            isOnline: u.status === 'online',
            fameRating: (profile as any)?.fameRating ?? 0,
            distance: distance,
            tagMatch,
            likedByMe: likedByMe === true,
          };
        });
      mapped = mapped.filter(p => (typeof filters.fameMax === 'number' ? p.fameRating <= filters.fameMax : true));
      setSearchResults(mapped);
      
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleLike = async (id: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/action/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ targetUserId: Number(id), status: 'like' }),
      });
      if (!response.ok) throw new Error('Failed to like');
      // Update the profile to show it's now liked instead of removing it
      setSearchResults(prev => prev.map(p => 
        p.id === id ? { ...p, likedByMe: true } : p
      ));
    } catch (e) {
      console.error('Like error:', e);
    }
  };

  const handleUnlike = async (id: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/action/unlike`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ targetUserId: Number(id) }),
      });
      if (!response.ok) throw new Error('Failed to unlike');
      // Update the profile to show it's now unliked
      setSearchResults(prev => prev.map(p => 
        p.id === id ? { ...p, likedByMe: false } : p
      ));
    } catch (e) {
      console.error('Unlike error:', e);
    }
  };

  const handlePass = async (id: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/action/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ targetUserId: Number(id), status: 'dislike' }),
      });
      if (!response.ok) throw new Error('Failed to pass');
      setSearchResults(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      console.error('Pass error:', e);
    }
  };

  const sortedResults = [...searchResults].sort((a, b) => {
    switch (sortBy) {
      case 'age-asc': return (a.age ?? 0) - (b.age ?? 0);
      case 'age-desc': return (b.age ?? 0) - (a.age ?? 0);
      case 'distance-asc': return (a.distance ?? Infinity) - (b.distance ?? Infinity);
      case 'distance-desc': return (b.distance ?? -Infinity) - (a.distance ?? -Infinity);
      case 'fame-asc': return (a.fameRating ?? 0) - (b.fameRating ?? 0);
      case 'fame-desc': return (b.fameRating ?? 0) - (a.fameRating ?? 0);
      case 'tags-desc': return (b.tagMatch ?? 0) - (a.tagMatch ?? 0);
      default: return 0;
    }
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Search</h1>
          <p className="text-gray-600">Find people who match your specific criteria</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, interests, or location..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Age Range
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={filters.ageMin}
                    onChange={(e) => handleFilterChange('ageMin', parseInt(e.target.value))}
                    min="18"
                    max="100"
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="number"
                    value={filters.ageMax}
                    onChange={(e) => handleFilterChange('ageMax', parseInt(e.target.value))}
                    min="18"
                    max="100"
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Star className="w-4 h-4 inline mr-1" />
                  Fame Rating
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={filters.fameMin}
                    onChange={(e) => handleFilterChange('fameMin', parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 w-16">
                    {filters.fameMin}+ stars
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Distance
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={filters.distance}
                    onChange={(e) => handleFilterChange('distance', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 w-16">
                    {filters.distance} miles
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                placeholder="Enter city, state, or zip code"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interests
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filters.tags.includes(tag)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white font-semibold rounded-xl transition-all"
            >
              <Search className="w-5 h-5" />
              <span>Search</span>
            </button>
          </form>
        </div>

        {loading && (
          <div className="text-center text-gray-600">Searching…</div>
        )}
        {!loading && searchResults.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Search Results ({searchResults.length})
              </h2>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="distance-asc">Distance ↑</option>
                  <option value="distance-desc">Distance ↓</option>
                  <option value="age-asc">Age ↑</option>
                  <option value="age-desc">Age ↓</option>
                  <option value="fame-desc">Fame ↓</option>
                  <option value="fame-asc">Fame ↑</option>
                  <option value="tags-desc">Tags match ↓</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedResults.map((profile) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  onLike={handleLike}
                  onUnlike={handleUnlike}
                  onPass={handlePass}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SearchPage;
