
import { ActivityLog } from '../types';

export const getDailyInsights = async (logs: ActivityLog[], userName: string) => {
  // Mock implementation for now to fix the build
  // In a real scenario, this would call the Gemini API
  return {
    summary: `Bonjour ${userName.split(' ')[0]}, vous avez ${logs.length} activités enregistrées.`,
    stats: "Analyse de performance en cours...",
    advice: "N'oubliez pas de bien noter vos pauses pour un calcul précis de votre modulation."
  };
};
