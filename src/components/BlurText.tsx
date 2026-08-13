'use client'

import React, { useEffect, useRef, useState } from 'react'

export interface BlurTextProps {
  text: string
  delay?: number
  animateBy?: 'words' | 'letters'
  direction?: 'top' | 'bottom'
  gradientText?: string
  onAnimationComplete?: () => void
  className?: string
  style?: React.CSSProperties
}

export default function BlurText({
  text,
  delay = 150,
  animateBy = 'words',
  direction = 'top',
  gradientText,
  onAnimationComplete,
  className = '',
  style = {},
}: BlurTextProps) {
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (ref.current) observer.unobserve(ref.current)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  const elements = animateBy === 'words' ? text.split(' ') : text.split('')

  useEffect(() => {
    if (inView && onAnimationComplete) {
      const totalTime = elements.length * delay + 500
      const timer = setTimeout(() => {
        onAnimationComplete()
      }, totalTime)
      return () => clearTimeout(timer)
    }
  }, [inView, elements.length, delay, onAnimationComplete])

  const initialY = direction === 'top' ? '-18px' : '18px'

  const gradientStyles: React.CSSProperties = gradientText
    ? {
        backgroundImage: gradientText,
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }
    : {}

  return (
    <span ref={ref} className={className} style={{ display: 'inline-block', ...style }}>
      {elements.map((el, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            filter: inView ? 'blur(0px)' : 'blur(12px)',
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0px)' : `translateY(${initialY})`,
            transition: `all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${i * delay}ms`,
            marginRight: animateBy === 'words' && i < elements.length - 1 ? '0.35em' : '0em',
            willChange: 'filter, opacity, transform',
            ...gradientStyles,
          }}
        >
          {el === ' ' ? '\u00A0' : el}
        </span>
      ))}
    </span>
  )
}
