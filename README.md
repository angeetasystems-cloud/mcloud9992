# Multi-Cloud Management Dashboard

A comprehensive, production-ready dashboard for managing and monitoring resources across AWS, Azure, and GCP cloud providers.

![Multi-Cloud Dashboard](https://img.shields.io/badge/Multi--Cloud-Dashboard-blue)
![React](https://img.shields.io/badge/React-18.2-61dafb)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)

## Features

### 🌐 Multi-Cloud Support
- **AWS**: EC2, S3, RDS integration
- **Azure**: Virtual Machines, Blob Storage, SQL Database
- **GCP**: Compute Engine, Cloud Storage, Cloud SQL

### 📊 Dashboard Capabilities
- **Unified Overview**: Single pane of glass for all cloud resources
- **Real-time Monitoring**: Live resource health status
- **Cost Analytics**: Track spending across providers with detailed breakdowns
- **Resource Management**: View and manage compute, storage, and database resources
- **Alerts & Notifications**: Get notified about resource issues

### 🎨 Modern UI/UX
- Beautiful, responsive design with TailwindCSS
- Dark mode support
- Interactive charts with Recharts
- Smooth animations and transitions
- Mobile-friendly interface

## Architecture

```
multi-cloud-dashboard/
├── src/                      # Frontend React application
│   ├── components/           # React components
│   │   ├── ui/              # Reusable UI components
│   │   ├── OverviewDashboard.tsx
│   │   ├── ResourcesView.tsx
│   │   ├── CostAnalytics.tsx
│   │   └── CloudProviderSelector.tsx
│   ├── lib/                 # Utility functions
│   ├── App.tsx              # Main application component
│   └── main.tsx             # Application entry point
├── server/                   # Backend Express API
│   ├── providers/           # Cloud provider integrations
│   │   ├── aws.js          # AWS SDK integration
│   │   ├── azure.js        # Azure SDK integration
│   │   └── gcp.js          # GCP SDK integration
│   └── index.js            # API server
└── package.json            # Dependencies and scripts
```

## Prerequisites

- **Node.js** 18+ and npm
- Cloud provider accounts (AWS, Azure, GCP)
- API credentials for each cloud provider you want to use

## Installation

1. **Clone or navigate to the project directory**:
```bash
cd multi-cloud-dashboard
```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure environment variables**:
```bash
cp .env.example .env
```

Edit `.env` with your cloud provider credentials:

```env
# AWS Credentials
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1

# Azure Credentials
AZURE_TENANT_ID=your_azure_tenant_id
AZURE_CLIENT_ID=your_azure_client_id
AZURE_CLIENT_SECRET=your_azure_client_secret
AZURE_SUBSCRIPTION_ID=your_azure_subscription_id

# GCP Credentials
GCP_PROJECT_ID=your_gcp_project_id
GOOGLE_APPLICATION_CREDENTIALS=./gcp-credentials.json

# Server Configuration
PORT=5000
NODE_ENV=development
```

## Cloud Provider Setup

### AWS Setup

1. Create an IAM user with programmatic access
2. Attach policies:
   - `AmazonEC2ReadOnlyAccess`
   - `AmazonS3ReadOnlyAccess`
   - `AmazonRDSReadOnlyAccess`
3. Copy Access Key ID and Secret Access Key to `.env`

### Azure Setup

1. Register an application in Azure AD
2. Create a client secret
3. Assign the "Reader" role to your subscription
4. Copy Tenant ID, Client ID, Client Secret, and Subscription ID to `.env`

### GCP Setup

1. Create a service account in Google Cloud Console
2. Grant roles:
   - `Compute Viewer`
   - `Storage Object Viewer`
   - `Cloud SQL Viewer`
3. Download the JSON key file
4. Save as `gcp-credentials.json` in the project root
5. Add project ID to `.env`

## Running the Application

### Development Mode

Start both frontend and backend concurrently:

```bash
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Production Mode

1. **Build the frontend**:
```bash
npm run build
```

2. **Start the server**:
```bash
npm start
```

## API Endpoints

### POST `/api/dashboard`
Fetch aggregated dashboard data for selected providers.

**Request Body**:
```json
{
  "providers": ["aws", "azure", "gcp"]
}
```

**Response**:
```json
{
  "summary": {
    "totalInstances": 7,
    "totalStorage": 1250,
    "totalDatabases": 3,
    "monthlyCost": 2025
  },
  "providers": [...],
  "resources": {...},
  "costs": {...},
  "alerts": [...]
}
```

### GET `/api/health`
Health check endpoint.

## Features Breakdown

### Overview Dashboard
- **Key Metrics**: Total instances, storage, databases, and monthly costs
- **Health Status**: Visual representation of resource health across providers
- **Cost Trends**: Historical cost data with line charts
- **Recent Alerts**: Latest alerts and warnings

### Resources View
- **Compute Instances**: List all VMs/instances with status and specs
- **Storage Volumes**: View all storage buckets and disks
- **Databases**: Managed database services overview
- **Provider Filtering**: Color-coded by cloud provider

### Cost Analytics
- **Cost by Provider**: Pie chart showing spending distribution
- **Cost by Service**: Breakdown by service category
- **Top Cost Drivers**: Identify most expensive resources
- **Monthly Trends**: Track cost changes over time

## Mock Data Mode

If cloud credentials are not configured, the application automatically uses mock data for demonstration purposes. This allows you to:
- Test the UI without cloud access
- Demo the dashboard
- Develop new features

## Security Best Practices

1. **Never commit `.env` file** to version control
2. **Use IAM roles** with minimal required permissions
3. **Rotate credentials** regularly
4. **Enable MFA** on cloud accounts
5. **Use environment-specific credentials** (dev/staging/prod)
6. **Store credentials securely** (use secret managers in production)

## Customization

### Adding New Cloud Providers

1. Create a new provider file in `server/providers/`
2. Implement the resource fetching logic
3. Add provider to the API endpoint in `server/index.js`
4. Update frontend to display new provider

### Extending Metrics

Modify the provider files to fetch additional metrics:
- Network traffic
- CPU/Memory utilization
- Custom tags and metadata
- Billing details

## Troubleshooting

### Common Issues

**Issue**: "Cannot find module" errors
- **Solution**: Run `npm install` to ensure all dependencies are installed

**Issue**: API returns empty data
- **Solution**: Check `.env` file has correct credentials and permissions

**Issue**: CORS errors
- **Solution**: Ensure backend is running on port 5000 and frontend proxy is configured

**Issue**: Cloud SDK authentication errors
- **Solution**: Verify credentials have proper permissions and are not expired

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **shadcn/ui** - Component library
- **Recharts** - Data visualization
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **AWS SDK v3** - AWS integration
- **Azure SDK** - Azure integration
- **Google Cloud SDK** - GCP integration

## Performance Optimization

- Parallel API calls to cloud providers
- Efficient data aggregation
- Responsive caching strategies
- Optimized bundle size with code splitting

## Future Enhancements

- [ ] Real-time WebSocket updates
- [ ] Advanced filtering and search
- [ ] Resource tagging and organization
- [ ] Cost optimization recommendations
- [ ] Automated alerting via email/Slack
- [ ] Multi-user support with authentication
- [ ] Custom dashboards and widgets
- [ ] Export reports (PDF/CSV)
- [ ] Infrastructure as Code integration

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues, questions, or suggestions, please open an issue on the repository.

---

**Built with ❤️ for multi-cloud management**
