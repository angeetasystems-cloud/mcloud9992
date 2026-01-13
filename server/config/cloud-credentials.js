import { DefaultAzureCredential } from '@azure/identity';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { auditLogger } from '../middleware/audit.js';

export class CloudCredentialManager {
  constructor() {
    this.credentialCache = new Map();
    this.authMethod = process.env.AUTH_METHOD || 'iam-role';
  }

  async getAWSCredentials(user) {
    const cacheKey = `aws-${user?.id || 'default'}`;
    
    if (this.credentialCache.has(cacheKey)) {
      const cached = this.credentialCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 3600000) {
        return cached.credentials;
      }
    }

    let credentials;

    switch (this.authMethod) {
      case 'iam-role':
        credentials = await this.getAWSIAMRoleCredentials();
        break;
      
      case 'assume-role':
        credentials = await this.getAWSAssumeRoleCredentials(user);
        break;
      
      case 'user-provided':
        credentials = this.getAWSUserProvidedCredentials(user);
        break;
      
      default:
        credentials = this.getAWSEnvironmentCredentials();
    }

    this.credentialCache.set(cacheKey, {
      credentials,
      timestamp: Date.now(),
    });

    auditLogger('aws_credentials_retrieved', {
      userId: user?.id,
      method: this.authMethod,
    });

    return credentials;
  }

  async getAWSIAMRoleCredentials() {
    try {
      const { fromInstanceMetadata } = await import('@aws-sdk/credential-providers');
      return fromInstanceMetadata({
        timeout: 1000,
        maxRetries: 1,
      });
    } catch (error) {
      console.log('IAM role not available, using environment credentials');
      return this.getAWSEnvironmentCredentials();
    }
  }

  async getAWSAssumeRoleCredentials(user) {
    if (!user?.awsRoleArn) {
      throw new Error('AWS Role ARN not configured for user');
    }

    const stsClient = new STSClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });

    const command = new AssumeRoleCommand({
      RoleArn: user.awsRoleArn,
      RoleSessionName: `dashboard-${user.id}`,
      DurationSeconds: 3600,
    });

    const response = await stsClient.send(command);

    return {
      accessKeyId: response.Credentials.AccessKeyId,
      secretAccessKey: response.Credentials.SecretAccessKey,
      sessionToken: response.Credentials.SessionToken,
    };
  }

  getAWSUserProvidedCredentials(user) {
    if (!user?.awsAccessKey || !user?.awsSecretKey) {
      throw new Error('AWS credentials not provided by user');
    }

    return {
      accessKeyId: user.awsAccessKey,
      secretAccessKey: user.awsSecretKey,
    };
  }

  getAWSEnvironmentCredentials() {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return null;
    }

    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }

  async getAzureCredentials(user) {
    const cacheKey = `azure-${user?.id || 'default'}`;
    
    if (this.credentialCache.has(cacheKey)) {
      const cached = this.credentialCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 3600000) {
        return cached.credentials;
      }
    }

    let credentials;

    switch (this.authMethod) {
      case 'managed-identity':
        credentials = await this.getAzureManagedIdentity();
        break;
      
      case 'user-provided':
        credentials = this.getAzureUserProvidedCredentials(user);
        break;
      
      default:
        credentials = this.getAzureEnvironmentCredentials();
    }

    this.credentialCache.set(cacheKey, {
      credentials,
      timestamp: Date.now(),
    });

    auditLogger('azure_credentials_retrieved', {
      userId: user?.id,
      method: this.authMethod,
    });

    return credentials;
  }

  async getAzureManagedIdentity() {
    try {
      return new DefaultAzureCredential();
    } catch (error) {
      console.log('Managed Identity not available, using environment credentials');
      return this.getAzureEnvironmentCredentials();
    }
  }

  getAzureUserProvidedCredentials(user) {
    if (!user?.azureCredentials) {
      throw new Error('Azure credentials not provided by user');
    }

    return user.azureCredentials;
  }

  getAzureEnvironmentCredentials() {
    if (!process.env.AZURE_TENANT_ID || !process.env.AZURE_CLIENT_ID) {
      return null;
    }

    return {
      tenantId: process.env.AZURE_TENANT_ID,
      clientId: process.env.AZURE_CLIENT_ID,
      clientSecret: process.env.AZURE_CLIENT_SECRET,
    };
  }

  async getGCPCredentials(user) {
    const cacheKey = `gcp-${user?.id || 'default'}`;
    
    if (this.credentialCache.has(cacheKey)) {
      const cached = this.credentialCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 3600000) {
        return cached.credentials;
      }
    }

    let credentials;

    switch (this.authMethod) {
      case 'service-account':
        credentials = await this.getGCPServiceAccount();
        break;
      
      case 'user-provided':
        credentials = this.getGCPUserProvidedCredentials(user);
        break;
      
      default:
        credentials = this.getGCPEnvironmentCredentials();
    }

    this.credentialCache.set(cacheKey, {
      credentials,
      timestamp: Date.now(),
    });

    auditLogger('gcp_credentials_retrieved', {
      userId: user?.id,
      method: this.authMethod,
    });

    return credentials;
  }

  async getGCPServiceAccount() {
    try {
      const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (keyFile) {
        return { keyFilename: keyFile };
      }
      return {};
    } catch (error) {
      console.log('Service account not available, using default credentials');
      return {};
    }
  }

  getGCPUserProvidedCredentials(user) {
    if (!user?.gcpCredentials) {
      throw new Error('GCP credentials not provided by user');
    }

    return user.gcpCredentials;
  }

  getGCPEnvironmentCredentials() {
    if (!process.env.GCP_PROJECT_ID) {
      return null;
    }

    return {
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    };
  }

  clearCache(userId) {
    if (userId) {
      this.credentialCache.delete(`aws-${userId}`);
      this.credentialCache.delete(`azure-${userId}`);
      this.credentialCache.delete(`gcp-${userId}`);
    } else {
      this.credentialCache.clear();
    }

    auditLogger('credential_cache_cleared', { userId });
  }
}

export const credentialManager = new CloudCredentialManager();
