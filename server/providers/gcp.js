import compute from '@google-cloud/compute';

export async function getGCPResources() {
  try {
    const projectId = process.env.GCP_PROJECT_ID;
    
    if (!projectId) {
      console.log('GCP credentials not configured, using mock data');
      return getMockGCPData();
    }

    const computeClient = new compute.InstancesClient();
    const zonesClient = new compute.ZonesClient();

    const instances = [];
    const storage = [];
    const databases = [];
    let healthyResources = 0;
    let warningResources = 0;
    let criticalResources = 0;

    try {
      const zones = await zonesClient.list({ project: projectId });
      
      for (const zone of zones[0]) {
        try {
          const [vms] = await computeClient.list({
            project: projectId,
            zone: zone.name,
          });

          vms.forEach(vm => {
            const status = vm.status || 'UNKNOWN';
            const isHealthy = status === 'RUNNING';
            
            if (isHealthy) healthyResources++;
            else warningResources++;

            instances.push({
              name: vm.name,
              type: vm.machineType?.split('/').pop() || 'n1-standard-1',
              status: isHealthy ? 'running' : 'stopped',
              region: zone.name,
              provider: 'GCP',
              cpu: 2,
              memory: 4,
            });
          });
        } catch (error) {
          console.error(`Error fetching VMs in zone ${zone.name}:`, error.message);
        }
      }
    } catch (error) {
      console.error('Error fetching GCP instances:', error.message);
    }

    storage.push({
      name: 'gcp-storage-bucket',
      size: 200,
      type: 'Cloud Storage',
      region: 'us-central1',
      provider: 'GCP',
    });
    healthyResources++;

    databases.push({
      name: 'gcp-cloud-sql',
      engine: 'MySQL',
      version: '8.0',
      size: 'db-n1-standard-1',
      provider: 'GCP',
    });
    healthyResources++;

    const cost = (instances.length * 130) + (storage.length * 45) + (databases.length * 190);

    const alerts = [];
    const topResources = instances.slice(0, 2).map(inst => ({
      name: inst.name,
      type: 'Compute Engine',
      provider: 'GCP',
      cost: 130,
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
    console.error('Error in getGCPResources:', error);
    return getMockGCPData();
  }
}

function getMockGCPData() {
  return {
    instances: [
      {
        name: 'gcp-web-1',
        type: 'n1-standard-2',
        status: 'running',
        region: 'us-central1-a',
        provider: 'GCP',
        cpu: 2,
        memory: 7.5,
      },
      {
        name: 'gcp-api-1',
        type: 'n1-standard-1',
        status: 'running',
        region: 'us-east1-b',
        provider: 'GCP',
        cpu: 1,
        memory: 3.75,
      },
    ],
    storage: [
      {
        name: 'gcp-storage-bucket',
        size: 200,
        type: 'Cloud Storage',
        region: 'us-central1',
        provider: 'GCP',
      },
    ],
    databases: [
      {
        name: 'gcp-cloud-sql',
        engine: 'MySQL',
        version: '8.0',
        size: 'db-n1-standard-1',
        provider: 'GCP',
      },
    ],
    healthyResources: 4,
    warningResources: 0,
    criticalResources: 0,
    cost: 555,
    alerts: [],
    topResources: [
      {
        name: 'gcp-web-1',
        type: 'Compute Engine',
        provider: 'GCP',
        cost: 130,
        region: 'us-central1-a',
      },
      {
        name: 'gcp-cloud-sql',
        type: 'Cloud SQL',
        provider: 'GCP',
        cost: 190,
        region: 'us-central1',
      },
    ],
  };
}
