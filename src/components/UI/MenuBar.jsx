import { Home, Search, Bookmark, Route, Map } from 'lucide-react'

const MENU_ITEMS = [
  { id: 'home',      icon: Home,     label: '홈' },
  { id: 'search',    icon: Search,   label: '검색' },
  { id: 'bookmarks', icon: Bookmark, label: '즐겨찾기' },
  { id: 'route',     icon: Route,    label: '길찾기' },
]

export default function MenuBar({ activeMenu, onSelect, bookmarkCount }) {
  return (
    <div style={{
      width: 64,
      minWidth: 64,
      height: '100%',
      background: '#ffffff',
      borderRight: '1px solid #f0f0f0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      zIndex: 30,
      boxShadow: '2px 0 8px rgba(0,0,0,0.06)',
    }}>
      {/* 로고 */}
      <div style={{
        width: '100%',
        padding: '14px 0',
        display: 'flex',
        justifyContent: 'center',
        borderBottom: '1px solid #f3f4f6',
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: '#0062FF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(0,98,255,0.35)',
        }}>
          <Map size={18} color="#ffffff" />
        </div>
      </div>

      {/* 메뉴 목록 */}
      <nav style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: '10px 0',
        flex: 1,
        width: '100%',
      }}>
        {MENU_ITEMS.map(({ id, icon: Icon, label }) => {
          const active = activeMenu === id
          return (
            <button
              key={id}
              onClick={() => onSelect(active ? null : id)}
              title={label}
              style={{
                position: 'relative',
                width: 48,
                height: 52,
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                background: active ? '#0062FF' : 'transparent',
                color: active ? '#ffffff' : '#9ca3af',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = '#f3f4f6'
                  e.currentTarget.style.color = '#374151'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#9ca3af'
                }
              }}
            >
              <Icon size={20} />
              <span style={{ fontSize: 9, fontWeight: 600, lineHeight: 1 }}>{label}</span>

              {/* 즐겨찾기 뱃지 */}
              {id === 'bookmarks' && bookmarkCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  background: '#f59e0b',
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 3px',
                }}>
                  {bookmarkCount > 9 ? '9+' : bookmarkCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
