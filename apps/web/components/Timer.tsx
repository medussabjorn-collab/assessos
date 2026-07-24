'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  timeLimitMin: number;
  onTimeExpired: () => void;
  paused?: boolean;
}

export default function Timer({ timeLimitMin, onTimeExpired, paused = false }: TimerProps) {
  const [timeRemainingSec, setTimeRemainingSec] = useState(
    timeLimitMin * 60,
  );
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (timeRemainingSec <= 0) {
      onTimeExpired();
      return;
    }

    const interval = setInterval(() => {
      setTimeRemainingSec((prev) => {
        const newTime = prev - 1;
        if (newTime <= 300) {
          setIsWarning(true);
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemainingSec, onTimeExpired, paused]);

  const minutes = Math.floor(timeRemainingSec / 60);
  const seconds = timeRemainingSec % 60;

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold ${
        paused
          ? 'bg-gray-100 text-gray-500'
          : isWarning
            ? 'bg-red-100 text-red-700'
            : 'bg-brand-100 text-brand-700'
      }`}
    >
      <Clock className="w-5 h-5" />
      <span>
        {minutes}:{seconds.toString().padStart(2, '0')}
        {paused ? ' (paused)' : ''}
      </span>
    </div>
  );
}
