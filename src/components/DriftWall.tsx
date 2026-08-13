'use client'

import React, { useRef, useEffect, useState } from 'react'

interface DriftItem {
  image?: string
  icon?: string
  title?: string
  subtitle?: string
  type?: 'progress' | 'tags' | 'match' | 'step' | 'code' | 'badge'
  val?: number | string
  tags?: string[]
  href?: string
}

interface DriftWallProps {
  items: DriftItem[]
  columns?: number
  tileWidth?: number
  tileHeight?: number
  gap?: number
  tilt?: number
  turn?: number
  perspective?: number
  depth?: number
  speed?: number
  direction?: 'up' | 'down'
  variance?: number
  parallax?: number
  lift?: number
  fade?: number
  dim?: number
  overlayColor?: string
}

export default function DriftWall({
  items,
  columns = 5,
  tileWidth = 200,
  tileHeight = 132,
  gap = 18,
  tilt = 16,
  turn = -14,
  perspective = 1200,
  depth = 120,
  speed = 42,
  direction = 'up',
  variance = 0.45,
  parallax = 0.6,
  lift = 64,
  fade = 0.6,
  dim = 0.55,
  overlayColor = '#060010',
}: DriftWallProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mouseY, setMouseY] = useState(0)
  const [offsets, setOffsets] = useState<number[]>([])
  const [tick, setTick] = useState(0)
  const startTime = useRef(performance.now())
  const rafRef = useRef<number>(0)

  useEffect(() => {
    // Generate random column offsets
    const o = Array.from({ length: columns }, (_, i) => Math.random() * variance * (tileHeight + gap) * (i % 2 === 0 ? 1 : -1))
    setOffsets(o)
  }, [columns, variance, tileHeight, gap])

  useEffect(() => {
    const loop = () => {
      setTick(performance.now())
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      setMouseY((e.clientY - rect.top) / rect.height - 0.5)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  const elapsed = (performance.now() - startTime.current) / 1000
  const dir = direction === 'up' ? -1 : 1

  // Tile rows per column — enough to fill + loop
  const rowCount = Math.ceil(600 / (tileHeight + gap)) + 4

  const transformStyle = {
    perspective: `${perspective}px`,
    transform: `rotateX(${tilt}deg) rotateY(${turn}deg)`,
    transformStyle: 'preserve-3d' as const,
  }

  const totalWidth = columns * (tileWidth + gap) - gap
  const parallaxOffset = mouseY * parallax * 40

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        background: overlayColor,
      }}
    >
      {/* Overlay fades */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: `linear-gradient(to bottom, ${overlayColor} 0%, transparent 25%, transparent 75%, ${overlayColor} 100%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: `linear-gradient(to right, ${overlayColor} 0%, transparent 20%, transparent 80%, ${overlayColor} 100%)`, pointerEvents: 'none' }} />

      <div
        style={{
          ...transformStyle,
          position: 'absolute',
          top: '50%',
          left: '50%',
          marginLeft: `-${totalWidth / 2}px`,
          marginTop: `-300px`,
          transform: `${transformStyle.transform} translateY(${parallaxOffset}px)`,
        }}
      >
        <div style={{ display: 'flex', gap: `${gap}px` }}>
          {Array.from({ length: columns }).map((_, col) => {
            const columnOffset = (offsets[col] || 0) * (tileHeight + gap)
            const scrollOffset = (elapsed * speed * dir + columnOffset) % (rowCount * (tileHeight + gap))
            const colDepth = col % 2 === 0 ? 0 : depth

            return (
              <div
                key={col}
                style={{
                  width: `${tileWidth}px`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: `${gap}px`,
                  transform: `translateY(${scrollOffset}px) translateZ(${colDepth}px)`,
                }}
              >
                {Array.from({ length: rowCount * 2 }).map((_, row) => {
                  const item = items[(col * rowCount + row) % items.length]
                  const isEdge = row === 0 || row >= rowCount * 2 - 2
                  const liftOffset = col % 2 === 0 ? -lift / 2 : lift / 2

                  return (
                    <a
                      key={row}
                      href={item.href || '#'}
                      style={{
                        display: 'block',
                        width: `${tileWidth}px`,
                        height: `${tileHeight}px`,
                        borderRadius: '12px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        opacity: isEdge ? 0 : (col % 3 === 1 ? dim : 1) * (1 - fade * 0.3),
                        transform: `translateY(${liftOffset}px)`,
                        transition: 'opacity 0.3s',
                        textDecoration: 'none',
                        position: 'relative',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        background: 'rgba(255, 255, 255, 0.02)',
                        boxSizing: 'border-box',
                      }}
                    >
                      {item.icon ? (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxSizing: 'border-box',
                          background: 'rgba(255,255,255,0.01)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '18px' }}>{item.icon}</span>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.title}
                            </span>
                          </div>
                          
                          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                            {item.subtitle}
                          </div>

                          {item.type === 'progress' && (
                            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
                              <div style={{ width: `${item.val || 50}%`, height: '100%', background: 'linear-gradient(90deg, #ffffff, #cbd5e1)' }} />
                            </div>
                          )}

                          {item.type === 'tags' && item.tags && (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                              {item.tags.slice(0, 2).map((tag, tIdx) => (
                                <span key={tIdx} style={{ fontSize: '8px', padding: '2px 6px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)' }}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {item.type === 'match' && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                              <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Match</span>
                              <span style={{ fontSize: '10px', fontWeight: 800, color: '#cbd5e1' }}>{item.val}</span>
                            </div>
                          )}

                          {item.type === 'code' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '2px 6px', borderRadius: '4px', alignSelf: 'flex-start', marginTop: '4px' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#cbd5e1' }} />
                              <span style={{ fontSize: '8px', color: '#cbd5e1', fontWeight: 600 }}>{item.val}</span>
                            </div>
                          )}

                          {item.type === 'badge' && (
                            <span style={{ fontSize: '8px', padding: '2px 6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#cbd5e1', alignSelf: 'flex-start', marginTop: '4px', fontWeight: 600 }}>
                              {item.val}
                            </span>
                          )}

                          {item.type === 'step' && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: 'var(--text-muted)', marginTop: '4px' }}>
                              <span>Status</span>
                              <span style={{ color: '#fff', fontWeight: 600 }}>{item.val}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.title || ''}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                          )}
                          {item.title && (
                            <div style={{
                              position: 'absolute', bottom: 0, left: 0, right: 0,
                              background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                              color: '#fff', padding: '12px 10px 8px',
                              fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em',
                            }}>
                              {item.title}
                            </div>
                          )}
                        </>
                      )}
                    </a>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
