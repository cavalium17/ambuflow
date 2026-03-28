import { useMemo } from 'react';
import { Shift, ModulationStats } from '../types'; // Import du type pour garantir la structure

export const useModulation = (
  shifts: Shift[], 
  anchorDateStr: string, 
  cycleWeeks: number
): ModulationStats | null => { // On définit le type de retour
  return useMemo(() => {
    if (!anchorDateStr) return null;

    const ANCHOR_DATE = new Date(anchorDateStr);
    const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
    const now = new Date();

    const cycleDurationMs = cycleWeeks * MS_PER_WEEK;
    const diffInMs = now.getTime() - ANCHOR_DATE.getTime();
    
    // Calcul de l'index du cycle actuel
    const cycleIndex = Math.floor(diffInMs / cycleDurationMs);
    
    const currentCycleStart = new Date(ANCHOR_DATE.getTime() + (cycleIndex * cycleDurationMs));
    const currentCycleEnd = new Date(currentCycleStart.getTime() + cycleDurationMs);

    // Filtrage des shifts du cycle
    const cycleShifts = shifts.filter(s => {
      const d = new Date(s.day);
      // On inclut les shifts qui commencent le jour du début et finissent avant la fin du cycle
      return d >= currentCycleStart && d < currentCycleEnd && s.end !== '--:--';
    });

    // Calcul des heures (Conversion en minutes puis en heures décimales)
    const totalMin = cycleShifts.reduce((acc, s) => {
      const [h1, m1] = s.start.split(':').map(Number);
      const [h2, m2] = s.end.split(':').map(Number);
      
      let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
      if (diff < 0) diff += 1440; // Gestion du passage à minuit

      const breaks = s.breaks?.reduce((sum, b) => sum + b.duration, 0) || 0;
      return acc + (diff - breaks);
    }, 0);

    const daysInCycle = cycleWeeks * 7;
    const daysElapsed = Math.floor((now.getTime() - currentCycleStart.getTime()) / (24 * 60 * 60 * 1000));

    return {
      totalHours: Number((totalMin / 60).toFixed(1)),
      startDate: currentCycleStart,
      endDate: currentCycleEnd,
      progress: Math.min(100, Math.max(0, (daysElapsed / daysInCycle) * 100)),
      daysRemaining: daysInCycle - daysElapsed,
      weekInCycle: Math.min(cycleWeeks, Math.floor(daysElapsed / 7) + 1),
      totalWeeks: cycleWeeks // <--- Crucial pour l'affichage "Semaine X / Y"
    };
  }, [shifts, anchorDateStr, cycleWeeks]);
};