import { useState } from 'react';
import { toast } from 'sonner';
import { sendLikeAction, sendUnlikeAction } from '@/utils/actions';

export const useActions = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async (targetUserId: number): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await sendLikeAction(targetUserId, 'like');
      
      if (result.success) {
        // Vérifier s'il y a un match
        if (result.data?.chat) {
          toast.success("C'est un match ! 🎉", {
            description: "Vous pouvez maintenant commencer à chatter !"
          });
        } else {
          toast.success("Like envoyé avec succès !");
        }
        return true;
      } else {
        // Gestion d'erreurs spécifiques
        if (result.error?.includes('profile picture')) {
          toast.error("Vous devez avoir une photo de profil pour liker quelqu'un");
        } else if (result.error?.includes('blocked')) {
          toast.error("Action impossible - utilisateur bloqué");
        } else {
          toast.error(result.error || "Erreur lors de l'envoi du like");
        }
        return false;
      }
    } catch (error) {
      toast.error("Une erreur inattendue s'est produite");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDislike = async (targetUserId: number): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await sendLikeAction(targetUserId, 'dislike');
      
      if (result.success) {
        toast.success("Profil passé");
        return true;
      } else {
        if (result.error?.includes('blocked')) {
          toast.error("Action impossible - utilisateur bloqué");
        } else {
          toast.error(result.error || "Erreur lors du dislike");
        }
        return false;
      }
    } catch (error) {
      toast.error("Une erreur inattendue s'est produite");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlike = async (targetUserId: number): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await sendUnlikeAction(targetUserId);
      
      if (result.success) {
        toast.success("Like retiré");
        return true;
      } else {
        toast.error(result.error || "Erreur lors du unlike");
        return false;
      }
    } catch (error) {
      toast.error("Une erreur inattendue s'est produite");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleLike,
    handleDislike,
    handleUnlike,
    isLoading,
  };
};