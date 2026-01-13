import { useState, useEffect } from 'react'
import { Cloud, LogOut, Settings, Key, Users, LayoutDashboard } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OverviewDashboard } from '@/components/OverviewDashboard'
import { ResourcesView } from '@/components/ResourcesView'
import { CostAnalytics } from '@/components/CostAnalytics'
import { CloudProviderSelector } from '@/components/CloudProviderSelector'
import { Login } from '@/pages/Login'
import { CloudCredentials } from '@/pages/CloudCredentials'
import { UserManagement } from '@/pages/UserManagement'
import { API_URL } from '@/config'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [selectedProviders, setSelectedProviders] = useState<string[]>(['aws', 'azure', 'gcp'])
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
      setIsAuthenticated(true)
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && activeTab === 'dashboard') {
      fetchDashboardData()
    }
  }, [selectedProviders, isAuthenticated, activeTab])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/dashboard`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
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

  const handleLogin = (newToken: string, newUser: any) => {
    setToken(newToken)
    setUser(newUser)
    setIsAuthenticated(true)
    setLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
    setActiveTab('dashboard')
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  const canManageUsers = user?.role === 'super_admin' || user?.role === 'admin'
  const canManageCredentials = user?.role === 'super_admin' || user?.role === 'admin'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <header className="border-b bg-white/50 backdrop-blur-sm dark:bg-slate-900/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Cloud className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  Multi-Cloud Dashboard
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Enterprise Cloud Management
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {activeTab === 'dashboard' && (
                <CloudProviderSelector
                  selected={selectedProviders}
                  onChange={setSelectedProviders}
                />
              )}
              
              <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-slate-900 dark:text-white">{user?.username}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            {canManageCredentials && (
              <TabsTrigger value="credentials" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Credentials
              </TabsTrigger>
            )}
            {canManageUsers && (
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
            )}
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
          </TabsContent>

          {canManageCredentials && (
            <TabsContent value="credentials">
              <CloudCredentials token={token!} />
            </TabsContent>
          )}

          {canManageUsers && (
            <TabsContent value="users">
              <UserManagement token={token!} currentUser={user} />
            </TabsContent>
          )}

          <TabsContent value="settings">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-8 text-center">
              <Settings className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Settings
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Settings panel coming soon
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App
