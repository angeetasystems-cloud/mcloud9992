import express from 'express';
import { userDB, UserRole, Permissions } from '../models/User.js';
import { generateToken } from '../auth/jwt.js';
import { requireAuth, requirePermission, requireRole } from '../middleware/rbac.js';
import { auditLogger } from '../middleware/audit.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required',
      });
    }

    const user = await userDB.authenticateUser(username, password);
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: userDB.getUserPermissions(user.id),
      },
    });
  } catch (error) {
    res.status(401).json({
      error: 'Authentication failed',
      message: error.message,
    });
  }
});

router.get('/me', requireAuth, (req, res) => {
  const user = userDB.findById(req.user.id);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    user: userDB.sanitizeUser(user),
    permissions: userDB.getUserPermissions(user.id),
  });
});

router.post('/create', requireAuth, requirePermission(Permissions.MANAGE_USERS), async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Username, email, and password are required',
      });
    }

    if (role === UserRole.SUPER_ADMIN && req.user.role !== UserRole.SUPER_ADMIN) {
      return res.status(403).json({
        error: 'Only super admins can create super admin accounts',
      });
    }

    const user = await userDB.createUser({
      username,
      email,
      password,
      role: role || UserRole.USER,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user,
    });
  } catch (error) {
    res.status(400).json({
      error: 'Failed to create user',
      message: error.message,
    });
  }
});

router.get('/list', requireAuth, requirePermission(Permissions.MANAGE_USERS), (req, res) => {
  const users = userDB.getAllUsers();
  
  res.json({
    users,
    total: users.length,
  });
});

router.get('/:userId', requireAuth, requirePermission(Permissions.MANAGE_USERS), (req, res) => {
  const { userId } = req.params;
  const user = userDB.findById(userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    user: userDB.sanitizeUser(user),
    permissions: userDB.getUserPermissions(userId),
  });
});

router.put('/:userId', requireAuth, requirePermission(Permissions.MANAGE_USERS), async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    if (updates.role === UserRole.SUPER_ADMIN && req.user.role !== UserRole.SUPER_ADMIN) {
      return res.status(403).json({
        error: 'Only super admins can assign super admin role',
      });
    }

    const user = await userDB.updateUser(userId, updates, req.user.id);

    res.json({
      success: true,
      message: 'User updated successfully',
      user,
    });
  } catch (error) {
    res.status(400).json({
      error: 'Failed to update user',
      message: error.message,
    });
  }
});

router.delete('/:userId', requireAuth, requirePermission(Permissions.MANAGE_USERS), async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user.id) {
      return res.status(400).json({
        error: 'Cannot delete your own account',
      });
    }

    await userDB.deleteUser(userId, req.user.id);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    res.status(400).json({
      error: 'Failed to delete user',
      message: error.message,
    });
  }
});

router.put('/:userId/permissions', requireAuth, requireRole(UserRole.SUPER_ADMIN), (req, res) => {
  try {
    const { userId } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        error: 'Permissions must be an array',
      });
    }

    const user = userDB.setCustomPermissions(userId, permissions, req.user.id);

    res.json({
      success: true,
      message: 'Permissions updated successfully',
      user,
      permissions: userDB.getUserPermissions(userId),
    });
  } catch (error) {
    res.status(400).json({
      error: 'Failed to update permissions',
      message: error.message,
    });
  }
});

router.put('/:userId/toggle-status', requireAuth, requirePermission(Permissions.MANAGE_USERS), async (req, res) => {
  try {
    const { userId } = req.params;
    const user = userDB.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      return res.status(403).json({
        error: 'Cannot disable super admin account',
      });
    }

    const updated = await userDB.updateUser(
      userId,
      { isActive: !user.isActive },
      req.user.id
    );

    res.json({
      success: true,
      message: `User ${updated.isActive ? 'enabled' : 'disabled'} successfully`,
      user: updated,
    });
  } catch (error) {
    res.status(400).json({
      error: 'Failed to toggle user status',
      message: error.message,
    });
  }
});

router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Current password and new password are required',
      });
    }

    const user = userDB.findById(req.user.id);
    const bcrypt = (await import('bcryptjs')).default;
    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      return res.status(401).json({
        error: 'Current password is incorrect',
      });
    }

    await userDB.updateUser(req.user.id, { password: newPassword }, req.user.id);

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    res.status(400).json({
      error: 'Failed to change password',
      message: error.message,
    });
  }
});

router.get('/roles/list', requireAuth, (req, res) => {
  res.json({
    roles: Object.values(UserRole),
    descriptions: {
      [UserRole.SUPER_ADMIN]: 'Full system access, can manage all users and settings',
      [UserRole.ADMIN]: 'Can manage users and view all resources',
      [UserRole.USER]: 'Can view dashboard and resources',
    },
  });
});

router.get('/permissions/list', requireAuth, requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]), (req, res) => {
  res.json({
    permissions: Object.values(Permissions),
    descriptions: {
      [Permissions.VIEW_DASHBOARD]: 'View main dashboard',
      [Permissions.VIEW_RESOURCES]: 'View cloud resources',
      [Permissions.VIEW_COSTS]: 'View cost analytics',
      [Permissions.MANAGE_USERS]: 'Create, update, delete users',
      [Permissions.MANAGE_CREDENTIALS]: 'Manage cloud credentials',
      [Permissions.MANAGE_PROVIDERS]: 'Manage cloud providers',
      [Permissions.VIEW_AUDIT_LOGS]: 'View audit logs',
      [Permissions.MANAGE_SETTINGS]: 'Manage system settings',
      [Permissions.DELETE_RESOURCES]: 'Delete cloud resources',
    },
  });
});

export default router;
