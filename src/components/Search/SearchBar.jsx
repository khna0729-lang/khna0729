import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, X, ArrowLeft, Mic } from 'lucide-react'

const RECENT_KEY = 'map_recent_searches'

function getRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}
function addRecent(q) {
  const list = [q, ...getRecent().filter(r => r !== q)].slice(0, 8)
  localStorage.setItem(RECENT_KEY, JSON.stringify(list))
}

export default function SearchBar({ onSearch, onBack, showBack, placeholder = '장소, 주소, 버스, 지하철 검색' }) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [recent, setRecent] = useState(getRecent)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  const handleChange = useCallback((val) => {
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (val.trim().length >= 2) onSearch(val)
    }, 400)
  }, [onSearch])

  const handleSubmit = useCallback((q) => {
    const text = (q || query).trim()
    if (!text) return
    addRecent(text)
    setRecent(getRecent())
    setQuery(text)
    setFocused(false)
    inputRef.current?.blur()
    onSearch(text)
  }, [query, onSearch])

  const handleClear = useCallback(() => {
    setQuery('')
    onSearch('')
    inputRef.current?.focus()
  }, [onSearch])

  const handleRecentClick = useCallback((r) => {
    handleSubmit(r)
  }, [handleSubmit])

  return (
    <div className="relative">
      {/* Input row */}
      <div className={`flex items-center gap-2 bg-white rounded-2xl px-3 py-2.5 float-shadow transition-shadow ${focused ? 'ring-2 ring-primary/30' : ''}`}>
        {showBack ? (
          <button onClick={onBack} className="p-1 text-gray-400 hover:text-gray-700 shrink-0">
            <ArrowLeft size={20} />
          </button>
        ) : (
          <Search size={18} className="text-primary shrink-0" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
        />
        {query && (
          <button onClick={handleClear} className="p-0.5 rounded-full bg-gray-200 text-gray-500 shrink-0">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Recent searches dropdown */}
      {focused && !query && recent.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl float-shadow overflow-hidden z-50">
          <div className="px-4 py-2.5 flex items-center justify-between border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-500">최근 검색</span>
            <button
              onMouseDown={() => {
                localStorage.removeItem(RECENT_KEY)
                setRecent([])
              }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              전체삭제
            </button>
          </div>
          {recent.map((r, i) => (
            <button
              key={i}
              onMouseDown={() => handleRecentClick(r)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
            >
              <Search size={14} className="text-gray-400 shrink-0" />
              <span className="text-sm text-gray-700 truncate">{r}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
