
import React from 'react';
import { Heart, X, MapPin, Star } from 'lucide-react';

interface ProfileCardProps {
  profile: {
    id: string;
    name: string;
    age: number;
    location: string;
    bio: string;
    tags: string[];
    photos: string[];
    isOnline: boolean;
    fameRating: number;
  };
  onLike?: (id: string) => void;
  onPass?: (id: string) => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onLike, onPass }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Photo */}
      <div className="relative h-80 bg-gradient-to-br from-blue-200 to-sky-200">
        <div className="absolute inset-0 bg-gray-300 rounded-t-2xl"></div>
        {profile.isOnline && (
          <div className="absolute top-4 left-4 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
        )}
        <div className="absolute top-4 right-4 flex items-center space-x-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
          <Star className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-medium">{profile.fameRating}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-semibold text-gray-900">
            {profile.name}, {profile.age}
          </h3>
          <div className="flex items-center text-gray-500 text-sm">
            <MapPin className="w-4 h-4 mr-1" />
            {profile.location}
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{profile.bio}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {profile.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium"
            >
              #{tag}
            </span>
          ))}
          {profile.tags.length > 3 && (
            <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">
              +{profile.tags.length - 3} more
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={() => onPass?.(profile.id)}
            className="flex-1 flex items-center justify-center space-x-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
            <span>Pass</span>
          </button>
          <button
            onClick={() => onLike?.(profile.id)}
            className="flex-1 flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white rounded-xl transition-all"
          >
            <Heart className="w-5 h-5" />
            <span>Like</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
