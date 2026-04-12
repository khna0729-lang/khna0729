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
import { useSearch } from './hooks/useSearch'
import { useRoute } from './hooks/useRoute'
import { useBookmarks } from './hooks/useBookmarks'
import { Bookmark, MapPin, AlertCircle } from 'lucide-react'

// Sidebar view states
const VIEW = {
  NONE: 'none',
  SEARCH: 'search',
  PLACE: 'place',
  ROUTE: 'route',
  BOOKMARKS: 'bookmarks',
}

export default function App() {
  const mapRef = useRef(null)

  // Map state
  const [mapLayer, setMapLayer] = useState('street')
  const [mapCenter, setMapCenter] = useState([37.5665, 126.978])
  const [mapZoom, setMapZoom] = useState(13)

  // Panel view state
  const [view, setView] = useState(VIEW.NONE)

  // Place state
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [activeCategory, setActiveCategory] = useState(null)

  // Route state
  const [routeOrigin, setRouteOrigin] = useState(null)
  const [routeDestination, setRouteDestination] = useState(null)
  const [routeMode, setRouteMode] = useState('car')

  // User location
  const [userLocation, setUserLocation] = useState(null)
  const [locating, setLocating] = useState(false)

  // Traffic overlay (UI toggle)
  const [trafficOn, setTrafficOn] = useState(false)
  const [trafficMsg, setTrafficMsg] = useState(false)

  // Hooks
  const { results, loading: searchLoading, error: searchError, search, searchNearby, clearResults } = useSearch()
  const { routeData, loading: routeLoading, error: routeError, fetchRoute, clearRoute } = useRoute()
  const { bookmarks, addBookmark, removeBookmark, isBookmarked } = useBookmarks()

  // --- Handlers ---

  const handleSearch = useCallback((query) => {
    if (!query.trim()) {
      clearResults()
      if (view === VIEW.SEARCH && !selectedPlace) setView(VIEW.NONE)
      return
    }
    clearResults()
    setSelectedPlace(null)
    setActiveCategory(null)
    search(query)
    setView(VIEW.SEARCH)
  }, [search, clearResults, view, selectedPlace])

  const handleSelectPlace = useCallback((place) => {
    setSelectedPlace(place)
    setView(VIEW.PLACE)
    setMapCenter([place.lat, place.lon])
    setMapZoom(16)
  }, [])

  const handleStartRoute = useCallback((destination) => {
    setRouteDestination(destination)
    setRouteOrigin(userLocation
      ? { ...userLocation, name: '내 위치' }
      : null
    )
    setView(VIEW.ROUTE)
    clearRoute()
  }, [userLocation, clearRoute])

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

  const handleZoomIn = useCallback(() => {
    const map = mapRef.current
    if (map) map.zoomIn()
  }, [])

  const handleZoomOut = useCallback(() => {
    const map = mapRef.current
    if (map) map.zoomOut()
  }, [])

  const handleMapClick = useCallback((latlng) => {
    if (view === VIEW.ROUTE) {
      if (!routeOrigin) {
        setRouteOrigin({ ...latlng, name: `${latlng.lat.toFixed(4)}, ${latlng.lon.toFixed(4)}` })
      } else if (!routeDestination) {
        setRouteDestination({ ...latlng, name: `${latlng.lat.toFixed(4)}, ${latlng.lon.toFixed(4)}` })
      }
    }
  }, [view, routeOrigin, routeDestination])

  const handleCategorySelect = useCallback((category) => {
    setActiveCategory(category)
    if (!category) {
      clearResults()
      setView(VIEW.NONE)
      return
    }
    const map = mapRef.current
    const center = map ? map.getCenter() : { lat: 37.5665, lng: 126.978 }
    searchNearby(center.lat, center.lng, category)
    setView(VIEW.SEARCH)
  }, [searchNearby, clearResults])

  const handleTrafficToggle = useCallback(() => {
    setTrafficOn(on => !on)
    setTrafficMsg(true)
    setTimeout(() => setTrafficMsg(false), 3000)
  }, [])

  const handleBookmark = useCallback((place) => {
    if (isBookmarked(place.place_id)) {
      removeBookmark(place.place_id)
    } else {
      addBookmark(place)
    }
  }, [isBookmarked, addBookmark, removeBookmark])

  const panelOpen = view !== VIEW.NONE

  return (
    <div className="w-full h-full flex relative overflow-hidden" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>

      {/* ===== LEFT SIDEBAR ===== */}
      <div
        className={`relative flex flex-col bg-white z-20 transition-all duration-300 overflow-hidden ${
          panelOpen ? 'shadow-xl' : ''
        }`}
        style={{ width: panelOpen ? '360px' : '0px', minWidth: 0 }}
      >
        {panelOpen && (
          <div className="flex flex-col h-full w-[360px]">
            {view === VIEW.SEARCH && (
              <>
                <div className="p-3 border-b border-gray-100 bg-white">
                  <SearchBar
                    onSearch={handleSearch}
                    onBack={() => { setView(VIEW.NONE); clearResults(); setActiveCategory(null) }}
                    showBack
                  />
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

            {view === VIEW.PLACE && selectedPlace && (
              <PlaceDetail
                place={selectedPlace}
                onClose={() => { setView(VIEW.NONE); setSelectedPlace(null) }}
                onRoute={handleStartRoute}
                isBookmarked={isBookmarked}
                onBookmark={handleBookmark}
              />
            )}

            {view === VIEW.ROUTE && (
              <RoutePanel
                origin={routeOrigin}
                destination={routeDestination}
                setOrigin={setRouteOrigin}
                setDestination={setRouteDestination}
                routeData={routeData}
                loading={routeLoading}
                error={routeError}
                onFetchRoute={fetchRoute}
                onClose={() => { setView(VIEW.NONE); clearRoute() }}
                mode={routeMode}
                setMode={setRouteMode}
              />
            )}

            {view === VIEW.BOOKMARKS && (
              <BookmarkPanel
                bookmarks={bookmarks}
                onSelect={handleSelectPlace}
                onRemove={removeBookmark}
                onClose={() => setView(VIEW.NONE)}
              />
            )}
          </div>
        )}
      </div>

      {/* ===== MAP AREA ===== */}
      <div className="flex-1 relative min-w-0">
        <MapView
          mapLayer={mapLayer}
          center={mapCenter}
          zoom={mapZoom}
          selectedPlace={selectedPlace}
          searchResults={view === VIEW.SEARCH ? results : []}
          routeData={routeData}
          userLocation={userLocation}
          onMapClick={handleMapClick}
          onMarkerClick={handleSelectPlace}
          mapRef={mapRef}
        />

        {/* === TOP OVERLAY: Search bar + category bar === */}
        <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
          <div className="p-3 flex flex-col gap-2">
            {/* Search row */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={() => setView(v => v === VIEW.BOOKMARKS ? VIEW.NONE : VIEW.BOOKMARKS)}
                className={`w-11 h-11 rounded-xl float-shadow flex items-center justify-center shrink-0 transition-colors ${
                  view === VIEW.BOOKMARKS
                    ? 'bg-yellow-400 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                title="즐겨찾기"
              >
                <Bookmark size={18} />
              </button>
              <div className="flex-1">
                <SearchBar
                  onSearch={handleSearch}
                  placeholder="장소, 주소, 버스, 지하철 검색"
                />
              </div>
            </div>

            {/* Category bar */}
            <div className="pointer-events-auto">
              <CategoryBar
                activeCategory={activeCategory}
                onSelect={handleCategorySelect}
              />
            </div>
          </div>
        </div>

        {/* === BOTTOM-LEFT: Layer control + traffic toggle === */}
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

        {/* === RIGHT: Floating controls === */}
        <div className="absolute right-4 bottom-6 z-10">
          <FloatingControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onLocate={handleLocate}
            locating={locating}
          />
        </div>

        {/* === Traffic notice toast === */}
        {trafficMsg && (
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 bg-gray-900/90 text-white text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 backdrop-blur-sm whitespace-nowrap">
            <AlertCircle size={14} className="text-yellow-400 shrink-0" />
            실시간 교통정보는 현재 지원되지 않습니다
          </div>
        )}

        {/* === Route click hint === */}
        {view === VIEW.ROUTE && (!routeOrigin || !routeDestination) && (
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 bg-primary text-white text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg whitespace-nowrap">
            <MapPin size={14} />
            지도를 클릭하여 {!routeOrigin ? '출발지' : '목적지'}를 선택하세요
          </div>
        )}
      </div>
    </div>
  )
}
