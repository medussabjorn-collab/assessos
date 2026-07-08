import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../utils/cn';
import type { NavItemConfig } from '../../layouts/navConfig';

interface IconRailProps {
  navItems: NavItemConfig[];
}

export function IconRail({ navItems }: IconRailProps) {
  const { isDark, toggleDark } = useTheme();
  const location = useLocation();

  return (
    <aside
      className="fixed left-0 top-16 bottom-0 z-30 flex flex-col items-center py-4 gap-2 w-16"
      style={{
        boxShadow: 'var(--shadow-rail)',
        backgroundColor: 'rgb(var(--color-surface))',
        borderRight: '1px solid rgb(var(--color-border))',
      }}
    >
      <div className="flex flex-col items-center gap-2 flex-1">
        {navItems.map(item => {
          const active = location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              title={item.label}
              className={cn('rail-btn', active && 'active')}
            >
              <item.icon size={18} />
            </Link>
          );
        })}
      </div>

      <button
        onClick={toggleDark}
        title={isDark ? 'Light mode' : 'Dark mode'}
        className="rail-btn"
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </aside>
  );
}
