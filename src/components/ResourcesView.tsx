import { Server, Database, HardDrive, Network } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ResourcesViewProps {
  data: any
}

export function ResourcesView({ data }: ResourcesViewProps) {
  if (!data) return null

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'aws': return 'border-orange-500 bg-orange-50 dark:bg-orange-950'
      case 'azure': return 'border-blue-500 bg-blue-50 dark:bg-blue-950'
      case 'gcp': return 'border-red-500 bg-red-50 dark:bg-red-950'
      default: return 'border-gray-500 bg-gray-50 dark:bg-gray-950'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running': return 'bg-green-500'
      case 'stopped': return 'bg-red-500'
      case 'pending': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Compute Instances
          </CardTitle>
          <CardDescription>Virtual machines across all providers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(data.resources?.instances || []).map((instance: any, index: number) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${getProviderColor(instance.provider)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold">{instance.name}</h4>
                      <span className={`h-2 w-2 rounded-full ${getStatusColor(instance.status)}`}></span>
                      <span className="text-sm text-muted-foreground">{instance.status}</span>
                    </div>
                    <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                      <span>Type: {instance.type}</span>
                      <span>Region: {instance.region}</span>
                      <span>Provider: {instance.provider}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{instance.cpu} vCPUs</p>
                    <p className="text-sm text-muted-foreground">{instance.memory} GB RAM</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Storage Volumes
            </CardTitle>
            <CardDescription>Block storage and disks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data.resources?.storage || []).map((storage: any, index: number) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-l-4 ${getProviderColor(storage.provider)}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{storage.name}</h4>
                      <p className="text-sm text-muted-foreground">{storage.provider} • {storage.region}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{storage.size} GB</p>
                      <p className="text-sm text-muted-foreground">{storage.type}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Databases
            </CardTitle>
            <CardDescription>Managed database services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data.resources?.databases || []).map((db: any, index: number) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-l-4 ${getProviderColor(db.provider)}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{db.name}</h4>
                      <p className="text-sm text-muted-foreground">{db.engine} {db.version}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{db.size}</p>
                      <p className="text-sm text-muted-foreground">{db.provider}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
