import React from 'react';
import { Heart, X, MapPin, Star, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
    tagMatch?: number;
    likedByMe?: boolean;
  };
  onLike?: (id: string) => void;
  onUnlike?: (id: string) => void;
  onPass?: (id: string) => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onLike, onUnlike, onPass }) => {
  const navigate = useNavigate();

  const handleViewProfile = () => {
    navigate(`/profile/${profile.id}`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative h-80 bg-gradient-to-br from-blue-200 to-sky-200 group">
        {profile.photos.length > 0 ? (
          <div className="relative w-full h-full">
            <Carousel className="w-full h-full">
              <CarouselContent>
                {profile.photos.map((photo, index) => (
                  <CarouselItem key={index}>
                    <img
                      src={photo}
                      alt={`${profile.name}'s photo ${index + 1}`}
                      className="w-full h-80 object-cover cursor-pointer"
                      onClick={handleViewProfile}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              {profile.photos.length > 1 && (
                <>
                  <CarouselPrevious className="left-2" />
                  <CarouselNext className="right-2" />
                </>
              )}
            </Carousel>
            
            {/* Overlay pour voir le profil */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
              <button
                onClick={handleViewProfile}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 hover:bg-white text-gray-800 px-4 py-2 rounded-lg flex items-center space-x-2 font-medium shadow-lg"
              >
                <Eye className="w-4 h-4" />
                <span>Voir profil</span>
              </button>
            </div>
          </div>
        ) : (
          <div 
            className="absolute inset-0 bg-gray-300 rounded-t-2xl flex items-center justify-center cursor-pointer"
            onClick={handleViewProfile}
          >
            <span className="text-gray-500 text-lg">No photo</span>
          </div>
        )}
        
        {profile.isOnline && (
          <div className="absolute top-4 left-4 w-3 h-3 bg-green-400 rounded-full border-2 border-white z-10"></div>
        )}
        
        <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
          <div className="flex items-center space-x-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium">{profile.fameRating}</span>
          </div>
        </div>
        
        {profile.photos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1 z-10">
            {profile.photos.map((_, index) => (
              <div
                key={index}
                className="w-2 h-2 rounded-full bg-white/60"
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 
            className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={handleViewProfile}
          >
            {profile.name}, {profile.age}
          </h3>
        <div className="flex items-center text-gray-500 text-sm">
          <MapPin className="w-4 h-4 mr-1" />
          {profile.location}
        </div>
      </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{profile.bio}</p>

        <div className="flex flex-wrap gap-2 mb-4">
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
          {typeof profile.tagMatch === 'number' && (
            <span className="ml-auto px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              {profile.tagMatch} common
            </span>
          )}
        </div>


        <div className="flex space-x-3">
          <button
            onClick={() => onPass?.(profile.id)}
            className="flex-1 flex items-center justify-center space-x-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
            <span>Pass</span>
          </button>
          {profile.likedByMe ? (
            <button
              onClick={() => onUnlike?.(profile.id)}
              className="flex-1 flex items-center justify-center space-x-2 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all"
            >
              <Heart className="w-5 h-5 fill-current" />
              <span>Unlike</span>
            </button>
          ) : (
            <button
              onClick={() => onLike?.(profile.id)}
              className="flex-1 flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white rounded-xl transition-all"
            >
              <Heart className="w-5 h-5" />
              <span>Like</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
