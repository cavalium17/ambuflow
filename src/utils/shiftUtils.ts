
import { Shift } from '../types';

export const calculateEffectiveMinutes = (shift: Shift, activeShiftId: string | null, currentTime: Date) => {
  if (shift.start === '--:--') return 0;
  
  let start = shift.startDateTime;
  let end = shift.endDateTime;
  
  if (!start) {
    const [y, mon, d] = shift.day.split('-').map(Number);
    const [h1, m1] = shift.start.split(':').map(Number);
    start = new Date(y, mon - 1, d, h1, m1, 0, 0);
  }
  
  if (!end) {
    if (shift.end !== '--:--') {
      const [y, mon, d] = shift.day.split('-').map(Number);
      const [h2, m2] = shift.end.split(':').map(Number);
      end = new Date(y, mon - 1, d, h2, m2, 0, 0);
      if (end.getTime() < start.getTime()) {
        end.setDate(end.getDate() + 1);
      }
    } else if (shift.id === activeShiftId) {
      end = currentTime;
    } else {
      return 0;
    }
  }
  
  let diffMs = end.getTime() - start.getTime();
  let totalMin = Math.round(diffMs / 60000);
  
  if (shift.breaks) {
    shift.breaks.forEach(b => {
      const bStart = b.startDateTime ? new Date(b.startDateTime).getTime() : 0;
      const bEnd = b.endDateTime ? new Date(b.endDateTime).getTime() : 0;
      const now = currentTime.getTime();

      if (bEnd && bEnd <= now) {
        totalMin -= b.duration;
      } else if (bStart && bStart <= now) {
        // Active break: subtract elapsed time to freeze effective work time
        const elapsed = Math.round((now - bStart) / 60000);
        totalMin -= elapsed;
      }
    });
  }
  
  return Math.max(0, totalMin);
};
