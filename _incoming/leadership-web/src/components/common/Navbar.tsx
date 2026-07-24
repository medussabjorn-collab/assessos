import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Bell, Globe, Menu, X, Shield, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useTranslation } from 'react-i18next';
import { supportedLanguages } from '../../i18n';
import { cn } from '../../utils/cn';
import i18n from '../../i18n';
import { BackendStatus } from './BackendStatus';
import { SyncIndicator } from './SyncIndicator';
import type { NavItemConfig } from '../../layouts/navConfig'; // persona-driven nav

interface NavbarProps {
  navItems: NavItemConfig[];
  homeUrl: string;
  profileUrl: string;
}

export function Navbar({ navItems, homeUrl, profileUrl }: NavbarProps) {
  const { user, signOut } = useAuth();
  const { unreadCount, notifications, markRead } = useNotifications();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen,  setNotifOpen]  = useState(false);
  const [langOpen,   setLangOpen]   = useState(false);

  if (!user) return null;

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full h-16 flex items-center"
        style={{
          backgroundColor: 'rgb(var(--color-surface))',
          borderBottom: '1px solid rgb(var(--color-border))',
          boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
        }}
      >
        <div className="flex items-center w-full px-4 sm:px-6 gap-4">
          {/* Logo */}
          <Link to={homeUrl} className="flex items-center gap-2.5 flex-shrink-0 w-12">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-purple-600 rounded-xl flex items-center justify-center shadow-glow">
              <Shield size={16} className="text-white" />
            </div>
          </Link>

          {/* Desktop nav — black pill active */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1">
            {navItems.map(item => {
              const active = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(active ? 'nav-pill-active' : 'nav-pill-inactive')}
                >
                  {t(item.label)}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1 ml-auto">
            <div className="hidden sm:flex items-center gap-1">
              <SyncIndicator />
              <BackendStatus />
            </div>

            <button className="rail-btn" title="Search"><Search size={16} /></button>

            {/* Language */}
            <div className="relative">
              <button
                onClick={() => { setLangOpen(o => !o); setNotifOpen(false); }}
                className="rail-btn" title="Language"
              >
                <Globe size={16} />
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 mt-2 w-40 rounded-2xl shadow-xl overflow-hidden z-50"
                    style={{ backgroundColor: 'rgb(var(--color-surface))', border: '1px solid rgb(var(--color-border))' }}
                  >
                    {supportedLanguages.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => { i18n.changeLanguage(lang.code); setLangOpen(false); }}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors',
                          i18n.language === lang.code
                            ? 'text-brand-600 font-medium'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-frost-100 dark:hover:bg-gray-800'
                        )}
                      >
                        <span>{lang.flag}</span>{lang.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(o => !o); setLangOpen(false); }}
                className="rail-btn relative" title="Notifications"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 mt-2 w-80 rounded-2xl shadow-xl overflow-hidden z-50"
                    style={{ backgroundColor: 'rgb(var(--color-surface))', border: '1px solid rgb(var(--color-border))' }}
                  >
                    <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgb(var(--color-border))' }}>
                      <span className="font-semibold text-sm">Notifications</span>
                      <span className="text-xs text-brand-600 cursor-pointer font-medium">Mark all read</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y" style={{ borderColor: 'rgb(var(--color-border))' }}>
                      {notifications.slice(0, 5).map(n => (
                        <div
                          key={n.id}
                          onClick={() => markRead(n.id)}
                          className={cn('px-4 py-3 cursor-pointer transition-colors hover:bg-frost-50 dark:hover:bg-gray-800', !n.read && 'bg-brand-50/40')}
                        >
                          <div className="flex items-start gap-3">
                            <span className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                              n.type === 'success' ? 'bg-emerald-500' :
                              n.type === 'warning' ? 'bg-yellow-500' :
                              n.type === 'error'   ? 'bg-red-500' : 'bg-blue-500')} />
                            <div>
                              <p className="text-sm font-medium">{n.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {notifications.length === 0 && (
                        <p className="text-center text-sm text-gray-400 py-6">No notifications</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Avatar */}
            <button
              onClick={() => navigate(profileUrl)}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-white text-sm font-semibold ml-1 flex-shrink-0"
              title={user.name}
            >
              {user.name.charAt(0).toUpperCase()}
            </button>

            {/* Logout */}
            <button
              onClick={() => { signOut(); navigate('/'); }}
              className="rail-btn ml-0.5" title="Sign out"
            >
              <LogOut size={15} />
            </button>

            {/* Mobile menu */}
            <button onClick={() => setMobileOpen(o => !o)} className="md:hidden rail-btn ml-1">
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 inset-x-0 z-30 md:hidden shadow-lg"
            style={{ backgroundColor: 'rgb(var(--color-surface))', borderBottom: '1px solid rgb(var(--color-border))' }}
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {navItems.map(item => {
                const active = location.pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                      active ? 'bg-gray-900 text-white' : 'text-gray-600 dark:text-gray-300'
                    )}
                  >
                    <item.icon size={18} />{t(item.label)}
                  </Link>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
