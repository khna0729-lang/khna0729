const CATEGORIES = [
  { id: 'restaurant', label: '음식점', emoji: '🍽️' },
  { id: 'cafe', label: '카페', emoji: '☕' },
  { id: 'convenience', label: '편의점', emoji: '🏪' },
  { id: 'pharmacy', label: '약국', emoji: '💊' },
  { id: 'hospital', label: '병원', emoji: '🏥' },
  { id: 'parking', label: '주차장', emoji: '🅿️' },
  { id: 'gas', label: '주유소', emoji: '⛽' },
  { id: 'hotel', label: '숙박', emoji: '🏨' },
]

export default function CategoryBar({ activeCategory, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
      {CATEGORIES.map(cat => (
        <button
          key={cat.id}
          onClick={() => onSelect(activeCategory === cat.id ? null : cat.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
            activeCategory === cat.id
              ? 'bg-primary text-white shadow-sm'
              : 'bg-white text-gray-600 float-shadow hover:bg-gray-50'
          }`}
        >
          <span>{cat.emoji}</span>
          <span>{cat.label}</span>
        </button>
      ))}
    </div>
  )
}
