import { useState } from 'react'
import { Layers, X } from 'lucide-react'

const LAYERS = [
  {
    id: 'street',
    label: '일반',
    thumbnail: 'https://tile.openstreetmap.org/13/7171/3180.png',
    color: '#4CAF50',
  },
  {
    id: 'satellite',
    label: '위성',
    thumbnail: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/13/3180/7171',
    color: '#2196F3',
  },
  {
    id: 'terrain',
    label: '지형',
    thumbnail: 'https://tile.opentopomap.org/13/7171/3180.png',
    color: '#8BC34A',
  },
  {
    id: 'hybrid',
    label: '위성+지도',
    thumbnail: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/13/3180/7171',
    color: '#FF5722',
  },
]

const COLORS = {
  street: 'bg-green-500',
  satellite: 'bg-blue-500',
  terrain: 'bg-lime-600',
  hybrid: 'bg-orange-500',
}

export default function LayerControl({ currentLayer, onChange }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-11 h-11 rounded-xl bg-white float-shadow flex items-center justify-center hover:bg-gray-50 transition-colors"
        title="지도 스타일"
      >
        <Layers size={20} className="text-gray-700" />
      </button>

      {open && (
        <div className="absolute bottom-12 left-0 bg-white rounded-2xl float-shadow p-3 w-64 z-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">지도 스타일</span>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {LAYERS.map(layer => (
              <button
                key={layer.id}
                onClick={() => { onChange(layer.id); setOpen(false) }}
                className="flex flex-col items-center gap-1.5"
              >
                <div
                  className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                    currentLayer === layer.id
                      ? 'border-primary shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Color block fallback since external tile images may not load */}
                  <div className={`w-full h-full flex items-center justify-center text-2xl ${
                    layer.id === 'street' ? 'bg-green-100' :
                    layer.id === 'satellite' ? 'bg-slate-800' :
                    layer.id === 'terrain' ? 'bg-lime-100' :
                    'bg-slate-700'
                  }`}>
                    {layer.id === 'street' ? '🗺️' :
                     layer.id === 'satellite' ? '🛰️' :
                     layer.id === 'terrain' ? '🏔️' : '🗺️'}
                  </div>
                </div>
                <span className={`text-xs font-medium ${
                  currentLayer === layer.id ? 'text-primary' : 'text-gray-600'
                }`}>
                  {layer.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
