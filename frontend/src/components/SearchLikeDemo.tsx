import React from 'react';
import { Search, RefreshCw } from 'lucide-react';

interface SearchLikeDemoProps {
  onSearch: () => void;
  isLoading: boolean;
}

const SearchLikeDemo: React.FC<SearchLikeDemoProps> = ({ onSearch, isLoading }) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <Search className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-900">
            Fonction Like/Unlike dans la recherche
          </h3>
          <p className="text-sm text-blue-700 mt-1">
            Les profils likés apparaîtront avec un bouton "Unlike" vert lors des prochaines recherches.
            Testez en likant un profil puis en relançant la recherche.
          </p>
        </div>
        <button
          onClick={onSearch}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          <span>{isLoading ? 'Recherche...' : 'Relancer'}</span>
        </button>
      </div>
    </div>
  );
};

export default SearchLikeDemo;