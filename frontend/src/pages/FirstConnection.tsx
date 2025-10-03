import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Upload, X, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { useToast } from '../hooks/use-toast';

function dataURLtoBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}


const FirstConnection = () => {
  const navigate = useNavigate();
  const { updateUser, user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    gender: '',
    sexualPreference: '',
    biography: '',
    tags: [] as string[],
    location: '',
    allowLocation: false,
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });

  const [photos, setPhotos] = useState<string[]>([]);
  const [profilePicIndex, setProfilePicIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const suggestedTags = [
    '#artist', '#gamer', '#traveler', '#foodie', '#fitness', '#music',
    '#photography', '#books', '#movies', '#nature', '#yoga', '#cooking',
    '#dancing', '#hiking', '#tech', '#fashion', '#sports', '#wine',
    '#coffee', '#cats', '#dogs', '#beach', '#mountains', '#adventure'
  ];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && photos.length < 5) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotos(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    if (profilePicIndex >= index && profilePicIndex > 0) {
      setProfilePicIndex(profilePicIndex - 1);
    }
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleLocationRequest = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData(prev => ({
            ...prev,
            location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            latitude,
            longitude,
            allowLocation: true,
          }));
          toast({
            title: "Location detected",
            description: "We've automatically set your location.",
          });
        },
        () => {
          toast({
            title: "Location access denied",
            description: "You can manually enter your location below.",
            variant: "destructive",
          });
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!formData.gender || !formData.sexualPreference || !formData.biography.trim()) {
    toast({
      title: "Please complete all required fields",
      description: "Gender, preferences, and biography are required.",
      variant: "destructive",
    });
    return;
  }

  if (photos.length === 0) {
    toast({
      title: "Profile photo required",
      description: "Please upload at least one photo to continue.",
      variant: "destructive",
    });
    return;
  }

  if (formData.tags.length < 7) {
    toast({
      title: "Not enough tags",
      description: "Please select at least 7 tags.",
      variant: "destructive",
    });
    return;
  }

  setIsLoading(true);
  let response;

  try {
    let latitude = formData.latitude;
    let longitude = formData.longitude;


    if (!formData.allowLocation) {
      const res = await fetch('http://ip-api.com/json/');
      const loc = await res.json();
      if (loc && loc.status === 'success') {
        latitude = loc.lat;
        longitude = loc.lon;
      }
    }

    if ((latitude === undefined || longitude === undefined) && formData.location) {
      const m = formData.location.split(',').map(s => parseFloat(s.trim()));
      if (m.length === 2 && isFinite(m[0]) && isFinite(m[1])) {
        latitude = m[0];
        longitude = m[1];
      }
    }

    const form = new FormData();

    photos.forEach((photo, index) => {
      const blob = dataURLtoBlob(photo);
      form.append('files', blob, `photo${index}.png`);
    });

    const payload = {
      userId: user.id,
      gender: formData.gender,
      sexualOrientation: formData.sexualPreference,
      biography: formData.biography,
      minAgePreference: 18,
      maxAgePreference: 100,
      latitude,
      longitude,
      tags: formData.tags.map(t => t.replace('#', '').toLowerCase()),
      pictures: photos.map((_, i) => ({
        isProfile: i === profilePicIndex,
      })),
    };

    form.append("data", JSON.stringify(payload));

    response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/settings/create`, {
      method: "POST",
      credentials: "include",
      body: form,
    });

    if (!response.ok) throw new Error('error');

    updateUser({
      profilePicture: photos[profilePicIndex],
      settings: { ...formData, latitude, longitude },
      profileCompleted: true,
    });

    toast({
      title: "Profile completed! 🎉",
      description: "Welcome to Matcha! Let's find your perfect match.",
    });

    navigate('/home');
  } catch (error) {
    toast({
      title: "Something went wrong",
      description: `${(response ? (await response.json())['message'] : "Please try again later")}`,
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-400 to-sky-400 rounded-full mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-sky-500 bg-clip-text text-transparent mb-2">
            Welcome to Matcha!
          </h1>
          <p className="text-gray-600">
            👋 Let's complete your profile to start matching with amazing people.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Gender <span className="text-blue-500">*</span>
            </label>
            <RadioGroup
              value={formData.gender}
              onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="man" id="man" />
                <label htmlFor="man" className="text-sm font-medium">man</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="woman" id="woman" />
                <label htmlFor="woman" className="text-sm font-medium">woman</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <label htmlFor="other" className="text-sm font-medium">other</label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Interested in <span className="text-blue-500">*</span>
            </label>
            <RadioGroup
              value={formData.sexualPreference}
              onValueChange={(value) => setFormData(prev => ({ ...prev, sexualPreference: value }))}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="heterosexual" id="pref-heterosexual" />
                <label htmlFor="pref-heterosexual" className="text-sm font-medium">heterosexual</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bisexual" id="pref-bisexual" />
                <label htmlFor="pref-bisexual" className="text-sm font-medium">bisexual</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="homosexual" id="pref-homosexual" />
                <label htmlFor="pref-homosexual" className="text-sm font-medium">homosexual</label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Biography <span className="text-blue-500">*</span>
            </label>
            <Textarea
              value={formData.biography}
              onChange={(e) => setFormData(prev => ({ ...prev, biography: e.target.value }))}
              placeholder="Tell us about yourself, your interests, what you're looking for..."
              className="min-h-[120px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.biography.length}/500 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Interests & Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-4">
              {suggestedTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    formData.tags.includes(tag)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-blue-100'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            {formData.tags.length > 0 && (
              <p className="text-xs text-gray-500">
                Selected: {formData.tags.join(', ')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Photos <span className="text-blue-500">*</span>
              <span className="text-xs text-gray-500 ml-2">(1-5 photos, first will be your profile picture)</span>
            </label>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={photo}
                    alt={`Upload ${index + 1}`}
                    className={`w-full h-32 object-cover rounded-lg ${
                      index === profilePicIndex ? 'ring-2 ring-blue-500' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {index === profilePicIndex && (
                    <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      Profile
                    </div>
                  )}
                  {index !== profilePicIndex && (
                    <button
                      type="button"
                      onClick={() => setProfilePicIndex(index)}
                      className="absolute bottom-2 right-2 bg-white/80 text-gray-700 text-xs px-2 py-1 rounded-full hover:bg-white"
                    >
                      Set as profile
                    </button>
                  )}
                </div>
              ))}

              {photos.length < 5 && (
                <label className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <Upload className="w-6 h-6 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Add photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Location
            </label>
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleLocationRequest}
                className="w-full"
              >
                📍 Use my current location
              </Button>
			</div>
			  { /*
              <div className="text-center text-sm text-gray-500">or</div>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Enter your city or location manually"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div> */}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-all transform hover:scale-105"
          >
            {isLoading ? 'Setting up your profile...' : 'Complete Profile & Start Matching! 💕'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default FirstConnection;
