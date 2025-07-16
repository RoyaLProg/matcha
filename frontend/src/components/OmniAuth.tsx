import React, { useState } from 'react';
import { Github, Mail, Chrome } from 'lucide-react';

interface OmniAuthProps {
  onSocialLogin: (provider: string) => Promise<void>;
}

const OmniAuth: React.FC<OmniAuthProps> = ({ onSocialLogin }) => {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSocialLogin = async (provider: string) => {
    setIsLoading(provider);
    try {
      await onSocialLogin(provider);
    } catch (error) {
      console.error(`${provider} login error:`, error);
    } finally {
      setIsLoading(null);
    }
  };

  const socialProviders = [
    {
      name: 'Google',
      key: 'google',
      icon: Chrome,
      color: 'from-red-500 to-orange-500',
      hoverColor: 'from-red-600 to-orange-600'
    },
    {
      name: 'Facebook',
      key: 'facebook',
      icon: Mail,
      color: 'from-blue-600 to-blue-700',
      hoverColor: 'from-blue-700 to-blue-800'
    },
    {
      name: 'GitHub',
      key: 'github',
      icon: Github,
      color: 'from-gray-800 to-gray-900',
      hoverColor: 'from-gray-900 to-black'
    }
  ];

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-blue-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Ou continuer avec</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {socialProviders.map(({ name, key, icon: Icon, color, hoverColor }) => (
          <button
            key={key}
            onClick={() => handleSocialLogin(key)}
            disabled={isLoading === key}
            className={`w-full flex items-center justify-center space-x-2 py-3 px-4 border border-gray-300 rounded-xl text-white font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r ${color} hover:${hoverColor}`}
          >
            <Icon className="w-5 h-5" />
            <span>
              {isLoading === key ? 'Connexion...' : `Continuer avec ${name}`}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default OmniAuth;
