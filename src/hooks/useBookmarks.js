import { useState, useCallback } from 'react'

const STORAGE_KEY = 'map_bookmarks'

function loadBookmarks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState(loadBookmarks)

  const addBookmark = useCallback((place) => {
    setBookmarks(prev => {
      if (prev.some(b => b.place_id === place.place_id)) return prev
      const next = [place, ...prev]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const removeBookmark = useCallback((placeId) => {
    setBookmarks(prev => {
      const next = prev.filter(b => b.place_id !== placeId)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const isBookmarked = useCallback((placeId) => {
    return bookmarks.some(b => b.place_id === placeId)
  }, [bookmarks])

  return { bookmarks, addBookmark, removeBookmark, isBookmarked }
}
