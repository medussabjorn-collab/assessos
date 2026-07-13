'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import SyncIndicator from '@/components/SyncIndicator';
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
    <div className="min-h-screen bg-canvas text-ink">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-surface border-r border-hairline flex flex-col transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center gap-2 px-5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-accent-teal flex items-center justify-center font-bold text-white">
            A
          </div>
          <span className="text-lg font-semibold tracking-tight text-ink">
            AssessOS
          </span>
        </div>

        {/* Org / tenant context */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 rounded-xl bg-canvas px-3 py-2.5">
            <Building2 size={16} className="text-brand-500 shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] text-subtle">Workspace</div>
              <div className="text-sm font-medium capitalize truncate text-ink">
                {orgName}
              </div>
            </div>
            <ChevronDown size={14} className="text-subtle ml-auto" />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
          {NAV.map((group) => (
            <div key={group.title}>
              <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-subtle/70">
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
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                        active
                          ? 'bg-brand-600 text-white'
                          : 'text-subtle hover:bg-canvas hover:text-ink'
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
        <div className="px-4 py-4">
          <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-canvas border border-hairline px-4 py-3">
            <div className="text-xs text-subtle">Current plan</div>
            <div className="text-sm font-semibold text-ink">Enterprise</div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main column */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 px-4 lg:px-8 pt-4">
          <div className="h-14 rounded-2xl bg-surface/80 backdrop-blur border border-hairline shadow-frost flex items-center gap-4 px-4">
            <button
              className="lg:hidden text-subtle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            {/* Search */}
            <div className="hidden md:flex items-center gap-2 flex-1 max-w-md rounded-full bg-canvas px-3.5 py-2">
              <Search size={16} className="text-subtle" />
              <input
                placeholder="Search assessments, candidates, problems…"
                className="bg-transparent text-sm outline-none w-full text-ink placeholder:text-subtle"
              />
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <SyncIndicator />

              <button className="relative w-9 h-9 rounded-full hover:bg-canvas flex items-center justify-center text-subtle transition">
                <Bell size={18} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-accent-coral rounded-full" />
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-full hover:bg-canvas pl-1 pr-2 py-1 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-accent-teal flex items-center justify-center text-sm font-semibold text-white">
                    {initial}
                  </div>
                  <span className="hidden sm:block text-sm max-w-[140px] truncate text-ink">
                    {email}
                  </span>
                  <ChevronDown size={14} className="text-subtle" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-surface border border-hairline shadow-frost-lg py-1">
                    <div className="px-4 py-3 border-b border-hairline">
                      <div className="text-sm font-medium truncate text-ink">
                        {email}
                      </div>
                      <div className="text-xs text-subtle capitalize truncate">
                        {orgName}
                      </div>
                    </div>
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-subtle hover:bg-canvas"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings size={16} /> Settings
                    </Link>
                    <button
                      onClick={() => logout()}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-accent-coral hover:bg-canvas"
                    >
                      <LogOut size={16} /> Sign out
                    </button>
                  </div>
                )}
              </div>
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
