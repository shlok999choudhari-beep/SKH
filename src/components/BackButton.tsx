'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import styles from './BackButton.module.css'

interface BackButtonProps {
  fallbackHref?: string
  label?: string
  showLabel?: boolean
  variant?: 'default' | 'compact' | 'pill'
  className?: string
  style?: React.CSSProperties
  title?: string
}

export default function BackButton({
  fallbackHref = '/student/dashboard',
  label = 'Back',
  showLabel = true,
  variant = 'default',
  className = '',
  style,
  title = 'Go back'
}: BackButtonProps) {
  const router = useRouter()

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault()
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackHref)
    }
  }

  const variantClass = variant === 'compact' ? styles.compact : variant === 'pill' ? styles.pill : ''

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`${styles.backBtn} ${variantClass} ${className}`}
      style={style}
      title={title}
      aria-label={label || 'Go back'}
    >
      <ArrowLeft size={16} strokeWidth={2.2} className={styles.icon} />
      {showLabel && <span>{label}</span>}
    </button>
  )
}
