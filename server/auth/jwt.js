import jwt from 'jsonwebtoken';
import { auditLogger } from '../middleware/audit.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production-use-secrets-manager';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

export function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    provider: user.provider || 'local',
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
    issuer: 'multi-cloud-dashboard',
    audience: 'dashboard-api',
  });

  auditLogger('jwt_generated', {
    userId: user.id,
    email: user.email,
    expiresIn: JWT_EXPIRY,
  });

  return token;
}

export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'multi-cloud-dashboard',
      audience: 'dashboard-api',
    });

    return { valid: true, user: decoded };
  } catch (error) {
    auditLogger('jwt_verification_failed', {
      error: error.message,
    });

    return { valid: false, error: error.message };
  }
}

export function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please provide a valid Bearer token' 
    });
  }

  const token = authHeader.substring(7);
  const result = verifyToken(token);

  if (!result.valid) {
    auditLogger('unauthorized_access', {
      ip: req.ip,
      url: req.originalUrl,
      error: result.error,
    });

    return res.status(401).json({ 
      error: 'Invalid or expired token',
      message: result.error 
    });
  }

  req.user = result.user;
  next();
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const result = verifyToken(token);

    if (result.valid) {
      req.user = result.user;
    }
  }

  next();
}
