import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface CostAnalyticsProps {
  data: any
}

export function CostAnalytics({ data }: CostAnalyticsProps) {
  if (!data) return null

  const costByProvider = data.costs?.byProvider || [
    { name: 'AWS', value: 4500, color: '#ff9900' },
    { name: 'Azure', value: 3200, color: '#0078d4' },
    { name: 'GCP', value: 2800, color: '#ea4335' },
  ]

  const costByService = data.costs?.byService || [
    { name: 'Compute', value: 4200, color: '#3b82f6' },
    { name: 'Storage', value: 2800, color: '#10b981' },
    { name: 'Database', value: 2100, color: '#8b5cf6' },
    { name: 'Network', value: 1400, color: '#f59e0b' },
  ]

  const totalCost = costByProvider.reduce((sum: number, item: any) => sum + item.value, 0)
  const monthlyChange = data.costs?.monthlyChange || 5.2

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Monthly Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all cloud providers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Change</CardTitle>
            {monthlyChange > 0 ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${monthlyChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {monthlyChange > 0 ? '+' : ''}{monthlyChange}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Compared to last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected Annual</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalCost * 12).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on current usage
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cost by Provider</CardTitle>
            <CardDescription>Monthly spending distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={costByProvider}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {costByProvider.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost by Service</CardTitle>
            <CardDescription>Service category breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={costByService}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {costByService.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Cost Drivers</CardTitle>
          <CardDescription>Resources with highest monthly costs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(data.costs?.topResources || []).map((resource: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div className="flex-1">
                  <p className="font-medium">{resource.name}</p>
                  <p className="text-sm text-muted-foreground">{resource.type} • {resource.provider}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${resource.cost.toLocaleString()}/mo</p>
                  <p className="text-sm text-muted-foreground">{resource.region}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
