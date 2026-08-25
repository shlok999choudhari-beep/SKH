'use client'

import React, { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { gsap } from 'gsap'
import './PillNav.css'

export type PillNavItem = {
  label: string
  href: string
  ariaLabel?: string
}

export interface PillNavProps {
  logo?: ReactNode | string
  logoAlt?: string
  items: PillNavItem[]
  activeHref?: string
  className?: string
  ease?: string
  baseColor?: string
  pillColor?: string
  hoveredPillTextColor?: string
  pillTextColor?: string
  rightAction?: ReactNode
  onMobileMenuClick?: () => void
  initialLoadAnimation?: boolean
}

export const PillNav: React.FC<PillNavProps> = ({
  logo,
  logoAlt = 'PlaceIQ Logo',
  items,
  activeHref,
  className = '',
  ease = 'power3.out',
  baseColor = '#060010',
  pillColor = 'rgba(255, 255, 255, 0.04)',
  hoveredPillTextColor = '#ffffff',
  pillTextColor = '#94a3b8',
  rightAction,
  onMobileMenuClick,
  initialLoadAnimation = true
}) => {
  const pathname = usePathname()
  const currentActiveHref = activeHref !== undefined ? activeHref : pathname

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const circleRefs = useRef<Array<HTMLSpanElement | null>>([])
  const tlRefs = useRef<Array<gsap.core.Timeline | null>>([])
  const activeTweenRefs = useRef<Array<gsap.core.Tween | null>>([])
  const hamburgerRef = useRef<HTMLButtonElement | null>(null)
  const mobileMenuRef = useRef<HTMLDivElement | null>(null)
  const navItemsRef = useRef<HTMLDivElement | null>(null)
  const logoRef = useRef<HTMLAnchorElement | HTMLElement | null>(null)

  useEffect(() => {
    const layout = () => {
      circleRefs.current.forEach((circle, index) => {
        if (!circle?.parentElement) return

        const pill = circle.parentElement as HTMLElement
        const rect = pill.getBoundingClientRect()
        const { width: w, height: h } = rect
        if (w === 0 || h === 0) return

        const R = ((w * w) / 4 + h * h) / (2 * h)
        const D = Math.ceil(2 * R) + 2
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1
        const originY = D - delta

        circle.style.width = `${D}px`
        circle.style.height = `${D}px`
        circle.style.bottom = `-${delta}px`

        gsap.set(circle, {
          xPercent: -50,
          scale: 0,
          transformOrigin: `50% ${originY}px`
        })

        const label = pill.querySelector<HTMLElement>('.pill-label')
        const white = pill.querySelector<HTMLElement>('.pill-label-hover')

        if (label) gsap.set(label, { y: 0 })
        if (white) gsap.set(white, { y: h + 12, opacity: 0 })

        tlRefs.current[index]?.kill()
        const tl = gsap.timeline({ paused: true })

        tl.to(circle, { scale: 1.2, xPercent: -50, duration: 0.4, ease, overwrite: 'auto' }, 0)

        if (label) {
          tl.to(label, { y: -(h + 6), duration: 0.35, ease, overwrite: 'auto' }, 0)
        }

        if (white) {
          gsap.set(white, { y: Math.ceil(h + 20), opacity: 0 })
          tl.to(white, { y: 0, opacity: 1, duration: 0.35, ease, overwrite: 'auto' }, 0)
        }

        tlRefs.current[index] = tl
      })
    }

    layout()

    const onResize = () => layout()
    window.addEventListener('resize', onResize)

    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(layout).catch(() => {})
    }

    const menu = mobileMenuRef.current
    if (menu) {
      gsap.set(menu, { visibility: 'hidden', opacity: 0, scaleY: 1 })
    }

    if (initialLoadAnimation) {
      const logoEl = logoRef.current
      const navItems = navItemsRef.current

      if (logoEl) {
        gsap.fromTo(logoEl, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.5, ease })
      }

      if (navItems) {
        gsap.fromTo(navItems, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.5, ease })
      }
    }

    return () => {
      window.removeEventListener('resize', onResize)
      tlRefs.current.forEach(tl => tl?.kill())
      activeTweenRefs.current.forEach(tw => tw?.kill())
    }
  }, [items, ease, initialLoadAnimation])

  const handleEnter = (i: number) => {
    const tl = tlRefs.current[i]
    if (!tl) return
    activeTweenRefs.current[i]?.kill()
    activeTweenRefs.current[i] = tl.tweenTo(tl.duration(), {
      duration: 0.28,
      ease,
      overwrite: 'auto'
    })
  }

  const handleLeave = (i: number) => {
    const tl = tlRefs.current[i]
    if (!tl) return
    activeTweenRefs.current[i]?.kill()
    activeTweenRefs.current[i] = tl.tweenTo(0, {
      duration: 0.22,
      ease,
      overwrite: 'auto'
    })
  }

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen
    setIsMobileMenuOpen(newState)

    const hamburger = hamburgerRef.current
    const menu = mobileMenuRef.current

    if (hamburger) {
      const lines = hamburger.querySelectorAll('.hamburger-line')
      if (newState) {
        gsap.to(lines[0], { rotation: 45, y: 3.5, duration: 0.25, ease })
        gsap.to(lines[1], { rotation: -45, y: -3.5, duration: 0.25, ease })
      } else {
        gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.25, ease })
        gsap.to(lines[1], { rotation: 0, y: 0, duration: 0.25, ease })
      }
    }

    if (menu) {
      if (newState) {
        gsap.set(menu, { visibility: 'visible' })
        gsap.fromTo(
          menu,
          { opacity: 0, y: -8 },
          {
            opacity: 1,
            y: 0,
            duration: 0.25,
            ease,
            transformOrigin: 'top center'
          }
        )
      } else {
        gsap.to(menu, {
          opacity: 0,
          y: -8,
          duration: 0.2,
          ease,
          onComplete: () => {
            gsap.set(menu, { visibility: 'hidden' })
          }
        })
      }
    }

    onMobileMenuClick?.()
  }

  const isHashOrExternal = (href: string) =>
    href.startsWith('#') ||
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:')

  const cssVars = {
    '--base': baseColor,
    '--pill-bg': pillColor,
    '--hover-text': hoveredPillTextColor,
    '--pill-text': pillTextColor
  } as CSSProperties

  return (
    <header className="pill-nav-container">
      <nav className={`pill-nav ${className}`} aria-label="Primary" style={cssVars}>
        <div className="pill-nav-left">
          {logo && (
            <div
              ref={el => {
                logoRef.current = el
              }}
              className="pill-logo"
            >
              {typeof logo === 'string' ? (
                <Link href="/" aria-label="PlaceIQ Home">
                  <img src={logo} alt={logoAlt} style={{ height: '32px', width: 'auto', display: 'block' }} />
                </Link>
              ) : (
                logo
              )}
            </div>
          )}
        </div>

        <div className="pill-nav-items desktop-only" ref={navItemsRef}>
          <ul className="pill-list" role="menubar">
            {items.map((item, i) => {
              const isActive = currentActiveHref === item.href
              const isHash = isHashOrExternal(item.href)

              return (
                <li key={item.href} role="none">
                  {isHash ? (
                    <a
                      role="menuitem"
                      href={item.href}
                      className={`pill${isActive ? ' is-active' : ''}`}
                      aria-label={item.ariaLabel || item.label}
                      onMouseEnter={() => handleEnter(i)}
                      onMouseLeave={() => handleLeave(i)}
                    >
                      <span
                        className="hover-circle"
                        aria-hidden="true"
                        ref={el => {
                          circleRefs.current[i] = el
                        }}
                      />
                      <span className="label-stack">
                        <span className="pill-label">{item.label}</span>
                        <span className="pill-label-hover" aria-hidden="true">
                          {item.label}
                        </span>
                      </span>
                    </a>
                  ) : (
                    <Link
                      role="menuitem"
                      href={item.href}
                      className={`pill${isActive ? ' is-active' : ''}`}
                      aria-label={item.ariaLabel || item.label}
                      onMouseEnter={() => handleEnter(i)}
                      onMouseLeave={() => handleLeave(i)}
                    >
                      <span
                        className="hover-circle"
                        aria-hidden="true"
                        ref={el => {
                          circleRefs.current[i] = el
                        }}
                      />
                      <span className="label-stack">
                        <span className="pill-label">{item.label}</span>
                        <span className="pill-label-hover" aria-hidden="true">
                          {item.label}
                        </span>
                      </span>
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        </div>

        <div className="pill-nav-right">
          {rightAction && <div className="desktop-only">{rightAction}</div>}

          <button
            className="mobile-menu-button mobile-only"
            onClick={toggleMobileMenu}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
            ref={hamburgerRef}
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
        </div>
      </nav>

      <div className="mobile-menu-popover mobile-only" ref={mobileMenuRef} style={cssVars}>
        <ul className="mobile-menu-list">
          {items.map(item => {
            const isActive = currentActiveHref === item.href
            const isHash = isHashOrExternal(item.href)

            return (
              <li key={item.href}>
                {isHash ? (
                  <a
                    href={item.href}
                    className={`mobile-menu-link${isActive ? ' is-active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span>{item.label}</span>
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    className={`mobile-menu-link${isActive ? ' is-active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span>{item.label}</span>
                  </Link>
                )}
              </li>
            )
          })}
        </ul>

        {rightAction && (
          <div className="mobile-menu-actions" onClick={() => setIsMobileMenuOpen(false)}>
            {rightAction}
          </div>
        )}
      </div>
    </header>
  )
}

export default PillNav
