import { useState, useEffect } from 'react'
import { Plus, Trash2, Eye, EyeOff, Key, AlertCircle, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { API_URL } from '@/config'

interface Credential {
  id: string
  provider: 'aws' | 'azure' | 'gcp'
  name: string
  createdAt: string
}

export function CloudCredentials({ token }: { token: string }) {
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    provider: 'aws' as 'aws' | 'azure' | 'gcp',
    name: '',
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1',
    clientId: '',
    clientSecret: '',
    tenantId: '',
    subscriptionId: '',
    projectId: '',
    credentials: '',
  })

  const [showSecrets, setShowSecrets] = useState(false)

  useEffect(() => {
    fetchCredentials()
  }, [])

  const fetchCredentials = async () => {
    try {
      const response = await fetch(`${API_URL}/api/credentials`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setCredentials(data.credentials || [])
      }
    } catch (error) {
      console.error('Failed to fetch credentials:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      let credentialData: any = {
        provider: formData.provider,
        name: formData.name,
      }

      if (formData.provider === 'aws') {
        credentialData = {
          ...credentialData,
          accessKeyId: formData.accessKeyId,
          secretAccessKey: formData.secretAccessKey,
          region: formData.region,
        }
      } else if (formData.provider === 'azure') {
        credentialData = {
          ...credentialData,
          clientId: formData.clientId,
          clientSecret: formData.clientSecret,
          tenantId: formData.tenantId,
          subscriptionId: formData.subscriptionId,
        }
      } else if (formData.provider === 'gcp') {
        credentialData = {
          ...credentialData,
          projectId: formData.projectId,
          credentials: formData.credentials,
        }
      }

      const response = await fetch(`${API_URL}/api/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(credentialData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add credentials')
      }

      setMessage({ type: 'success', text: 'Credentials added successfully!' })
      setShowAddForm(false)
      setFormData({
        provider: 'aws',
        name: '',
        accessKeyId: '',
        secretAccessKey: '',
        region: 'us-east-1',
        clientId: '',
        clientSecret: '',
        tenantId: '',
        subscriptionId: '',
        projectId: '',
        credentials: '',
      })
      fetchCredentials()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete these credentials?')) return

    try {
      const response = await fetch(`${API_URL}/api/credentials/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Credentials deleted successfully!' })
        fetchCredentials()
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete credentials' })
    }
  }

  const providerLogos = {
    aws: '☁️',
    azure: '🔷',
    gcp: '🌐',
  }

  const providerNames = {
    aws: 'Amazon Web Services',
    azure: 'Microsoft Azure',
    gcp: 'Google Cloud Platform',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Cloud Credentials</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage your cloud provider access credentials
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Credentials
        </button>
      </div>

      {message && (
        <div
          className={`rounded-lg p-4 flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          )}
          <p
            className={`text-sm ${
              message.type === 'success'
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {message.text}
          </p>
        </div>
      )}

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Cloud Credentials</CardTitle>
            <CardDescription>Securely store your cloud provider credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cloud Provider</label>
                  <select
                    value={formData.provider}
                    onChange={(e) =>
                      setFormData({ ...formData, provider: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                  >
                    <option value="aws">AWS</option>
                    <option value="azure">Azure</option>
                    <option value="gcp">GCP</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Credential Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                    placeholder="e.g., Production AWS"
                    required
                  />
                </div>
              </div>

              {formData.provider === 'aws' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Access Key ID</label>
                    <input
                      type={showSecrets ? 'text' : 'password'}
                      value={formData.accessKeyId}
                      onChange={(e) => setFormData({ ...formData, accessKeyId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Secret Access Key</label>
                    <input
                      type={showSecrets ? 'text' : 'password'}
                      value={formData.secretAccessKey}
                      onChange={(e) =>
                        setFormData({ ...formData, secretAccessKey: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Region</label>
                    <input
                      type="text"
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                      placeholder="us-east-1"
                      required
                    />
                  </div>
                </>
              )}

              {formData.provider === 'azure' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Client ID</label>
                      <input
                        type={showSecrets ? 'text' : 'password'}
                        value={formData.clientId}
                        onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tenant ID</label>
                      <input
                        type="text"
                        value={formData.tenantId}
                        onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Client Secret</label>
                    <input
                      type={showSecrets ? 'text' : 'password'}
                      value={formData.clientSecret}
                      onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subscription ID</label>
                    <input
                      type="text"
                      value={formData.subscriptionId}
                      onChange={(e) =>
                        setFormData({ ...formData, subscriptionId: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                      required
                    />
                  </div>
                </>
              )}

              {formData.provider === 'gcp' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Project ID</label>
                    <input
                      type="text"
                      value={formData.projectId}
                      onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Service Account JSON</label>
                    <textarea
                      value={formData.credentials}
                      onChange={(e) => setFormData({ ...formData, credentials: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white font-mono text-sm"
                      rows={6}
                      placeholder='{"type": "service_account", ...}'
                      required
                    />
                  </div>
                </>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSecrets(!showSecrets)}
                  className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showSecrets ? 'Hide' : 'Show'} secrets
                </button>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Credentials'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {credentials.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Key className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">
                No credentials added yet. Click "Add Credentials" to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          credentials.map((cred) => (
            <Card key={cred.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{providerLogos[cred.provider]}</div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {cred.name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {providerNames[cred.provider]}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        Added {new Date(cred.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(cred.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
