import { useState, useCallback } from 'react'
import {
  X, Bookmark, BookmarkCheck, Navigation, Phone, Globe, Clock,
  Star, MapPin, Share2, Route, Camera, Pencil, Check
} from 'lucide-react'
import { useRatings } from '../../hooks/useRatings'

const STORAGE_KEY_REVIEWS = 'map_reviews'

function loadReviews() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_REVIEWS) || '{}') } catch { return {} }
}
function saveReviews(data) {
  localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(data))
}

// 장소별 시드 기반 기본 평점 (고정값)
function getBaseRating(place) {
  const seed = place.place_id?.toString().split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) || 42
  return parseFloat((3.5 + (seed % 15) / 10).toFixed(1))
}
function getBaseReviewCount(place) {
  const seed = place.place_id?.toString().split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) || 42
  return (seed % 900) + 100
}

const BASE_REVIEWS = [
  { author: '김**', text: '위치도 좋고 서비스도 훌륭했어요. 다음에도 방문할 것 같습니다!', rating: 5, date: '2024.03.15' },
  { author: '이**', text: '주변 접근성이 좋아서 편리했습니다. 주차공간도 넉넉해요.', rating: 4, date: '2024.03.10' },
  { author: '박**', text: '전반적으로 만족스럽습니다. 청결하고 친절한 서비스 덕분에 좋은 경험이었어요.', rating: 4, date: '2024.02.28' },
]

// 클릭/호버 가능한 별점 컴포넌트
function StarRatingInput({ value, onChange, size = 24 }) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const n = i + 1
        const filled = n <= (hovered || value)
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            className="transition-transform hover:scale-110 focus:outline-none"
          >
            <Star
              size={size}
              className={filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-gray-100'}
            />
          </button>
        )
      })}
    </div>
  )
}

// 읽기 전용 별 표시
function Stars({ rating, size = 12 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}
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
  const [reviewsData, setReviewsData] = useState(loadReviews)

  // 내 리뷰 작성 상태
  const [writing, setWriting] = useState(false)
  const [draftRating, setDraftRating] = useState(0)
  const [draftText, setDraftText] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const { saveRating, getRating } = useRatings()

  if (!place) return null

  const placeId = place.place_id
  const baseRating = getBaseRating(place)
  const baseCount = getBaseReviewCount(place)

  // 이 장소에 저장된 사용자 리뷰 목록
  const placeReviews = reviewsData[placeId] || []

  // 전체 평균 계산
  const allRatings = [
    ...BASE_REVIEWS.map(r => r.rating),
    ...placeReviews.map(r => r.rating),
  ]
  const avgRating = allRatings.length
    ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1)
    : baseRating.toFixed(1)
  const totalCount = baseCount + placeReviews.length

  // 내 기존 평점
  const myPrev = getRating(placeId)

  // 별점 분포 계산
  const allReviewsList = [...BASE_REVIEWS, ...placeReviews]
  const dist = [5, 4, 3, 2, 1].map(n => ({
    n,
    count: allReviewsList.filter(r => Math.round(r.rating) === n).length,
    pct: allReviewsList.length
      ? Math.round((allReviewsList.filter(r => Math.round(r.rating) === n).length / allReviewsList.length) * 100)
      : 0,
  }))

  const handleSubmitReview = useCallback(() => {
    if (!draftRating) return
    const newReview = {
      author: '나',
      text: draftText.trim(),
      rating: draftRating,
      date: new Date().toLocaleDateString('ko-KR'),
      isMe: true,
    }
    // localStorage에 저장
    const updated = { ...loadReviews() }
    updated[placeId] = [newReview, ...(updated[placeId] || []).filter(r => !r.isMe)]
    saveReviews(updated)
    setReviewsData(updated)

    saveRating(placeId, { rating: draftRating, review: draftText })
    setWriting(false)
    setSubmitted(true)
    setDraftRating(0)
    setDraftText('')
  }, [draftRating, draftText, placeId, saveRating])

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
      {/* Header photo area */}
      <div className="relative">
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
          {isBookmarked(placeId)
            ? <BookmarkCheck size={16} className="text-yellow-300" />
            : <Bookmark size={16} className="text-white" />
          }
        </button>
      </div>

      {/* Title + rating summary */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">{place.name}</h2>
            {cuisine && <span className="text-xs text-orange-600 font-medium">{cuisine}</span>}
          </div>
          <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <Share2 size={16} />
          </button>
        </div>
        {/* 평균 평점 표시 */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm font-bold text-yellow-500">{avgRating}</span>
          <Stars rating={parseFloat(avgRating)} />
          <span className="text-xs text-gray-400">리뷰 {totalCount}개</span>
          {myPrev && (
            <span className="text-xs bg-blue-50 text-primary px-1.5 py-0.5 rounded-full">내 평점 {myPrev.rating}점</span>
          )}
        </div>
      </div>

      {/* Action buttons */}
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
        <button
          onClick={() => { setActiveTab('review'); setWriting(true) }}
          className="flex-1 flex flex-col items-center gap-1 py-3 hover:bg-gray-50 transition-colors text-gray-600"
        >
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <Pencil size={15} />
          </div>
          <span className="text-xs">리뷰쓰기</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 shrink-0">
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
            {{ info: '정보', review: `리뷰 ${totalCount}`, photo: '사진' }[tab]}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto sidebar-scroll">

        {/* 정보 탭 */}
        {activeTab === 'info' && (
          <div className="px-4 py-2">
            <InfoRow icon={MapPin} label="주소" value={address} />
            <InfoRow icon={Phone} label="전화번호" value={phone} link={phone ? `tel:${phone}` : null} />
            <InfoRow icon={Globe} label="웹사이트" value={website} link={website} />
            <InfoRow icon={Clock} label="영업시간" value={hours} />
            <div className="mt-3 p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-400 mb-1">좌표</p>
              <p className="text-xs font-mono text-gray-600">
                {place.lat?.toFixed(6)}, {place.lon?.toFixed(6)}
              </p>
            </div>
          </div>
        )}

        {/* 리뷰 탭 */}
        {activeTab === 'review' && (
          <div className="px-4 py-3 space-y-3">

            {/* 내 평점 입력 또는 완료 */}
            {writing ? (
              <div className="bg-blue-50 rounded-2xl p-4 space-y-3 border border-blue-100">
                <p className="text-sm font-semibold text-gray-700">별점을 선택해주세요</p>
                <StarRatingInput value={draftRating} onChange={setDraftRating} size={32} />
                {draftRating > 0 && (
                  <p className="text-xs text-primary font-medium">
                    {['', '별로예요', '그저 그래요', '괜찮아요', '좋아요', '최고예요!'][draftRating]}
                  </p>
                )}
                <textarea
                  value={draftText}
                  onChange={e => setDraftText(e.target.value)}
                  placeholder="리뷰를 남겨주세요 (선택)"
                  rows={3}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setWriting(false); setDraftRating(0); setDraftText('') }}
                    className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    disabled={!draftRating}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      draftRating
                        ? 'bg-primary text-white hover:bg-primary-dark'
                        : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <Check size={15} />
                    등록
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setWriting(true); setSubmitted(false) }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary hover:bg-blue-50 transition-colors text-gray-400 hover:text-primary"
              >
                <Star size={16} />
                <span className="text-sm font-medium">
                  {myPrev ? `내 평점: ${myPrev.rating}점 (수정하기)` : '별점 및 리뷰 남기기'}
                </span>
              </button>
            )}

            {/* 평점 요약 */}
            <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{avgRating}</p>
                <Stars rating={parseFloat(avgRating)} />
                <p className="text-xs text-gray-400 mt-1">{totalCount}개 리뷰</p>
              </div>
              <div className="flex-1 space-y-1">
                {dist.map(({ n, pct }) => (
                  <div key={n} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-3">{n}</span>
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-6 text-right">{pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 리뷰 목록: 내 리뷰 + 기본 리뷰 */}
            {[...placeReviews, ...BASE_REVIEWS].map((r, i) => (
              <div key={i} className={`border rounded-xl p-3 ${r.isMe ? 'border-primary/30 bg-blue-50/40' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-gray-700">{r.author}</span>
                    {r.isMe && <span className="text-xs bg-primary text-white px-1.5 py-0.5 rounded-full">나</span>}
                  </div>
                  <span className="text-xs text-gray-400">{r.date}</span>
                </div>
                <div className="flex items-center gap-0.5 mb-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={11}
                      className={i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}
                    />
                  ))}
                </div>
                {r.text && <p className="text-xs text-gray-600 leading-relaxed">{r.text}</p>}
              </div>
            ))}
          </div>
        )}

        {/* 사진 탭 */}
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
