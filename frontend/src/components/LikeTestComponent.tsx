import React, { useState } from 'react';
import { Heart, X } from 'lucide-react';
import { useActions } from '@/hooks/useActions';

interface LikeTestProps {
  targetUserId: number;
  onProfileRemoved?: () => void;
}

const LikeTestComponent: React.FC<LikeTestProps> = ({ targetUserId, onProfileRemoved }) => {
  const { handleLike, handleDislike, isLoading } = useActions();
  const [isLiked, setIsLiked] = useState(false);

  const onLike = async () => {
    const success = await handleLike(targetUserId);
    if (success) {
      setIsLiked(true);
      onProfileRemoved?.();
    }
  };

  const onDislike = async () => {
    const success = await handleDislike(targetUserId);
    if (success) {
      onProfileRemoved?.();
    }
  };

  return (
    <div className="flex space-x-3">
      <button
        onClick={onDislike}
        disabled={isLoading}
        className="flex-1 flex items-center justify-center space-x-2 py-3 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-600 rounded-xl transition-all"
      >
        <X className="w-5 h-5" />
        <span>{isLoading ? 'Chargement...' : 'Passer'}</span>
      </button>
      
      <button
        onClick={onLike}
        disabled={isLoading || isLiked}
        className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl transition-all ${
          isLiked 
            ? 'bg-green-500 text-white' 
            : 'bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white'
        } ${isLoading ? 'opacity-50' : ''}`}
      >
        <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
        <span>
          {isLoading ? 'Chargement...' : isLiked ? 'Liké !' : 'Liker'}
        </span>
      </button>
    </div>
  );
};

export default LikeTestComponent;