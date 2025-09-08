import React from 'react';
import { Heart, Bell, MessageCircle, User, Search, MapPin, Calendar } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50">
      <header className="bg-white/90 backdrop-blur-md shadow-lg border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-sky-500 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-blue-200 transition-all">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
                Matcha
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-2">
              <Link
                to="/home"
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
                  isActive('/home')
                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Search className="w-4 h-4" />
                <span className="font-medium">Discover</span>
              </Link>
              <Link
                to="/search"
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
                  isActive('/search')
                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Search className="w-4 h-4" />
                <span className="font-medium">Search</span>
              </Link>
              <Link
                to="/events"
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
                  isActive('/events')
                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Events</span>
              </Link>
              <Link
                to="/chat"
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 relative ${
                  isActive('/chat') || location.pathname.startsWith('/chat/')
                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                <span className="font-medium">Chat</span>
              </Link>
              <Link
                to={user?.id ? `/profile/${user.id}` : '/profile/edit'}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
                  (location.pathname.startsWith('/profile'))
                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <User className="w-4 h-4" />
                <span className="font-medium">Profile</span>
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              <NotificationBell />
              
              <div className="relative group">
                <button className="flex items-center space-x-2 p-2 hover:bg-blue-50 rounded-full transition-colors">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-sky-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white text-sm font-semibold">
                      {user?.firstName?.charAt(0) || 'U'}
                    </span>
                  </div>
                </button>
                
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-blue-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <Link
                      to="/account"
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      Account Settings
                    </Link>
                    <Link
                      to="/profile/edit"
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      Edit Profile
                    </Link>
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-white/80 backdrop-blur-sm border-t border-blue-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2024 Matcha - Blue Edition. Made with 💙 for meaningful connections.</p>
          </div>
        </div>
      </footer>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-blue-100 z-50">
        <div className="flex justify-around py-2">
          <Link
            to="/home"
            className={`flex flex-col items-center px-3 py-2 rounded-lg transition-all ${
              isActive('/home') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
          >
            <Search className="w-5 h-5" />
            <span className="text-xs mt-1 font-medium">Discover</span>
          </Link>
          <Link
            to="/search"
            className={`flex flex-col items-center px-3 py-2 rounded-lg transition-all ${
              isActive('/search') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
          >
            <Search className="w-5 h-5" />
            <span className="text-xs mt-1 font-medium">Search</span>
          </Link>
          <Link
            to="/events"
            className={`flex flex-col items-center px-3 py-2 rounded-lg transition-all ${
              isActive('/events') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-xs mt-1 font-medium">Events</span>
          </Link>
          <Link
            to="/chat"
            className={`flex flex-col items-center px-3 py-2 rounded-lg transition-all relative ${
              isActive('/chat') || location.pathname.startsWith('/chat/') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs mt-1 font-medium">Chat</span>
          </Link>
          <Link
            to={user?.id ? `/profile/${user.id}` : '/profile/edit'}
            className={`flex flex-col items-center px-3 py-2 rounded-lg transition-all ${
              location.pathname.startsWith('/profile') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-xs mt-1 font-medium">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
