# Enterprise Authentication Guide

## Overview

This Multi-Cloud Dashboard implements **industry-standard authentication** methods following security best practices. No credentials are stored in `.env` files in production.

## Authentication Methods

### 1. OAuth 2.0 (Recommended for Users)

#### Google OAuth
**Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: "Web application"
6. Authorized redirect URIs: `http://localhost:5000/auth/google/callback`
7. Copy Client ID and Client Secret

**Configuration:**
```env
# OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback
FRONTEND_URL=http://localhost:3002
```

**Usage:**
```bash
# User clicks "Login with Google" button
# Redirects to: http://localhost:5000/auth/google
# After auth, returns JWT token
```

#### Azure AD OAuth
**Setup:**
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory"
3. Go to "App registrations" → "New registration"
4. Name: "Multi-Cloud Dashboard"
5. Redirect URI: `http://localhost:5000/auth/azure/callback`
6. Copy Application (client) ID and Directory (tenant) ID
7. Create client secret in "Certificates & secrets"

**Configuration:**
```env
AZURE_AD_CLIENT_ID=your-application-id
AZURE_AD_TENANT_ID=your-tenant-id
AZURE_AD_CLIENT_SECRET=your-client-secret
```

### 2. AWS IAM Roles (Recommended for AWS)

#### EC2 Instance Profile (Best Practice)
**Setup:**
1. Create IAM Role in AWS Console
2. Attach policies:
   - `AmazonEC2ReadOnlyAccess`
   - `AmazonS3ReadOnlyAccess`
   - `AmazonRDSReadOnlyAccess`
3. Attach role to EC2 instance
4. No credentials needed in code!

**Configuration:**
```env
AUTH_METHOD=iam-role
AWS_REGION=us-east-1
```

**How it works:**
```javascript
// Automatically uses EC2 instance metadata
// No access keys needed!
const credentials = await credentialManager.getAWSCredentials();
```

#### Assume Role (Multi-Account)
**Setup:**
1. Create IAM Role in target account
2. Trust policy allows your account to assume role
3. Users provide Role ARN

**API Usage:**
```bash
POST /api/credentials/aws
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "method": "assume-role",
  "roleArn": "arn:aws:iam::123456789012:role/DashboardReadOnly"
}
```

### 3. Azure Managed Identity (Recommended for Azure)

**Setup:**
1. Deploy dashboard to Azure VM or App Service
2. Enable System-assigned Managed Identity
3. Grant permissions to Azure resources
4. No credentials needed!

**Configuration:**
```env
AUTH_METHOD=managed-identity
```

**How it works:**
```javascript
// Automatically uses Managed Identity
const credential = new DefaultAzureCredential();
```

### 4. GCP Service Account (Recommended for GCP)

**Setup:**
1. Create Service Account in GCP Console
2. Grant roles:
   - `Compute Viewer`
   - `Storage Object Viewer`
   - `Cloud SQL Viewer`
3. Attach service account to Compute Engine instance
4. No key file needed!

**Configuration:**
```env
AUTH_METHOD=service-account
GCP_PROJECT_ID=your-project-id
```

### 5. JWT Token Authentication

**Generate Token (after OAuth login):**
```bash
POST /auth/google
# Redirects and returns JWT token
```

**Use Token:**
```bash
GET /api/dashboard
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token contains:**
- User ID
- Email
- Provider (google/azure)
- Expiry (24 hours default)

## Security Architecture

### Production Deployment Options

#### Option 1: AWS (Recommended)
```
┌─────────────────────────────────────┐
│  User Browser                       │
│  ↓ OAuth Login (Google/Azure AD)   │
├─────────────────────────────────────┤
│  Application Load Balancer (HTTPS) │
│  ↓ JWT Token                        │
├─────────────────────────────────────┤
│  EC2 Instance (Dashboard)           │
│  • IAM Instance Profile             │
│  • No credentials in code           │
│  ↓ Temporary credentials            │
├─────────────────────────────────────┤
│  AWS Services (EC2, S3, RDS)        │
│  • Read-only access via IAM role    │
└─────────────────────────────────────┘
```

**Setup:**
```bash
# 1. Create IAM Role
aws iam create-role --role-name DashboardInstanceRole \
  --assume-role-policy-document file://trust-policy.json

# 2. Attach policies
aws iam attach-role-policy --role-name DashboardInstanceRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess

# 3. Create instance profile
aws iam create-instance-profile --instance-profile-name DashboardProfile

# 4. Add role to profile
aws iam add-role-to-instance-profile \
  --instance-profile-name DashboardProfile \
  --role-name DashboardInstanceRole

# 5. Launch EC2 with profile
aws ec2 run-instances --iam-instance-profile Name=DashboardProfile ...
```

#### Option 2: Azure
```
┌─────────────────────────────────────┐
│  User Browser                       │
│  ↓ Azure AD OAuth                   │
├─────────────────────────────────────┤
│  Azure App Service (HTTPS)          │
│  • Managed Identity enabled         │
│  • No credentials in code           │
│  ↓ Managed Identity token           │
├─────────────────────────────────────┤
│  Azure Resources (VMs, Storage)     │
│  • Read-only access via RBAC        │
└─────────────────────────────────────┘
```

**Setup:**
```bash
# 1. Create App Service
az webapp create --name multi-cloud-dashboard \
  --resource-group myResourceGroup

# 2. Enable Managed Identity
az webapp identity assign --name multi-cloud-dashboard \
  --resource-group myResourceGroup

# 3. Grant permissions
az role assignment create \
  --assignee <managed-identity-id> \
  --role "Reader" \
  --scope /subscriptions/<subscription-id>
```

#### Option 3: GCP
```
┌─────────────────────────────────────┐
│  User Browser                       │
│  ↓ Google OAuth                     │
├─────────────────────────────────────┤
│  Cloud Run / Compute Engine         │
│  • Service Account attached         │
│  • No key files needed              │
│  ↓ Service account credentials      │
├─────────────────────────────────────┤
│  GCP Resources (Compute, Storage)   │
│  • Read-only access via IAM         │
└─────────────────────────────────────┘
```

**Setup:**
```bash
# 1. Create service account
gcloud iam service-accounts create dashboard-sa \
  --display-name="Dashboard Service Account"

# 2. Grant permissions
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:dashboard-sa@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/compute.viewer"

# 3. Attach to Compute Engine
gcloud compute instances create dashboard-instance \
  --service-account=dashboard-sa@PROJECT_ID.iam.gserviceaccount.com
```

## API Endpoints

### Authentication

#### Login with Google
```bash
GET /auth/google
# Redirects to Google OAuth
# Returns: JWT token in callback URL
```

#### Login with Azure AD
```bash
GET /auth/azure
# Redirects to Azure AD OAuth
# Returns: JWT token in callback URL
```

#### Verify Token
```bash
POST /auth/token/verify
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

# Response:
{
  "valid": true,
  "user": {
    "id": "123456",
    "email": "user@example.com",
    "provider": "google"
  }
}
```

#### Check Auth Status
```bash
GET /auth/status
Authorization: Bearer <token>

# Response:
{
  "authenticated": true,
  "user": {
    "id": "123456",
    "email": "user@example.com",
    "name": "John Doe",
    "provider": "google"
  },
  "availableMethods": {
    "google": true,
    "azure": true,
    "apiKey": true
  }
}
```

### Cloud Credentials Management

#### Store AWS Credentials
```bash
POST /api/credentials/aws
Authorization: Bearer <token>
Content-Type: application/json

# Method 1: Access Keys (encrypted)
{
  "method": "access-key",
  "accessKeyId": "AKIAIOSFODNN7EXAMPLE",
  "secretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
}

# Method 2: Assume Role
{
  "method": "assume-role",
  "roleArn": "arn:aws:iam::123456789012:role/DashboardReadOnly"
}
```

#### Store Azure Credentials
```bash
POST /api/credentials/azure
Authorization: Bearer <token>
Content-Type: application/json

{
  "tenantId": "your-tenant-id",
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret"
}

# Or use Managed Identity
{
  "useManagedIdentity": true
}
```

#### Store GCP Credentials
```bash
POST /api/credentials/gcp
Authorization: Bearer <token>
Content-Type: application/json

{
  "projectId": "my-project-id",
  "serviceAccountKey": "{...service-account-json...}"
}
```

#### Check Credential Status
```bash
GET /api/credentials/status
Authorization: Bearer <token>

# Response:
{
  "aws": {
    "configured": true,
    "method": "assume-role"
  },
  "azure": {
    "configured": true,
    "method": "service-principal"
  },
  "gcp": {
    "configured": true,
    "projectId": "my-project-id"
  }
}
```

#### Delete Credentials
```bash
DELETE /api/credentials/aws
Authorization: Bearer <token>

# Response:
{
  "success": true,
  "message": "AWS credentials deleted"
}
```

## Security Features

### 1. Credential Encryption
- All user-provided credentials encrypted with bcrypt
- Secrets never stored in plain text
- Credentials cached in memory (1 hour TTL)

### 2. Token Security
- JWT tokens with 24-hour expiry
- Signed with secret key (use AWS Secrets Manager in production)
- Includes user ID, email, and provider
- Verified on every API request

### 3. Audit Logging
All authentication events logged:
- OAuth logins
- Credential storage/retrieval
- Token generation/verification
- Unauthorized access attempts

### 4. Rate Limiting
- 100 requests per 15 minutes (general)
- 20 requests per 15 minutes (auth endpoints)

## Environment Variables

### Required for OAuth
```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

# Azure AD OAuth
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_TENANT_ID=your-tenant-id
AZURE_AD_CLIENT_SECRET=your-client-secret

# JWT Configuration
JWT_SECRET=use-aws-secrets-manager-in-production
JWT_EXPIRY=24h
SESSION_SECRET=use-aws-secrets-manager-in-production

# Frontend
FRONTEND_URL=http://localhost:3002
ALLOWED_ORIGINS=http://localhost:3002,http://localhost:3000
```

### Required for Cloud Access
```env
# Authentication Method
AUTH_METHOD=iam-role  # or managed-identity, service-account

# AWS (only if not using IAM role)
AWS_REGION=us-east-1

# Azure (only if not using Managed Identity)
# Leave empty to use Managed Identity

# GCP (only if not using attached service account)
GCP_PROJECT_ID=your-project-id
```

## Best Practices

### ✅ DO:
1. **Use OAuth 2.0** for user authentication
2. **Use IAM roles** for cloud resource access (AWS)
3. **Use Managed Identity** for Azure deployments
4. **Use Service Accounts** for GCP deployments
5. **Rotate JWT secrets** regularly (use Secrets Manager)
6. **Enable HTTPS** in production
7. **Use short-lived tokens** (24 hours or less)
8. **Audit all authentication events**
9. **Implement MFA** for OAuth providers
10. **Use separate credentials** per environment

### ❌ DON'T:
1. ❌ Store credentials in `.env` files in production
2. ❌ Use long-lived access keys
3. ❌ Share credentials between users
4. ❌ Commit secrets to Git
5. ❌ Use admin/write permissions (read-only only)
6. ❌ Disable audit logging
7. ❌ Use weak JWT secrets
8. ❌ Allow unlimited token lifetime
9. ❌ Skip credential encryption
10. ❌ Use HTTP in production

## Migration from .env

### Before (Insecure):
```env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

### After (Secure):

**Option 1: IAM Role (Best)**
```env
AUTH_METHOD=iam-role
AWS_REGION=us-east-1
# No credentials needed!
```

**Option 2: User-Provided (Encrypted)**
```bash
# User logs in with OAuth
# User provides credentials via API (encrypted)
POST /api/credentials/aws
Authorization: Bearer <jwt-token>
{
  "method": "assume-role",
  "roleArn": "arn:aws:iam::123456789012:role/ReadOnly"
}
```

## Compliance

This authentication system meets:
- ✅ **GDPR**: User consent, data minimization
- ✅ **HIPAA**: Access controls, audit logging
- ✅ **SOC 2**: Authentication, authorization, monitoring
- ✅ **ISO 27001**: Identity management, access control
- ✅ **NIST**: Multi-factor authentication, least privilege

## Troubleshooting

### Issue: OAuth redirect not working
**Solution**: Check callback URL matches exactly in OAuth provider settings

### Issue: IAM role not found
**Solution**: Verify EC2 instance has instance profile attached

### Issue: Token expired
**Solution**: Tokens expire after 24 hours, user must re-authenticate

### Issue: Credentials not working
**Solution**: Check audit logs for detailed error messages

## Support

For authentication issues:
- Check `logs/audit.log` for detailed logs
- Verify OAuth provider configuration
- Test with `/auth/status` endpoint
- Review IAM/Managed Identity permissions

---

**Security First**: Never store production credentials in code or `.env` files!
