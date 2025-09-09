import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Save, X, Plus } from 'lucide-react';
import type ISettings from '@/interface/settings.interface';
import { UserGender, UserSexualOrientation } from '@/interface/settings.interface';
import { useToast } from '@/hooks/use-toast';

const EditProfile = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const AVAILABLE_TAGS = useMemo(() => [
    'artist','gamer','traveler','foodie','fitness','music','photography','books','movies','nature','yoga','cooking','dancing','hiking','tech','fashion','sports','wine','coffee','cats','dogs','beach','mountains','adventure'
  ], []);

  type LocalPhoto = { id?: number; url: string; isProfile?: boolean; isNew?: boolean; file?: File };

  const [formData, setFormData] = useState({
    bio: '',
    gender: UserGender.Undefined as UserGender,
    lookingFor: UserSexualOrientation.Undefined as UserSexualOrientation,
    tags: [] as string[],
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  const toggleTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
    }));
  };

  const removePhoto = (url: string) => {
    setPhotos((prev) => prev.filter(p => p.url !== url));
  };

  const setProfilePhoto = (url: string) => {
    setPhotos((prev) => prev.map(p => ({ ...p, isProfile: p.url === url })));
  };

  const onAddFiles = (files: FileList | null) => {
    if (!files) return;
    const list = Array.from(files);
    const remaining = Math.max(0, 5 - photos.length);
    const toAdd = list.slice(0, remaining);
    const newLocal = toAdd.map((f) => ({ url: URL.createObjectURL(f), isNew: true, file: f } as LocalPhoto));
    setPhotos((prev) => [...prev, ...newLocal]);
    setNewFiles((prev) => [...prev, ...toAdd]);
  };

  useEffect(() => {
    if (!user?.settings) return;
    const s = user.settings as unknown as ISettings;
    const normalize = (url?: string) => {
      if (!url) return '';
      if (/^https?:/i.test(url) || url.startsWith('blob:')) return url;
      if (url.startsWith('/api/')) return `${import.meta.env.VITE_API_URL}${url}`;
      return `${import.meta.env.VITE_API_URL}/api${url}`;
    };
    setFormData({
      bio: s.biography ?? '',
      gender: s.gender ?? UserGender.Undefined,
      lookingFor: s.sexualOrientation ?? UserSexualOrientation.Undefined,
      tags: (s.tags ?? []).map((t: any) => t.tag),
      latitude: s.latitude,
      longitude: s.longitude,
    });
    const pics = (s.pictures ?? []).map((p: any) => ({ id: p.id, url: normalize(p.url), isProfile: p.isProfile })) as LocalPhoto[];
    setPhotos(pics);
  }, [user?.settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    (async () => {
      try {
        const keptExisting = photos.filter(p => !p.isNew).map(p => {
          let u = p.url.replace(`${import.meta.env.VITE_API_URL}`, '');
          u = u.replace(/^\/api/, '');
          return { url: u, isProfile: !!p.isProfile };
        });
        const newOnes = photos.filter(p => p.isNew && p.file);
        const picturesPayload = [
          ...keptExisting,
          ...newOnes.map(p => ({ url: '', isProfile: !!p.isProfile })),
        ];
        const tagsPayload = formData.tags.map(t => ({ tag: t }));
        const genderMap: any = formData.gender;
        const orientationMap: any = formData.lookingFor;
        const data: any = {
          biography: formData.bio,
          gender: genderMap,
          sexualOrientation: orientationMap,
          pictures: picturesPayload,
          tags: tagsPayload,
        };
        if (typeof formData.latitude === 'number' && isFinite(formData.latitude)) data.latitude = formData.latitude;
        if (typeof formData.longitude === 'number' && isFinite(formData.longitude)) data.longitude = formData.longitude;

        const fd = new FormData();
        fd.append('data', JSON.stringify(data));
        newOnes.forEach((p) => {
          if (p.file) fd.append('files', p.file);
        });

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/settings`, {
          method: 'PATCH',
          credentials: 'include',
          body: fd,
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = payload?.message || 'Failed to update profile';
          throw new Error(msg);
        }

        try {
          const meRes = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
            method: 'GET',
            credentials: 'include',
          });
          if (meRes.ok) {
            const me = await meRes.json();
            updateUser({ settings: me.settings, profileCompleted: !!me.settings });
          }
        } catch {}

        toast({ title: 'Profil mis à jour', description: 'Tes modifications ont été enregistrées.' });
      } catch (err) {
        console.error(err);
        toast({ title: 'Échec de la mise à jour', description: (err as Error).message, variant: 'destructive' });
      }
    })();
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Profile</h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Photos</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((p, idx) => (
                  <div key={p.url} className="relative group">
                    <img src={p.url} alt={`photo-${idx}`} className="w-full h-40 object-cover rounded-xl border" />
                    <button type="button" onClick={() => removePhoto(p.url)} className="absolute top-2 right-2 bg-white/90 rounded-full p-1 shadow hover:bg-white">
                      <X className="w-4 h-4 text-gray-700" />
                    </button>
                    <label className="absolute bottom-2 left-2 bg-white/90 px-2 py-1 rounded text-xs cursor-pointer shadow">
                      <input type="radio" name="profilePhoto" checked={!!p.isProfile} onChange={() => setProfilePhoto(p.url)} className="mr-1" />
                      Profile
                    </label>
                  </div>
                ))}
                {photos.length < 5 && (
                  <label className="flex items-center justify-center h-40 border-2 border-dashed rounded-xl text-gray-500 cursor-pointer hover:bg-gray-50">
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onAddFiles(e.target.files)} />
                    <div className="flex items-center space-x-2"><Plus className="w-4 h-4" /><span>Add photos</span></div>
                  </label>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Gender</option>
                  <option value="man">Man</option>
                  <option value="woman">Woman</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Looking For</label>
                <select
                  name="lookingFor"
                  value={formData.lookingFor}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Preference</option>
                  <option value="heterosexual">Heterosexual</option>
                  <option value="bisexual">Bisexual</option>
                  <option value="homosexual">Homosexual</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <input
                  type="hidden"
                  value={formData.latitude ?? ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value === '' ? undefined : Number(e.target.value) }))}
                />
              </div>
              <div>
                <input
                  type="hidden"
                  value={formData.longitude ?? ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value === '' ? undefined : Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!navigator.geolocation) return alert('Geolocation not supported');
                  navigator.geolocation.getCurrentPosition((pos) => {
                    setFormData(prev => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
                  }, () => alert('Permission denied'));
                }}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
              >Use my current location</button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                placeholder="Tell us about yourself..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Interests</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map(tag => {
                  const active = formData.tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-sm border ${active ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
                    >
                      #{tag}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white font-semibold rounded-xl transition-all transform hover:scale-105"
              >
                <Save className="w-5 h-5" />
                <span>Save Profile</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default EditProfile;
