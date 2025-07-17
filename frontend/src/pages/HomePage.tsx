
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ProfileCard from '../components/ProfileCard';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';

const HomePage = () => {
  const [sortBy, setSortBy] = useState('age');
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
  const fetchProfiles = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/action/matches`, {
        credentials: 'include',
      });
      const data = await res.json();

      const mappedProfiles = await Promise.all(data.map(async (profile: any) => {
        const { user, settings, tags, pictures, age, distance } = profile;

        // Reverse geocoding
        let location = '';
        try {
          const geores = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${settings.latitude}&longitude=${settings.longitude}&localityLanguage=en`);
          const geoData = await geores.json();
          location = `${geoData.city || geoData.locality || geoData.principalSubdivision}, ${geoData.countryName}`;
        } catch (e) {
          location = 'Unknown location';
        }

        return {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          age: age,
          location: location,
          bio: settings.biography,
          tags: tags.map((tag: any) => tag.tag),
          photos: pictures.map((pic: any) => pic.url),
          isOnline: user.status === 'online',
          fameRating: settings.maxFameRating,
          distance: distance.toFixed(1),
        };
      }));

      setProfiles(mappedProfiles);
      setLoading(false);
    } catch (err) {
      console.error("Erreur chargement profils:", err);
      setLoading(false);
    }
  };

  fetchProfiles();
}, []);



  // Mock profiles data
  // const profiles = [
  //   {
  //     id: '1',
  //     name: 'Emma',
  //     age: 28,
  //     location: 'San Francisco, CA',
  //     bio: 'Love hiking, yoga, and good coffee. Looking for someone to explore the city with!',
  //     tags: ['hiking', 'yoga', 'coffee', 'adventure'],
  //     photos: ['https://images.unsplash.com/photo-1494790108755-2616b332c1b0'],
  //     isOnline: true,
  //     fameRating: 4.2,
  //   },
  //   {
  //     id: '2',
  //     name: 'Alex',
  //     age: 32,
  //     location: 'Los Angeles, CA',
  //     bio: 'Photographer and travel enthusiast. Always planning the next adventure.',
  //     tags: ['photography', 'travel', 'art', 'music'],
  //     photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d'],
  //     isOnline: false,
  //     fameRating: 4.8,
  //   },
  //   {
  //     id: '3',
  //     name: 'Maya',
  //     age: 26,
  //     location: 'Seattle, WA',
  //     bio: 'Bookworm, dog lover, and aspiring chef. Let\'s cook together!',
  //     tags: ['books', 'cooking', 'dogs', 'movies'],
  //     photos: ['https://images.unsplash.com/photo-1438761681033-6461ffad8d80'],
  //     isOnline: true,
  //     fameRating: 4.5,
  //   },
  // ];

  const handleLike = (id: string) => {
    console.log('Liked profile:', id);
  };

  const handlePass = (id: string) => {
    console.log('Passed profile:', id);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent mb-2">
            Discover People
          </h1>
          <p className="text-gray-600">Find your perfect match based on your preferences</p>
        </div>

        {/* Controls */}
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
              <option value="age">Sort by Age</option>
              <option value="distance">Sort by Distance</option>
              <option value="fame">Sort by Fame Rating</option>
              <option value="recent">Recently Active</option>
            </select>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-100 p-6 mb-8 blue-card-hover">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age Range</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="18"
                    max="65"
                    value={filters.ageRange[0]}
                    className="flex-1 accent-blue-500"
                  />
                  <span className="text-sm text-gray-600 font-medium">{filters.ageRange[0]}-{filters.ageRange[1]}</span>
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
                    max="100"
                    value={filters.distance}
                    className="flex-1 accent-blue-500"
                  />
                  <span className="text-sm text-gray-600 font-medium">{filters.distance} mi</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interests</label>
                <div className="flex flex-wrap gap-2">
                  {['hiking', 'yoga', 'coffee', 'travel', 'art', 'music'].map((tag) => (
                    <button
                      key={tag}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200 transition-colors font-medium"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onLike={handleLike}
              onPass={handlePass}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;
