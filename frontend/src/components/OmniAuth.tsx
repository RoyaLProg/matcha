import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    google?: any;
  }
}

interface OmniAuthProps {
  onSocialLogin: (provider: string) => Promise<void>;
}

const OmniAuth: React.FC<OmniAuthProps> = ({ onSocialLogin }) => {
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    if (!clientId) {
      setError('Google client ID non configuré');
      return;
    }
    const loadScript = () => new Promise<void>((resolve, reject) => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google script'));
      document.head.appendChild(script);
    });

    let cancelled = false;
    (async () => {
      try {
        await loadScript();
        if (cancelled) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (resp: any) => {
            const idToken = resp?.credential;
            if (!idToken) return;
            try {
              const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ idToken }),
              });
              if (!res.ok) throw new Error(`auth failed ${res.status}`);
              await onSocialLogin('google');
            } catch (e) {
              setError('Échec de la connexion Google');
              console.error(e);
            }
          },
          ux_mode: 'popup',
          auto_select: false,
        });

        if (containerRef.current) {
          window.google.accounts.id.renderButton(containerRef.current, {
            theme: 'outline',
            size: 'large',
            shape: 'pill',
            width: 320,
            text: 'continue_with',
            logo_alignment: 'left',
          });
        }
      } catch (e) {
        setError('Impossible de charger Google Sign-In');
      }
    })();
    return () => { cancelled = true; };
  }, [onSocialLogin]);

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
        {error ? (
          <div className="text-center text-red-500 text-sm">{error}</div>
        ) : (
          <div ref={containerRef} className="flex justify-center" />
        )}
      </div>
    </div>
  );
};

export default OmniAuth;
