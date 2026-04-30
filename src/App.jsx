import { useState, useRef, useCallback } from 'react'
import MapView from './components/Map/MapView'
import SearchBar from './components/Search/SearchBar'
import SearchResults from './components/Search/SearchResults'
import PlaceDetail from './components/Place/PlaceDetail'
import RoutePanel from './components/Route/RoutePanel'
import LayerControl from './components/UI/LayerControl'
import FloatingControls from './components/UI/FloatingControls'
import CategoryBar from './components/UI/CategoryBar'
import BookmarkPanel from './components/UI/BookmarkPanel'
import MenuBar from './components/UI/MenuBar'
import HomePanel from './components/UI/HomePanel'
import TetrisGame from './components/Tetris/TetrisGame'
import { useSearch } from './hooks/useSearch'
import { useRoute } from './hooks/useRoute'
import { useBookmarks } from './hooks/useBookmarks'
import { MapPin, AlertCircle, X, Navigation } from 'lucide-react'

const PANEL = {
  HOME:      'home',
  RESULTS:   'results',
  PLACE:     'place',
  ROUTE:     'route',
  BOOKMARKS: 'bookmarks',
}

const MENU_W  = 64    // 메뉴바 너비
const PANEL_W = 340   // 콘텐츠 패널 너비

export default function App() {
  const mapRef = useRef(null)

  const [mapLayer, setMapLayer]   = useState('street')
  const [mapCenter, setMapCenter] = useState([37.5665, 126.978])
  const [mapZoom, setMapZoom]     = useState(13)

  const [activeMenu, setActiveMenu] = useState('home')
  const [panel, setPanel]           = useState(PANEL.HOME)
  const [showTetris, setShowTetris] = useState(false)

  const [selectedPlace, setSelectedPlace]   = useState(null)
  const [clickedPlace, setClickedPlace]     = useState(null)   // 지도 클릭 임시 정보
  const [activeCategory, setActiveCategory] = useState(null)

  const [routeOrigin, setRouteOrigin]           = useState(null)
  const [routeDestination, setRouteDestination] = useState(null)
  const [routeMode, setRouteMode]               = useState('car')

  const [userLocation, setUserLocation] = useState(null)
  const [locating, setLocating]         = useState(false)
  const [reverseLoading, setReverseLoading] = useState(false)

  const [trafficOn, setTrafficOn]   = useState(false)
  const [trafficMsg, setTrafficMsg] = useState(false)

  const { results, loading: searchLoading, error: searchError,
          search, searchNearby, clearResults, reverse } = useSearch()
  const { routeData, loading: routeLoading, error: routeError,
          fetchRoute, clearRoute } = useRoute()
  const { bookmarks, addBookmark, removeBookmark, isBookmarked } = useBookmarks()

  // ── 메뉴 선택 ───────────────────────────────────
  const handleMenuSelect = useCallback((id) => {
    if (!id) { setActiveMenu(null); return }
    setActiveMenu(id)
    if (id === 'home')      setPanel(PANEL.HOME)
    if (id === 'search')    setPanel(PANEL.RESULTS)
    if (id === 'bookmarks') setPanel(PANEL.BOOKMARKS)
    if (id === 'route')   { setPanel(PANEL.ROUTE); clearRoute() }
    if (id === 'tetris')  { setShowTetris(true); return }
  }, [clearRoute])

  // ── 검색 ───────────────────────────────────────
  const handleSearch = useCallback((query) => {
    if (!query.trim()) { clearResults(); return }
    clearResults()
    setSelectedPlace(null)
    setActiveCategory(null)
    setClickedPlace(null)
    search(query)
    setActiveMenu('search')
    setPanel(PANEL.RESULTS)
  }, [search, clearResults])

  // ── 장소 선택 ───────────────────────────────────
  const handleSelectPlace = useCallback((place) => {
    setSelectedPlace(place)
    setClickedPlace(null)
    setPanel(PANEL.PLACE)
    if (activeMenu === null) setActiveMenu('search')
    setMapCenter([place.lat, place.lon])
    setMapZoom(16)
  }, [activeMenu])

  // ── 지도 클릭 → 역지오코딩으로 장소 정보 표시 ──
  const handleMapClick = useCallback(async (latlng) => {
    // 경로 설정 모드
    if (panel === PANEL.ROUTE) {
      if (!routeOrigin)           setRouteOrigin({ ...latlng, name: `${latlng.lat.toFixed(4)}, ${latlng.lon.toFixed(4)}` })
      else if (!routeDestination) setRouteDestination({ ...latlng, name: `${latlng.lat.toFixed(4)}, ${latlng.lon.toFixed(4)}` })
      return
    }

    // 역지오코딩으로 클릭 위치 정보 가져오기
    setClickedPlace(null)
    setReverseLoading(true)
    try {
      const place = await reverse(latlng.lat, latlng.lon)
      if (place) {
        setClickedPlace({ ...place, lat: latlng.lat, lon: latlng.lon })
      }
    } catch (_) {
      setClickedPlace({
        place_id: `click_${Date.now()}`,
        name: '선택한 위치',
        display_name: `${latlng.lat.toFixed(5)}, ${latlng.lon.toFixed(5)}`,
        lat: latlng.lat, lon: latlng.lon,
        address: {}, extratags: {}, icon: '📍',
      })
    } finally {
      setReverseLoading(false)
    }
  }, [panel, routeOrigin, routeDestination, reverse])

  // ── 길찾기 시작 ─────────────────────────────────
  const handleStartRoute = useCallback((destination) => {
    setRouteDestination(destination)
    setRouteOrigin(userLocation ? { ...userLocation, name: '내 위치' } : null)
    setActiveMenu('route')
    setPanel(PANEL.ROUTE)
    setClickedPlace(null)
    clearRoute()
  }, [userLocation, clearRoute])

  // ── 카테고리 ────────────────────────────────────
  const handleCategorySelect = useCallback((category) => {
    setActiveCategory(category)
    if (!category) { clearResults(); return }
    const map = mapRef.current
    const center = map ? map.getCenter() : { lat: 37.5665, lng: 126.978 }
    searchNearby(center.lat, center.lng, category)
    setActiveMenu('search')
    setPanel(PANEL.RESULTS)
  }, [searchNearby, clearResults])

  // ── 내 위치 ─────────────────────────────────────
  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude, name: '내 위치' }
        setUserLocation(loc)
        setMapCenter([loc.lat, loc.lon])
        setMapZoom(16)
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  const handleZoomIn  = useCallback(() => mapRef.current?.zoomIn(),  [])
  const handleZoomOut = useCallback(() => mapRef.current?.zoomOut(), [])

  const handleBookmark = useCallback((place) => {
    isBookmarked(place.place_id) ? removeBookmark(place.place_id) : addBookmark(place)
  }, [isBookmarked, addBookmark, removeBookmark])

  const handleTrafficToggle = useCallback(() => {
    setTrafficOn(on => !on)
    setTrafficMsg(true)
    setTimeout(() => setTrafficMsg(false), 3000)
  }, [])

  const panelOpen  = activeMenu !== null
  const leftOffset = MENU_W + (panelOpen ? PANEL_W : 0)

  // ── 렌더 ────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      display: 'flex', flexDirection: 'row', overflow: 'hidden',
      fontFamily: "'Noto Sans KR', system-ui, sans-serif",
    }}>

      {/* ▌메뉴바 (항상 보임, 64px) */}
      <MenuBar
        activeMenu={activeMenu}
        onSelect={handleMenuSelect}
        bookmarkCount={bookmarks.length}
      />

      {/* ▌콘텐츠 패널 (슬라이드) */}
      <div style={{
        width: panelOpen ? PANEL_W : 0,
        minWidth: 0,
        height: '100%',
        background: '#fff',
        borderRight: '1px solid #f0f0f0',
        overflow: 'hidden',
        transition: 'width 0.25s ease',
        boxShadow: panelOpen ? '4px 0 16px rgba(0,0,0,0.08)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 20,
      }}>
        {panelOpen && (
          <div style={{ width: PANEL_W, height: '100%', display: 'flex', flexDirection: 'column' }}>

            {panel === PANEL.HOME && (
              <HomePanel onSearch={handleSearch} onCategory={handleCategorySelect} userLocation={userLocation} />
            )}

            {panel === PANEL.RESULTS && (
              <>
                <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
                  <SearchBar onSearch={handleSearch} showBack={false} />
                  <div style={{ marginTop: 8 }}>
                    <CategoryBar activeCategory={activeCategory} onSelect={handleCategorySelect} />
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }} className="sidebar-scroll">
                  <SearchResults
                    results={results} loading={searchLoading} error={searchError}
                    onSelect={handleSelectPlace} userLocation={userLocation}
                    isBookmarked={isBookmarked} onBookmark={handleBookmark}
                  />
                </div>
              </>
            )}

            {panel === PANEL.PLACE && selectedPlace && (
              <PlaceDetail
                place={selectedPlace}
                onClose={() => { setSelectedPlace(null); setPanel(results.length ? PANEL.RESULTS : PANEL.HOME) }}
                onRoute={handleStartRoute}
                isBookmarked={isBookmarked}
                onBookmark={handleBookmark}
              />
            )}

            {panel === PANEL.ROUTE && (
              <RoutePanel
                origin={routeOrigin} destination={routeDestination}
                setOrigin={setRouteOrigin} setDestination={setRouteDestination}
                routeData={routeData} loading={routeLoading} error={routeError}
                onFetchRoute={fetchRoute}
                onClose={() => { setPanel(PANEL.HOME); setActiveMenu('home'); clearRoute() }}
                mode={routeMode} setMode={setRouteMode}
              />
            )}

            {panel === PANEL.BOOKMARKS && (
              <BookmarkPanel
                bookmarks={bookmarks} onSelect={handleSelectPlace}
                onRemove={removeBookmark}
                onClose={() => { setPanel(PANEL.HOME); setActiveMenu('home') }}
              />
            )}
          </div>
        )}
      </div>

      {/* ▌지도 영역 */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minWidth: 0 }}>
        <MapView
          mapLayer={mapLayer} center={mapCenter} zoom={mapZoom}
          selectedPlace={selectedPlace}
          searchResults={panel === PANEL.RESULTS ? results : []}
          routeData={routeData} userLocation={userLocation}
          onMapClick={handleMapClick}
          onMarkerClick={handleSelectPlace}
          mapRef={mapRef}
        />

        {/* 상단 오버레이: 검색창 + 카테고리 바 (항상 표시) */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
          padding: '10px 12px 8px',
          pointerEvents: 'none',
        }}>
          {/* 패널 닫혔을 때만 검색창 표시 */}
          {!panelOpen && (
            <div style={{ marginBottom: 8, pointerEvents: 'auto' }}>
              <SearchBar onSearch={handleSearch} placeholder="장소, 주소 검색" />
            </div>
          )}

          {/* 카테고리 바 - 항상 표시 */}
          <div style={{ pointerEvents: 'auto' }}>
            <CategoryBar activeCategory={activeCategory} onSelect={handleCategorySelect} />
          </div>
        </div>

        {/* 지도 클릭 → 장소 팝업 */}
        {(clickedPlace || reverseLoading) && (
          <div style={{
            position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)',
            background: '#fff', borderRadius: 16, padding: '14px 16px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)', zIndex: 20,
            minWidth: 260, maxWidth: 320, width: 'calc(100% - 32px)',
          }}>
            {reverseLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#6b7280' }}>
                <div style={{
                  width: 18, height: 18, border: '2px solid #0062FF',
                  borderTopColor: 'transparent', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
                <span style={{ fontSize: 13 }}>위치 정보 불러오는 중...</span>
              </div>
            ) : clickedPlace && (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{clickedPlace.icon || '📍'}</span>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>{clickedPlace.name}</p>
                      <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0', lineHeight: 1.4 }}>
                        {clickedPlace.display_name?.split(',').slice(0, 3).join(',')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setClickedPlace(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2 }}
                  >
                    <X size={16} />
                  </button>
                </div>
                <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 10, fontFamily: 'monospace' }}>
                  {clickedPlace.lat?.toFixed(5)}, {clickedPlace.lon?.toFixed(5)}
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleSelectPlace(clickedPlace)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 10, border: 'none',
                      background: '#0062FF', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    상세 정보
                  </button>
                  <button
                    onClick={() => handleStartRoute(clickedPlace)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 10,
                      border: '1px solid #e5e7eb', background: '#fff',
                      color: '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    길찾기
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* 레이어 + 교통정보 */}
        <div style={{ position: 'absolute', bottom: 24, left: 12, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <LayerControl currentLayer={mapLayer} onChange={setMapLayer} />
          <button
            onClick={handleTrafficToggle}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 12px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: trafficOn ? '#ef4444' : '#fff', color: trafficOn ? '#fff' : '#374151',
              fontSize: 12, fontWeight: 500,
              boxShadow: '0 2px 8px rgba(0,0,0,0.13)',
            }}
          >
            🚗 교통정보 {trafficOn ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* 줌 / 내 위치 */}
        <div style={{ position: 'absolute', right: 12, bottom: 24, zIndex: 10 }}>
          <FloatingControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onLocate={handleLocate} locating={locating} />
        </div>

        {/* 교통정보 토스트 */}
        {trafficMsg && (
          <div style={{
            position: 'absolute', bottom: 100, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(17,24,39,0.9)', color: '#fff', fontSize: 12,
            padding: '10px 16px', borderRadius: 12, display: 'flex', alignItems: 'center',
            gap: 8, zIndex: 30, whiteSpace: 'nowrap',
          }}>
            <AlertCircle size={14} color="#fbbf24" />
            실시간 교통정보는 현재 지원되지 않습니다
          </div>
        )}

        {/* 경로 클릭 안내 */}
        {panel === PANEL.ROUTE && (!routeOrigin || !routeDestination) && (
          <div style={{
            position: 'absolute', bottom: 100, left: '50%', transform: 'translateX(-50%)',
            background: '#0062FF', color: '#fff', fontSize: 12,
            padding: '10px 16px', borderRadius: 12, display: 'flex', alignItems: 'center',
            gap: 8, zIndex: 30, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,98,255,0.4)',
          }}>
            <MapPin size={14} />
            지도를 클릭하여 {!routeOrigin ? '출발지' : '목적지'}를 선택하세요
          </div>
        )}
      </div>

      {showTetris && (
        <TetrisGame onClose={() => { setShowTetris(false); setActiveMenu('home') }} />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
