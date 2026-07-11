const INTEGRATION_PROVIDERS = [
  {
    id: 'MICROSOFT365',
    name: 'Microsoft 365',
    category: 'Identity and productivity',
    authType: 'OAuth or tenant credentials',
    evidenceTypes: ['Users', 'MFA', 'Groups', 'Mailbox audit', 'Device posture'],
    requiredFields: ['tenantId', 'clientId'],
  },
  {
    id: 'GOOGLE_WORKSPACE',
    name: 'Google Workspace',
    category: 'Identity and productivity',
    authType: 'OAuth or service account',
    evidenceTypes: ['Users', 'MFA', 'Groups', 'Admin audit', 'Drive sharing'],
    requiredFields: ['customerId', 'clientEmail'],
  },
  {
    id: 'GITHUB',
    name: 'GitHub',
    category: 'Code and change management',
    authType: 'GitHub App or token',
    evidenceTypes: ['Repositories', 'Branch protection', 'Pull requests', 'Vulnerabilities'],
    requiredFields: ['organization'],
  },
  {
    id: 'AWS',
    name: 'AWS',
    category: 'Cloud provider',
    authType: 'AssumeRole or access key',
    evidenceTypes: ['IAM', 'CloudTrail', 'S3', 'Security Hub', 'Backups'],
    requiredFields: ['accountId', 'region'],
  },
  {
    id: 'AZURE',
    name: 'Azure',
    category: 'Cloud provider',
    authType: 'App registration',
    evidenceTypes: ['Entra ID', 'Defender', 'Storage', 'Activity logs', 'Backups'],
    requiredFields: ['tenantId', 'subscriptionId'],
  },
  {
    id: 'JIRA',
    name: 'Jira',
    category: 'Ticketing and remediation',
    authType: 'API token',
    evidenceTypes: ['Projects', 'Security tickets', 'SLA tracking', 'Remediation workflow'],
    requiredFields: ['siteUrl', 'projectKey'],
  },
];

function getProvider(providerId) {
  return INTEGRATION_PROVIDERS.find((provider) => provider.id === providerId);
}

function isSupportedProvider(providerId) {
  return Boolean(getProvider(providerId));
}

module.exports = {
  INTEGRATION_PROVIDERS,
  getProvider,
  isSupportedProvider,
};
