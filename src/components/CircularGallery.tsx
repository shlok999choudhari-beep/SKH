'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'

export interface CircularGalleryItem {
  icon?: React.ReactNode
  title: string
  desc: string
  tag?: string
  badge?: string
  gradient?: string
}

interface CircularGalleryProps {
  items?: CircularGalleryItem[]
  bend?: number
  textColor?: string
  borderRadius?: number
  scrollEase?: number
  autoRotate?: boolean
  autoRotateSpeed?: number
  fontUrl?: string
  font?: string
}

const DEFAULT_ITEMS: CircularGalleryItem[] = [
  { icon: '📄', title: 'Resume Upload & ATS Score', desc: 'Upload PDF resumes. Get ATS compatibility score like real companies run it.', tag: 'Core', badge: 'badge-purple', gradient: 'linear-gradient(135deg,#EAB308,#FDE047)' },
  { icon: '🧠', title: 'Semantic Skill Extraction', desc: 'AI reads between the lines and extracts hard + soft skills intelligently.', tag: 'AI', badge: 'badge-blue', gradient: 'linear-gradient(135deg,#96c8ff,#60a5fa)' },
  { icon: '🎯', title: 'Company Match Score', desc: 'Vector similarity matching against real company requirement profiles.', tag: 'AI', badge: 'badge-blue', gradient: 'linear-gradient(135deg,#EAB308,#96c8ff)' },
  { icon: '🔍', title: 'Skill Gap Detection', desc: 'Pinpoint exact missing skills — both technical and soft skills breakdown.', tag: 'Core', badge: 'badge-purple', gradient: 'linear-gradient(135deg,#ef4444,#f59e0b)' },
  { icon: '🗺️', title: 'AI 4-Week Roadmap', desc: 'Personalized day-by-day learning plan to close your skill gaps fast.', tag: 'AI', badge: 'badge-blue', gradient: 'linear-gradient(135deg,#10b981,#96c8ff)' },
  { icon: '🎤', title: 'Live Interview Simulator', desc: 'Voice & chat AI for mock interviews. Get confidence scores instantly.', tag: 'Advanced', badge: 'badge-orange', gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
  { icon: '💻', title: 'DSA Coding Judge', desc: 'Real-time coding round evaluator with test cases — like LeetCode meets AI.', tag: 'Advanced', badge: 'badge-orange', gradient: 'linear-gradient(135deg,#96c8ff,#60a5fa)' },
  { icon: '📊', title: 'Skill Radar Chart', desc: 'Beautiful visual radar showing your strengths across all domains.', tag: 'Visual', badge: 'badge-green', gradient: 'linear-gradient(135deg,#10b981,#34d399)' }
]

export default function CircularGallery({
  items = DEFAULT_ITEMS,
  bend = 3,
  textColor = '#ffffff',
  borderRadius = 0.05,
  scrollEase = 0.08,
  autoRotate = true,
  autoRotateSpeed = 0.025,
  fontUrl,
  font,
}: CircularGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cylinderRef = useRef<HTMLDivElement>(null)
  const [isDraggingState, setIsDraggingState] = useState(false)

  // Physics & Animation Refs
  const isDragging = useRef(false)
  const isHovered = useRef(false)
  const lastX = useRef(0)
  const lastTime = useRef(0)
  const currentRotation = useRef(0)
  const targetRotation = useRef(0)
  const momentumVelocity = useRef(0)
  const dragVelocity = useRef(0)
  const lastInteractionTime = useRef(0)

  // Load custom font if fontUrl is provided
  useEffect(() => {
    if (fontUrl && typeof document !== 'undefined') {
      const link = document.createElement('link')
      link.href = fontUrl
      link.rel = 'stylesheet'
      if (document.head) {
        document.head.appendChild(link)
      }
      return () => {
        if (link.parentNode) {
          link.parentNode.removeChild(link)
        }
      }
    }
  }, [fontUrl])

  // Drag sensitivity factor
  const sensitivity = 0.22 / Math.max(0.5, bend * 0.35)

  // Pointer event handlers for hold & move
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return // Only primary click/touch
    isDragging.current = true
    setIsDraggingState(true)
    lastX.current = e.clientX
    lastTime.current = performance.now()
    dragVelocity.current = 0
    momentumVelocity.current = 0
    lastInteractionTime.current = performance.now()
    
    try {
      containerRef.current?.setPointerCapture(e.pointerId)
    } catch {
      // Ignore if pointer capture fails
    }
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return
    const now = performance.now()
    const dt = Math.max(1, now - lastTime.current)
    const deltaX = e.clientX - lastX.current
    
    // Direct bidirectional movement:
    // Dragging right (deltaX > 0) rotates right (positive)
    // Dragging left (deltaX < 0) rotates left (negative)
    const rotDelta = deltaX * sensitivity
    targetRotation.current += rotDelta
    
    // Smooth velocity tracking
    const instantVelocity = rotDelta / (dt / 16.67)
    dragVelocity.current = dragVelocity.current * 0.3 + instantVelocity * 0.7

    lastX.current = e.clientX
    lastTime.current = now
    lastInteractionTime.current = now
  }, [sensitivity])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return
    isDragging.current = false
    setIsDraggingState(false)
    
    // Transfer drag velocity into smooth momentum on release (clamped for stability)
    const maxVelocity = 6
    const clampedVelocity = Math.max(-maxVelocity, Math.min(maxVelocity, dragVelocity.current))
    momentumVelocity.current = clampedVelocity
    lastInteractionTime.current = performance.now()

    try {
      containerRef.current?.releasePointerCapture(e.pointerId)
    } catch {
      // Ignore
    }
  }, [])

  // Physics animation loop (60fps direct DOM style update for rock-solid stability)
  useEffect(() => {
    let animId: number

    const tick = () => {
      const now = performance.now()
      const idleTime = now - lastInteractionTime.current

      if (!isDragging.current) {
        // Friction decay on momentum after release
        if (Math.abs(momentumVelocity.current) > 0.001) {
          targetRotation.current += momentumVelocity.current
          momentumVelocity.current *= 0.95 // smooth friction decay
        } else {
          momentumVelocity.current = 0
        }

        // Very slow auto-rotation when not hovered and idle
        if (autoRotate && !isHovered.current && idleTime > 800) {
          const resumeFactor = Math.min(1, (idleTime - 800) / 1000) // smooth 1s ramp-in
          targetRotation.current -= autoRotateSpeed * resumeFactor
        }
      }

      // Smooth interpolation for rotation
      const ease = isDragging.current ? 0.3 : scrollEase
      const diff = targetRotation.current - currentRotation.current
      currentRotation.current += diff * ease

      // Direct transform update without vibration/tilt or React re-renders
      if (cylinderRef.current) {
        cylinderRef.current.style.transform = `rotateY(${currentRotation.current}deg)`
      }

      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animId)
  }, [autoRotate, autoRotateSpeed, scrollEase])

  // Cylinder 3D radius calculation
  const radius = Math.max(260, (items.length * 125) / Math.PI)

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseEnter={() => { isHovered.current = true }}
      onMouseLeave={() => { isHovered.current = false }}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        cursor: isDraggingState ? 'grabbing' : 'grab',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'pan-y', // allows normal page scrolling vertically on mobile
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: '1300px',
      }}
    >
      {/* 3D Cylindrical Container */}
      <div
        ref={cylinderRef}
        style={{
          width: '220px',
          height: '280px',
          transformStyle: 'preserve-3d',
          position: 'relative',
          willChange: 'transform',
        }}
      >
        {items.map((item, idx) => {
          const angle = (360 / items.length) * idx
          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                top: 0,
                left: 0,
                transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                backfaceVisibility: 'visible',
                transformStyle: 'preserve-3d',
              }}
            >
              <div
                className="glass"
                style={{
                  width: '100%',
                  height: '100%',
                  padding: '20px',
                  borderRadius: `${(borderRadius || 0.05) * 200}px`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                  transform: 'translateZ(0px)',
                  transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.3s, box-shadow 0.3s',
                  color: textColor,
                  cursor: isDraggingState ? 'grabbing' : 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateZ(20px) scale(1.03)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)'
                  e.currentTarget.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(255, 255, 255, 0.06)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateZ(0px) scale(1)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)'
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '19px',
                    background: item.gradient || 'linear-gradient(135deg, #ffffff, #cbd5e1)',
                    color: '#000',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <h4
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    lineHeight: '1.25',
                    fontFamily: font ? font.split(' ').slice(2).join(' ') : 'inherit',
                    color: textColor,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {item.title}
                </h4>
                <p
                  style={{
                    fontSize: '11px',
                    lineHeight: '1.45',
                    color: 'rgba(255, 255, 255, 0.65)',
                    flex: 1,
                    margin: 0,
                  }}
                >
                  {item.desc}
                </p>
                {item.tag && (
                  <span
                    className={`badge ${item.badge || 'badge-purple'}`}
                    style={{ alignSelf: 'flex-start', fontSize: '10px', padding: '2px 8px', borderRadius: '6px' }}
                  >
                    {item.tag}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


