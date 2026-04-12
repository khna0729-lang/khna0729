import { useState, useCallback } from 'react'

const OSRM_BASE = 'https://router.project-osrm.org/route/v1'

const MODE_PROFILE = {
  car: 'driving',
  walk: 'foot',
  bike: 'cycling',
}

export function useRoute() {
  const [routeData, setRouteData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchRoute = useCallback(async (origin, destination, mode = 'car') => {
    if (!origin || !destination) return
    setLoading(true)
    setError(null)

    const profile = MODE_PROFILE[mode] || 'driving'
    const coords = `${origin.lon},${origin.lat};${destination.lon},${destination.lat}`
    const url = `${OSRM_BASE}/${profile}/${coords}?steps=true&geometries=geojson&overview=full&annotations=false`

    try {
      const res = await fetch(url)
      const data = await res.json()
      if (data.code !== 'Ok' || !data.routes?.length) {
        throw new Error('경로를 찾을 수 없습니다')
      }
      const route = data.routes[0]
      setRouteData({
        distance: route.distance, // meters
        duration: route.duration, // seconds
        geometry: route.geometry,
        steps: parseSteps(route.legs[0]?.steps || [], mode),
        mode,
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const clearRoute = useCallback(() => {
    setRouteData(null)
    setError(null)
  }, [])

  return { routeData, loading, error, fetchRoute, clearRoute }
}

function parseSteps(steps, mode) {
  return steps.map(step => ({
    instruction: translateInstruction(step.maneuver?.type, step.maneuver?.modifier, mode),
    distance: step.distance,
    duration: step.duration,
    name: step.name || '',
    maneuver: step.maneuver?.type || '',
    modifier: step.maneuver?.modifier || '',
  }))
}

function translateInstruction(type, modifier, mode) {
  const modMap = {
    left: '좌회전',
    right: '우회전',
    'slight left': '좌측',
    'slight right': '우측',
    straight: '직진',
    uturn: 'U턴',
    'sharp left': '좌회전',
    'sharp right': '우회전',
  }
  const typeMap = {
    turn: modifier ? `${modMap[modifier] || modifier}` : '회전',
    'new name': '이름 변경',
    depart: '출발',
    arrive: '도착',
    merge: '합류',
    'on ramp': '진입로',
    'off ramp': '출구',
    fork: '분기',
    'end of road': '도로 끝',
    continue: modifier ? `${modMap[modifier] || '직진'}` : '계속',
    roundabout: '로터리',
    rotary: '로터리',
    'roundabout turn': '로터리 회전',
    notification: '알림',
    'exit roundabout': '로터리 진출',
    'exit rotary': '로터리 진출',
  }
  return typeMap[type] || type || '이동'
}

export function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

export function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}시간 ${m}분`
  return `${m}분`
}
