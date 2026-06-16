import React from 'react';
import { cn } from '../../utils/cn';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className, hover, glass, onClick, padding = 'md' }: CardProps) {
  const pads = { none: '', sm: 'p-4', md: 'p-5 md:p-6', lg: 'p-6 md:p-8' };
  return (
    <motion.div
      whileHover={hover ? { y: -2, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' } : undefined}
      onClick={onClick}
      className={cn(
        'rounded-2xl transition-all duration-200',
        glass
          ? 'glass'
          : 'frost-card',
        hover && 'cursor-pointer',
        pads[padding],
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex items-center justify-between mb-4', className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('font-semibold text-gray-900 dark:text-white text-sm', className)}>{children}</h3>;
}
