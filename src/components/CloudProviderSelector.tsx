import { Cloud } from 'lucide-react'

interface CloudProviderSelectorProps {
  selected: string[]
  onChange: (providers: string[]) => void
}

export function CloudProviderSelector({ selected, onChange }: CloudProviderSelectorProps) {
  const providers = [
    { id: 'aws', name: 'AWS', color: 'bg-orange-500' },
    { id: 'azure', name: 'Azure', color: 'bg-blue-500' },
    { id: 'gcp', name: 'GCP', color: 'bg-red-500' },
  ]

  const toggleProvider = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(p => p !== id))
    } else {
      onChange([...selected, id])
    }
  }

  return (
    <div className="flex gap-2">
      {providers.map(provider => (
        <button
          key={provider.id}
          onClick={() => toggleProvider(provider.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            selected.includes(provider.id)
              ? `${provider.color} text-white shadow-lg`
              : 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300'
          }`}
        >
          <Cloud className="h-4 w-4" />
          {provider.name}
        </button>
      ))}
    </div>
  )
}
