import { useState, useRef, useCallback } from 'react'

const DIFFICULTY_LABEL = { beginner: '초급', intermediate: '중급', advanced: '고급' }
const DIFFICULTY_COLOR = { beginner: 'bg-green-100 text-green-700', intermediate: 'bg-yellow-100 text-yellow-700', advanced: 'bg-red-100 text-red-700' }

function ApiKeyInput({ apiKey, onSave }) {
  const [val, setVal] = useState(apiKey)
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
      <p className="text-sm font-medium text-amber-800 mb-2">🔑 Anthropic API 키를 입력하세요</p>
      <div className="flex gap-2">
        <input
          type="password"
          value={val}
          onChange={e => setVal(e.target.value)}
          placeholder="sk-ant-..."
          className="flex-1 text-sm border border-amber-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
        />
        <button
          onClick={() => onSave(val.trim())}
          disabled={!val.trim()}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg disabled:opacity-40 transition-colors"
        >
          저장
        </button>
      </div>
    </div>
  )
}

function UploadZone({ onImage }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const processFile = useCallback(file => {
    if (!file || !file.type.match(/image\/(jpeg|png|webp)/)) return
    const reader = new FileReader()
    reader.onload = e => onImage({ dataUrl: e.target.result, base64: e.target.result.split(',')[1], mimeType: file.type })
    reader.readAsDataURL(file)
  }, [onImage])

  const onDrop = e => {
    e.preventDefault()
    setDragging(false)
    processFile(e.dataTransfer.files[0])
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current.click()}
      className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all select-none
        ${dragging ? 'border-green-500 bg-green-50' : 'border-green-300 hover:border-green-500 hover:bg-green-50 bg-white'}`}
    >
      <div className="text-5xl mb-3">🌿</div>
      <p className="text-green-700 font-semibold text-lg">식물 사진을 업로드하세요</p>
      <p className="text-green-500 text-sm mt-1">드래그 앤 드롭 또는 클릭 (JPG, PNG, WEBP)</p>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => processFile(e.target.files[0])} />
    </div>
  )
}

function TagList({ items, colorClass = 'bg-green-100 text-green-700' }) {
  if (!items?.length) return null
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {items.map((item, i) => (
        <span key={i} className={`text-xs px-2 py-1 rounded-full font-medium ${colorClass}`}>{item}</span>
      ))}
    </div>
  )
}

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-500 min-w-[80px] shrink-0">{label}</span>
      <span className="text-gray-800">{value}</span>
    </div>
  )
}

function SunIcon({ level }) {
  const icons = { '전광': '☀️', '반음지': '⛅', '음지': '🌑' }
  const match = Object.keys(icons).find(k => level?.includes(k))
  return <span>{icons[match] || '🌤️'} {level}</span>
}

function PlantCard({ plant }) {
  const { koreanName, scientificName, englishName, family, genus, description,
    characteristics, regions, careGuide, whereToBuy, funFacts } = plant

  const searchUrl = name => `https://search.naver.com/search.naver?query=${encodeURIComponent(name + ' 식물 구매')}`
  const coupangUrl = name => `https://www.coupang.com/np/search?q=${encodeURIComponent(name)}`
  const auctionUrl = name => `https://www.auction.co.kr/search?query=${encodeURIComponent(name + ' 식물')}`

  return (
    <div className="space-y-4 mt-6">
      {/* 기본 정보 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-green-100">
        <div className="flex items-start gap-3">
          <span className="text-4xl">🌱</span>
          <div>
            <h2 className="text-2xl font-bold text-green-800">{koreanName}</h2>
            <p className="text-gray-500 text-sm italic">{scientificName}</p>
            <p className="text-gray-500 text-sm">{englishName}</p>
            <p className="text-xs text-gray-400 mt-1">{family} · {genus}</p>
          </div>
        </div>
        <p className="mt-3 text-gray-700 text-sm leading-relaxed">{description}</p>
      </div>

      {/* 특성 */}
      {characteristics && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-green-100">
          <h3 className="font-semibold text-green-700 mb-3">📋 특성</h3>
          <div className="space-y-2">
            <InfoRow label="키" value={characteristics.height} />
            <InfoRow label="잎 모양" value={characteristics.leafShape} />
            <InfoRow label="꽃 색깔" value={characteristics.flowerColor} />
            <InfoRow label="개화시기" value={characteristics.floweringSeason} />
            <InfoRow label="상록/낙엽" value={characteristics.evergreen ? '상록' : '낙엽'} />
            {characteristics.toxicity && (
              <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                ⚠️ 독성: {characteristics.toxicity}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 자생 지역 */}
      {regions && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-green-100">
          <h3 className="font-semibold text-green-700 mb-3">🌍 자생 지역</h3>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500 mb-1">분포 국가</p>
              <TagList items={regions.countries} colorClass="bg-blue-100 text-blue-700" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">기후대</p>
              <TagList items={regions.climateZones} colorClass="bg-sky-100 text-sky-700" />
            </div>
            {regions.koreaSpecific?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">한국 자생지</p>
                <TagList items={regions.koreaSpecific} colorClass="bg-green-100 text-green-700" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 재배 가이드 */}
      {careGuide && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-green-100">
          <h3 className="font-semibold text-green-700 mb-3">🪴 재배 가이드</h3>
          <div className="space-y-2">
            <div className="text-sm flex gap-2">
              <span className="text-gray-500 min-w-[80px]">햇빛</span>
              <SunIcon level={careGuide.sunlight} />
            </div>
            <InfoRow label="물주기" value={careGuide.watering} />
            <InfoRow label="토양" value={careGuide.soilType} />
            <div className="flex gap-2 text-sm items-center">
              <span className="text-gray-500 min-w-[80px]">난이도</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLOR[careGuide.difficulty] || 'bg-gray-100 text-gray-600'}`}>
                {DIFFICULTY_LABEL[careGuide.difficulty] || careGuide.difficulty}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 구매 정보 */}
      {whereToBuy && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-green-100">
          <h3 className="font-semibold text-green-700 mb-3">🛒 구매 정보</h3>
          <div className="space-y-2 mb-4">
            <InfoRow label="평균 가격" value={whereToBuy.avgPriceKRW} />
            <InfoRow label="구매 적기" value={whereToBuy.bestSeason} />
          </div>
          <p className="text-xs text-gray-500 mb-2 font-medium">온라인 구매</p>
          <div className="flex flex-wrap gap-2 mb-3">
            <a href={coupangUrl(koreanName)} target="_blank" rel="noopener noreferrer"
              className="text-xs bg-orange-100 text-orange-700 hover:bg-orange-200 px-3 py-1.5 rounded-lg font-medium transition-colors">
              쿠팡에서 검색 →
            </a>
            <a href={searchUrl(koreanName)} target="_blank" rel="noopener noreferrer"
              className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-lg font-medium transition-colors">
              네이버 스마트스토어 →
            </a>
            <a href={auctionUrl(koreanName)} target="_blank" rel="noopener noreferrer"
              className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 rounded-lg font-medium transition-colors">
              옥션에서 검색 →
            </a>
          </div>
          <p className="text-xs text-gray-500 mb-2 font-medium">오프라인 구매</p>
          <TagList items={['화훼단지', '인근 화원', '대형마트 원예코너']} colorClass="bg-gray-100 text-gray-600" />
        </div>
      )}

      {/* 재미있는 사실 */}
      {funFacts?.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-green-100">
          <h3 className="font-semibold text-green-700 mb-3">💡 재미있는 사실</h3>
          <ul className="space-y-2">
            {funFacts.map((fact, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700">
                <span className="text-green-500 shrink-0">•</span>
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function HistoryGallery({ history, onSelect }) {
  if (!history.length) return null
  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold text-gray-500 mb-3">📚 이전에 분석한 식물</h3>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {history.map((item, i) => (
          <button key={i} onClick={() => onSelect(item)}
            className="shrink-0 flex flex-col items-center gap-1 group">
            <img src={item.dataUrl} alt={item.plant.koreanName}
              className="w-16 h-16 object-cover rounded-xl border-2 border-transparent group-hover:border-green-400 transition-all" />
            <span className="text-xs text-gray-600 max-w-[64px] truncate">{item.plant.koreanName}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

const SYSTEM_PROMPT = `당신은 한국어로 응답하는 식물 전문가입니다. 식물 사진을 보고 식물을 식별하고 종합적인 정보를 제공합니다.

식물 이미지가 주어지면 정확히 다음 구조의 JSON 객체를 반환하세요:
{
  "koreanName": "한국어 이름",
  "scientificName": "학명",
  "englishName": "English Name",
  "family": "과명",
  "genus": "속명",
  "description": "식물 설명 (2-3문장)",
  "characteristics": {
    "height": "키 정보",
    "leafShape": "잎 모양",
    "flowerColor": "꽃 색깔",
    "floweringSeason": "개화시기",
    "evergreen": true,
    "toxicity": "독성 정보 또는 null"
  },
  "regions": {
    "countries": ["국가 목록"],
    "climateZones": ["기후대"],
    "koreaSpecific": ["한국 내 자생지"]
  },
  "careGuide": {
    "sunlight": "햇빛 요구사항",
    "watering": "물주기 정보",
    "soilType": "토양 유형",
    "difficulty": "beginner 또는 intermediate 또는 advanced"
  },
  "whereToBuy": {
    "avgPriceKRW": "평균 가격",
    "bestSeason": "구매 적기"
  },
  "funFacts": ["재미있는 사실 1", "재미있는 사실 2", "재미있는 사실 3"]
}

식물이 아닌 이미지인 경우 {"error": "식물이 아닙니다"} 를 반환하세요.
JSON 외에 다른 텍스트는 포함하지 마세요.`

export default function App() {
  const [apiKey, setApiKey] = useState('')
  const [apiKeySaved, setApiKeySaved] = useState(false)
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [plant, setPlant] = useState(null)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])

  const handleSaveKey = key => {
    setApiKey(key)
    setApiKeySaved(!!key)
  }

  const handleImage = useCallback(img => {
    setImage(img)
    setPlant(null)
    setError(null)
  }, [])

  const handleAnalyze = async () => {
    if (!image || !apiKey) return
    setLoading(true)
    setError(null)
    setPlant(null)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-calls': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          system: SYSTEM_PROMPT,
          messages: [{
            role: 'user',
            content: [{
              type: 'image',
              source: { type: 'base64', media_type: image.mimeType, data: image.base64 }
            }, {
              type: 'text',
              text: '이 식물을 식별하고 JSON 형식으로 정보를 제공해주세요.'
            }]
          }]
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error?.message || `API 오류: ${res.status}`)
      }
      const data = await res.json()
      const text = data.content?.[0]?.text || ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('응답을 파싱할 수 없습니다.')
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed.error) throw new Error(parsed.error)
      setPlant(parsed)
      setHistory(h => [{ dataUrl: image.dataUrl, plant: parsed }, ...h].slice(0, 20))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleHistorySelect = item => {
    setImage({ dataUrl: item.dataUrl, base64: '', mimeType: '' })
    setPlant(item.plant)
    setError(null)
  }

  const handleReset = () => {
    setImage(null)
    setPlant(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* 헤더 */}
        <header className="text-center mb-8">
          <div className="text-5xl mb-2">🌿</div>
          <h1 className="text-3xl font-bold text-green-800">식물 백과사전</h1>
          <p className="text-green-600 text-sm mt-1">사진으로 식물을 식별하세요</p>
        </header>

        {/* API 키 입력 */}
        {!apiKeySaved ? (
          <ApiKeyInput apiKey={apiKey} onSave={handleSaveKey} />
        ) : (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-2 mb-4">
            <span className="text-sm text-green-700">🔑 API 키 설정됨</span>
            <button onClick={() => setApiKeySaved(false)} className="text-xs text-green-500 hover:text-green-700 underline">변경</button>
          </div>
        )}

        {/* 업로드 영역 */}
        {!image ? (
          <UploadZone onImage={handleImage} />
        ) : (
          <div className="relative">
            <img src={image.dataUrl} alt="업로드된 식물" className="w-full rounded-2xl object-cover max-h-72 shadow-md" />
            <button onClick={handleReset}
              className="absolute top-2 right-2 bg-white/80 hover:bg-white text-gray-600 rounded-full w-8 h-8 flex items-center justify-center text-lg shadow transition-colors">
              ✕
            </button>
          </div>
        )}

        {/* 분석 버튼 */}
        {image && !plant && (
          <button
            onClick={handleAnalyze}
            disabled={loading || !apiKeySaved}
            className="w-full mt-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">🔄</span>
                <span>식물 분석 중...</span>
              </>
            ) : (
              <>🔍 식물 분석하기</>
            )}
          </button>
        )}

        {/* 에러 */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* 결과 */}
        {plant && <PlantCard plant={plant} />}

        {/* 히스토리 */}
        <HistoryGallery history={history} onSelect={handleHistorySelect} />
      </div>
    </div>
  )
}
