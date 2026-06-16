import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import type { Notification } from '../../types';

const icons: Record<Notification['type'], React.ReactNode> = {
  success: <CheckCircle2 size={16} className="text-emerald-500" />,
  warning: <AlertTriangle size={16} className="text-amber-500" />,
  info:    <Info size={16} className="text-blue-500" />,
  error:   <XCircle size={16} className="text-red-500" />,
};

const borders: Record<Notification['type'], string> = {
  success: 'border-l-emerald-500',
  warning: 'border-l-amber-500',
  info:    'border-l-blue-500',
  error:   'border-l-red-500',
};

const TOAST_TTL = 5000;

export function ToastContainer() {
  const { notifications, dismiss } = useNotifications();
  // Only show unread notifications created within the last 10 seconds
  const recent = notifications.filter(n => !n.read && Date.now() - new Date(n.createdAt).getTime() < TOAST_TTL).slice(0, 4);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {recent.map(n => (
          <motion.div key={n.id}
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0,  scale: 1   }}
            exit={{    opacity: 0, x: 80, scale: 0.9  }}
            className={`pointer-events-auto w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 border-l-4 ${borders[n.type]} rounded-xl shadow-apple px-4 py-3 flex items-start gap-3`}>
            <div className="mt-0.5 flex-shrink-0">{icons[n.type]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{n.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">{n.message}</p>
            </div>
            <button onClick={() => dismiss(n.id)} className="flex-shrink-0 p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X size={14} />
            </button>
            <AutoDismiss id={n.id} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function AutoDismiss({ id }: { id: string }) {
  const { dismiss } = useNotifications();
  useEffect(() => {
    const t = setTimeout(() => dismiss(id), TOAST_TTL);
    return () => clearTimeout(t);
  }, [id, dismiss]);
  return null;
}
