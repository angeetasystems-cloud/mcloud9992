import { userDB } from '../models/User.js';
import { auditLogger } from './audit.js';

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in to access this resource',
    });
  }
  next();
}

export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    const hasPermission = userDB.hasPermission(req.user.id, permission);

    if (!hasPermission) {
      auditLogger('permission_denied', {
        userId: req.user.id,
        username: req.user.username,
        permission,
        url: req.originalUrl,
      });

      return res.status(403).json({
        error: 'Permission denied',
        message: `You don't have permission: ${permission}`,
        required: permission,
      });
    }

    next();
  };
}

export function requireRole(roles) {
  if (!Array.isArray(roles)) {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      auditLogger('role_denied', {
        userId: req.user.id,
        username: req.user.username,
        requiredRoles: roles,
        userRole: req.user.role,
        url: req.originalUrl,
      });

      return res.status(403).json({
        error: 'Access denied',
        message: 'You don\'t have the required role to access this resource',
        required: roles,
        current: req.user.role,
      });
    }

    next();
  };
}

export function attachUserPermissions(req, res, next) {
  if (req.user) {
    req.user.permissions = userDB.getUserPermissions(req.user.id);
  }
  next();
}
