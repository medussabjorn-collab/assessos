import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, ClipboardList, BarChart3, User,
  Users, Calendar, TrendingUp, Settings,
  Shield, Plug, Activity, Layers,
} from 'lucide-react';

export interface NavItemConfig {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const candidateNav: NavItemConfig[] = [
  { to: '/candidate/dashboard',   label: 'My Journey',   icon: LayoutDashboard },
  { to: '/candidate/assessments', label: 'Assessments',  icon: ClipboardList   },
  { to: '/candidate/results',     label: 'My Results',   icon: BarChart3        },
  { to: '/candidate/profile',     label: 'Profile',      icon: User             },
];

export const recruiterNav: NavItemConfig[] = [
  { to: '/recruiter/dashboard',  label: 'Pipeline',     icon: LayoutDashboard },
  { to: '/recruiter/candidates', label: 'Candidates',   icon: Users            },
  { to: '/recruiter/reports',    label: 'Reports',      icon: TrendingUp       },
  { to: '/recruiter/schedule',   label: 'Schedule',     icon: Calendar         },
  { to: '/recruiter/profile',    label: 'Profile',      icon: User             },
];

export const adminNav: NavItemConfig[] = [
  { to: '/admin/dashboard',      label: 'Overview',      icon: LayoutDashboard },
  { to: '/admin/users',          label: 'Users',         icon: Users            },
  { to: '/admin/integrations',   label: 'Integrations',  icon: Plug             },
  { to: '/admin/security',       label: 'Security',      icon: Shield           },
  { to: '/admin/observability',  label: 'Observability', icon: Activity         },
  { to: '/admin/architecture',   label: 'Architecture',  icon: Layers           },
  { to: '/admin/profile',        label: 'Profile',       icon: Settings         },
];

export function homeUrlForRole(role: string): string {
  if (role === 'recruiter') return '/recruiter/dashboard';
  if (role === 'admin')     return '/admin/dashboard';
  return '/candidate/dashboard';
}

export function profileUrlForRole(role: string): string {
  if (role === 'recruiter') return '/recruiter/profile';
  if (role === 'admin')     return '/admin/profile';
  return '/candidate/profile';
}
