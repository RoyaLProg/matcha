export interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
}

export const sendLikeAction = async (targetUserId: number, status: 'like' | 'dislike'): Promise<ActionResult> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/action/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        targetUserId,
        status,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `Erreur ${response.status}: ${response.statusText}`;
      return { success: false, error: errorMessage };
    }

    const data = await response.json();
    return { success: true, data };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur de connexion';
    return { success: false, error: errorMessage };
  }
};

export const sendUnlikeAction = async (targetUserId: number): Promise<ActionResult> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/action/unlike`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        targetUserId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `Erreur ${response.status}: ${response.statusText}`;
      return { success: false, error: errorMessage };
    }

    const data = await response.json();
    return { success: true, data };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur de connexion';
    return { success: false, error: errorMessage };
  }
};