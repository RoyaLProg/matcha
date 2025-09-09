import { useState } from 'react';
import { toast } from 'sonner';
import { validateMultipleImageFiles, validateVideoFile, validateAudioFile } from '@/utils/fileValidation';

export interface UploadResult {
  success: boolean;
  data?: any;
  error?: string;
}

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);

  const uploadImages = async (files: File[]): Promise<UploadResult> => {
    // Validation côté client
    const validation = validateMultipleImageFiles(files);
    if (!validation.isValid) {
      toast.error(validation.error);
      return { success: false, error: validation.error };
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/upload/picture`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || `Erreur ${response.status}: ${response.statusText}`;
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }

      const result = await response.json();
      toast.success(`${files.length} image(s) uploadée(s) avec succès!`);
      return { success: true, data: result };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'upload';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsUploading(false);
    }
  };

  const uploadVideo = async (file: File, chatId: number): Promise<UploadResult> => {
    // Validation côté client
    const validation = validateVideoFile(file);
    if (!validation.isValid) {
      toast.error(validation.error);
      return { success: false, error: validation.error };
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/upload/${chatId}/video`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || `Erreur ${response.status}: ${response.statusText}`;
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }

      const result = await response.json();
      toast.success('Vidéo uploadée avec succès!');
      return { success: true, data: result };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'upload vidéo';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsUploading(false);
    }
  };

  const uploadAudio = async (file: File, chatId: number): Promise<UploadResult> => {
    // Validation côté client
    const validation = validateAudioFile(file);
    if (!validation.isValid) {
      toast.error(validation.error);
      return { success: false, error: validation.error };
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/upload/${chatId}/audio`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || `Erreur ${response.status}: ${response.statusText}`;
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }

      const result = await response.json();
      toast.success('Audio uploadé avec succès!');
      return { success: true, data: result };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'upload audio';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadImages,
    uploadVideo,
    uploadAudio,
    isUploading,
  };
};