import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Shield, ShieldCheck, Copy, Eye, EyeOff } from 'lucide-react';

interface TwoFactorSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [step, setStep] = useState<'setup' | 'verify' | 'backup-codes'>('setup');
  const [qrCode, setQrCode] = useState<string>('');
  const [manualKey, setManualKey] = useState<string>('');
  const [showManualKey, setShowManualKey] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const startSetup = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/2fa/setup`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to setup 2FA');
      }

      const data = await response.json();
      setQrCode(data.qrCode);
      setManualKey(data.manualEntryKey);
      setStep('verify');
    } catch (error) {
      toast({
        title: 'Setup failed',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!verificationCode.trim()) {
      toast({
        title: 'Verification required',
        description: 'Please enter the 6-digit code from your authenticator app',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/2fa/verify-setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          token: verificationCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Verification failed');
      }

      const data = await response.json();
      setBackupCodes(data.backupCodes || []);
      setStep('backup-codes');
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

  const copyManualKey = async () => {
    try {
      await navigator.clipboard.writeText(manualKey);
      toast({
        title: 'Copied',
        description: 'Manual entry key copied to clipboard',
      });
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const copyBackupCodes = async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.join('\n'));
      toast({
        title: 'Copied',
        description: 'Backup codes copied to clipboard',
      });
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const downloadBackupCodes = () => {
    const content = `Matcha 2FA Backup Codes\nGenerated: ${new Date().toISOString()}\n\n${backupCodes.join('\n')}\n\nImportant:\n- Store these codes in a safe place\n- Each code can only be used once\n- Use them if you lose access to your authenticator app`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'matcha-2fa-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const finishSetup = () => {
    toast({
      title: '2FA Enabled',
      description: 'Two-factor authentication has been successfully enabled for your account.',
    });
    onSuccess();
    handleClose();
  };

  const handleClose = () => {
    setStep('setup');
    setQrCode('');
    setManualKey('');
    setVerificationCode('');
    setShowManualKey(false);
    setBackupCodes([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 m-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Setup Two-Factor Authentication</h2>
          </div>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-800">
            ✕
          </button>
        </div>

        {step === 'setup' && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p className="mb-3">
                Two-factor authentication adds an extra layer of security to your account. 
                You'll need an authenticator app like Google Authenticator or Authy.
              </p>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="font-medium text-blue-800 mb-1">How it works:</p>
                <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
                  <li>Install an authenticator app on your phone</li>
                  <li>Scan the QR code we'll show you</li>
                  <li>Enter the 6-digit code to verify</li>
                </ol>
              </div>
            </div>
            <button
              onClick={startSetup}
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white rounded-xl transition-all disabled:opacity-50"
            >
              {isLoading ? 'Setting up...' : 'Continue Setup'}
            </button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Scan this QR code with your authenticator app:
              </p>
              {qrCode && (
                <div className="flex justify-center mb-4">
                  <img src={qrCode} alt="2FA QR Code" className="border rounded-lg" />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="text-center">
                <button
                  onClick={() => setShowManualKey(!showManualKey)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mx-auto"
                >
                  {showManualKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showManualKey ? 'Hide' : 'Show'} manual entry key
                </button>
              </div>

              {showManualKey && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <code className="text-xs break-all flex-1">{manualKey}</code>
                    <button
                      onClick={copyManualKey}
                      className="ml-2 p-1 text-gray-500 hover:text-gray-700"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter the 6-digit code from your authenticator app:
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-3 text-center text-lg font-mono border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={6}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep('setup')}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all"
                >
                  Back
                </button>
                <button
                  onClick={verifyAndEnable}
                  disabled={isLoading || verificationCode.length !== 6}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Verifying...' : 'Enable 2FA'}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'backup-codes' && (
          <div className="space-y-4">
            <div className="text-center">
              <ShieldCheck className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">2FA Enabled Successfully!</h3>
              <p className="text-sm text-gray-600 mb-4">
                Save these backup codes in a safe place. Each code can only be used once.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-3">
                <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center mt-0.5">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <div>
                  <p className="font-medium text-amber-800 text-sm">Important:</p>
                  <ul className="text-amber-700 text-xs mt-1 space-y-1">
                    <li>• Keep these codes in a safe place</li>
                    <li>• Use them if you lose access to your authenticator app</li>
                    <li>• Each code can only be used once</li>
                  </ul>
                </div>
              </div>
            </div>

            {backupCodes.length > 0 && (
              <div className="bg-gray-50 border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-800">Your Backup Codes</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={copyBackupCodes}
                      className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                    <button
                      onClick={downloadBackupCodes}
                      className="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-md"
                    >
                      Download
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="bg-white border rounded p-2 text-center">
                      <code className="text-sm font-mono">{code}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={finishSetup}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl transition-all"
            >
              Continue to Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFactorSetup;