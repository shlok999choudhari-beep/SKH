'use client'

import React, { useEffect, useRef } from 'react'

export interface AntigravityProps {
  count?: number
  magnetRadius?: number
  ringRadius?: number
  waveSpeed?: number
  waveAmplitude?: number
  particleSize?: number
  lerpSpeed?: number
  color?: string
  autoAnimate?: boolean
  particleVariance?: number
  className?: string
  style?: React.CSSProperties
}

export default function Antigravity({
  count = 300,
  magnetRadius = 6,
  ringRadius = 7,
  waveSpeed = 0.4,
  waveAmplitude = 1,
  particleSize = 1.5,
  lerpSpeed = 0.05,
  color = '#FF9FFC',
  autoAnimate = true,
  particleVariance = 1,
  className = '',
  style = {},
}: AntigravityProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth)
    let height = (canvas.height = canvas.parentElement?.clientHeight || 400)

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return
      width = canvas.width = canvas.parentElement.clientWidth || window.innerWidth
      height = canvas.height = canvas.parentElement.clientHeight || 400
    }
    window.addEventListener('resize', handleResize)

    const mouse = { x: -1000, y: -1000, active: false }
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
      mouse.active = true
    }
    const handleMouseLeave = () => {
      mouse.active = false
    }

    const parent = canvas.parentElement
    if (parent) {
      parent.addEventListener('mousemove', handleMouseMove)
      parent.addEventListener('mouseleave', handleMouseLeave)
    }

    interface Particle {
      x: number
      y: number
      baseX: number
      baseY: number
      vx: number
      vy: number
      size: number
      angle: number
      speed: number
      amplitude: number
      phase: number
      color: string
    }

    const particles: Particle[] = []

    for (let i = 0; i < count; i++) {
      const x = Math.random() * width
      const y = Math.random() * height
      particles.push({
        x,
        y,
        baseX: x,
        baseY: y,
        vx: 0,
        vy: 0,
        size: particleSize * (0.6 + Math.random() * 0.8 * particleVariance),
        angle: Math.random() * Math.PI * 2,
        speed: (0.2 + Math.random() * 0.5) * waveSpeed,
        amplitude: (10 + Math.random() * 30) * waveAmplitude,
        phase: Math.random() * Math.PI * 2,
        color,
      })
    }

    let time = 0

    const render = () => {
      ctx.clearRect(0, 0, width, height)
      time += 0.016 * waveSpeed

      const effectiveMagnetRadius = magnetRadius * 15
      const effectiveRingRadius = ringRadius * 10

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        if (autoAnimate) {
          p.angle += p.speed * 0.05
          const waveX = Math.sin(time + p.phase) * p.amplitude
          const waveY = Math.cos(time * 0.8 + p.phase) * (p.amplitude * 0.7)
          p.baseX += Math.sin(p.angle) * 0.3
          p.baseY += Math.cos(p.angle) * 0.3

          if (p.baseX < -50) p.baseX = width + 50
          if (p.baseX > width + 50) p.baseX = -50
          if (p.baseY < -50) p.baseY = height + 50
          if (p.baseY > height + 50) p.baseY = -50

          p.x += (p.baseX + waveX - p.x) * lerpSpeed
          p.y += (p.baseY + waveY - p.y) * lerpSpeed
        }

        if (mouse.active) {
          const dx = mouse.x - p.x
          const dy = mouse.y - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < effectiveMagnetRadius) {
            const force = (1 - dist / effectiveMagnetRadius) * 4
            const angle = Math.atan2(dy, dx)
            const targetDist = effectiveRingRadius
            const diff = dist - targetDist
            p.vx += Math.cos(angle) * diff * 0.05 * force
            p.vy += Math.sin(angle) * diff * 0.05 * force
          }
        }

        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.92
        p.vy *= 0.92

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = 0.65
        ctx.shadowColor = p.color
        ctx.shadowBlur = 6
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.globalAlpha = 1.0
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      if (parent) {
        parent.removeEventListener('mousemove', handleMouseMove)
        parent.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, [count, magnetRadius, ringRadius, waveSpeed, waveAmplitude, particleSize, lerpSpeed, color, autoAnimate, particleVariance])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 0,
        ...style,
      }}
    />
  )
}
