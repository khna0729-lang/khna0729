import { Home, Search, Bookmark, Route, Map, ChevronLeft } from 'lucide-react'

const MENU_ITEMS = [
  { id: 'home',      icon: Home,     label: '홈' },
  { id: 'search',    icon: Search,   label: '검색' },
  { id: 'bookmarks', icon: Bookmark, label: '즐겨찾기' },
  { id: 'route',     icon: Route,    label: '길찾기' },
]

export default function MenuBar({ activeMenu, onSelect, bookmarkCount }) {
  return (
    <div className="flex flex-col items-center bg-white border-r border-gray-100 z-30 shadow-sm"
         style={{ width: 64 }}>
      {/* 로고 */}
      <div className="flex items-center justify-center w-full py-4 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
          <Map size={18} className="text-white" />
        </div>
      </div>

      {/* 메뉴 아이템 */}
      <nav className="flex flex-col items-center gap-1 w-full py-3 flex-1">
        {MENU_ITEMS.map(({ id, icon: Icon, label }) => {
          const active = activeMenu === id
          return (
            <button
              key={id}
              onClick={() => onSelect(active ? null : id)}
              title={label}
              className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-xl mx-auto transition-all ${
                active
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              <Icon size={20} />
              <span className="text-[9px] mt-0.5 font-medium leading-none">{label}</span>
              {/* 즐겨찾기 뱃지 */}
              {id === 'bookmarks' && bookmarkCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-yellow-400 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
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
