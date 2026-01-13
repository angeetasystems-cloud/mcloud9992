# User Management & RBAC Guide

## Overview

Enterprise-grade user management system with **Role-Based Access Control (RBAC)** and granular permissions.

## User Roles

### 1. Super Admin
**Full system access** - Can do everything
- ✅ Manage all users (create, update, delete)
- ✅ Assign any role including Super Admin
- ✅ Set custom permissions for any user
- ✅ View all audit logs
- ✅ Manage system settings
- ✅ Access all cloud providers
- ✅ Delete cloud resources

### 2. Admin
**User and resource management** - Cannot create Super Admins
- ✅ Manage users (create, update, delete regular users)
- ✅ Cannot create/modify Super Admins
- ✅ View audit logs
- ✅ Manage cloud credentials
- ✅ Access all cloud providers
- ✅ View all resources and costs
- ❌ Cannot delete cloud resources
- ❌ Cannot manage system settings

### 3. User (Normal User)
**Read-only access** - View only
- ✅ View dashboard
- ✅ View cloud resources
- ✅ View cost analytics
- ❌ Cannot manage users
- ❌ Cannot manage credentials
- ❌ Cannot delete resources
- ❌ Cannot view audit logs

## Default Credentials

### Super Admin Account
```
Username: superadmin
Password: ChangeMe@123
```

**⚠️ CRITICAL: Change this password immediately after first login!**

## API Endpoints

### Authentication

#### Login (Console-Style)
```bash
POST http://localhost:5000/api/users/login
Content-Type: application/json

{
  "username": "superadmin",
  "password": "ChangeMe@123"
}

# Response:
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "super-admin-001",
    "username": "superadmin",
    "email": "admin@multicloud-dashboard.local",
    "role": "super_admin",
    "permissions": [
      "view_dashboard",
      "view_resources",
      "manage_users",
      ...
    ]
  }
}
```

#### Get Current User
```bash
GET http://localhost:5000/api/users/me
Authorization: Bearer <token>

# Response:
{
  "user": {
    "id": "super-admin-001",
    "username": "superadmin",
    "email": "admin@multicloud-dashboard.local",
    "role": "super_admin",
    "isActive": true,
    "createdAt": "2026-01-13T06:00:00.000Z",
    "lastLogin": "2026-01-13T06:30:00.000Z"
  },
  "permissions": [...]
}
```

### User Management

#### Create User
```bash
POST http://localhost:5000/api/users/create
Authorization: Bearer <super-admin-token>
Content-Type: application/json

{
  "username": "john.doe",
  "email": "john.doe@company.com",
  "password": "SecurePass123!",
  "role": "admin"
}

# Roles: "super_admin", "admin", "user"

# Response:
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": "user-1234567890-abc123",
    "username": "john.doe",
    "email": "john.doe@company.com",
    "role": "admin",
    "isActive": true,
    "createdAt": "2026-01-13T06:00:00.000Z"
  }
}
```

#### List All Users
```bash
GET http://localhost:5000/api/users/list
Authorization: Bearer <admin-token>

# Response:
{
  "users": [
    {
      "id": "super-admin-001",
      "username": "superadmin",
      "email": "admin@multicloud-dashboard.local",
      "role": "super_admin",
      "isActive": true
    },
    {
      "id": "user-1234567890-abc123",
      "username": "john.doe",
      "email": "john.doe@company.com",
      "role": "admin",
      "isActive": true
    }
  ],
  "total": 2
}
```

#### Get User Details
```bash
GET http://localhost:5000/api/users/:userId
Authorization: Bearer <admin-token>

# Response:
{
  "user": {
    "id": "user-1234567890-abc123",
    "username": "john.doe",
    "email": "john.doe@company.com",
    "role": "admin",
    "isActive": true,
    "createdAt": "2026-01-13T06:00:00.000Z",
    "lastLogin": "2026-01-13T07:00:00.000Z"
  },
  "permissions": [
    "view_dashboard",
    "view_resources",
    "view_costs",
    "manage_users",
    "manage_credentials",
    "view_audit_logs"
  ]
}
```

#### Update User
```bash
PUT http://localhost:5000/api/users/:userId
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "email": "newemail@company.com",
  "role": "user"
}

# Response:
{
  "success": true,
  "message": "User updated successfully",
  "user": {
    "id": "user-1234567890-abc123",
    "username": "john.doe",
    "email": "newemail@company.com",
    "role": "user",
    "isActive": true
  }
}
```

#### Delete User
```bash
DELETE http://localhost:5000/api/users/:userId
Authorization: Bearer <admin-token>

# Response:
{
  "success": true,
  "message": "User deleted successfully"
}

# Note: Cannot delete:
# - Your own account
# - Super admin accounts
```

#### Enable/Disable User
```bash
PUT http://localhost:5000/api/users/:userId/toggle-status
Authorization: Bearer <admin-token>

# Response:
{
  "success": true,
  "message": "User disabled successfully",
  "user": {
    "id": "user-1234567890-abc123",
    "username": "john.doe",
    "isActive": false
  }
}
```

#### Change Password
```bash
POST http://localhost:5000/api/users/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass456!"
}

# Response:
{
  "success": true,
  "message": "Password changed successfully"
}
```

### Permission Management

#### Set Custom Permissions (Super Admin Only)
```bash
PUT http://localhost:5000/api/users/:userId/permissions
Authorization: Bearer <super-admin-token>
Content-Type: application/json

{
  "permissions": [
    "view_dashboard",
    "view_resources",
    "view_costs",
    "manage_credentials"
  ]
}

# Response:
{
  "success": true,
  "message": "Permissions updated successfully",
  "user": {...},
  "permissions": [...]
}
```

#### List Available Roles
```bash
GET http://localhost:5000/api/users/roles/list
Authorization: Bearer <token>

# Response:
{
  "roles": ["super_admin", "admin", "user"],
  "descriptions": {
    "super_admin": "Full system access, can manage all users and settings",
    "admin": "Can manage users and view all resources",
    "user": "Can view dashboard and resources"
  }
}
```

#### List Available Permissions
```bash
GET http://localhost:5000/api/users/permissions/list
Authorization: Bearer <admin-token>

# Response:
{
  "permissions": [
    "view_dashboard",
    "view_resources",
    "view_costs",
    "manage_users",
    "manage_credentials",
    "manage_providers",
    "view_audit_logs",
    "manage_settings",
    "delete_resources"
  ],
  "descriptions": {
    "view_dashboard": "View main dashboard",
    "view_resources": "View cloud resources",
    ...
  }
}
```

## Permission Matrix

| Permission | Super Admin | Admin | User |
|-----------|-------------|-------|------|
| View Dashboard | ✅ | ✅ | ✅ |
| View Resources | ✅ | ✅ | ✅ |
| View Costs | ✅ | ✅ | ✅ |
| Manage Users | ✅ | ✅ | ❌ |
| Manage Credentials | ✅ | ✅ | ❌ |
| Manage Providers | ✅ | ❌ | ❌ |
| View Audit Logs | ✅ | ✅ | ❌ |
| Manage Settings | ✅ | ❌ | ❌ |
| Delete Resources | ✅ | ❌ | ❌ |

## Usage Examples

### Example 1: Create Admin User
```bash
# 1. Login as Super Admin
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin",
    "password": "ChangeMe@123"
  }'

# Save the token from response

# 2. Create Admin User
curl -X POST http://localhost:5000/api/users/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <super-admin-token>" \
  -d '{
    "username": "admin1",
    "email": "admin1@company.com",
    "password": "AdminPass123!",
    "role": "admin"
  }'
```

### Example 2: Create Normal User with Custom Permissions
```bash
# 1. Create User
curl -X POST http://localhost:5000/api/users/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "username": "analyst1",
    "email": "analyst1@company.com",
    "password": "UserPass123!",
    "role": "user"
  }'

# 2. Add Custom Permission (as Super Admin)
curl -X PUT http://localhost:5000/api/users/<user-id>/permissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <super-admin-token>" \
  -d '{
    "permissions": [
      "view_dashboard",
      "view_resources",
      "view_costs",
      "view_audit_logs"
    ]
  }'
```

### Example 3: Disable User Account
```bash
curl -X PUT http://localhost:5000/api/users/<user-id>/toggle-status \
  -H "Authorization: Bearer <admin-token>"
```

## Security Features

### 1. Password Security
- ✅ Bcrypt hashing (10 rounds)
- ✅ Passwords never stored in plain text
- ✅ Passwords never returned in API responses
- ✅ Minimum password requirements (implement in frontend)

### 2. Role-Based Access Control
- ✅ Hierarchical role system
- ✅ Permission-based authorization
- ✅ Custom permissions per user
- ✅ Cannot escalate own privileges

### 3. Audit Logging
All user actions logged:
- Login attempts (success/failure)
- User creation/modification/deletion
- Permission changes
- Role assignments
- Password changes

### 4. Session Management
- ✅ JWT tokens with 24-hour expiry
- ✅ Secure session cookies
- ✅ HTTP-only cookies in production
- ✅ CSRF protection

## Best Practices

### ✅ DO:
1. **Change default password** immediately
2. **Use strong passwords** (12+ characters, mixed case, numbers, symbols)
3. **Assign least privilege** - Start with User role, escalate as needed
4. **Regular password rotation** - Every 90 days
5. **Enable MFA** (when implemented)
6. **Review audit logs** regularly
7. **Disable inactive accounts** promptly
8. **Use separate accounts** for different purposes
9. **Limit Super Admin accounts** - Only 1-2 per organization
10. **Document permission changes**

### ❌ DON'T:
1. ❌ Share account credentials
2. ❌ Use weak passwords
3. ❌ Grant unnecessary permissions
4. ❌ Keep default password
5. ❌ Create multiple Super Admin accounts unnecessarily
6. ❌ Disable audit logging
7. ❌ Delete users without backup
8. ❌ Allow users to escalate own privileges
9. ❌ Store passwords in plain text
10. ❌ Ignore failed login attempts

## Integration with Cloud Providers

### User-Specific Credentials
Each user can have their own cloud credentials:

```bash
# User logs in
POST /api/users/login

# User adds their AWS credentials
POST /api/credentials/aws
Authorization: Bearer <user-token>
{
  "method": "assume-role",
  "roleArn": "arn:aws:iam::123456789012:role/UserReadOnly"
}

# Dashboard uses user's credentials
POST /api/dashboard
Authorization: Bearer <user-token>
{
  "providers": ["aws"]
}
```

## Compliance

This RBAC system meets:
- ✅ **GDPR**: User consent, data minimization, right to erasure
- ✅ **HIPAA**: Access controls, audit logging, user authentication
- ✅ **SOC 2**: Authentication, authorization, monitoring
- ✅ **ISO 27001**: Identity and access management
- ✅ **NIST**: Role-based access control, least privilege

## Troubleshooting

### Issue: Cannot login
**Solutions**:
- Verify username/password are correct
- Check if account is active
- Review audit logs for failed attempts

### Issue: Permission denied
**Solutions**:
- Check user role and permissions
- Verify JWT token is valid
- Ensure user has required permission

### Issue: Cannot create Super Admin
**Solutions**:
- Only Super Admins can create Super Admins
- Login with existing Super Admin account

### Issue: Forgot Super Admin password
**Solutions**:
- Restart server (creates new Super Admin if none exists)
- Or manually reset in database

## Future Enhancements

Planned features:
- 🔄 Multi-Factor Authentication (MFA)
- 🔄 SSO Integration (SAML, LDAP)
- 🔄 Password complexity requirements
- 🔄 Account lockout after failed attempts
- 🔄 Password expiry policies
- 🔄 Session timeout configuration
- 🔄 IP whitelisting
- 🔄 API key authentication

---

**Security First**: Always follow the principle of least privilege and regularly audit user permissions!
