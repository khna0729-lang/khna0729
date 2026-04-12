import { Plus, Minus, Locate, LocateFixed } from 'lucide-react'

export default function FloatingControls({ onZoomIn, onZoomOut, onLocate, locating }) {
  return (
    <div className="flex flex-col gap-2">
      {/* Zoom controls */}
      <div className="flex flex-col rounded-xl overflow-hidden float-shadow bg-white divide-y divide-gray-100">
        <button
          onClick={onZoomIn}
          className="w-11 h-11 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-700"
          title="확대"
        >
          <Plus size={18} />
        </button>
        <button
          onClick={onZoomOut}
          className="w-11 h-11 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-700"
          title="축소"
        >
          <Minus size={18} />
        </button>
      </div>

      {/* Location button */}
      <button
        onClick={onLocate}
        className={`w-11 h-11 rounded-xl float-shadow flex items-center justify-center transition-colors ${
          locating
            ? 'bg-primary text-white'
            : 'bg-white text-gray-600 hover:bg-gray-50'
        }`}
        title="내 위치"
      >
        {locating
          ? <LocateFixed size={18} className="animate-pulse" />
          : <Locate size={18} />
        }
      </button>
    </div>
  )
}
