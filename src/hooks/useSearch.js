import { useState, useCallback, useRef } from 'react'

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'

// Rate-limit: 1 req/sec
let lastRequestTime = 0
async function rateLimitedFetch(url) {
  const now = Date.now()
  const wait = Math.max(0, 1000 - (now - lastRequestTime))
  if (wait > 0) await new Promise(r => setTimeout(r, wait))
  lastRequestTime = Date.now()
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'ko,en', 'User-Agent': 'CustomMapApp/1.0' }
  })
  if (!res.ok) throw new Error('검색 요청 실패')
  return res.json()
}

export function useSearch() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  const search = useCallback(async (query, viewbox = null) => {
    if (!query.trim()) {
      setResults([])
      return
    }
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({
      format: 'json',
      q: query,
      limit: '15',
      addressdetails: '1',
      extratags: '1',
      namedetails: '1',
      'accept-language': 'ko,en',
    })
    if (viewbox) {
      params.set('viewbox', viewbox)
      params.set('bounded', '0')
    }

    try {
      const data = await rateLimitedFetch(`${NOMINATIM_BASE}/search?${params}`)
      setResults(data.map(normalizePlace))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const searchNearby = useCallback(async (lat, lng, category) => {
    setLoading(true)
    setError(null)

    // Use Overpass API for nearby POIs
    const overpassQuery = buildOverpassQuery(lat, lng, category)
    try {
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: overpassQuery,
      })
      const data = await res.json()
      const places = data.elements
        .filter(el => el.tags && el.tags.name)
        .slice(0, 20)
        .map(el => normalizeOverpassElement(el))
      setResults(places)
    } catch (e) {
      // Fallback to Nominatim
      const categoryQuery = getCategoryQuery(category)
      await search(`${categoryQuery} near ${lat},${lng}`)
    } finally {
      setLoading(false)
    }
  }, [search])

  const reverse = useCallback(async (lat, lng) => {
    const params = new URLSearchParams({
      format: 'json',
      lat: lat.toString(),
      lon: lng.toString(),
      addressdetails: '1',
      'accept-language': 'ko,en',
    })
    const data = await rateLimitedFetch(`${NOMINATIM_BASE}/reverse?${params}`)
    return normalizePlace(data)
  }, [])

  const clearResults = useCallback(() => setResults([]), [])

  return { results, loading, error, search, searchNearby, reverse, clearResults }
}

function normalizePlace(item) {
  return {
    place_id: item.place_id || item.id || Math.random().toString(),
    name: item.namedetails?.name || item.name || item.display_name?.split(',')[0] || '이름 없음',
    display_name: item.display_name || '',
    lat: parseFloat(item.lat),
    lon: parseFloat(item.lon),
    type: item.type || item.category || 'place',
    category: item.category || item.type || '',
    address: item.address || {},
    extratags: item.extratags || {},
    icon: getPlaceIcon(item),
  }
}

function normalizeOverpassElement(el) {
  const lat = el.lat || (el.center && el.center.lat)
  const lon = el.lon || (el.center && el.center.lon)
  return {
    place_id: `overpass_${el.id}`,
    name: el.tags.name || '이름 없음',
    display_name: buildAddressFromTags(el.tags),
    lat: parseFloat(lat),
    lon: parseFloat(lon),
    type: el.tags.amenity || el.tags.shop || el.tags.tourism || 'place',
    category: el.tags.amenity || el.tags.shop || '',
    address: {},
    extratags: el.tags,
    icon: getOverpassIcon(el.tags),
  }
}

function buildAddressFromTags(tags) {
  const parts = []
  if (tags['addr:road']) parts.push(tags['addr:road'])
  if (tags['addr:city']) parts.push(tags['addr:city'])
  return parts.join(', ') || tags.name || ''
}

function buildOverpassQuery(lat, lng, category) {
  const radius = 1500 // 1.5km
  const amenityMap = {
    restaurant:  'amenity~"restaurant|fast_food"',
    cafe:        'amenity=cafe',
    convenience: 'shop=convenience',
    pharmacy:    'amenity=pharmacy',
    gas:         'amenity=fuel',
    hospital:    'amenity~"hospital|clinic"',
    parking:     'amenity=parking',
    hotel:       'tourism~"hotel|motel|hostel"',
    government:  'amenity~"townhall|government|police|fire_station|post_office|courthouse"',
    school:      'amenity~"school|university|college|kindergarten"',
    bank:        'amenity~"bank|atm"',
  }
  const filter = amenityMap[category] || `amenity=${category}`
  return `[out:json][timeout:15];
(
  node[${filter}](around:${radius},${lat},${lng});
  way[${filter}](around:${radius},${lat},${lng});
);
out center 25;`
}

function getCategoryQuery(category) {
  const map = {
    restaurant:  '음식점',
    cafe:        '카페',
    convenience: '편의점',
    pharmacy:    '약국',
    gas:         '주유소',
    hospital:    '병원',
    parking:     '주차장',
    hotel:       '숙박',
    government:  '관공서',
    school:      '학교',
    bank:        '은행',
  }
  return map[category] || category
}

function getPlaceIcon(item) {
  const type = item.type || item.category || ''
  if (type.includes('restaurant') || type.includes('food')) return '🍽️'
  if (type.includes('cafe')) return '☕'
  if (type.includes('hospital') || type.includes('pharmacy')) return '🏥'
  if (type.includes('hotel') || type.includes('motel')) return '🏨'
  if (type.includes('park') || type.includes('forest')) return '🌲'
  if (type.includes('school') || type.includes('university')) return '🏫'
  if (type.includes('station') || type.includes('subway')) return '🚇'
  if (type.includes('bus')) return '🚌'
  if (type.includes('parking')) return '🅿️'
  if (type.includes('fuel') || type.includes('gas')) return '⛽'
  if (type.includes('convenience')) return '🏪'
  return '📍'
}

function getOverpassIcon(tags) {
  const a = tags.amenity || ''
  const s = tags.shop || ''
  if (a.includes('restaurant') || a.includes('fast_food')) return '🍽️'
  if (a === 'cafe') return '☕'
  if (a === 'pharmacy') return '💊'
  if (a.includes('hospital') || a === 'clinic') return '🏥'
  if (a === 'fuel') return '⛽'
  if (a === 'parking') return '🅿️'
  if (s === 'convenience') return '🏪'
  if (a.includes('hotel') || tags.tourism?.includes('hotel')) return '🏨'
  if (a === 'townhall' || a === 'government' || a === 'courthouse') return '🏛️'
  if (a === 'police') return '🚔'
  if (a === 'fire_station') return '🚒'
  if (a === 'post_office') return '📮'
  if (a === 'school' || a === 'university' || a === 'college') return '🏫'
  if (a === 'bank' || a === 'atm') return '🏦'
  return '📍'
}
