'use client';

import { useState, useEffect } from 'react';

// Ported from leadership-assessment's src/hooks/useOnlineStatus.ts. Fix vs the
// original: it called `useState(navigator.onLine)` directly, which throws
// during Next's server render (`navigator` doesn't exist there) — lazy-init
// with a browser check instead.
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
