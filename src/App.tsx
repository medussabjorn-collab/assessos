import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Shells
import { CandidateShell } from './layouts/CandidateShell';
import { RecruiterShell } from './layouts/RecruiterShell';
import { AdminShell }     from './layouts/AdminShell';

// Auth
import AuthPage from './pages/AuthPage';

// ── Candidate pages ──────────────────────────────────────
import CandidateDashboard   from './pages/candidate/CandidateDashboard';
import AssessmentsPage      from './pages/AssessmentsPage';
import AssessmentDetailPage from './pages/AssessmentDetailPage';
import ResultsPage          from './pages/ResultsPage';
import ProfilePage          from './pages/ProfilePage';

// ── Recruiter pages ──────────────────────────────────────
import RecruiterDashboard  from './pages/recruiter/RecruiterDashboard';
import RecruiterCandidates from './pages/recruiter/RecruiterCandidates';
import RecruiterReports    from './pages/recruiter/RecruiterReports';
import RecruiterSchedule   from './pages/recruiter/RecruiterSchedule';

// ── Admin pages ───────────────────────────────────────────
import AdminDashboard   from './pages/admin/AdminDashboard';
import AdminPage        from './pages/AdminPage';
import IntegrationsPage from './pages/IntegrationsPage';
import SecurityPage     from './pages/SecurityPage';
import ObservabilityPage from './pages/ObservabilityPage';
import ArchitecturePage from './pages/ArchitecturePage';

import './i18n';

/* ── Role-based redirect after login ── */
function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user)                     return <AuthPage />;
  if (user.role === 'admin')     return <Navigate to="/admin/dashboard"     replace />;
  if (user.role === 'recruiter') return <Navigate to="/recruiter/dashboard" replace />;
  return <Navigate to="/candidate/dashboard" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<RootRedirect />} />

              {/* ── Candidate ───────────────────────────────────── */}
              <Route element={<CandidateShell />}>
                <Route path="/candidate/dashboard"             element={<CandidateDashboard />}   />
                <Route path="/candidate/assessments"           element={<AssessmentsPage />}       />
                <Route path="/candidate/assessments/:moduleId" element={<AssessmentDetailPage />}  />
                <Route path="/candidate/results"               element={<ResultsPage />}           />
                <Route path="/candidate/profile"               element={<ProfilePage />}           />
              </Route>

              {/* ── Recruiter ───────────────────────────────────── */}
              <Route element={<RecruiterShell />}>
                <Route path="/recruiter/dashboard"  element={<RecruiterDashboard />}  />
                <Route path="/recruiter/candidates" element={<RecruiterCandidates />} />
                <Route path="/recruiter/reports"    element={<RecruiterReports />}    />
                <Route path="/recruiter/schedule"   element={<RecruiterSchedule />}   />
                <Route path="/recruiter/profile"    element={<ProfilePage />}         />
              </Route>

              {/* ── Admin ───────────────────────────────────────── */}
              <Route element={<AdminShell />}>
                <Route path="/admin/dashboard"     element={<AdminDashboard />}    />
                <Route path="/admin/users"         element={<AdminPage />}         />
                <Route path="/admin/integrations"  element={<IntegrationsPage />}  />
                <Route path="/admin/security"      element={<SecurityPage />}      />
                <Route path="/admin/observability" element={<ObservabilityPage />} />
                <Route path="/admin/architecture"  element={<ArchitecturePage />}  />
                <Route path="/admin/profile"       element={<ProfilePage />}       />
              </Route>

              {/* ── Legacy redirects ─────────────────────────────── */}
              <Route path="/dashboard"   element={<Navigate to="/candidate/dashboard"   replace />} />
              <Route path="/assessments" element={<Navigate to="/candidate/assessments" replace />} />
              <Route path="/results"     element={<Navigate to="/candidate/results"     replace />} />
              <Route path="/profile"     element={<Navigate to="/candidate/profile"     replace />} />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
