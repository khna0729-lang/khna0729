# 커스텀 지도 앱

카카오맵과 네이버지도의 장점을 결합한 웹 기반 지도 애플리케이션입니다.

## 주요 기능

### 카카오맵에서 가져온 장점
- **깔끔한 UI/UX** - 직관적인 사이드바 + 검색바 레이아웃
- **카테고리 빠른 검색** - 음식점, 카페, 편의점, 약국, 주차장 등 원터치 검색
- **대중교통 경로** - 버스/지하철/도보 복합 경로 탐색 UI
- **길찾기 모드** - 자동차/도보/자전거/대중교통 모드 전환
- **최근 검색어** - 검색 기록 자동 저장 및 관리
- **즐겨찾기** - 장소 북마크 저장 (localStorage)

### 네이버지도에서 가져온 장점
- **멀티 레이어 지도** - 일반/위성/지형/위성+지도 레이어 전환
- **상세 장소 정보** - 주소, 전화번호, 영업시간, 웹사이트 표시
- **리뷰 및 평점** - 장소별 별점 및 사용자 리뷰
- **사진 탭** - 장소 사진 갤러리 (확장 가능)
- **상세 경로 안내** - 턴-바이-턴 방향 안내

### 추가 기능
- **내 위치** - GPS 기반 현재 위치 표시
- **교통정보 토글** - 실시간 교통상황 표시 UI
- **OpenStreetMap 기반** - 무료 오픈소스 지도 데이터
- **Nominatim 검색** - 한국어 지원 장소/주소 검색
- **OSRM 경로** - 실제 도로 기반 경로 계산

## 기술 스택

- **Frontend**: React 18 + Vite
- **지도**: Leaflet.js + react-leaflet
- **스타일**: Tailwind CSS
- **아이콘**: Lucide React
- **지도 타일**: OpenStreetMap, ESRI World Imagery, OpenTopoMap
- **검색 API**: Nominatim (OpenStreetMap)
- **경로 API**: OSRM (Open Source Routing Machine)
- **POI 검색**: Overpass API

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속
