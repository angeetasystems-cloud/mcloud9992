import bcrypt from 'bcryptjs';
import { auditLogger } from '../middleware/audit.js';

export const UserRole = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  USER: 'user',
};

export const Permissions = {
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_RESOURCES: 'view_resources',
  VIEW_COSTS: 'view_costs',
  MANAGE_USERS: 'manage_users',
  MANAGE_CREDENTIALS: 'manage_credentials',
  MANAGE_PROVIDERS: 'manage_providers',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  MANAGE_SETTINGS: 'manage_settings',
  DELETE_RESOURCES: 'delete_resources',
};

const rolePermissions = {
  [UserRole.SUPER_ADMIN]: [
    Permissions.VIEW_DASHBOARD,
    Permissions.VIEW_RESOURCES,
    Permissions.VIEW_COSTS,
    Permissions.MANAGE_USERS,
    Permissions.MANAGE_CREDENTIALS,
    Permissions.MANAGE_PROVIDERS,
    Permissions.VIEW_AUDIT_LOGS,
    Permissions.MANAGE_SETTINGS,
    Permissions.DELETE_RESOURCES,
  ],
  [UserRole.ADMIN]: [
    Permissions.VIEW_DASHBOARD,
    Permissions.VIEW_RESOURCES,
    Permissions.VIEW_COSTS,
    Permissions.MANAGE_USERS,
    Permissions.MANAGE_CREDENTIALS,
    Permissions.VIEW_AUDIT_LOGS,
  ],
  [UserRole.USER]: [
    Permissions.VIEW_DASHBOARD,
    Permissions.VIEW_RESOURCES,
    Permissions.VIEW_COSTS,
  ],
};

class UserDatabase {
  constructor() {
    this.users = new Map();
    this.initializeSuperAdmin();
  }

  async initializeSuperAdmin() {
    const superAdminExists = Array.from(this.users.values()).some(
      user => user.role === UserRole.SUPER_ADMIN
    );

    if (!superAdminExists) {
      const hashedPassword = await bcrypt.hash('ChangeMe@123', 10);
      
      const superAdmin = {
        id: 'super-admin-001',
        username: 'superadmin',
        email: 'admin@multicloud-dashboard.local',
        password: hashedPassword,
        role: UserRole.SUPER_ADMIN,
        customPermissions: [],
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLogin: null,
        mfaEnabled: false,
      };

      this.users.set(superAdmin.id, superAdmin);
      
      console.log('🔐 Super Admin created:');
      console.log('   Username: superadmin');
      console.log('   Password: ChangeMe@123');
      console.log('   ⚠️  CHANGE THIS PASSWORD IMMEDIATELY!');
    }
  }

  async createUser(userData) {
    const { username, email, password, role, createdBy } = userData;

    if (this.findByUsername(username)) {
      throw new Error('Username already exists');
    }

    if (this.findByEmail(email)) {
      throw new Error('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const user = {
      id: userId,
      username,
      email,
      password: hashedPassword,
      role: role || UserRole.USER,
      customPermissions: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      createdBy,
      lastLogin: null,
      mfaEnabled: false,
    };

    this.users.set(userId, user);

    auditLogger('user_created', {
      userId,
      username,
      email,
      role: user.role,
      createdBy,
    });

    return this.sanitizeUser(user);
  }

  async authenticateUser(username, password) {
    const user = this.findByUsername(username);

    if (!user) {
      auditLogger('login_failed', { username, reason: 'user_not_found' });
      throw new Error('Invalid username or password');
    }

    if (!user.isActive) {
      auditLogger('login_failed', { username, reason: 'account_disabled' });
      throw new Error('Account is disabled');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      auditLogger('login_failed', { username, reason: 'invalid_password' });
      throw new Error('Invalid username or password');
    }

    user.lastLogin = new Date().toISOString();

    auditLogger('login_success', {
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    return this.sanitizeUser(user);
  }

  findByUsername(username) {
    return Array.from(this.users.values()).find(
      user => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  findByEmail(email) {
    return Array.from(this.users.values()).find(
      user => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  findById(userId) {
    return this.users.get(userId);
  }

  getAllUsers() {
    return Array.from(this.users.values()).map(user => this.sanitizeUser(user));
  }

  async updateUser(userId, updates, updatedBy) {
    const user = this.users.get(userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    Object.assign(user, updates, { updatedAt: new Date().toISOString() });

    auditLogger('user_updated', {
      userId,
      updates: Object.keys(updates),
      updatedBy,
    });

    return this.sanitizeUser(user);
  }

  async deleteUser(userId, deletedBy) {
    const user = this.users.get(userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      throw new Error('Cannot delete super admin');
    }

    this.users.delete(userId);

    auditLogger('user_deleted', {
      userId,
      username: user.username,
      deletedBy,
    });

    return true;
  }

  setCustomPermissions(userId, permissions, setBy) {
    const user = this.users.get(userId);

    if (!user) {
      throw new Error('User not found');
    }

    user.customPermissions = permissions;

    auditLogger('permissions_updated', {
      userId,
      permissions,
      setBy,
    });

    return this.sanitizeUser(user);
  }

  getUserPermissions(userId) {
    const user = this.users.get(userId);

    if (!user) {
      return [];
    }

    const basePermissions = rolePermissions[user.role] || [];
    return [...new Set([...basePermissions, ...user.customPermissions])];
  }

  hasPermission(userId, permission) {
    const permissions = this.getUserPermissions(userId);
    return permissions.includes(permission);
  }

  sanitizeUser(user) {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}

export const userDB = new UserDatabase();
