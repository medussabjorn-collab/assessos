import React from 'react';
import { cn } from '../../utils/cn';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: 'brand' | 'green' | 'yellow' | 'red' | 'blue';
  size?: 'xs' | 'sm' | 'md';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

const colors = {
  brand:  'bg-brand-600',
  green:  'bg-emerald-500',
  yellow: 'bg-yellow-500',
  red:    'bg-red-500',
  blue:   'bg-blue-500',
};

const heights = { xs: 'h-1', sm: 'h-1.5', md: 'h-2.5' };

export function ProgressBar({ value, max = 100, color = 'brand', size = 'sm', showLabel, animated = true, className }: ProgressBarProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  const autoColor = pct >= 70 ? 'green' : pct >= 40 ? 'yellow' : 'red';
  const barColor = color === 'brand' ? colors.brand : colors[color] || colors[autoColor];

  return (
    <div className={cn('w-full flex items-center gap-3', className)}>
      <div className={cn('flex-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden', heights[size])}>
        <motion.div
          initial={animated ? { width: 0 } : { width: `${pct}%` }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn('h-full rounded-full', barColor)}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 tabular-nums w-9 text-right">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
}
