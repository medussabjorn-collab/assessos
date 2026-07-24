import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

const API_HEALTH = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1').replace('/api/v1', '/health');

export function BackendStatus() {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        await fetch(API_HEALTH, { signal: AbortSignal.timeout(3000) });
        if (alive) setOnline(true);
      } catch {
        if (alive) setOnline(false);
      }
    };
    check();
    const id = setInterval(check, 30_000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  if (online === null) return null;

  return (
    <div className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
      online ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
             : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    }`}>
      {online ? <Wifi size={11} /> : <WifiOff size={11} />}
      {online ? 'API Connected' : 'Demo Mode'}
    </div>
  );
}
