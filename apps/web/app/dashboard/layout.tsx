'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  BarChart3,
  Users,
  BookOpen,
  Video,
  Code,
  Trophy,
  PieChart,
  Settings,
  ChevronDown,
  LogOut,
  Menu,
  Building2,
  Search,
  Bell,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Assessments',
    items: [
      { label: 'Leadership', href: '/dashboard/assessment', icon: BarChart3 },
      { label: 'Hiring', href: '/dashboard/hiring', icon: Users },
      { label: 'Pipeline', href: '/dashboard/hiring/pipeline', icon: Users },
      { label: 'Practice', href: '/dashboard/practice', icon: BookOpen },
    ],
  },
  {
    title: 'Engagement',
    items: [
      { label: 'Interviews', href: '/dashboard/interviews', icon: Video },
      { label: 'Challenges', href: '/dashboard/challenges', icon: Code },
      { label: 'Hackathons', href: '/dashboard/hackathon', icon: Trophy },
    ],
  },
  {
    title: 'Insights',
    items: [
      { label: 'Analytics', href: '/dashboard/analytics', icon: PieChart },
      { label: 'Settings', href: '/dashboard/settings', icon: Settings },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, tenantId, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const orgName = tenantId ? tenantId.replace(/-/g, ' ') : 'Your Organization';
  const email = user?.email || 'guest@assessos.io';
  const initial = email.charAt(0).toUpperCase();

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center gap-2 px-5 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white">
            A
          </div>
          <span className="text-lg font-semibold tracking-tight">AssessOS</span>
        </div>

        {/* Org / tenant context */}
        <div className="px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2 rounded-lg bg-slate-800/60 px-3 py-2">
            <Building2 size={16} className="text-blue-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-slate-400">Workspace</div>
              <div className="text-sm font-medium capitalize truncate">
                {orgName}
              </div>
            </div>
            <ChevronDown size={14} className="text-slate-500 ml-auto" />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {NAV.map((group) => (
            <div key={group.title}>
              <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                        active
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <item.icon size={18} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Plan badge */}
        <div className="px-5 py-4 border-t border-slate-800">
          <div className="rounded-lg bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/30 px-3 py-3">
            <div className="text-xs text-slate-400">Current plan</div>
            <div className="text-sm font-semibold text-white">Enterprise</div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main column */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 h-16 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center gap-4 px-4 lg:px-8">
          <button
            className="lg:hidden text-slate-300"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          {/* Search */}
          <div className="hidden md:flex items-center gap-2 flex-1 max-w-md rounded-lg bg-slate-800/60 px-3 py-2">
            <Search size={16} className="text-slate-500" />
            <input
              placeholder="Search assessments, candidates, problems…"
              className="bg-transparent text-sm outline-none w-full placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button className="relative text-slate-400 hover:text-white transition">
              <Bell size={20} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full" />
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg hover:bg-slate-800 px-2 py-1.5 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-semibold">
                  {initial}
                </div>
                <span className="hidden sm:block text-sm max-w-[140px] truncate">
                  {email}
                </span>
                <ChevronDown size={14} className="text-slate-500" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg bg-slate-900 border border-slate-800 shadow-xl py-1">
                  <div className="px-4 py-3 border-b border-slate-800">
                    <div className="text-sm font-medium truncate">{email}</div>
                    <div className="text-xs text-slate-400 capitalize truncate">
                      {orgName}
                    </div>
                  </div>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings size={16} /> Settings
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-800"
                  >
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
