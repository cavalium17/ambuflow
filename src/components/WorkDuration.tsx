
import React, { useState, useEffect } from 'react';

interface WorkDurationProps {
  startDateTime: Date | string | null;
  className?: string;
}

export const WorkDuration: React.FC<WorkDurationProps> = ({ startDateTime, className }) => {
  const [duration, setDuration] = useState("00:00:00");

  useEffect(() => {
    if (!startDateTime) {
      setDuration("00:00:00");
      return;
    }

    const start = new Date(startDateTime).getTime();

    const calculateDuration = () => {
      const now = new Date().getTime();
      const diff = now - start;
      if (diff < 0) {
        setDuration("00:00:00");
        return;
      }
      
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      
      setDuration(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };

    calculateDuration();
    const timer = setInterval(calculateDuration, 1000);
    return () => clearInterval(timer);
  }, [startDateTime]);

  return <span className={className}>{duration}</span>;
};

export default WorkDuration;
