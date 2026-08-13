'use client'

import React, { useRef, useState, useEffect } from 'react'

export interface CircularGalleryItem {
  icon?: string
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
  scrollEase = 0.05,
  autoRotate = true,
  autoRotateSpeed = 0.35,
  fontUrl,
  font,
}: CircularGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [rotation, setRotation] = useState(0)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const currentRotation = useRef(0)
  const targetRotation = useRef(0)

  // Load custom font if fontUrl is provided
  useEffect(() => {
    if (fontUrl) {
      const link = document.createElement('link')
      link.href = fontUrl
      link.rel = 'stylesheet'
      document.head.appendChild(link)
      return () => {
        document.head.removeChild(link)
      }
    }
  }, [fontUrl])

  // Drag handles
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true
    startX.current = e.clientX
    containerRef.current?.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return
    const deltaX = e.clientX - startX.current
    startX.current = e.clientX
    // Adjust sensitivity based on bend factor
    targetRotation.current += deltaX * (0.18 / Math.max(0.1, bend))
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false
    containerRef.current?.releasePointerCapture(e.pointerId)
  }

  // Animation Loop for automated continuous circulation and smooth easing
  useEffect(() => {
    let animId: number
    const tick = () => {
      if (autoRotate && !isDragging.current) {
        targetRotation.current -= autoRotateSpeed
      }
      const diff = targetRotation.current - currentRotation.current
      currentRotation.current += diff * scrollEase
      setRotation(currentRotation.current)
      animId = requestAnimationFrame(tick)
    }
    animId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animId)
  }, [scrollEase, autoRotate, autoRotateSpeed])

  const radius = Math.max(200, (items.length * 115) / Math.PI)

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        cursor: isDragging.current ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: '1000px',
      }}
    >
      {/* 3D Cylindrical Container */}
      <div
        style={{
          width: '210px',
          height: '270px',
          transformStyle: 'preserve-3d',
          transform: `rotateY(${rotation}deg)`,
          position: 'relative',
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
                  padding: '18px',
                  borderRadius: `${(borderRadius || 0.05) * 200}px`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                  transform: 'translateZ(0px)',
                  transition: 'transform 0.3s, border-color 0.3s',
                  color: textColor,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateZ(20px) scale(1.03)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateZ(0px) scale(1)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    background: item.gradient || 'linear-gradient(135deg, #ffffff, #cbd5e1)',
                    color: '#000',
                  }}
                >
                  {item.icon}
                </div>
                <h4
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    fontFamily: font ? font.split(' ').slice(2).join(' ') : 'inherit',
                    color: textColor,
                  }}
                >
                  {item.title}
                </h4>
                <p
                  style={{
                    fontSize: '11px',
                    lineHeight: '1.4',
                    color: 'var(--text-secondary)',
                    flex: 1,
                  }}
                >
                  {item.desc}
                </p>
                {item.tag && (
                  <span
                    className={`badge ${item.badge || 'badge-purple'}`}
                    style={{ alignSelf: 'flex-start', fontSize: '10px', padding: '2px 8px' }}
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
