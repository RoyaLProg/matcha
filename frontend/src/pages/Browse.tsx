
import React, { useState } from 'react';
import { Filter, SlidersHorizontal } from 'lucide-react';
import Layout from '../components/Layout';
import ProfileCard from '../components/ProfileCard';

const Browse = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    ageRange: [18, 65],
    fameRange: [0, 100],
    location: '',
    interests: [] as string[]
  });

  // Mock data
  const profiles = [
    {
      id: '1',
      name: 'Emma',
      age: 25,
      location: 'New York',
      bio: 'Love hiking, coffee, and deep conversations. Looking for someone who shares my passion for adventure and isn\'t afraid to try new things.',
      tags: ['hiking', 'coffee', 'travel', 'photography', 'yoga'],
      photos: [],
      isOnline: true,
      fameRating: 85
    },
    {
      id: '2',
      name: 'Alex',
      age: 28,
      location: 'San Francisco',
      bio: 'Software engineer by day, chef by night. I believe the best relationships start with good food and great conversation.',
      tags: ['cooking', 'tech', 'music', 'fitness'],
      photos: [],
      isOnline: false,
      fameRating: 92
    },
    {
      id: '3',
      name: 'Sophie',
      age: 23,
      location: 'Los Angeles',
      bio: 'Artist and dreamer. I spend my days creating and my nights exploring the city. Let\'s make some memories together!',
      tags: ['art', 'music', 'nightlife', 'creativity'],
      photos: [],
      isOnline: true,
      fameRating: 78
    },
    {
      id: '4',
      name: 'Marcus',
      age: 30,
      location: 'Chicago',
      bio: 'Fitness enthusiast and dog lover. Looking for someone to share morning runs and lazy Sunday brunches with.',
      tags: ['fitness', 'dogs', 'outdoors', 'health'],
      photos: [],
      isOnline: true,
      fameRating: 88
    }
  ];

  const handleLike = (profileId: string) => {
    console.log('Liked profile:', profileId);
    // Here you would typically make an API call
  };

  const handlePass = (profileId: string) => {
    console.log('Passed on profile:', profileId);
    // Here you would typically make an API call
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Discover</h1>
            <p className="text-gray-600 mt-1">Find your perfect match</p>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-pink-200 hover:border-pink-300 rounded-xl transition-all"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-pink-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age Range
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="18"
                    max="65"
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="18"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="number"
                    min="18"
                    max="65"
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="65"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="City or area"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interests
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="e.g., hiking, music, art"
                />
              </div>
            </div>
          </div>
        )}

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-20">
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

export default Browse;
