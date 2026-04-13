
import { useMemo } from 'react';
import { Shift, ModulationStats } from '../types';
import { calculateEffectiveMinutes } from '../utils/shiftUtils';

export const useModulation = (
  shifts: Shift[],
  anchorDateStr: string | undefined,
  cycleWeeksStr: string | number | undefined,
  activeShiftId: string | null,
  currentTime: Date
): ModulationStats | null => {
  return useMemo(() => {
    if (!anchorDateStr) return null;

    const anchorDate = new Date(anchorDateStr);
    const cycleWeeksRaw = typeof cycleWeeksStr === 'string' ? parseInt(cycleWeeksStr) : (cycleWeeksStr || 4);
    const cycleWeeks = isNaN(cycleWeeksRaw as number) ? 4 : (cycleWeeksRaw as number);
    const now = currentTime;

    // Calculer le début du cycle actuel
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const diffMs = now.getTime() - anchorDate.getTime();
    const weeksSinceAnchor = Math.floor(diffMs / msPerWeek);
    const currentCycleStartWeeks = Math.floor(weeksSinceAnchor / cycleWeeks) * cycleWeeks;
    
    const startDate = new Date(anchorDate.getTime() + currentCycleStartWeeks * msPerWeek);
    const endDate = new Date(startDate.getTime() + cycleWeeks * msPerWeek);
    
    // Calculer la semaine actuelle dans le cycle (1 à cycleWeeks)
    const weekInCycle = (weeksSinceAnchor % cycleWeeks) + 1;

    // Calculer le total des heures dans ce cycle
    const cycleShifts = shifts.filter(s => {
      const shiftDate = new Date(s.day);
      return shiftDate >= startDate && shiftDate < endDate && (s.end !== '--:--' || s.id === activeShiftId);
    });

    const totalMinutes = cycleShifts.reduce((acc, s) => {
      return acc + calculateEffectiveMinutes(s, activeShiftId, currentTime);
    }, 0);

    const totalHours = parseFloat((totalMinutes / 60).toFixed(1));
    
    // Calculer la progression
    const totalCycleMs = endDate.getTime() - startDate.getTime();
    const elapsedMs = now.getTime() - startDate.getTime();
    const progress = Math.min(100, Math.max(0, Math.floor((elapsedMs / totalCycleMs) * 100)));

    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    return {
      totalHours: isNaN(totalHours) ? 0 : totalHours,
      startDate,
      endDate,
      progress: isNaN(progress) ? 0 : progress,
      daysRemaining: isNaN(daysRemaining) ? 0 : daysRemaining,
      weekInCycle: isNaN(weekInCycle) ? 1 : weekInCycle,
      totalWeeks: cycleWeeks
    };
  }, [shifts, anchorDateStr, cycleWeeksStr, activeShiftId, currentTime]);
};
