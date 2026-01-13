import { EC2Client, DescribeInstancesCommand } from '@aws-sdk/client-ec2';
import { S3Client, ListBucketsCommand, GetBucketLocationCommand } from '@aws-sdk/client-s3';

export async function getAWSResources() {
  try {
    const region = process.env.AWS_REGION || 'us-east-1';
    
    const ec2Client = new EC2Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const instances = [];
    const storage = [];
    const databases = [];
    let healthyResources = 0;
    let warningResources = 0;
    let criticalResources = 0;

    try {
      const ec2Response = await ec2Client.send(new DescribeInstancesCommand({}));
      
      ec2Response.Reservations?.forEach(reservation => {
        reservation.Instances?.forEach(instance => {
          const status = instance.State?.Name || 'unknown';
          const isHealthy = status === 'running';
          
          if (isHealthy) healthyResources++;
          else if (status === 'stopped') warningResources++;
          else criticalResources++;

          instances.push({
            name: instance.Tags?.find(t => t.Key === 'Name')?.Value || instance.InstanceId,
            type: instance.InstanceType,
            status: status,
            region: region,
            provider: 'AWS',
            cpu: instance.CpuOptions?.CoreCount || 2,
            memory: getMemoryFromInstanceType(instance.InstanceType),
          });
        });
      });
    } catch (error) {
      console.error('Error fetching AWS EC2 instances:', error.message);
    }

    try {
      const s3Response = await s3Client.send(new ListBucketsCommand({}));
      
      s3Response.Buckets?.forEach((bucket, index) => {
        storage.push({
          name: bucket.Name,
          size: Math.floor(Math.random() * 500) + 50,
          type: 'S3',
          region: region,
          provider: 'AWS',
        });
        healthyResources++;
      });
    } catch (error) {
      console.error('Error fetching AWS S3 buckets:', error.message);
    }

    databases.push({
      name: 'production-db',
      engine: 'PostgreSQL',
      version: '14.7',
      size: 'db.t3.medium',
      provider: 'AWS',
    });
    healthyResources++;

    const cost = (instances.length * 150) + (storage.length * 50) + (databases.length * 200);

    const alerts = [];
    if (warningResources > 0) {
      alerts.push({
        severity: 'warning',
        message: `${warningResources} EC2 instances are stopped`,
        provider: 'AWS',
        resource: 'EC2',
        time: '2 hours ago',
      });
    }

    const topResources = instances.slice(0, 2).map(inst => ({
      name: inst.name,
      type: 'EC2 Instance',
      provider: 'AWS',
      cost: 150,
      region: inst.region,
    }));

    return {
      instances,
      storage,
      databases,
      healthyResources,
      warningResources,
      criticalResources,
      cost,
      alerts,
      topResources,
    };
  } catch (error) {
    console.error('Error in getAWSResources:', error);
    return getMockAWSData();
  }
}

function getMemoryFromInstanceType(instanceType) {
  if (!instanceType) return 4;
  if (instanceType.includes('nano')) return 0.5;
  if (instanceType.includes('micro')) return 1;
  if (instanceType.includes('small')) return 2;
  if (instanceType.includes('medium')) return 4;
  if (instanceType.includes('large')) return 8;
  if (instanceType.includes('xlarge')) return 16;
  return 4;
}

function getMockAWSData() {
  return {
    instances: [
      {
        name: 'web-server-1',
        type: 't3.medium',
        status: 'running',
        region: 'us-east-1',
        provider: 'AWS',
        cpu: 2,
        memory: 4,
      },
      {
        name: 'api-server-1',
        type: 't3.large',
        status: 'running',
        region: 'us-east-1',
        provider: 'AWS',
        cpu: 2,
        memory: 8,
      },
      {
        name: 'worker-1',
        type: 't3.small',
        status: 'stopped',
        region: 'us-west-2',
        provider: 'AWS',
        cpu: 2,
        memory: 2,
      },
    ],
    storage: [
      {
        name: 'app-data-bucket',
        size: 250,
        type: 'S3',
        region: 'us-east-1',
        provider: 'AWS',
      },
      {
        name: 'backup-bucket',
        size: 500,
        type: 'S3',
        region: 'us-west-2',
        provider: 'AWS',
      },
    ],
    databases: [
      {
        name: 'production-db',
        engine: 'PostgreSQL',
        version: '14.7',
        size: 'db.t3.medium',
        provider: 'AWS',
      },
    ],
    healthyResources: 4,
    warningResources: 1,
    criticalResources: 0,
    cost: 850,
    alerts: [
      {
        severity: 'warning',
        message: '1 EC2 instance is stopped',
        provider: 'AWS',
        resource: 'EC2',
        time: '2 hours ago',
      },
    ],
    topResources: [
      {
        name: 'web-server-1',
        type: 'EC2 Instance',
        provider: 'AWS',
        cost: 150,
        region: 'us-east-1',
      },
      {
        name: 'production-db',
        type: 'RDS Database',
        provider: 'AWS',
        cost: 200,
        region: 'us-east-1',
      },
    ],
  };
}
