import dotenv from 'dotenv';
import { auditLogger } from '../middleware/audit.js';

dotenv.config();

function validateCredentials() {
  const warnings = [];
  
  if (!process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID === 'your_aws_access_key') {
    warnings.push('AWS credentials not configured - using mock data');
  }
  
  if (!process.env.AZURE_SUBSCRIPTION_ID || process.env.AZURE_SUBSCRIPTION_ID === 'your_azure_subscription_id') {
    warnings.push('Azure credentials not configured - using mock data');
  }
  
  if (!process.env.GCP_PROJECT_ID || process.env.GCP_PROJECT_ID === 'your_gcp_project_id') {
    warnings.push('GCP credentials not configured - using mock data');
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  Credential Warnings:');
    warnings.forEach(w => console.log(`   - ${w}`));
    console.log('');
  }

  return warnings;
}

export function getAWSCredentials() {
  const hasCredentials = process.env.AWS_ACCESS_KEY_ID && 
                        process.env.AWS_ACCESS_KEY_ID !== 'your_aws_access_key';
  
  if (hasCredentials) {
    auditLogger('credential_access', { provider: 'AWS', action: 'credentials_retrieved' });
  }

  return {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    configured: hasCredentials,
  };
}

export function getAzureCredentials() {
  const hasCredentials = process.env.AZURE_SUBSCRIPTION_ID && 
                        process.env.AZURE_SUBSCRIPTION_ID !== 'your_azure_subscription_id';
  
  if (hasCredentials) {
    auditLogger('credential_access', { provider: 'Azure', action: 'credentials_retrieved' });
  }

  return {
    tenantId: process.env.AZURE_TENANT_ID,
    clientId: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
    subscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
    configured: hasCredentials,
  };
}

export function getGCPCredentials() {
  const hasCredentials = process.env.GCP_PROJECT_ID && 
                        process.env.GCP_PROJECT_ID !== 'your_gcp_project_id';
  
  if (hasCredentials) {
    auditLogger('credential_access', { provider: 'GCP', action: 'credentials_retrieved' });
  }

  return {
    projectId: process.env.GCP_PROJECT_ID,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    configured: hasCredentials,
  };
}

export function initializeCredentials() {
  console.log('🔐 Initializing secure credential management...');
  const warnings = validateCredentials();
  
  if (warnings.length === 0) {
    console.log('✅ All cloud provider credentials configured');
  }
  
  auditLogger('system_startup', { 
    action: 'credentials_initialized',
    warnings: warnings.length 
  });
}
