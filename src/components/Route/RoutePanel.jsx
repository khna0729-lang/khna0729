import { useState, useEffect } from 'react'
import {
  Car, Footprints, Bike, Train, ArrowLeft,
  X, Clock, Route, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react'
import { formatDistance, formatDuration } from '../../hooks/useRoute'

const MODES = [
  { id: 'car', label: '자동차', icon: Car, color: '#0062FF' },
  { id: 'transit', label: '대중교통', icon: Train, color: '#8B5CF6' },
  { id: 'walk', label: '도보', icon: Footprints, color: '#FF6B00' },
  { id: 'bike', label: '자전거', icon: Bike, color: '#00AA44' },
]

function ManeuverIcon({ type }) {
  const icons = {
    depart: '🚩',
    arrive: '🏁',
    turn: '↩',
    'new name': '→',
    merge: '⤵',
    fork: '⑂',
    roundabout: '⟳',
    default: '→',
  }
  return <span className="text-base">{icons[type] || icons.default}</span>
}

export default function RoutePanel({
  origin,
  destination,
  setOrigin,
  setDestination,
  routeData,
  loading,
  error,
  onFetchRoute,
  onClose,
  mode,
  setMode,
}) {
  const [showSteps, setShowSteps] = useState(false)
  const [swapped, setSwapped] = useState(false)

  useEffect(() => {
    if (origin && destination && mode !== 'transit') {
      onFetchRoute(origin, destination, mode)
    }
  }, [origin, destination, mode]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSwap = () => {
    setOrigin(destination)
    setDestination(origin)
    setSwapped(s => !s)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-base font-bold text-gray-800">길찾기</h2>
        </div>

        {/* Origin / Destination */}
        <div className="relative">
          <div className="space-y-2">
            {/* Origin */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
              <span className="text-sm text-gray-700 truncate flex-1">
                {origin?.name || '출발지를 선택하세요'}
              </span>
              {origin && (
                <button onClick={() => setOrigin(null)} className="text-gray-300 hover:text-gray-500">
                  <X size={14} />
                </button>
              )}
            </div>
            {/* Destination */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
              <span className="text-sm text-gray-700 truncate flex-1">
                {destination?.name || '목적지를 선택하세요'}
              </span>
              {destination && (
                <button onClick={() => setDestination(null)} className="text-gray-300 hover:text-gray-500">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          {/* Swap button */}
          <button
            onClick={handleSwap}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 shadow-sm"
          >
            <span className="text-xs text-gray-500 font-bold">⇅</span>
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 mt-3">
          {MODES.map(m => {
            const Icon = m.icon
            const isActive = mode === m.id
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'text-white shadow-sm'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
                style={isActive ? { background: m.color } : {}}
              >
                <Icon size={16} />
                {m.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Result */}
      <div className="flex-1 overflow-y-auto sidebar-scroll">
        {loading && (
          <div className="py-10 text-center text-gray-400">
            <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">경로 탐색 중...</p>
          </div>
        )}

        {error && (
          <div className="p-4">
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {mode === 'transit' && !loading && !error && (
          <TransitSimulation origin={origin} destination={destination} />
        )}

        {routeData && mode !== 'transit' && !loading && !error && (
          <div className="p-4">
            {/* Summary card */}
            <div
              className="rounded-2xl p-4 text-white mb-4"
              style={{ background: MODES.find(m => m.id === routeData.mode)?.color || '#0062FF' }}
            >
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-2xl font-bold">{formatDuration(routeData.duration)}</p>
                  <p className="text-sm opacity-80">{formatDistance(routeData.distance)}</p>
                </div>
                <div className="ml-auto">
                  {routeData.mode === 'car' && (
                    <div className="text-right">
                      <p className="text-xs opacity-70">예상 요금</p>
                      <p className="text-sm font-medium">
                        {Math.round(routeData.distance / 1000 * 1200 + 3800).toLocaleString()}원
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Step-by-step toggle */}
            {routeData.steps?.length > 0 && (
              <div>
                <button
                  onClick={() => setShowSteps(s => !s)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors mb-2"
                >
                  <span className="text-sm font-medium text-gray-700">
                    상세 경로 ({routeData.steps.length}단계)
                  </span>
                  {showSteps ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showSteps && (
                  <div className="space-y-0.5">
                    {routeData.steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-3 py-2.5 px-2 rounded-lg hover:bg-gray-50">
                        <div className="w-6 shrink-0 mt-0.5">
                          <ManeuverIcon type={step.maneuver} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-700">{step.instruction}</p>
                          {step.name && <p className="text-xs text-gray-400">{step.name}</p>}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs text-gray-500">{formatDistance(step.distance)}</p>
                          <p className="text-xs text-gray-400">{formatDuration(step.duration)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!origin && !destination && !loading && (
          <div className="p-4 text-center text-gray-400 py-10">
            <Route size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">출발지와 목적지를 선택하세요</p>
            <p className="text-xs mt-1">지도에서 장소를 클릭하거나 검색해보세요</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Simulated transit route (UI only - real transit GTFS not available)
function TransitSimulation({ origin, destination }) {
  if (!origin || !destination) return (
    <div className="p-4 text-center text-gray-400 py-10">
      <Train size={40} className="mx-auto mb-3 opacity-20" />
      <p className="text-sm">대중교통 경로 탐색</p>
      <p className="text-xs mt-1">출발지와 목적지를 모두 선택해주세요</p>
    </div>
  )

  const ROUTES = [
    {
      duration: 32, cost: 1400, segments: [
        { type: 'walk', duration: 5, name: '도보 이동', desc: '정류장까지 350m' },
        { type: 'bus', duration: 15, name: '143번 버스', desc: '5정거장' },
        { type: 'subway', duration: 8, name: '2호선', desc: '강남역 방향 2정거장' },
        { type: 'walk', duration: 4, name: '도보 이동', desc: '목적지까지 280m' },
      ]
    },
    {
      duration: 41, cost: 1200, segments: [
        { type: 'walk', duration: 3, name: '도보 이동', desc: '정류장까지 200m' },
        { type: 'subway', duration: 28, name: '1호선 → 4호선', desc: '환승 포함 6정거장' },
        { type: 'walk', duration: 10, name: '도보 이동', desc: '목적지까지 700m' },
      ]
    },
  ]

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
        <AlertCircle size={12} />
        <span>대중교통 경로는 예시입니다 (실시간 데이터 미지원)</span>
      </div>
      {ROUTES.map((route, ri) => (
        <div key={ri} className="border border-gray-100 rounded-2xl p-4 hover:border-blue-200 cursor-pointer transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-lg font-bold text-gray-900">{route.duration}분</span>
              <span className="text-sm text-gray-400 ml-2">{route.cost.toLocaleString()}원</span>
            </div>
            {ri === 0 && <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">추천</span>}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {route.segments.map((seg, si) => (
              <div key={si} className="flex items-center gap-1.5">
                <span className={`
                  text-xs px-2 py-1 rounded-lg font-medium
                  ${seg.type === 'walk' ? 'bg-orange-100 text-orange-700' :
                    seg.type === 'bus' ? 'bg-green-100 text-green-700' :
                    'bg-blue-100 text-blue-700'}
                `}>
                  {seg.type === 'walk' ? '🚶' : seg.type === 'bus' ? '🚌' : '🚇'} {seg.name}
                </span>
                {si < route.segments.length - 1 && (
                  <span className="text-gray-300">›</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
