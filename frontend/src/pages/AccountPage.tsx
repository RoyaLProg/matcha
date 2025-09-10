
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, LogOut, Trash2, Save, Flag, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TwoFactorSetup from '../components/TwoFactorSetup';

const AccountPage = () => {
  const { user, updateUser, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    username: user?.username || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    (async () => {
      try {
        const payload: any = {};
        if (formData.firstName !== user?.firstName) payload.firstName = formData.firstName.trim();
        if (formData.lastName !== user?.lastName) payload.lastName = formData.lastName.trim();
        if (formData.username !== user?.username) payload.username = formData.username.trim();
        const has = Object.keys(payload).length > 0;
        if (has) {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${user?.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to update account');
          }
          updateUser(payload);
          toast({ title: 'Account updated', description: 'Your account information has been updated successfully.' });
        }
        setIsEditing(false);
      } catch (err) {
        console.error(err);
        toast({ title: 'Update failed', description: (err as Error).message, variant: 'destructive' });
      }
    })();
  };

  const validatePassword = (password: string): string | null => {
    if (!password || password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (password.length > 255) {
      return 'Password must be less than 255 characters long';
    }
    if (!/[^A-Za-z0-9_\s]/.test(password)) {
      return 'Password must contain at least one special character';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    const weakWords = ['password', 'qwerty', 'letmein', 'welcome', 'dragon', 'football', 'monkey', 'iloveyou', 'admin', 'login', 'princess', 'solo', 'starwars', 'sunshine', 'flower', 'shadow', 'superman', 'baseball', 'master', 'hello', 'freedom', 'whatever', 'qazwsx', 'trustno1', 'passw0rd', 'default', 'matcha'];
    const lower = password.toLowerCase();
    for (const word of weakWords) {
      if (lower === word || lower.includes(word)) {
        return 'Password is too common';
      }
    }
    return null;
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: 'Password mismatch', description: 'New passwords do not match', variant: 'destructive' });
      return;
    }
    
    const passwordError = validatePassword(passwordData.newPassword);
    if (passwordError) {
      toast({ title: 'Invalid password', description: passwordError, variant: 'destructive' });
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/change-password`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
          }),
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to update password');
        }
        toast({ title: 'Password updated', description: 'Your password has been updated successfully.' });
        setShowPasswordForm(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } catch (err) {
        console.error(err);
        toast({ title: 'Password update failed', description: (err as Error).message, variant: 'destructive' });
      }
    })();
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      (async () => {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
            method: 'DELETE',
            credentials: 'include',
          });
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to delete account');
          }
          toast({ title: 'Account deleted', description: 'Your account has been permanently deleted.' });
          logout();
          navigate('/');
        } catch (err) {
          console.error(err);
          toast({ title: 'Deletion failed', description: (err as Error).message, variant: 'destructive' });
        }
      })();
    }
  };

  const [blocked, setBlocked] = useState<Array<{id:number, username?:string, firstName?:string, avatar?:string}>>([]);
  const [myReports, setMyReports] = useState<any[]>([]);
  const [reportsAboutMe, setReportsAboutMe] = useState<any[]>([]);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  const loadBlocked = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/blocks`, { credentials: 'include' });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setBlocked(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load blocked users', e);
      setBlocked([]);
    }
  };

  const loadReports = async () => {
    try {
      const r1 = await fetch(`${import.meta.env.VITE_API_URL}/api/report/mine`, { credentials: 'include' });
      const mine = r1.ok ? await r1.json() : [];
      setMyReports(Array.isArray(mine) ? mine : []);
    } catch { setMyReports([]); }
    try {
      const r2 = await fetch(`${import.meta.env.VITE_API_URL}/api/report/received`, { credentials: 'include' });
      const rec = r2.ok ? await r2.json() : [];
      setReportsAboutMe(Array.isArray(rec) ? rec : []);
    } catch { setReportsAboutMe([]); }
  };

  const onUnblock = async (id: number) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${id}/unblock`, { method: 'POST', credentials: 'include' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to unblock user');
      }
      setBlocked((prev) => prev.filter(u => u.id !== id));
      toast({ title: 'User unblocked', description: 'User has been unblocked successfully.' });
    } catch (e) {
      toast({ title: 'Unblock failed', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const load2FAStatus = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/2fa/status`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTwoFactorEnabled(data.enabled);
      }
    } catch {
      setTwoFactorEnabled(false);
    }
  };

  const disable2FA = async () => {
    const code = prompt('Enter your current 2FA code to disable two-factor authentication:');
    if (!code) return;

    setTwoFactorLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/2fa/disable`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token: code }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to disable 2FA');
      }
      
      setTwoFactorEnabled(false);
      toast({ title: '2FA Disabled', description: 'Two-factor authentication has been disabled.' });
    } catch (err) {
      toast({ title: 'Disable failed', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  useEffect(() => { loadBlocked(); loadReports(); load2FAStatus(); }, []);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Account Settings</h1>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be modified</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>

              {isEditing && (
                <button
                  type="submit"
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white font-semibold rounded-xl transition-all"
                >
                  <Save className="w-5 h-5" />
                  <span>Save Changes</span>
                </button>
              )}
            </form>
          </div>

          <div className="mb-8 border-t border-gray-200 pt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Password</h2>
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                Change Password
              </button>
            </div>

            {showPasswordForm && (
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white font-semibold rounded-xl transition-all"
                >
                  <Lock className="w-5 h-5" />
                  <span>Update Password</span>
                </button>
              </form>
            )}
          </div>

          <div className="mb-8 border-t border-gray-200 pt-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-green-600" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Two-Factor Authentication</h2>
                  <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {twoFactorEnabled ? (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Enabled</span>
                ) : (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">Disabled</span>
                )}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-600 mb-2">
                {twoFactorEnabled
                  ? 'Two-factor authentication is currently enabled for your account. You\'ll need your authenticator app to log in.'
                  : 'Two-factor authentication is not enabled. Enable it to add an extra layer of security to your account.'}
              </p>
              {!twoFactorEnabled && (
                <ul className="text-xs text-gray-500 list-disc list-inside space-y-1">
                  <li>Requires an authenticator app (Google Authenticator, Authy, etc.)</li>
                  <li>You'll scan a QR code to set it up</li>
                  <li>You'll need a 6-digit code to log in</li>
                </ul>
              )}
            </div>
            
            <div className="flex gap-3">
              {twoFactorEnabled ? (
                <button
                  onClick={disable2FA}
                  disabled={twoFactorLoading}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  {twoFactorLoading ? 'Disabling...' : 'Disable 2FA'}
                </button>
              ) : (
                <button
                  onClick={() => setShowTwoFactorSetup(true)}
                  className="px-4 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                >
                  Enable 2FA
                </button>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8 space-y-4">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Blocked Users</h2>
              {blocked.length === 0 ? (
                <div className="text-gray-500">You have not blocked anyone.</div>
              ) : (
                <div className="space-y-3">
                  {blocked.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-3 border rounded-xl">
                      <div className="flex items-center gap-3">
                        {u.avatar ? (
                          <img src={u.avatar} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">{(u.firstName?.[0] || u.username?.[0] || 'U').toUpperCase()}</div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{u.firstName || u.username || 'User'}</div>
                          <div className="text-sm text-gray-500">#{u.username ?? 'user'}</div>
                        </div>
                      </div>
                      <button onClick={() => onUnblock(u.id)} className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg">Unblock</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Reports</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2"><Flag className="w-4 h-4 text-red-500" /><h3 className="font-medium">Reports I submitted</h3></div>
                  {myReports.length === 0 ? (
                    <div className="text-gray-500 text-sm">No reports submitted.</div>
                  ) : (
                    <div className="space-y-2">
                      {myReports.map((r:any) => (
                        <div key={r.id} className="text-sm text-gray-700 flex items-center justify-between">
                          <div>To user #{r.userId} • {r.type} • {r.status}</div>
                          <div className="text-gray-400">{new Date(r.createdAt || Date.now()).toLocaleDateString()}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2"><Flag className="w-4 h-4 text-amber-500" /><h3 className="font-medium">Reports about me</h3></div>
                  {reportsAboutMe.length === 0 ? (
                    <div className="text-gray-500 text-sm">No reports received.</div>
                  ) : (
                    <div className="space-y-2">
                      {reportsAboutMe.map((r:any) => (
                        <div key={r.id} className="text-sm text-gray-700 flex items-center justify-between">
                          <div>From user #{r.from} • {r.type} • {r.status}</div>
                          <div className="text-gray-400">{new Date(r.createdAt || Date.now()).toLocaleDateString()}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span>Log Out</span>
            </button>

            <button
              onClick={handleDeleteAccount}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl transition-all"
            >
              <Trash2 className="w-5 h-5" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </div>

      <TwoFactorSetup
        isOpen={showTwoFactorSetup}
        onClose={() => setShowTwoFactorSetup(false)}
        onSuccess={() => {
          setTwoFactorEnabled(true);
          load2FAStatus();
        }}
      />
    </Layout>
  );
};

export default AccountPage;
