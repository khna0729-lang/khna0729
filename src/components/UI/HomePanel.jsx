import { MapPin, Clock, Search, TrendingUp } from 'lucide-react'

const RECENT_KEY = 'map_recent_searches'
function getRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}

const POPULAR = ['광화문', '강남역', '홍대입구', '명동', '이태원', '여의도', '코엑스', '인사동']

const CATEGORIES = [
  { emoji: '🍽️', label: '음식점', id: 'restaurant' },
  { emoji: '☕', label: '카페',   id: 'cafe' },
  { emoji: '🏪', label: '편의점', id: 'convenience' },
  { emoji: '💊', label: '약국',   id: 'pharmacy' },
  { emoji: '🏥', label: '병원',   id: 'hospital' },
  { emoji: '🅿️', label: '주차장', id: 'parking' },
  { emoji: '⛽', label: '주유소', id: 'gas' },
  { emoji: '🏨', label: '숙박',   id: 'hotel' },
]

export default function HomePanel({ onSearch, onCategory, userLocation }) {
  const recent = getRecent()

  return (
    <div className="flex flex-col h-full overflow-y-auto sidebar-scroll bg-white">
      {/* 헤더 */}
      <div className="px-5 pt-5 pb-4">
        <h1 className="text-lg font-bold text-gray-900">지도</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          {userLocation ? '📍 내 위치 확인됨' : '장소를 검색하거나 카테고리를 선택하세요'}
        </p>
      </div>

      {/* 카테고리 바로가기 */}
      <div className="px-4 pb-4">
        <p className="text-xs font-semibold text-gray-500 mb-2.5 px-1">카테고리</p>
        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => onCategory(cat.id)}
              className="flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl bg-gray-50 hover:bg-blue-50 hover:ring-1 hover:ring-primary/20 transition-all"
            >
              <span className="text-xl">{cat.emoji}</span>
              <span className="text-xs text-gray-600 font-medium">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-gray-100 mx-4" />

      {/* 최근 검색 */}
      {recent.length > 0 && (
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
              <Clock size={12} /> 최근 검색
            </p>
            <button
              onClick={() => { localStorage.removeItem(RECENT_KEY); window.dispatchEvent(new Event('storage')) }}
              className="text-xs text-gray-300 hover:text-gray-500"
            >
              전체삭제
            </button>
          </div>
          <div className="space-y-0.5">
            {recent.slice(0, 5).map((r, i) => (
              <button
                key={i}
                onClick={() => onSearch(r)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
              >
                <Search size={13} className="text-gray-300 shrink-0" />
                <span className="text-sm text-gray-700 truncate">{r}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="h-px bg-gray-100 mx-4" />

      {/* 인기 장소 */}
      <div className="px-4 py-4">
        <p className="text-xs font-semibold text-gray-500 mb-2.5 px-1 flex items-center gap-1.5">
          <TrendingUp size={12} /> 인기 장소
        </p>
        <div className="flex flex-wrap gap-2">
          {POPULAR.map((p, i) => (
            <button
              key={i}
              onClick={() => onSearch(p)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-xs text-gray-600 hover:bg-blue-50 hover:text-primary transition-colors"
            >
              <MapPin size={11} />
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
