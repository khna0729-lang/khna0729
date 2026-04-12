import { MapPin, Navigation, Bookmark, BookmarkCheck } from 'lucide-react'

function distanceTo(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return d < 1000 ? `${Math.round(d)}m` : `${(d / 1000).toFixed(1)}km`
}

function getSubtitle(place) {
  const a = place.address
  if (!a) return place.display_name?.split(',').slice(0, 2).join(',') || ''
  const parts = []
  if (a.road) parts.push(a.road)
  if (a.city || a.town || a.county) parts.push(a.city || a.town || a.county)
  if (a.country && a.country !== '대한민국') parts.push(a.country)
  return parts.join(', ') || place.display_name?.split(',')[0] || ''
}

function TypeBadge({ type }) {
  const map = {
    restaurant: { label: '음식점', color: 'bg-orange-100 text-orange-700' },
    fast_food: { label: '패스트푸드', color: 'bg-orange-100 text-orange-700' },
    cafe: { label: '카페', color: 'bg-amber-100 text-amber-700' },
    pharmacy: { label: '약국', color: 'bg-green-100 text-green-700' },
    hospital: { label: '병원', color: 'bg-red-100 text-red-700' },
    fuel: { label: '주유소', color: 'bg-blue-100 text-blue-700' },
    parking: { label: '주차장', color: 'bg-slate-100 text-slate-700' },
    convenience: { label: '편의점', color: 'bg-indigo-100 text-indigo-700' },
    hotel: { label: '숙박', color: 'bg-purple-100 text-purple-700' },
    subway_entrance: { label: '지하철', color: 'bg-blue-100 text-blue-700' },
    bus_stop: { label: '버스', color: 'bg-green-100 text-green-700' },
  }
  const cfg = map[type]
  if (!cfg) return null
  return (
    <span className={`inline-block text-xs px-1.5 py-0.5 rounded font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

export default function SearchResults({
  results,
  loading,
  error,
  onSelect,
  userLocation,
  isBookmarked,
  onBookmark,
}) {
  if (loading) {
    return (
      <div className="py-8 text-center text-gray-400">
        <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-sm">검색 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-red-500">{error}</p>
        <p className="text-xs text-gray-400 mt-1">잠시 후 다시 시도해주세요</p>
      </div>
    )
  }

  if (!results.length) {
    return (
      <div className="py-8 text-center text-gray-400">
        <MapPin size={32} className="mx-auto mb-2 opacity-30" />
        <p className="text-sm">검색 결과가 없습니다</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-50">
      <div className="px-4 py-2.5">
        <span className="text-xs text-gray-400">검색결과 {results.length}개</span>
      </div>
      {results.map(place => (
        <button
          key={place.place_id}
          onClick={() => onSelect(place)}
          className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-blue-50/50 transition-colors text-left group"
        >
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl mt-0.5 group-hover:bg-blue-100 transition-colors">
            {place.icon}
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-sm font-semibold text-gray-800 truncate">{place.name}</span>
              <TypeBadge type={place.type} />
            </div>
            <p className="text-xs text-gray-400 truncate">{getSubtitle(place)}</p>
            {userLocation && place.lat && (
              <p className="text-xs text-primary mt-0.5">
                <Navigation size={10} className="inline mr-0.5" />
                {distanceTo(userLocation.lat, userLocation.lon, place.lat, place.lon)}
              </p>
            )}
          </div>
          {/* Bookmark */}
          <button
            onClick={e => { e.stopPropagation(); onBookmark(place) }}
            className="shrink-0 p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-yellow-500 transition-colors"
          >
            {isBookmarked(place.place_id)
              ? <BookmarkCheck size={16} className="text-yellow-500" />
              : <Bookmark size={16} />
            }
          </button>
        </button>
      ))}
    </div>
  )
}
