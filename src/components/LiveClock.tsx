
import React, { useState, useEffect } from 'react';

interface LiveClockProps {
  className?: string;
  format?: 'time' | 'full';
}

export const LiveClock: React.FC<LiveClockProps> = ({ className, format = 'time' }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (format === 'full') {
    return (
      <span className={className}>
        {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
    );
  }

  return (
    <span className={className}>
      {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
    </span>
  );
};

export default LiveClock;
