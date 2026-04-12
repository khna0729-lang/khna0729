import { Bookmark, MapPin, Trash2, X } from 'lucide-react'

export default function BookmarkPanel({ bookmarks, onSelect, onRemove, onClose }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Bookmark size={18} className="text-yellow-500 fill-yellow-500" />
          <h2 className="text-base font-bold text-gray-800">즐겨찾기</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
            {bookmarks.length}
          </span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto sidebar-scroll">
        {bookmarks.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <Bookmark size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">즐겨찾기가 없습니다</p>
            <p className="text-xs mt-1">장소 상세에서 북마크 버튼을 눌러보세요</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {bookmarks.map(place => (
              <div
                key={place.place_id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
              >
                <button
                  onClick={() => onSelect(place)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-yellow-50 flex items-center justify-center text-lg shrink-0">
                    {place.icon || '📍'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{place.name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {place.address?.city || place.address?.town || place.display_name?.split(',')[1]?.trim() || ''}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => onRemove(place.place_id)}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-300 hover:text-red-400 transition-all"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
