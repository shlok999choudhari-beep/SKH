'use client'

import React from 'react'
import Link from 'next/link'
import styles from './Logo.module.css'

export type LogoVariant = 'default' | 'student' | 'company' | 'institution' | 'gold' | 'white'
export type LogoSize = 'sm' | 'md' | 'lg' | 'xl'

interface LogoProps {
  variant?: LogoVariant
  size?: LogoSize
  withText?: boolean
  withBadge?: boolean
  badgeText?: string
  href?: string
  className?: string
  animated?: boolean
}

export default function Logo({
  variant = 'default',
  size = 'md',
  withText = true,
  withBadge = false,
  badgeText = 'AI',
  href = '/',
  className = '',
  animated = true,
}: LogoProps) {
  // Color themes per variant
  const getGradients = (v: LogoVariant) => {
    switch (v) {
      case 'company':
        return {
          id: 'comp',
          g1: '#10b981',
          g2: '#06b6d4',
          g3: '#34d399',
          glow: 'rgba(16, 185, 129, 0.45)',
          iqClass: styles.iqCompany,
          badgeClass: styles.subBadgeCompany,
        }
      case 'institution':
        return {
          id: 'inst',
          g1: '#a855f7',
          g2: '#ec4899',
          g3: '#c084fc',
          glow: 'rgba(168, 85, 247, 0.45)',
          iqClass: styles.iqInstitution,
          badgeClass: styles.subBadgeInstitution,
        }
      case 'gold':
        return {
          id: 'gold',
          g1: '#f59e0b',
          g2: '#fbbf24',
          g3: '#fde047',
          glow: 'rgba(245, 158, 11, 0.45)',
          iqClass: styles.iqGold,
          badgeClass: styles.subBadgeGold,
        }
      case 'white':
        return {
          id: 'white',
          g1: '#ffffff',
          g2: '#cbd5e1',
          g3: '#94a3b8',
          glow: 'rgba(255, 255, 255, 0.35)',
          iqClass: styles.iqWhite,
          badgeClass: styles.subBadgeDefault,
        }
      case 'student':
      case 'default':
      default:
        return {
          id: 'stud',
          g1: '#6366f1',
          g2: '#8b5cf6',
          g3: '#06b6d4',
          glow: 'rgba(99, 102, 241, 0.45)',
          iqClass: styles.iqStudent,
          badgeClass: styles.subBadgeStudent,
        }
    }
  }

  const grad = getGradients(variant)
  const gid = `piq-grad-${grad.id}-${size}`

  const sizePixelMap = {
    sm: { icon: 28, text: 17, badge: 9 },
    md: { icon: 34, text: 20, badge: 10 },
    lg: { icon: 42, text: 25, badge: 11 },
    xl: { icon: 52, text: 32, badge: 13 },
  }
  const dims = sizePixelMap[size]

  const logoContent = (
    <div
      className={`${styles.logoContainer} ${styles[size]} ${animated ? styles.animated : ''} ${className}`}
      style={{ '--glow-color': grad.glow } as React.CSSProperties}
    >
      {/* ── BESPOKE GEOMETRIC VECTOR EMBLEM ── */}
      <div className={styles.iconWrapper} style={{ width: dims.icon, height: dims.icon }}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={styles.svgIcon}
        >
          <defs>
            {/* Primary Accent Gradient */}
            <linearGradient id={`${gid}-1`} x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={grad.g1} />
              <stop offset="50%" stopColor={grad.g2} />
              <stop offset="100%" stopColor={grad.g3} />
            </linearGradient>

            {/* Facet Light Gradient */}
            <linearGradient id={`${gid}-2`} x1="12" y1="6" x2="36" y2="42" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
            </linearGradient>

            {/* Glow Filter */}
            <filter id={`${gid}-glow`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={grad.glow} floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Background Rounded Shield / Hex Prism */}
          <rect
            x="4"
            y="4"
            width="40"
            height="40"
            rx="12"
            fill="rgba(10, 10, 20, 0.75)"
            stroke={`url(#${gid}-1)`}
            strokeWidth="1.5"
            className={styles.iconFrame}
          />

          {/* Inner Ambient Glow Layer */}
          <rect
            x="5.5"
            y="5.5"
            width="37"
            height="37"
            rx="10.5"
            fill={`url(#${gid}-2)`}
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="1"
          />

          {/* Upward Growth Surge / Trajectory Path (Stylized 'P' & Ascending Vector) */}
          <path
            d="M15 34V14C15 14 19 13 23.5 13C28 13 31.5 15.5 31.5 19.5C31.5 23.5 28 26 23.5 26H15"
            stroke={`url(#${gid}-1)`}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${gid}-glow)`}
            className={styles.pathP}
          />

          {/* Upward Precision Arrow / Career Breakthrough Vector */}
          <path
            d="M23 34L33 24M33 24H25.5M33 24V31.5"
            stroke={grad.g3}
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={styles.pathArrow}
          />

          {/* Intelligence Core Spark (Neural AI Point) */}
          <circle cx="23.5" cy="19.5" r="2.25" fill="#ffffff" className={styles.sparkleDot} />
          <circle cx="33" cy="24" r="1.5" fill={grad.g3} />
        </svg>
      </div>

      {/* ── TYPOGRAPHY WORDMARK ── */}
      {withText && (
        <div className={styles.wordmark}>
          <span className={styles.placeText} style={{ fontSize: `${dims.text}px` }}>
            Place
          </span>
          <span
            className={`${styles.iqText} ${grad.iqClass}`}
            style={{ fontSize: `${dims.text}px` }}
          >
            IQ
          </span>

          {withBadge && (
            <span
              className={`${styles.subBadge} ${grad.badgeClass}`}
              style={{ fontSize: `${dims.badge}px` }}
            >
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className={styles.logoLink} aria-label="PlaceIQ Home">
        {logoContent}
      </Link>
    )
  }

  return logoContent
}
