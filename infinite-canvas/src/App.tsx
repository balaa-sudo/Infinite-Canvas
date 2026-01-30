import { useRef, useState, useCallback, useEffect } from 'react'

interface Transform {
  x: number
  y: number
  scale: number
}

function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 })
  const [isPanning, setIsPanning] = useState(false)
  const [startPan, setStartPan] = useState({ x: 0, y: 0 })

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      setIsPanning(true)
      setStartPan({ x: e.clientX - transform.x, y: e.clientY - transform.y })
    }
  }, [transform.x, transform.y])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return
    setTransform(prev => ({
      ...prev,
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y
    }))
  }, [isPanning, startPan])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9
    const newScale = Math.min(Math.max(transform.scale * zoomFactor, 0.1), 10)

    const scaleChange = newScale / transform.scale
    const newX = mouseX - (mouseX - transform.x) * scaleChange
    const newY = mouseY - (mouseY - transform.y) * scaleChange

    setTransform({
      x: newX,
      y: newY,
      scale: newScale
    })
  }, [transform])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsPanning(false)
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [])

  const smallGridSize = 20 * transform.scale
  const largeGridSize = 100 * transform.scale
  const dotSize = Math.max(1, 2 * transform.scale)

  const offsetX = transform.x % smallGridSize
  const offsetY = transform.y % smallGridSize
  const largeOffsetX = transform.x % largeGridSize
  const largeOffsetY = transform.y % largeGridSize

  return (
    <div
      ref={containerRef}
      className="canvas-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
    >
      {/* Small dot grid pattern */}
      <svg className="pattern-layer" width="100%" height="100%">
        <defs>
          <pattern
            id="smallDots"
            x={offsetX}
            y={offsetY}
            width={smallGridSize}
            height={smallGridSize}
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx={smallGridSize / 2}
              cy={smallGridSize / 2}
              r={dotSize * 0.5}
              fill="rgba(100, 100, 120, 0.3)"
            />
          </pattern>
          <pattern
            id="largeDots"
            x={largeOffsetX}
            y={largeOffsetY}
            width={largeGridSize}
            height={largeGridSize}
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx={largeGridSize / 2}
              cy={largeGridSize / 2}
              r={dotSize * 1.2}
              fill="rgba(80, 80, 100, 0.5)"
            />
          </pattern>
          <pattern
            id="gridLines"
            x={largeOffsetX}
            y={largeOffsetY}
            width={largeGridSize}
            height={largeGridSize}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${largeGridSize} 0 L 0 0 0 ${largeGridSize}`}
              fill="none"
              stroke="rgba(70, 70, 90, 0.15)"
              strokeWidth={1}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#smallDots)" />
        <rect width="100%" height="100%" fill="url(#largeDots)" />
        <rect width="100%" height="100%" fill="url(#gridLines)" />
      </svg>

      {/* Crosshair at origin */}
      <div
        className="origin-marker"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`
        }}
      >
        <div className="crosshair-h" />
        <div className="crosshair-v" />
      </div>

      {/* Info overlay */}
      <div className="info-overlay">
        <span>Zoom: {(transform.scale * 100).toFixed(0)}%</span>
        <span>Position: ({Math.round(-transform.x / transform.scale)}, {Math.round(-transform.y / transform.scale)})</span>
      </div>
    </div>
  )
}

export default App
