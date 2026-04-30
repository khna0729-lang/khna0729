import { useState, useEffect, useCallback, useRef } from 'react'

const COLS = 10
const ROWS = 20
const CELL = 30

const TETROMINOES = {
  I: { shape: [[1,1,1,1]], color: '#00f0f0' },
  O: { shape: [[1,1],[1,1]], color: '#f0f000' },
  T: { shape: [[0,1,0],[1,1,1]], color: '#a000f0' },
  S: { shape: [[0,1,1],[1,1,0]], color: '#00f000' },
  Z: { shape: [[1,1,0],[0,1,1]], color: '#f00000' },
  J: { shape: [[1,0,0],[1,1,1]], color: '#0000f0' },
  L: { shape: [[0,0,1],[1,1,1]], color: '#f0a000' },
}

const PIECES = Object.keys(TETROMINOES)

function randomPiece() {
  const key = PIECES[Math.floor(Math.random() * PIECES.length)]
  return { key, shape: TETROMINOES[key].shape, color: TETROMINOES[key].color }
}

function rotate(shape) {
  const rows = shape.length
  const cols = shape[0].length
  const result = Array.from({ length: cols }, () => Array(rows).fill(0))
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      result[c][rows - 1 - r] = shape[r][c]
  return result
}

function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null))
}

function isValid(board, shape, pos) {
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      if (shape[r][c]) {
        const nr = pos.y + r
        const nc = pos.x + c
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return false
        if (board[nr][nc]) return false
      }
  return true
}

function placePiece(board, shape, pos, color) {
  const next = board.map(row => [...row])
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      if (shape[r][c]) next[pos.y + r][pos.x + c] = color
  return next
}

function clearLines(board) {
  const kept = board.filter(row => row.some(cell => !cell))
  const cleared = ROWS - kept.length
  const empty = Array.from({ length: cleared }, () => Array(COLS).fill(null))
  return { board: [...empty, ...kept], cleared }
}

function calcScore(lines, level) {
  const base = [0, 100, 300, 500, 800]
  return (base[lines] || 0) * (level + 1)
}

function ghostPos(board, shape, pos) {
  let p = { ...pos }
  while (isValid(board, shape, { ...p, y: p.y + 1 })) p = { ...p, y: p.y + 1 }
  return p
}

const LEVEL_SPEED = [800, 700, 600, 500, 400, 300, 200, 150, 100, 80]

export default function TetrisGame({ onClose }) {
  const [board, setBoard] = useState(emptyBoard)
  const [current, setCurrent] = useState(() => randomPiece())
  const [pos, setPos] = useState({ x: 3, y: 0 })
  const [next, setNext] = useState(() => randomPiece())
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [level, setLevel] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [paused, setPaused] = useState(false)
  const [started, setStarted] = useState(false)

  const boardRef = useRef(board)
  const currentRef = useRef(current)
  const posRef = useRef(pos)
  const pausedRef = useRef(paused)
  const gameOverRef = useRef(gameOver)
  const startedRef = useRef(started)

  boardRef.current = board
  currentRef.current = current
  posRef.current = pos
  pausedRef.current = paused
  gameOverRef.current = gameOver
  startedRef.current = started

  const lock = useCallback(() => {
    const b = boardRef.current
    const cur = currentRef.current
    const p = posRef.current
    const newBoard = placePiece(b, cur.shape, p, cur.color)
    const { board: cleared, cleared: count } = clearLines(newBoard)
    setBoard(cleared)
    setLines(l => {
      const nl = l + count
      setLevel(Math.floor(nl / 10))
      return nl
    })
    setScore(s => s + calcScore(count, Math.floor((lines + count) / 10)))
    const nx = next
    const spawn = { x: 3, y: 0 }
    if (!isValid(cleared, nx.shape, spawn)) {
      setGameOver(true)
      return
    }
    setCurrent(nx)
    setPos(spawn)
    setNext(randomPiece())
  }, [next, lines])

  const moveDown = useCallback(() => {
    if (pausedRef.current || gameOverRef.current || !startedRef.current) return
    const np = { ...posRef.current, y: posRef.current.y + 1 }
    if (isValid(boardRef.current, currentRef.current.shape, np)) {
      setPos(np)
    } else {
      lock()
    }
  }, [lock])

  // Drop interval
  useEffect(() => {
    if (!started || gameOver || paused) return
    const speed = LEVEL_SPEED[Math.min(level, LEVEL_SPEED.length - 1)]
    const id = setInterval(moveDown, speed)
    return () => clearInterval(id)
  }, [started, gameOver, paused, level, moveDown])

  // Keyboard
  useEffect(() => {
    const handler = (e) => {
      if (!startedRef.current || gameOverRef.current) return
      if (e.key === 'Escape') { setPaused(p => !p); return }
      if (pausedRef.current) return

      const b = boardRef.current
      const cur = currentRef.current
      const p = posRef.current

      if (e.key === 'ArrowLeft') {
        const np = { ...p, x: p.x - 1 }
        if (isValid(b, cur.shape, np)) setPos(np)
      } else if (e.key === 'ArrowRight') {
        const np = { ...p, x: p.x + 1 }
        if (isValid(b, cur.shape, np)) setPos(np)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        const np = { ...p, y: p.y + 1 }
        if (isValid(b, cur.shape, np)) setPos(np)
        else lock()
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        const rotated = rotate(cur.shape)
        if (isValid(b, rotated, p)) setCurrent({ ...cur, shape: rotated })
        else if (isValid(b, rotated, { ...p, x: p.x + 1 })) {
          setCurrent({ ...cur, shape: rotated })
          setPos({ ...p, x: p.x + 1 })
        } else if (isValid(b, rotated, { ...p, x: p.x - 1 })) {
          setCurrent({ ...cur, shape: rotated })
          setPos({ ...p, x: p.x - 1 })
        }
      } else if (e.key === ' ') {
        e.preventDefault()
        const ghost = ghostPos(b, cur.shape, p)
        setPos(ghost)
        setTimeout(() => lock(), 0)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lock])

  const restart = () => {
    setBoard(emptyBoard())
    const p = randomPiece()
    const n = randomPiece()
    setCurrent(p)
    setPos({ x: 3, y: 0 })
    setNext(n)
    setScore(0)
    setLines(0)
    setLevel(0)
    setGameOver(false)
    setPaused(false)
    setStarted(true)
  }

  const ghost = !gameOver && started ? ghostPos(board, current.shape, pos) : null

  const displayBoard = (() => {
    let b = board.map(row => [...row])
    if (ghost && ghost.y !== pos.y) {
      for (let r = 0; r < current.shape.length; r++)
        for (let c = 0; c < current.shape[r].length; c++)
          if (current.shape[r][c]) {
            const nr = ghost.y + r, nc = ghost.x + c
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !b[nr][nc])
              b[nr][nc] = 'ghost'
          }
    }
    if (started && !gameOver) {
      for (let r = 0; r < current.shape.length; r++)
        for (let c = 0; c < current.shape[r].length; c++)
          if (current.shape[r][c]) {
            const nr = pos.y + r, nc = pos.x + c
            if (nr >= 0 && nr < ROWS) b[nr][nc] = current.color
          }
    }
    return b
  })()

  // Next piece preview
  const nextCanvas = (() => {
    const size = 4
    const grid = Array.from({ length: size }, () => Array(size).fill(null))
    const sh = next.shape
    const or = Math.floor((size - sh.length) / 2)
    const oc = Math.floor((size - sh[0].length) / 2)
    for (let r = 0; r < sh.length; r++)
      for (let c = 0; c < sh[r].length; c++)
        if (sh[r][c]) grid[or + r][oc + c] = next.color
    return grid
  })()

  const btnStyle = (bg, color = '#fff') => ({
    padding: '10px 20px', borderRadius: 8, border: 'none',
    background: bg, color, fontWeight: 700, fontSize: 14,
    cursor: 'pointer', letterSpacing: 0.5,
  })

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, fontFamily: "'Noto Sans KR', system-ui, sans-serif",
    }}>
      <div style={{
        background: '#1a1a2e', borderRadius: 16, padding: 24,
        boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
        display: 'flex', gap: 20, alignItems: 'flex-start',
        border: '1px solid #2d2d4e',
      }}>
        {/* 게임 보드 */}
        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
            gridTemplateRows: `repeat(${ROWS}, ${CELL}px)`,
            gap: 1,
            background: '#0d0d1a',
            border: '2px solid #2d2d4e',
            borderRadius: 8,
            padding: 2,
          }}>
            {displayBoard.map((row, r) =>
              row.map((cell, c) => (
                <div key={`${r}-${c}`} style={{
                  width: CELL - 1, height: CELL - 1,
                  background: cell === 'ghost'
                    ? 'rgba(255,255,255,0.08)'
                    : cell
                    ? cell
                    : '#111122',
                  borderRadius: 3,
                  boxShadow: cell && cell !== 'ghost' ? `inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.3)` : 'none',
                  border: cell === 'ghost' ? '1px solid rgba(255,255,255,0.15)' : 'none',
                  transition: 'background 0.05s',
                }} />
              ))
            )}
          </div>

          {/* 오버레이: 시작 전 */}
          {!started && !gameOver && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(13,13,26,0.92)', borderRadius: 8, gap: 16,
            }}>
              <div style={{ fontSize: 40 }}>🎮</div>
              <div style={{ color: '#e0e0ff', fontSize: 22, fontWeight: 700 }}>TETRIS</div>
              <div style={{ color: '#8080aa', fontSize: 12, textAlign: 'center', lineHeight: 1.8 }}>
                ← → 이동 &nbsp;|&nbsp; ↑ 회전<br/>↓ 빠르게 &nbsp;|&nbsp; Space 즉시 낙하<br/>ESC 일시정지
              </div>
              <button onClick={restart} style={btnStyle('#6c63ff')}>게임 시작</button>
            </div>
          )}

          {/* 오버레이: 일시정지 */}
          {paused && !gameOver && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(13,13,26,0.92)', borderRadius: 8, gap: 16,
            }}>
              <div style={{ fontSize: 36 }}>⏸</div>
              <div style={{ color: '#e0e0ff', fontSize: 20, fontWeight: 700 }}>일시정지</div>
              <button onClick={() => setPaused(false)} style={btnStyle('#6c63ff')}>계속하기</button>
            </div>
          )}

          {/* 오버레이: 게임 오버 */}
          {gameOver && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(13,13,26,0.92)', borderRadius: 8, gap: 12,
            }}>
              <div style={{ fontSize: 36 }}>💀</div>
              <div style={{ color: '#ff6b6b', fontSize: 22, fontWeight: 700 }}>GAME OVER</div>
              <div style={{ color: '#e0e0ff', fontSize: 14 }}>점수: {score.toLocaleString()}</div>
              <button onClick={restart} style={btnStyle('#6c63ff')}>다시 시작</button>
            </div>
          )}
        </div>

        {/* 사이드 패널 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 130 }}>

          {/* 닫기 */}
          <button onClick={onClose} style={{
            background: 'none', border: '1px solid #3d3d5e', color: '#8080aa',
            borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12,
            alignSelf: 'flex-end',
          }}>✕ 닫기</button>

          {/* 점수 */}
          <InfoBox label="점수" value={score.toLocaleString()} />
          <InfoBox label="레벨" value={level + 1} />
          <InfoBox label="라인" value={lines} />

          {/* 다음 블록 */}
          <div style={{ background: '#0d0d1a', borderRadius: 10, padding: 12, border: '1px solid #2d2d4e' }}>
            <div style={{ color: '#6060aa', fontSize: 11, fontWeight: 600, marginBottom: 8, letterSpacing: 1 }}>NEXT</div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(4, 22px)`,
              gridTemplateRows: `repeat(4, 22px)`,
              gap: 1,
            }}>
              {nextCanvas.map((row, r) =>
                row.map((cell, c) => (
                  <div key={`n${r}-${c}`} style={{
                    width: 21, height: 21,
                    background: cell || '#111122',
                    borderRadius: 3,
                    boxShadow: cell ? `inset 0 1px 0 rgba(255,255,255,0.3)` : 'none',
                  }} />
                ))
              )}
            </div>
          </div>

          {/* 버튼들 */}
          {started && !gameOver && (
            <button onClick={() => setPaused(p => !p)} style={btnStyle(paused ? '#6c63ff' : '#3d3d5e')}>
              {paused ? '▶ 계속' : '⏸ 정지'}
            </button>
          )}
          {(started || gameOver) && (
            <button onClick={restart} style={btnStyle('#3d3d5e')}>
              🔄 재시작
            </button>
          )}

          {/* 조작법 */}
          <div style={{
            background: '#0d0d1a', borderRadius: 10, padding: 10,
            border: '1px solid #2d2d4e', fontSize: 10, color: '#5050aa', lineHeight: 1.9,
          }}>
            <div style={{ color: '#6060aa', fontWeight: 700, marginBottom: 4, letterSpacing: 0.5 }}>조작</div>
            ← → &nbsp;이동<br/>
            ↑ &nbsp;&nbsp;&nbsp;회전<br/>
            ↓ &nbsp;&nbsp;&nbsp;내리기<br/>
            Space 즉시 낙하<br/>
            ESC &nbsp;정지
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoBox({ label, value }) {
  return (
    <div style={{
      background: '#0d0d1a', borderRadius: 10, padding: '10px 14px',
      border: '1px solid #2d2d4e',
    }}>
      <div style={{ color: '#6060aa', fontSize: 10, fontWeight: 600, letterSpacing: 1, marginBottom: 2 }}>{label.toUpperCase()}</div>
      <div style={{ color: '#e0e0ff', fontSize: 20, fontWeight: 700 }}>{value}</div>
    </div>
  )
}
