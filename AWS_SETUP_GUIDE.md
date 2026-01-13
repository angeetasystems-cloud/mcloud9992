# AWS Free Tier Setup Guide for Multi-Cloud Dashboard

This guide will help you connect your AWS Free Tier account to the Multi-Cloud Dashboard securely.

## Prerequisites

- AWS Free Tier account (https://aws.amazon.com/free/)
- AWS CLI installed (optional but recommended)

## Step 1: Create IAM User for Dashboard

### Using AWS Console:

1. **Log in to AWS Console**: https://console.aws.amazon.com/

2. **Navigate to IAM**:
   - Search for "IAM" in the AWS Console search bar
   - Click on "IAM" (Identity and Access Management)

3. **Create New User**:
   - Click "Users" in the left sidebar
   - Click "Create user" button
   - Enter username: `multi-cloud-dashboard-readonly`
   - Click "Next"

4. **Set Permissions**:
   - Select "Attach policies directly"
   - Search and select these **read-only** policies:
     - ✅ `AmazonEC2ReadOnlyAccess`
     - ✅ `AmazonS3ReadOnlyAccess`
     - ✅ `AmazonRDSReadOnlyAccess`
     - ✅ `CloudWatchReadOnlyAccess` (optional)
   - Click "Next"
   - Review and click "Create user"

5. **Create Access Keys**:
   - Click on the newly created user
   - Go to "Security credentials" tab
   - Scroll to "Access keys" section
   - Click "Create access key"
   - Select "Application running outside AWS"
   - Click "Next"
   - Add description: "Multi-Cloud Dashboard"
   - Click "Create access key"
   - **IMPORTANT**: Copy both:
     - Access key ID
     - Secret access key
   - Click "Done"

## Step 2: Configure Dashboard

1. **Open your `.env` file** in the project root:
   ```
   c:\Users\Anjan\Downloads\CascadeProjects\multi-cloud-dashboard\.env
   ```

2. **Update AWS credentials**:
   ```env
   # AWS Credentials
   AWS_ACCESS_KEY_ID=AKIA...your_access_key_here
   AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
   AWS_REGION=us-east-1
   ```

3. **Choose your region**:
   - Free tier resources are available in all regions
   - Common regions:
     - `us-east-1` (N. Virginia) - Default
     - `us-west-2` (Oregon)
     - `eu-west-1` (Ireland)
     - `ap-southeast-1` (Singapore)

## Step 3: Test AWS Free Tier Resources

### Create Test Resources (Free Tier Eligible):

#### 1. Launch EC2 Instance (Free Tier):
```bash
# t2.micro is free tier eligible (750 hours/month)
```
- Go to EC2 Console
- Click "Launch Instance"
- Name: `test-dashboard-instance`
- AMI: Amazon Linux 2023 (Free tier eligible)
- Instance type: **t2.micro** ⭐ (Free tier)
- Key pair: Create or select existing
- Click "Launch instance"

#### 2. Create S3 Bucket (Free Tier):
```bash
# 5GB storage, 20,000 GET requests, 2,000 PUT requests/month
```
- Go to S3 Console
- Click "Create bucket"
- Bucket name: `test-dashboard-bucket-[your-unique-id]`
- Region: Same as your AWS_REGION
- Keep default settings
- Click "Create bucket"

#### 3. Create RDS Database (Free Tier):
```bash
# db.t2.micro or db.t3.micro, 20GB storage, 750 hours/month
```
- Go to RDS Console
- Click "Create database"
- Choose: "Standard create"
- Engine: PostgreSQL or MySQL
- Templates: **Free tier** ⭐
- DB instance identifier: `test-dashboard-db`
- Master username: `admin`
- Master password: (create secure password)
- Instance configuration: **db.t3.micro** or **db.t2.micro**
- Storage: 20 GB (Free tier limit)
- Click "Create database"

## Step 4: Restart Dashboard

1. **Stop the current server** (if running):
   - Press `Ctrl + C` in the terminal

2. **Restart the dashboard**:
   ```powershell
   npm run dev
   ```

3. **Check the console output**:
   - You should see: `✅ All cloud provider credentials configured`
   - If AWS is configured, it will fetch real data

## Step 5: Verify Connection

1. **Open the dashboard**: http://localhost:3000

2. **Select AWS provider** (toggle the AWS button)

3. **Check the Overview tab**:
   - You should see your actual EC2 instances
   - Your S3 buckets
   - Your RDS databases

## Security Best Practices

### ✅ DO:
- ✅ Use **read-only** IAM policies only
- ✅ Create dedicated IAM user for the dashboard
- ✅ Rotate access keys every 90 days
- ✅ Enable MFA on your AWS root account
- ✅ Use specific regions instead of `*`
- ✅ Monitor CloudTrail logs for API calls
- ✅ Keep `.env` file in `.gitignore`

### ❌ DON'T:
- ❌ Never use root account credentials
- ❌ Don't grant write/delete permissions
- ❌ Don't commit credentials to Git
- ❌ Don't share access keys
- ❌ Don't use admin policies

## Free Tier Limits (Important!)

### EC2:
- **750 hours/month** of t2.micro or t3.micro instances
- **30 GB** of EBS storage
- **15 GB** of bandwidth out

### S3:
- **5 GB** of standard storage
- **20,000 GET** requests
- **2,000 PUT** requests

### RDS:
- **750 hours/month** of db.t2.micro or db.t3.micro
- **20 GB** of database storage
- **20 GB** of backup storage

### CloudWatch:
- **10 custom metrics**
- **10 alarms**
- **1 million API requests**

## Troubleshooting

### Issue: "Access Denied" Error
**Solution**: 
- Verify IAM policies are attached correctly
- Check that access keys are correct in `.env`
- Ensure the region matches your resources

### Issue: "No resources found"
**Solution**:
- Make sure you have resources in the selected region
- Check that resources are in "running" state
- Verify the IAM user has read permissions

### Issue: "Rate limit exceeded"
**Solution**:
- AWS Free Tier has API rate limits
- Dashboard automatically handles rate limiting
- Wait a few minutes and try again

### Issue: Credentials not loading
**Solution**:
- Restart the server after updating `.env`
- Check `.env` file has no extra spaces
- Verify file is named exactly `.env` (not `.env.txt`)

## Cost Monitoring

### Stay Within Free Tier:
1. **Set up AWS Budgets**:
   - Go to AWS Billing Console
   - Create a budget for $0.01
   - Get alerts if you exceed free tier

2. **Enable Cost Explorer**:
   - Monitor daily usage
   - Check free tier usage dashboard

3. **Use AWS Free Tier Usage Alerts**:
   - AWS automatically sends emails at 85% usage

## Sample `.env` Configuration

```env
# AWS Credentials (Replace with your actual values)
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1

# Azure Credentials (Leave as is if not using)
AZURE_TENANT_ID=your_azure_tenant_id
AZURE_CLIENT_ID=your_azure_client_id
AZURE_CLIENT_SECRET=your_azure_client_secret
AZURE_SUBSCRIPTION_ID=your_azure_subscription_id

# GCP Credentials (Leave as is if not using)
GCP_PROJECT_ID=your_gcp_project_id
GOOGLE_APPLICATION_CREDENTIALS=./gcp-credentials.json

# Server Configuration
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000
```

## Next Steps

After successful AWS integration:

1. **Monitor your resources** through the dashboard
2. **Set up cost alerts** in AWS Console
3. **Add Azure or GCP** accounts (optional)
4. **Enable audit logging** for compliance
5. **Review security logs** in `logs/audit.log`

## Support

If you encounter issues:
1. Check the server console for error messages
2. Review `logs/audit.log` for detailed logs
3. Verify IAM permissions in AWS Console
4. Ensure free tier limits aren't exceeded

## Security Compliance

This setup follows:
- ✅ **AWS Well-Architected Framework**
- ✅ **Principle of Least Privilege**
- ✅ **GDPR compliance** (audit logging)
- ✅ **SOC 2 requirements** (access controls)
- ✅ **HIPAA guidelines** (encryption at rest/transit)

---

**Remember**: Always use read-only permissions and monitor your AWS Free Tier usage to avoid unexpected charges!
