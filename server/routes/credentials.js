import express from 'express';
import bcrypt from 'bcryptjs';
import { authenticateJWT } from '../auth/jwt.js';
import { auditLogger } from '../middleware/audit.js';
import { credentialManager } from '../config/cloud-credentials.js';

const router = express.Router();

const userCredentials = new Map();

router.post('/aws', authenticateJWT, async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey, roleArn, method } = req.body;

    if (!method || !['access-key', 'assume-role'].includes(method)) {
      return res.status(400).json({ 
        error: 'Invalid method. Use "access-key" or "assume-role"' 
      });
    }

    const userId = req.user.id;
    const hashedSecret = secretAccessKey ? await bcrypt.hash(secretAccessKey, 10) : null;

    const credentials = {
      method,
      accessKeyId: method === 'access-key' ? accessKeyId : null,
      secretAccessKey: hashedSecret,
      roleArn: method === 'assume-role' ? roleArn : null,
      createdAt: new Date().toISOString(),
    };

    if (!userCredentials.has(userId)) {
      userCredentials.set(userId, {});
    }

    userCredentials.get(userId).aws = credentials;

    auditLogger('aws_credentials_stored', {
      userId,
      method,
      hasAccessKey: !!accessKeyId,
      hasRoleArn: !!roleArn,
    });

    credentialManager.clearCache(userId);

    res.json({ 
      success: true, 
      message: 'AWS credentials stored securely',
      method 
    });
  } catch (error) {
    auditLogger('credential_storage_error', {
      userId: req.user.id,
      provider: 'AWS',
      error: error.message,
    });

    res.status(500).json({ 
      error: 'Failed to store credentials',
      message: error.message 
    });
  }
});

router.post('/azure', authenticateJWT, async (req, res) => {
  try {
    const { tenantId, clientId, clientSecret, useManagedIdentity } = req.body;

    if (!useManagedIdentity && (!tenantId || !clientId || !clientSecret)) {
      return res.status(400).json({ 
        error: 'Tenant ID, Client ID, and Client Secret are required' 
      });
    }

    const userId = req.user.id;
    const hashedSecret = clientSecret ? await bcrypt.hash(clientSecret, 10) : null;

    const credentials = {
      method: useManagedIdentity ? 'managed-identity' : 'service-principal',
      tenantId,
      clientId,
      clientSecret: hashedSecret,
      createdAt: new Date().toISOString(),
    };

    if (!userCredentials.has(userId)) {
      userCredentials.set(userId, {});
    }

    userCredentials.get(userId).azure = credentials;

    auditLogger('azure_credentials_stored', {
      userId,
      method: credentials.method,
    });

    credentialManager.clearCache(userId);

    res.json({ 
      success: true, 
      message: 'Azure credentials stored securely' 
    });
  } catch (error) {
    auditLogger('credential_storage_error', {
      userId: req.user.id,
      provider: 'Azure',
      error: error.message,
    });

    res.status(500).json({ 
      error: 'Failed to store credentials',
      message: error.message 
    });
  }
});

router.post('/gcp', authenticateJWT, async (req, res) => {
  try {
    const { projectId, serviceAccountKey } = req.body;

    if (!projectId) {
      return res.status(400).json({ 
        error: 'Project ID is required' 
      });
    }

    const userId = req.user.id;

    const credentials = {
      projectId,
      serviceAccountKey: serviceAccountKey ? JSON.parse(serviceAccountKey) : null,
      createdAt: new Date().toISOString(),
    };

    if (!userCredentials.has(userId)) {
      userCredentials.set(userId, {});
    }

    userCredentials.get(userId).gcp = credentials;

    auditLogger('gcp_credentials_stored', {
      userId,
      projectId,
    });

    credentialManager.clearCache(userId);

    res.json({ 
      success: true, 
      message: 'GCP credentials stored securely' 
    });
  } catch (error) {
    auditLogger('credential_storage_error', {
      userId: req.user.id,
      provider: 'GCP',
      error: error.message,
    });

    res.status(500).json({ 
      error: 'Failed to store credentials',
      message: error.message 
    });
  }
});

router.get('/status', authenticateJWT, (req, res) => {
  const userId = req.user.id;
  const userCreds = userCredentials.get(userId) || {};

  res.json({
    aws: {
      configured: !!userCreds.aws,
      method: userCreds.aws?.method,
    },
    azure: {
      configured: !!userCreds.azure,
      method: userCreds.azure?.method,
    },
    gcp: {
      configured: !!userCreds.gcp,
      projectId: userCreds.gcp?.projectId,
    },
  });
});

router.delete('/:provider', authenticateJWT, (req, res) => {
  const { provider } = req.params;
  const userId = req.user.id;

  if (!['aws', 'azure', 'gcp'].includes(provider)) {
    return res.status(400).json({ error: 'Invalid provider' });
  }

  const userCreds = userCredentials.get(userId);
  if (userCreds && userCreds[provider]) {
    delete userCreds[provider];

    auditLogger('credentials_deleted', {
      userId,
      provider,
    });

    credentialManager.clearCache(userId);

    res.json({ 
      success: true, 
      message: `${provider.toUpperCase()} credentials deleted` 
    });
  } else {
    res.status(404).json({ 
      error: 'Credentials not found' 
    });
  }
});

export function getUserCredentials(userId, provider) {
  const userCreds = userCredentials.get(userId);
  return userCreds?.[provider] || null;
}

export default router;
