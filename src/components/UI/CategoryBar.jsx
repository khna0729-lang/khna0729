const CATEGORIES = [
  { id: 'restaurant',  label: '음식점', emoji: '🍽️' },
  { id: 'cafe',        label: '카페',   emoji: '☕' },
  { id: 'hospital',    label: '병원',   emoji: '🏥' },
  { id: 'pharmacy',    label: '약국',   emoji: '💊' },
  { id: 'government',  label: '관공서', emoji: '🏛️' },
  { id: 'convenience', label: '편의점', emoji: '🏪' },
  { id: 'parking',     label: '주차장', emoji: '🅿️' },
  { id: 'gas',         label: '주유소', emoji: '⛽' },
  { id: 'hotel',       label: '숙박',   emoji: '🏨' },
  { id: 'school',      label: '학교',   emoji: '🏫' },
  { id: 'bank',        label: '은행',   emoji: '🏦' },
]

export default function CategoryBar({ activeCategory, onSelect }) {
  return (
    <div style={{
      display: 'flex',
      gap: 6,
      overflowX: 'auto',
      paddingBottom: 4,
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
    }}>
      {CATEGORIES.map(cat => {
        const active = activeCategory === cat.id
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(active ? null : cat.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 12px',
              borderRadius: 20,
              border: active ? 'none' : '1px solid rgba(0,0,0,0.08)',
              background: active ? '#0062FF' : '#ffffff',
              color: active ? '#ffffff' : '#374151',
              fontSize: 12,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              flexShrink: 0,
              cursor: 'pointer',
              boxShadow: active
                ? '0 2px 8px rgba(0,98,255,0.35)'
                : '0 1px 6px rgba(0,0,0,0.12)',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 14 }}>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        )
      })}
    </div>
  )
}
