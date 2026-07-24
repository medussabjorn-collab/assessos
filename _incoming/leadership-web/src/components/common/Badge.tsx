import React from 'react';
import { cn } from '../../utils/cn';

type Color = 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo' | 'orange';

interface BadgeProps {
  children: React.ReactNode;
  color?: Color;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

const colors: Record<Color, string> = {
  gray:   'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  blue:   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  green:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  red:    'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  indigo: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
};

const dotColors: Record<Color, string> = {
  gray: 'bg-gray-500', blue: 'bg-blue-500', green: 'bg-emerald-500',
  yellow: 'bg-yellow-500', red: 'bg-red-500', purple: 'bg-purple-500',
  indigo: 'bg-brand-500', orange: 'bg-orange-500',
};

export function Badge({ children, color = 'gray', size = 'sm', dot, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 font-medium rounded-full',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      colors[color],
      className,
    )}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[color])} />}
      {children}
    </span>
  );
}
