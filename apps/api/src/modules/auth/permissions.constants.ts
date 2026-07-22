/**
 * The full permission catalog — must stay in sync with the seed data in
 * migrations/20260722114139_add_rbac_roles_permissions/migration.sql.
 * Import these instead of hardcoding key strings so a typo is a compile
 * error, not a silent always-false permission check.
 */
export const PERMISSIONS = {
  COMPLIANCE_BIAS_AUDIT_VIEW: 'compliance.bias_audit.view',
  COMPLIANCE_REVIEW_REQUESTS_MANAGE: 'compliance.review_requests.manage',
  REPORT_EXPLANATION_VIEW_ANY: 'report.explanation.view_any',
  WEBHOOKS_MANAGE: 'webhooks.manage',
  INTEGRATIONS_MANAGE: 'integrations.manage',
  ASSESSMENT_SCENARIOS_MANAGE: 'assessment.scenarios.manage',
  ANALYTICS_ORG_DASHBOARD_VIEW: 'analytics.org_dashboard.view',
  ANALYTICS_RETENTION_RISK_VIEW: 'analytics.retention_risk.view',
  PSYCHOMETRIC_TEAM_DYNAMICS_VIEW: 'psychometric.team_dynamics.view',
  TENANT_WHITE_LABEL_MANAGE: 'tenant.white_label.manage',
  TENANT_SSO_MANAGE: 'tenant.sso.manage',
  PROCTORING_INCIDENTS_REVIEW: 'proctoring.incidents.review',
  PROCTORING_INCIDENTS_APPEALS_MANAGE: 'proctoring.incidents.appeals.manage',
  PROCTORING_EVIDENCE_REVIEW: 'proctoring.evidence.review',
  PROCTORING_POLICY_MANAGE: 'proctoring.policy.manage',
  QUESTION_BANK_WRITE: 'question_bank.write',
  AUDIT_LOG_VIEW: 'audit_log.view',
  NOTIFICATIONS_SEND: 'notifications.send',
  RATER_FEEDBACK_REVIEW: 'rater_feedback.review',
  PLATFORM_ORGS_MANAGE: 'platform.orgs.manage',
  ROLES_MANAGE: 'roles.manage',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
