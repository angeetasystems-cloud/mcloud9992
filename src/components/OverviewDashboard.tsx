import { Server, Database, HardDrive, Activity, DollarSign, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface OverviewDashboardProps {
  data: any
}

export function OverviewDashboard({ data }: OverviewDashboardProps) {
  if (!data) return null

  const stats = [
    {
      title: 'Total Instances',
      value: data.summary?.totalInstances || 0,
      icon: Server,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      title: 'Storage (TB)',
      value: ((data.summary?.totalStorage || 0) / 1024).toFixed(2),
      icon: HardDrive,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    {
      title: 'Databases',
      value: data.summary?.totalDatabases || 0,
      icon: Database,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
    },
    {
      title: 'Monthly Cost',
      value: `$${(data.summary?.monthlyCost || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
    },
  ]

  const healthData = data.providers?.map((p: any) => ({
    name: p.name,
    healthy: p.healthyResources || 0,
    warning: p.warningResources || 0,
    critical: p.criticalResources || 0,
  })) || []

  const costTrendData = data.costTrend || [
    { month: 'Jan', aws: 4000, azure: 2400, gcp: 2400 },
    { month: 'Feb', aws: 3000, azure: 1398, gcp: 2210 },
    { month: 'Mar', aws: 2000, azure: 9800, gcp: 2290 },
    { month: 'Apr', aws: 2780, azure: 3908, gcp: 2000 },
    { month: 'May', aws: 1890, azure: 4800, gcp: 2181 },
    { month: 'Jun', aws: 2390, azure: 3800, gcp: 2500 },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Resource Health Status</CardTitle>
            <CardDescription>Health status across cloud providers</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={healthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="healthy" fill="#10b981" name="Healthy" />
                <Bar dataKey="warning" fill="#f59e0b" name="Warning" />
                <Bar dataKey="critical" fill="#ef4444" name="Critical" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Trend</CardTitle>
            <CardDescription>Monthly spending by provider</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={costTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="aws" stroke="#ff9900" strokeWidth={2} name="AWS" />
                <Line type="monotone" dataKey="azure" stroke="#0078d4" strokeWidth={2} name="Azure" />
                <Line type="monotone" dataKey="gcp" stroke="#ea4335" strokeWidth={2} name="GCP" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(data.alerts || []).slice(0, 5).map((alert: any, index: number) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <AlertCircle className={`h-5 w-5 mt-0.5 ${
                  alert.severity === 'critical' ? 'text-red-500' :
                  alert.severity === 'warning' ? 'text-orange-500' : 'text-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="font-medium">{alert.message}</p>
                  <p className="text-sm text-muted-foreground">{alert.provider} • {alert.resource}</p>
                </div>
                <span className="text-xs text-muted-foreground">{alert.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
