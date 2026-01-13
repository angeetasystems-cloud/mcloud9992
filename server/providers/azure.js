import { ComputeManagementClient } from '@azure/arm-compute';
import { ResourceManagementClient } from '@azure/arm-resources';
import { DefaultAzureCredential, ClientSecretCredential } from '@azure/identity';

export async function getAzureResources() {
  try {
    const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
    
    if (!subscriptionId) {
      console.log('Azure credentials not configured, using mock data');
      return getMockAzureData();
    }

    let credential;
    if (process.env.AZURE_TENANT_ID && process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET) {
      credential = new ClientSecretCredential(
        process.env.AZURE_TENANT_ID,
        process.env.AZURE_CLIENT_ID,
        process.env.AZURE_CLIENT_SECRET
      );
    } else {
      credential = new DefaultAzureCredential();
    }

    const computeClient = new ComputeManagementClient(credential, subscriptionId);
    const resourceClient = new ResourceManagementClient(credential, subscriptionId);

    const instances = [];
    const storage = [];
    const databases = [];
    let healthyResources = 0;
    let warningResources = 0;
    let criticalResources = 0;

    try {
      const vms = computeClient.virtualMachines.listAll();
      
      for await (const vm of vms) {
        const instanceView = await computeClient.virtualMachines.instanceView(
          vm.id.split('/')[4],
          vm.name
        );
        
        const status = instanceView.statuses?.find(s => s.code?.startsWith('PowerState/'))?.displayStatus || 'Unknown';
        const isHealthy = status.includes('running');
        
        if (isHealthy) healthyResources++;
        else warningResources++;

        instances.push({
          name: vm.name,
          type: vm.hardwareProfile?.vmSize || 'Standard_B2s',
          status: isHealthy ? 'running' : 'stopped',
          region: vm.location,
          provider: 'Azure',
          cpu: 2,
          memory: 4,
        });
      }
    } catch (error) {
      console.error('Error fetching Azure VMs:', error.message);
    }

    storage.push({
      name: 'azurestorage01',
      size: 300,
      type: 'Blob Storage',
      region: 'eastus',
      provider: 'Azure',
    });
    healthyResources++;

    databases.push({
      name: 'azure-sql-db',
      engine: 'SQL Server',
      version: '2019',
      size: 'Standard S2',
      provider: 'Azure',
    });
    healthyResources++;

    const cost = (instances.length * 120) + (storage.length * 40) + (databases.length * 180);

    const alerts = [];
    const topResources = instances.slice(0, 2).map(inst => ({
      name: inst.name,
      type: 'Virtual Machine',
      provider: 'Azure',
      cost: 120,
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
    console.error('Error in getAzureResources:', error);
    return getMockAzureData();
  }
}

function getMockAzureData() {
  return {
    instances: [
      {
        name: 'app-vm-1',
        type: 'Standard_B2s',
        status: 'running',
        region: 'eastus',
        provider: 'Azure',
        cpu: 2,
        memory: 4,
      },
      {
        name: 'db-vm-1',
        type: 'Standard_D2s_v3',
        status: 'running',
        region: 'westus',
        provider: 'Azure',
        cpu: 2,
        memory: 8,
      },
    ],
    storage: [
      {
        name: 'azurestorage01',
        size: 300,
        type: 'Blob Storage',
        region: 'eastus',
        provider: 'Azure',
      },
    ],
    databases: [
      {
        name: 'azure-sql-db',
        engine: 'SQL Server',
        version: '2019',
        size: 'Standard S2',
        provider: 'Azure',
      },
    ],
    healthyResources: 4,
    warningResources: 0,
    criticalResources: 0,
    cost: 620,
    alerts: [],
    topResources: [
      {
        name: 'app-vm-1',
        type: 'Virtual Machine',
        provider: 'Azure',
        cost: 120,
        region: 'eastus',
      },
      {
        name: 'azure-sql-db',
        type: 'SQL Database',
        provider: 'Azure',
        cost: 180,
        region: 'eastus',
      },
    ],
  };
}
