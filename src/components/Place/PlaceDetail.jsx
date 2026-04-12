import { useState } from 'react'
import {
  X, Bookmark, BookmarkCheck, Navigation, Phone, Globe, Clock,
  Star, MapPin, Share2, Route, ChevronRight, Camera, Info
} from 'lucide-react'

// Simulate star rating from place type/tags
function getMockRating(place) {
  const seed = place.place_id?.toString().split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) || 42
  return (3.5 + (seed % 15) / 10).toFixed(1)
}
function getMockReviews(place) {
  const seed = place.place_id?.toString().split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) || 42
  return ((seed % 900) + 100).toString()
}

const SAMPLE_REVIEWS = [
  { author: '김**', text: '위치도 좋고 서비스도 훌륭했어요. 다음에도 방문할 것 같습니다!', rating: 5, date: '2024.03.15' },
  { author: '이**', text: '주변 접근성이 좋아서 편리했습니다. 주차공간도 넉넉해요.', rating: 4, date: '2024.03.10' },
  { author: '박**', text: '전반적으로 만족스럽습니다. 청결하고 친절한 서비스 덕분에 좋은 경험이었어요.', rating: 4, date: '2024.02.28' },
]

function Stars({ rating }) {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          className={i < full ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}
        />
      ))}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value, link }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
        <Icon size={14} className="text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        {link
          ? <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary truncate block hover:underline">{value}</a>
          : <p className="text-sm text-gray-700">{value}</p>
        }
      </div>
    </div>
  )
}

export default function PlaceDetail({ place, onClose, onRoute, isBookmarked, onBookmark }) {
  const [activeTab, setActiveTab] = useState('info')

  if (!place) return null

  const rating = parseFloat(getMockRating(place))
  const reviewCount = getMockReviews(place)

  const address = (() => {
    const a = place.address
    if (!a) return place.display_name
    const parts = []
    if (a.road) parts.push(a.road)
    if (a.house_number) parts.push(a.house_number)
    if (a.city || a.town) parts.push(a.city || a.town)
    if (a.state) parts.push(a.state)
    return parts.join(' ') || place.display_name
  })()

  const tags = place.extratags || {}
  const phone = tags.phone || tags['contact:phone']
  const website = tags.website || tags['contact:website']
  const hours = tags.opening_hours
  const cuisine = tags.cuisine

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="relative">
        {/* Photo placeholder (NaverMap-style) */}
        <div className="w-full h-36 bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
          <Camera size={32} className="text-blue-300" />
          <span className="ml-2 text-sm text-blue-400">사진 없음</span>
        </div>
        <button
          onClick={onClose}
          className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
        >
          <X size={16} />
        </button>
        <button
          onClick={() => onBookmark(place)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors"
        >
          {isBookmarked(place.place_id)
            ? <BookmarkCheck size={16} className="text-yellow-300" />
            : <Bookmark size={16} className="text-white" />
          }
        </button>
      </div>

      {/* Title */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">{place.name}</h2>
            {cuisine && (
              <span className="text-xs text-orange-600 font-medium">{cuisine}</span>
            )}
          </div>
          <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <Share2 size={16} />
          </button>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm font-bold text-yellow-500">{rating}</span>
          <Stars rating={rating} />
          <span className="text-xs text-gray-400">리뷰 {reviewCount}개</span>
        </div>
      </div>

      {/* Action buttons (KakaoMap style) */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => onRoute(place)}
          className="flex-1 flex flex-col items-center gap-1 py-3 hover:bg-blue-50 transition-colors text-primary"
        >
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Route size={15} className="text-white" />
          </div>
          <span className="text-xs font-medium">길찾기</span>
        </button>
        <button className="flex-1 flex flex-col items-center gap-1 py-3 hover:bg-gray-50 transition-colors text-gray-600 border-x border-gray-100">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <Navigation size={15} />
          </div>
          <span className="text-xs">바로가기</span>
        </button>
        <button className="flex-1 flex flex-col items-center gap-1 py-3 hover:bg-gray-50 transition-colors text-gray-600">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <Share2 size={15} />
          </div>
          <span className="text-xs">공유</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {['info', 'review', 'photo'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'text-primary border-b-2 border-primary -mb-px'
                : 'text-gray-400'
            }`}
          >
            {{ info: '정보', review: '리뷰', photo: '사진' }[tab]}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto sidebar-scroll">
        {activeTab === 'info' && (
          <div className="px-4 py-2">
            <InfoRow icon={MapPin} label="주소" value={address} />
            <InfoRow icon={Phone} label="전화번호" value={phone} link={phone ? `tel:${phone}` : null} />
            <InfoRow icon={Globe} label="웹사이트" value={website} link={website} />
            <InfoRow icon={Clock} label="영업시간" value={hours} />
            {/* Coordinates */}
            <div className="mt-3 p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-400 mb-1">좌표</p>
              <p className="text-xs font-mono text-gray-600">
                {place.lat?.toFixed(6)}, {place.lon?.toFixed(6)}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'review' && (
          <div className="px-4 py-3 space-y-3">
            {/* Rating summary */}
            <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{rating}</p>
                <Stars rating={rating} />
                <p className="text-xs text-gray-400 mt-1">{reviewCount}개 리뷰</p>
              </div>
              <div className="flex-1 space-y-1">
                {[5, 4, 3, 2, 1].map(n => (
                  <div key={n} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-3">{n}</span>
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full"
                        style={{ width: `${n === 5 ? 55 : n === 4 ? 28 : n === 3 ? 12 : 4}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Reviews */}
            {SAMPLE_REVIEWS.map((r, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-700">{r.author}</span>
                  <span className="text-xs text-gray-400">{r.date}</span>
                </div>
                <div className="flex items-center gap-1 mb-1.5">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} size={11} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'photo' && (
          <div className="p-4">
            <div className="grid grid-cols-3 gap-1.5">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <Camera size={20} className="text-gray-300" />
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-gray-400 mt-3">등록된 사진이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  )
}
