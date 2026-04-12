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
import { useSearch } from './hooks/useSearch'
import { useRoute } from './hooks/useRoute'
import { useBookmarks } from './hooks/useBookmarks'
import { MapPin, AlertCircle, ChevronLeft } from 'lucide-react'

// 콘텐츠 패널 안에서 무엇을 보여줄지
const PANEL = {
  HOME:      'home',
  RESULTS:   'results',
  PLACE:     'place',
  ROUTE:     'route',
  BOOKMARKS: 'bookmarks',
}

export default function App() {
  const mapRef = useRef(null)

  // 지도 상태
  const [mapLayer, setMapLayer]   = useState('street')
  const [mapCenter, setMapCenter] = useState([37.5665, 126.978])
  const [mapZoom, setMapZoom]     = useState(13)

  // 메뉴바 + 패널 상태
  const [activeMenu, setActiveMenu] = useState('home')   // 어떤 메뉴 아이콘이 선택됐는지
  const [panel, setPanel]           = useState(PANEL.HOME) // 패널 안 내용

  // 선택된 장소
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [activeCategory, setActiveCategory] = useState(null)

  // 경로
  const [routeOrigin, setRouteOrigin]           = useState(null)
  const [routeDestination, setRouteDestination] = useState(null)
  const [routeMode, setRouteMode]               = useState('car')

  // 내 위치
  const [userLocation, setUserLocation] = useState(null)
  const [locating, setLocating]         = useState(false)

  // 교통정보 토글
  const [trafficOn, setTrafficOn]   = useState(false)
  const [trafficMsg, setTrafficMsg] = useState(false)

  // 훅
  const { results, loading: searchLoading, error: searchError, search, searchNearby, clearResults } = useSearch()
  const { routeData, loading: routeLoading, error: routeError, fetchRoute, clearRoute } = useRoute()
  const { bookmarks, addBookmark, removeBookmark, isBookmarked } = useBookmarks()

  // ── 핸들러 ──────────────────────────────────────────────

  // 메뉴바 아이콘 클릭
  const handleMenuSelect = useCallback((id) => {
    if (!id) {
      // 같은 메뉴 재클릭 → 패널 닫기
      setActiveMenu(null)
      return
    }
    setActiveMenu(id)
    if (id === 'home')      setPanel(PANEL.HOME)
    if (id === 'search')    setPanel(PANEL.RESULTS)
    if (id === 'bookmarks') setPanel(PANEL.BOOKMARKS)
    if (id === 'route') {
      setPanel(PANEL.ROUTE)
      clearRoute()
    }
  }, [clearRoute])

  // 검색 실행
  const handleSearch = useCallback((query) => {
    if (!query.trim()) { clearResults(); return }
    clearResults()
    setSelectedPlace(null)
    setActiveCategory(null)
    search(query)
    setActiveMenu('search')
    setPanel(PANEL.RESULTS)
  }, [search, clearResults])

  // 장소 선택
  const handleSelectPlace = useCallback((place) => {
    setSelectedPlace(place)
    setPanel(PANEL.PLACE)
    setMapCenter([place.lat, place.lon])
    setMapZoom(16)
  }, [])

  // 길찾기 시작
  const handleStartRoute = useCallback((destination) => {
    setRouteDestination(destination)
    setRouteOrigin(userLocation ? { ...userLocation, name: '내 위치' } : null)
    setActiveMenu('route')
    setPanel(PANEL.ROUTE)
    clearRoute()
  }, [userLocation, clearRoute])

  // 카테고리 선택
  const handleCategorySelect = useCallback((category) => {
    setActiveCategory(category)
    if (!category) { clearResults(); return }
    const map = mapRef.current
    const center = map ? map.getCenter() : { lat: 37.5665, lng: 126.978 }
    searchNearby(center.lat, center.lng, category)
    setActiveMenu('search')
    setPanel(PANEL.RESULTS)
  }, [searchNearby, clearResults])

  // 내 위치
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

  // 지도 클릭 (경로 설정 모드)
  const handleMapClick = useCallback((latlng) => {
    if (panel === PANEL.ROUTE) {
      if (!routeOrigin)      setRouteOrigin({ ...latlng, name: `${latlng.lat.toFixed(4)}, ${latlng.lon.toFixed(4)}` })
      else if (!routeDestination) setRouteDestination({ ...latlng, name: `${latlng.lat.toFixed(4)}, ${latlng.lon.toFixed(4)}` })
    }
  }, [panel, routeOrigin, routeDestination])

  const handleBookmark = useCallback((place) => {
    isBookmarked(place.place_id) ? removeBookmark(place.place_id) : addBookmark(place)
  }, [isBookmarked, addBookmark, removeBookmark])

  const handleTrafficToggle = useCallback(() => {
    setTrafficOn(on => !on)
    setTrafficMsg(true)
    setTimeout(() => setTrafficMsg(false), 3000)
  }, [])

  // 패널 열림 여부 (메뉴가 선택된 경우)
  const panelOpen = activeMenu !== null

  return (
    <div className="w-full h-full flex overflow-hidden" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>

      {/* ══════════════════════════════════════
          좌측 메뉴바 (항상 보임, 64px)
      ══════════════════════════════════════ */}
      <MenuBar
        activeMenu={activeMenu}
        onSelect={handleMenuSelect}
        bookmarkCount={bookmarks.length}
      />

      {/* ══════════════════════════════════════
          콘텐츠 패널 (메뉴 선택 시 슬라이드)
      ══════════════════════════════════════ */}
      <div
        className="flex flex-col bg-white border-r border-gray-100 z-20 transition-all duration-300 overflow-hidden"
        style={{
          width: panelOpen ? 340 : 0,
          minWidth: 0,
          boxShadow: panelOpen ? '4px 0 16px rgba(0,0,0,0.08)' : 'none',
        }}
      >
        {panelOpen && (
          <div className="flex flex-col h-full" style={{ width: 340 }}>

            {/* ── 홈 ── */}
            {panel === PANEL.HOME && (
              <HomePanel
                onSearch={handleSearch}
                onCategory={handleCategorySelect}
                userLocation={userLocation}
              />
            )}

            {/* ── 검색 탭: 검색창 + 결과 ── */}
            {panel === PANEL.RESULTS && (
              <>
                <div className="p-3 border-b border-gray-100 bg-white shrink-0">
                  <SearchBar onSearch={handleSearch} showBack={false} />
                  <div className="mt-2">
                    <CategoryBar activeCategory={activeCategory} onSelect={handleCategorySelect} />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto sidebar-scroll">
                  <SearchResults
                    results={results}
                    loading={searchLoading}
                    error={searchError}
                    onSelect={handleSelectPlace}
                    userLocation={userLocation}
                    isBookmarked={isBookmarked}
                    onBookmark={handleBookmark}
                  />
                </div>
              </>
            )}

            {/* ── 장소 상세 ── */}
            {panel === PANEL.PLACE && selectedPlace && (
              <PlaceDetail
                place={selectedPlace}
                onClose={() => {
                  setSelectedPlace(null)
                  setPanel(results.length ? PANEL.RESULTS : PANEL.HOME)
                }}
                onRoute={handleStartRoute}
                isBookmarked={isBookmarked}
                onBookmark={handleBookmark}
              />
            )}

            {/* ── 길찾기 ── */}
            {panel === PANEL.ROUTE && (
              <RoutePanel
                origin={routeOrigin}
                destination={routeDestination}
                setOrigin={setRouteOrigin}
                setDestination={setRouteDestination}
                routeData={routeData}
                loading={routeLoading}
                error={routeError}
                onFetchRoute={fetchRoute}
                onClose={() => { setPanel(PANEL.HOME); setActiveMenu('home'); clearRoute() }}
                mode={routeMode}
                setMode={setRouteMode}
              />
            )}

            {/* ── 즐겨찾기 ── */}
            {panel === PANEL.BOOKMARKS && (
              <BookmarkPanel
                bookmarks={bookmarks}
                onSelect={handleSelectPlace}
                onRemove={removeBookmark}
                onClose={() => { setPanel(PANEL.HOME); setActiveMenu('home') }}
              />
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          지도 영역
      ══════════════════════════════════════ */}
      <div className="flex-1 relative min-w-0">
        <MapView
          mapLayer={mapLayer}
          center={mapCenter}
          zoom={mapZoom}
          selectedPlace={selectedPlace}
          searchResults={panel === PANEL.RESULTS ? results : []}
          routeData={routeData}
          userLocation={userLocation}
          onMapClick={handleMapClick}
          onMarkerClick={handleSelectPlace}
          mapRef={mapRef}
        />

        {/* 지도 위 검색창 (패널 닫혔을 때만) */}
        {!panelOpen && (
          <div className="absolute top-3 left-3 right-16 z-10 pointer-events-auto">
            <SearchBar onSearch={handleSearch} placeholder="장소, 주소 검색" />
          </div>
        )}

        {/* 레이어 + 교통정보 */}
        <div className="absolute bottom-6 left-4 z-10 flex flex-col gap-2 items-start">
          <LayerControl currentLayer={mapLayer} onChange={setMapLayer} />
          <button
            onClick={handleTrafficToggle}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium float-shadow transition-colors ${
              trafficOn ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            🚗 교통정보 {trafficOn ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* 줌 / 내 위치 */}
        <div className="absolute right-4 bottom-6 z-10">
          <FloatingControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onLocate={handleLocate}
            locating={locating}
          />
        </div>

        {/* 교통정보 토스트 */}
        {trafficMsg && (
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 bg-gray-900/90 text-white text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 backdrop-blur-sm whitespace-nowrap">
            <AlertCircle size={14} className="text-yellow-400 shrink-0" />
            실시간 교통정보는 현재 지원되지 않습니다
          </div>
        )}

        {/* 경로 클릭 안내 */}
        {panel === PANEL.ROUTE && (!routeOrigin || !routeDestination) && (
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 bg-primary text-white text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg whitespace-nowrap">
            <MapPin size={14} />
            지도를 클릭하여 {!routeOrigin ? '출발지' : '목적지'}를 선택하세요
          </div>
        )}
      </div>
    </div>
  )
}
