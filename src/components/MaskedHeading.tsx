'use client'

import React from 'react'

interface MaskedHeadingProps {
  text: string
  src?: string
  mediaType?: 'image' | 'video'
  poster?: string
  fillScale?: number
  parallax?: number
  reveal?: 'wipe' | 'fade' | 'none'
  trigger?: 'view' | 'load'
  className?: string
  style?: React.CSSProperties
}

export default function MaskedHeading({
  text,
  src,
  mediaType = 'image',
  poster,
  fillScale = 1,
  className = '',
  style = {},
}: MaskedHeadingProps) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        display: 'inline-block',
        lineHeight: 1,
        ...style,
      }}
    >
      {/* Background media clipped to text */}
      <span
        style={{
          display: 'inline-block',
          fontSize: 'inherit',
          fontWeight: 'inherit',
          letterSpacing: 'inherit',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundImage: src
            ? mediaType === 'image'
              ? `url(${src})`
              : undefined
            : 'linear-gradient(135deg, #EAB308, #96c8ff)',
          backgroundSize: `${100 * fillScale}% ${100 * fillScale}%`,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
        }}
      >
        {mediaType === 'video' && src && (
          <video
            autoPlay
            loop
            muted
            playsInline
            poster={poster}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${fillScale})`,
              opacity: 0,
            }}
          />
        )}
        {text}
      </span>
    </div>
  )
}
