// Static catalog of integrations the platform can connect to. Ported from the
// leadership-assessment IntegrationsPage (which hard-coded it in the frontend).
// This is the *registry* of what's connectable — the actual provider sync
// (real Workday/SAP/Greenhouse API calls) is a separate, larger effort (P1 in
// the gap analysis), NOT implemented here. Connecting records intent + status.

export interface CatalogEntry {
  id: string;
  name: string;
  category: string;
  description: string;
  features: string[];
}

export const INTEGRATION_CATALOG: CatalogEntry[] = [
  { id: 'workday', name: 'Workday', category: 'HRMS', description: 'Sync employee data, onboarding workflows, and role assignments automatically.', features: ['Auto-provision candidates', 'Sync org hierarchy', 'Push assessment results', 'Deactivate on offboard'] },
  { id: 'greenhouse', name: 'Greenhouse', category: 'ATS', description: 'Integrate with your ATS to trigger assessments in the hiring pipeline.', features: ['Auto-trigger on stage change', 'Push scores to candidate profile', 'Reject/advance based on score', 'Bulk invite candidates'] },
  { id: 'moodle', name: 'Moodle', category: 'LMS', description: 'Connect learning paths to assessment performance for skill gap recommendations.', features: ['Course completion triggers', 'Skill gap remediation', 'Sync learner profiles', 'Progress webhooks'] },
  { id: 'okta', name: 'Okta', category: 'Identity', description: 'Enterprise SSO and identity lifecycle management via SAML 2.0 / OIDC.', features: ['SSO (SAML 2.0)', 'SCIM provisioning', 'MFA enforcement', 'Group sync for RBAC'] },
  { id: 'slack', name: 'Slack', category: 'Comms', description: 'Real-time notifications for assessment events, violations, and completions.', features: ['Completion alerts', 'Violation notifications', 'Admin digest (daily)', 'Slash command /assess'] },
  { id: 'salesforce', name: 'Salesforce', category: 'CRM', description: 'Link leadership assessment scores to your CRM pipeline for talent tracking.', features: ['Push scores to Contact', 'Custom field mapping', 'Report embedding', 'Webhook events'] },
  { id: 'bamboohr', name: 'BambooHR', category: 'HRMS', description: 'HR data sync for small-to-medium teams using BambooHR.', features: ['Employee sync', 'Assessment scheduling', 'Performance data export'] },
  { id: 'lever', name: 'Lever', category: 'ATS', description: 'Assessment triggering in Lever hiring workflows.', features: ['Stage-based triggers', 'Score push-back', 'Candidate tagging'] },
  { id: 'teams', name: 'MS Teams', category: 'Comms', description: 'Microsoft Teams integration for notifications and bot commands.', features: ['Adaptive cards', 'Bot commands', 'Channel alerts', 'Meeting integration'] },
  { id: 'sap', name: 'SAP HCM', category: 'ERP', description: 'Enterprise SAP integration for large-scale HR data management.', features: ['IDoc integration', 'Employee master sync', 'Competency mapping'] },
  { id: 'powerbi', name: 'Power BI', category: 'Analytics', description: 'Embed assessment analytics in your existing Power BI dashboards.', features: ['REST API datasource', 'Custom visuals', 'Row-level security', 'Scheduled refresh'] },
  { id: 'zapier', name: 'Zapier', category: 'Automation', description: 'Connect to 5000+ apps without code using Zapier webhooks.', features: ['Webhook triggers', '5000+ app ecosystem', 'Custom Zaps', 'Conditional logic'] },
];

export const CATALOG_BY_ID = new Map(INTEGRATION_CATALOG.map((e) => [e.id, e]));
