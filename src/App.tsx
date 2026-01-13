import { useState, useEffect } from 'react'
import { Cloud, Server, Database, Activity, DollarSign, HardDrive } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OverviewDashboard } from '@/components/OverviewDashboard'
import { ResourcesView } from '@/components/ResourcesView'
import { CostAnalytics } from '@/components/CostAnalytics'
import { CloudProviderSelector } from '@/components/CloudProviderSelector'

function App() {
  const [selectedProviders, setSelectedProviders] = useState<string[]>(['aws', 'azure', 'gcp'])
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [selectedProviders])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providers: selectedProviders }),
      })
      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <header className="border-b bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Cloud className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Multi-Cloud Dashboard
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Unified management for AWS, Azure & GCP
                </p>
              </div>
            </div>
            <CloudProviderSelector
              selected={selectedProviders}
              onChange={setSelectedProviders}
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="costs">Costs</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <OverviewDashboard data={dashboardData} />
            </TabsContent>

            <TabsContent value="resources" className="space-y-6">
              <ResourcesView data={dashboardData} />
            </TabsContent>

            <TabsContent value="costs" className="space-y-6">
              <CostAnalytics data={dashboardData} />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}

export default App
