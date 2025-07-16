import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Upload, X, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { useToast } from '../hooks/use-toast';

const FirstConnection = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    gender: '',
    sexualPreference: '',
    biography: '',
    tags: [] as string[],
    location: '',
    allowLocation: false,
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
          setFormData(prev => ({
            ...prev,
            location: `${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)}`,
            allowLocation: true
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

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      updateUser({
        profilePicture: photos[profilePicIndex],
        // Store all profile data
        ...formData,
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
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
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
          {/* Gender */}
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
                <RadioGroupItem value="male" id="male" />
                <label htmlFor="male" className="text-sm font-medium">Male</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="female" />
                <label htmlFor="female" className="text-sm font-medium">Female</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <label htmlFor="other" className="text-sm font-medium">Other</label>
              </div>
            </RadioGroup>
          </div>

          {/* Sexual Preference */}
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
                <RadioGroupItem value="male" id="pref-male" />
                <label htmlFor="pref-male" className="text-sm font-medium">Men</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="pref-female" />
                <label htmlFor="pref-female" className="text-sm font-medium">Women</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="pref-both" />
                <label htmlFor="pref-both" className="text-sm font-medium">Both</label>
              </div>
            </RadioGroup>
          </div>

          {/* Biography */}
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

          {/* Tags */}
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

          {/* Photos */}
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

          {/* Location */}
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
              <div className="text-center text-sm text-gray-500">or</div>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Enter your city or location manually"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
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
