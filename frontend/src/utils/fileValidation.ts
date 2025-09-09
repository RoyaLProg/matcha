export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateImageFile = (file: File): FileValidationResult => {
  // Vérifier le type MIME
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Format non supporté: ${file.type}. Seuls JPEG, PNG et GIF sont autorisés.`
    };
  }

  // Vérifier la taille (5MB max)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `Fichier trop volumineux: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Taille maximum: 5MB.`
    };
  }

  // Vérifier l'extension du fichier (sécurité supplémentaire)
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
  const fileName = file.name.toLowerCase();
  const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
  
  if (!hasValidExtension) {
    return {
      isValid: false,
      error: `Extension non supportée. Utilisez: ${allowedExtensions.join(', ')}`
    };
  }

  return { isValid: true };
};

export const validateVideoFile = (file: File): FileValidationResult => {
  // Vérifier le type MIME
  if (file.type !== 'video/webm') {
    return {
      isValid: false,
      error: `Format vidéo non supporté: ${file.type}. Seul WebM est autorisé.`
    };
  }

  // Vérifier la taille (50MB max)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `Fichier vidéo trop volumineux: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Taille maximum: 50MB.`
    };
  }

  return { isValid: true };
};

export const validateAudioFile = (file: File): FileValidationResult => {
  // Vérifier le type MIME
  if (file.type !== 'audio/webm') {
    return {
      isValid: false,
      error: `Format audio non supporté: ${file.type}. Seul WebM audio est autorisé.`
    };
  }

  // Vérifier la taille (10MB max)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `Fichier audio trop volumineux: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Taille maximum: 10MB.`
    };
  }

  return { isValid: true };
};

export const validateMultipleImageFiles = (files: File[]): FileValidationResult => {
  if (files.length === 0) {
    return {
      isValid: false,
      error: 'Aucun fichier sélectionné.'
    };
  }

  if (files.length > 5) {
    return {
      isValid: false,
      error: `Trop de fichiers sélectionnés: ${files.length}. Maximum: 5 images.`
    };
  }

  // Valider chaque fichier
  for (let i = 0; i < files.length; i++) {
    const result = validateImageFile(files[i]);
    if (!result.isValid) {
      return {
        isValid: false,
        error: `Fichier ${i + 1} (${files[i].name}): ${result.error}`
      };
    }
  }

  return { isValid: true };
};