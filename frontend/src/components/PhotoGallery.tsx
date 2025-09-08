
import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, RotateCw, Crop, Palette, Download } from 'lucide-react';

interface Photo {
  id: string;
  url: string;
  file?: File;
}

interface PhotoGalleryProps {
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  maxPhotos?: number;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ 
  photos, 
  onPhotosChange, 
  maxPhotos = 5 
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [photos]);

  const handleFiles = (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const availableSlots = maxPhotos - photos.length;
    const filesToProcess = imageFiles.slice(0, availableSlots);

    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newPhoto: Photo = {
          id: Date.now().toString() + Math.random(),
          url: e.target?.result as string,
          file
        };
        onPhotosChange([...photos, newPhoto]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (photoId: string) => {
    onPhotosChange(photos.filter(photo => photo.id !== photoId));
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const applyFilters = () => {
    if (editingPhoto) {
      console.log(`Applying filters: rotation=${rotation}, brightness=${brightness}, contrast=${contrast}`);
      setEditingPhoto(null);
      setRotation(0);
      setBrightness(100);
      setContrast(100);
    }
  };

  return (
    <div className="space-y-6">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          dragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-blue-200 hover:border-blue-300 hover:bg-blue-50'
        }`}
      >
        <Upload className="w-12 h-12 text-blue-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-700">
          Glissez vos photos ici ou cliquez pour sélectionner
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Jusqu'à {maxPhotos} photos • JPG, PNG acceptés
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {photos.map((photo, index) => (
          <div key={photo.id} className="relative group">
            <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
              <img
                src={photo.url}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center space-x-2">
              <button
                onClick={() => setEditingPhoto(photo)}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Palette className="w-4 h-4" />
              </button>
              <button
                onClick={() => removePhoto(photo.id)}
                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {index === 0 && (
              <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                Principal
              </div>
            )}
          </div>
        ))}

        {photos.length < maxPhotos && (
          <div
            onClick={openFileDialog}
            className="aspect-square border-2 border-dashed border-blue-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <Upload className="w-8 h-8 text-blue-400" />
          </div>
        )}
      </div>

      {editingPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Éditer la photo</h3>
              <button
                onClick={() => setEditingPhoto(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
                <img
                  src={editingPhoto.url}
                  alt="Editing"
                  className="w-full h-full object-contain"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    filter: `brightness(${brightness}%) contrast(${contrast}%)`
                  }}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rotation
                  </label>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setRotation(rotation - 90)}
                      className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      <RotateCw className="w-4 h-4 transform rotate-180" />
                    </button>
                    <span className="text-sm text-gray-600">{rotation}°</span>
                    <button
                      onClick={() => setRotation(rotation + 90)}
                      className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Luminosité: {brightness}%
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraste: {contrast}%
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={contrast}
                    onChange={(e) => setContrast(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={applyFilters}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-sky-500 text-white rounded-xl hover:from-blue-600 hover:to-sky-600 font-medium"
                >
                  Appliquer les modifications
                </button>
                <button
                  onClick={() => setEditingPhoto(null)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;
