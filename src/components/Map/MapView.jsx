import { useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const TILE_LAYERS = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© <a href="https://www.esri.com">Esri</a>',
    maxZoom: 19,
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
  },
  hybrid: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© <a href="https://www.esri.com">Esri</a>',
    maxZoom: 19,
    overlay: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  },
}

function createPlaceIcon(emoji = '📍', color = '#0062FF') {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
      <path d="M18 0C8.059 0 0 8.059 0 18c0 14 18 26 18 26S36 32 36 18C36 8.059 27.941 0 18 0z"
        fill="${color}" stroke="white" stroke-width="2"/>
      <text x="18" y="23" text-anchor="middle" font-size="14">${emoji}</text>
    </svg>`
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -44],
  })
}

function createUserIcon() {
  const html = `
    <div style="
      width:20px;height:20px;
      background:#0062FF;
      border:3px solid white;
      border-radius:50%;
      box-shadow:0 2px 8px rgba(0,98,255,0.5);
      position:relative;
    ">
      <div style="
        position:absolute;
        inset:-8px;
        background:rgba(0,98,255,0.15);
        border-radius:50%;
        animation:pulse 2s infinite;
      "></div>
    </div>
    <style>@keyframes pulse{0%,100%{transform:scale(1);opacity:0.7}50%{transform:scale(1.3);opacity:0.3}}</style>`
  return L.divIcon({
    html,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

export default function MapView({
  mapLayer,
  center,
  zoom,
  selectedPlace,
  searchResults,
  routeData,
  userLocation,
  onMapClick,
  onMarkerClick,
  mapRef,
}) {
  const containerRef = useRef(null)
  const leafletRef = useRef(null)
  const tileRef = useRef(null)
  const overlayRef = useRef(null)
  const routeLayerRef = useRef(null)
  const markersRef = useRef([])
  const userMarkerRef = useRef(null)
  const selectedMarkerRef = useRef(null)

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || leafletRef.current) return

    const map = L.map(containerRef.current, {
      center: center || [37.5665, 126.978],
      zoom: zoom || 13,
      zoomControl: false,
      attributionControl: true,
    })

    const layer = TILE_LAYERS['street']
    tileRef.current = L.tileLayer(layer.url, {
      attribution: layer.attribution,
      maxZoom: layer.maxZoom,
    }).addTo(map)

    map.on('click', (e) => {
      onMapClick?.({ lat: e.latlng.lat, lon: e.latlng.lng })
    })

    leafletRef.current = map
    if (mapRef) mapRef.current = map

    return () => {
      map.remove()
      leafletRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update tile layer
  useEffect(() => {
    const map = leafletRef.current
    if (!map) return

    if (tileRef.current) map.removeLayer(tileRef.current)
    if (overlayRef.current) { map.removeLayer(overlayRef.current); overlayRef.current = null }

    const cfg = TILE_LAYERS[mapLayer] || TILE_LAYERS.street
    tileRef.current = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom,
    }).addTo(map)

    if (mapLayer === 'hybrid' && cfg.overlay) {
      overlayRef.current = L.tileLayer(cfg.overlay, {
        opacity: 0.4,
        maxZoom: 19,
      }).addTo(map)
    }
  }, [mapLayer])

  // Fly to center when it changes
  useEffect(() => {
    const map = leafletRef.current
    if (!map || !center) return
    map.flyTo(center, zoom || map.getZoom(), { duration: 0.8 })
  }, [center, zoom])

  // Update user location marker
  useEffect(() => {
    const map = leafletRef.current
    if (!map) return
    if (userMarkerRef.current) { map.removeLayer(userMarkerRef.current); userMarkerRef.current = null }
    if (userLocation) {
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lon], {
        icon: createUserIcon(),
        zIndexOffset: 1000,
      }).addTo(map)
    }
  }, [userLocation])

  // Update search result markers
  useEffect(() => {
    const map = leafletRef.current
    if (!map) return
    markersRef.current.forEach(m => map.removeLayer(m))
    markersRef.current = []

    if (!searchResults?.length) return

    searchResults.forEach((place, i) => {
      if (!place.lat || !place.lon) return
      const marker = L.marker([place.lat, place.lon], {
        icon: createPlaceIcon(place.icon || '📍', '#666'),
        title: place.name,
      })
        .addTo(map)
        .on('click', () => onMarkerClick?.(place))
      markersRef.current.push(marker)
    })

    // Fit bounds to all markers
    if (markersRef.current.length > 1) {
      const group = L.featureGroup(markersRef.current)
      map.fitBounds(group.getBounds().pad(0.2))
    }
  }, [searchResults]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update selected place marker
  useEffect(() => {
    const map = leafletRef.current
    if (!map) return
    if (selectedMarkerRef.current) { map.removeLayer(selectedMarkerRef.current); selectedMarkerRef.current = null }
    if (!selectedPlace) return

    selectedMarkerRef.current = L.marker([selectedPlace.lat, selectedPlace.lon], {
      icon: createPlaceIcon(selectedPlace.icon || '📍', '#0062FF'),
      zIndexOffset: 500,
    })
      .addTo(map)
      .bindPopup(`<strong>${selectedPlace.name}</strong>`, { offset: [0, -40] })
      .openPopup()
  }, [selectedPlace])

  // Draw route
  useEffect(() => {
    const map = leafletRef.current
    if (!map) return
    if (routeLayerRef.current) { map.removeLayer(routeLayerRef.current); routeLayerRef.current = null }
    if (!routeData?.geometry) return

    const colorMap = { car: '#0062FF', walk: '#FF6B00', bike: '#00AA44', transit: '#8B5CF6' }
    const color = colorMap[routeData.mode] || '#0062FF'

    routeLayerRef.current = L.geoJSON(routeData.geometry, {
      style: {
        color,
        weight: 5,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
      },
    }).addTo(map)

    map.fitBounds(routeLayerRef.current.getBounds().pad(0.15))
  }, [routeData])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ background: '#f0f0f0' }}
    />
  )
}
