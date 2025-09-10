import React, { useState } from 'react';
import { Shield, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TwoFactorVerifyProps {
  username: string;
  password: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const TwoFactorVerify: React.FC<TwoFactorVerifyProps> = ({ 
  username, 
  password, 
  onSuccess, 
  onCancel 
}) => {
  const { toast } = useToast();
  const [verificationCode, setVerificationCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    const code = useBackupCode ? backupCode : verificationCode;
    
    if (!code.trim()) {
      toast({
        title: 'Code required',
        description: useBackupCode 
          ? 'Please enter a backup code' 
          : 'Please enter the 6-digit code from your authenticator app',
        variant: 'destructive',
      });
      return;
    }

    if (!useBackupCode && code.length !== 6) {
      toast({
        title: 'Invalid code',
        description: 'Authenticator code must be 6 digits',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/2fa/verify-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username,
          password,
          token: code,
          isBackupCode: useBackupCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      toast({
        title: 'Login successful',
        description: 'Welcome back!',
      });
      
      onSuccess();
    } catch (error) {
      toast({
        title: 'Verification failed',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const switchToBackupCode = () => {
    setUseBackupCode(!useBackupCode);
    setVerificationCode('');
    setBackupCode('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 m-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Two-Factor Authentication</h2>
          </div>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-800">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            {useBackupCode 
              ? 'Enter one of your backup codes to complete login'
              : 'Enter the 6-digit code from your authenticator app to complete login'
            }
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {useBackupCode ? 'Backup Code' : 'Authenticator Code'}
            </label>
            {useBackupCode ? (
              <input
                type="text"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="XXXXXXXX"
                className="w-full px-4 py-3 text-center text-lg font-mono border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={8}
                autoComplete="off"
              />
            ) : (
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-3 text-center text-lg font-mono border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={6}
                autoComplete="off"
              />
            )}
          </div>

          <div className="text-center">
            <button
              onClick={switchToBackupCode}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {useBackupCode 
                ? 'Use authenticator code instead' 
                : "Can't access your authenticator app? Use a backup code"
              }
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleVerify}
              disabled={isLoading || (!useBackupCode && verificationCode.length !== 6) || (useBackupCode && !backupCode.trim())}
              className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white rounded-xl transition-all disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Verify & Login'}
            </button>
          </div>
        </div>

        {useBackupCode && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-amber-800 font-medium">Important</p>
                <p className="text-xs text-amber-700">
                  Each backup code can only be used once. Make sure to generate new ones when you run low.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFactorVerify;