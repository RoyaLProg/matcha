
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, LogOut, Trash2, Save, Flag } from 'lucide-react';

const AccountPage = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
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
        if (formData.email !== user?.email) payload.email = formData.email.trim();
        if (formData.username !== user?.username) payload.username = formData.username.trim();
        const has = Object.keys(payload).length > 0;
        if (has) {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/Users/${user?.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error('Failed to update account');
          updateUser(payload);
        }
        setIsEditing(false);
      } catch (err) {
        console.error(err);
        alert('Update failed');
      }
    })();
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    console.log('Password updated');
    setShowPasswordForm(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      console.log('Account deleted');
      logout();
      navigate('/');
    }
  };

  const [blocked, setBlocked] = useState<Array<{id:number, username?:string, firstName?:string, avatar?:string}>>([]);
  const [myReports, setMyReports] = useState<any[]>([]);
  const [reportsAboutMe, setReportsAboutMe] = useState<any[]>([]);

  const loadBlocked = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/Users/blocks`, { credentials: 'include' });
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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/Users/${id}/unblock`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error(String(res.status));
      setBlocked((prev) => prev.filter(u => u.id !== id));
    } catch (e) {
      alert('Failed to unblock user');
    }
  };

  useEffect(() => { loadBlocked(); loadReports(); }, []);

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
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
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
    </Layout>
  );
};

export default AccountPage;
