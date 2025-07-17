
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { Heart, X, Flag, Shield, MapPin, Star, Clock } from 'lucide-react';

const PublicProfile = () => {
  const { id } = useParams();
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // Mock profile data
  const profile = {
    id: id || '1',
    name: 'Emma',
    age: 28,
    location: 'San Francisco, CA',
    bio: 'Love hiking, yoga, and good coffee. Looking for someone to explore the city with! I enjoy weekend adventures, trying new restaurants, and deep conversations about life. Always up for spontaneous trips and making memories.',
    tags: ['hiking', 'yoga', 'coffee', 'adventure', 'travel', 'photography', 'music'],
    photos: [
      'https://images.unsplash.com/photo-1494790108755-2616b332c1b0',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9',
    ],
    isOnline: true,
    lastSeen: '2 minutes ago',
    fameRating: 4.2,
    mutualMatch: false,
    distance: '2.5 miles away',
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    console.log('Profile liked:', profile.id);
  };

  const handleBlock = () => {
    if (window.confirm('Are you sure you want to block this user?')) {
      setIsBlocked(true);
      console.log('Profile blocked:', profile.id);
    }
  };

  const handleReport = () => {
    console.log('Profile reported:', profile.id);
    alert('Profile reported. Thank you for keeping our community safe.');
  };

  if (isBlocked) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <Shield className="w-16 h-16 text-blue-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User Blocked</h2>
          <p className="text-gray-600">You have blocked this user.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-blue-100">
          {/* Photo Section */}
          <div className="relative h-96 md:h-[500px]">
            <img
              src={profile.photos[currentPhoto]}
              alt={`${profile.name}'s photo`}
              className="w-full h-full object-cover"
            />
            
            {/* Photo Navigation */}
            {profile.photos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {profile.photos.map((_, index) => (
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

            {/* Online Status */}
            {profile.isOnline && (
              <div className="absolute top-4 left-4 flex items-center space-x-2 bg-green-500 text-white px-3 py-1 rounded-full shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Online</span>
              </div>
            )}

            {/* Fame Rating */}
            <div className="absolute top-4 right-4 flex items-center space-x-1 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg">
              <Star className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-800">{profile.fameRating}</span>
            </div>

            {/* Mutual Match Badge */}
            {profile.mutualMatch && (
              <div className="absolute top-16 right-4 bg-gradient-to-r from-blue-500 to-sky-500 text-white px-3 py-1 rounded-full shadow-lg">
                <span className="text-sm font-medium">Mutual Match! 💙</span>
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
                  {profile.name}, {profile.age}
                </h1>
                <div className="flex items-center text-gray-600 mt-1">
                  <MapPin className="w-4 h-4 mr-1 text-blue-400" />
                  <span>{profile.location} • {profile.distance}</span>
                </div>
              </div>
              
              <div className="flex items-center text-gray-500 text-sm">
                <Clock className="w-4 h-4 mr-1" />
                <span>Last seen {profile.lastSeen}</span>
              </div>
            </div>

            {/* Bio */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">About</h2>
              <p className="text-gray-600 leading-relaxed">{profile.bio}</p>
            </div>

            {/* Tags */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Interests</h2>
              <div className="flex flex-wrap gap-2">
                {profile.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleLike}
                className={`flex-1 flex items-center justify-center space-x-2 py-4 rounded-xl font-semibold transition-all shadow-lg ${
                  isLiked
                    ? 'bg-gradient-to-r from-blue-500 to-sky-500 text-white hover:from-blue-600 hover:to-sky-600 shadow-blue-200'
                    : 'bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white hover:shadow-blue-200'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                <span>{isLiked ? 'Liked!' : 'Like'}</span>
              </button>

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
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PublicProfile;
