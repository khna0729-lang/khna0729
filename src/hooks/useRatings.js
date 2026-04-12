import { useState, useCallback } from 'react'

const STORAGE_KEY = 'map_ratings'

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}

export function useRatings() {
  const [ratings, setRatings] = useState(load)

  const saveRating = useCallback((placeId, { rating, review }) => {
    setRatings(prev => {
      const next = {
        ...prev,
        [placeId]: {
          rating,
          review: review || '',
          date: new Date().toLocaleDateString('ko-KR').replace(/\. /g, '.').replace('.', '년 ').replace('.', '월 ') + '일',
        },
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const getRating = useCallback((placeId) => {
    return ratings[placeId] || null
  }, [ratings])

  return { saveRating, getRating }
}
