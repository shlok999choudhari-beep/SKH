'use client'
import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from '@/components/Logo'
import NotificationBell from '@/components/NotificationBell'
import SecurityActivityModal from '@/components/SecurityActivityModal'
import styles from './sidebar.module.css'
import { useTheme } from '@/contexts/ThemeContext'
import { logout } from '@/app/actions/logout'
import {
  LayoutDashboard,
  FolderLock,
  Share2,
  Presentation,
  BriefcaseBusiness,
  GraduationCap,
  ChartNoAxesCombined,
  BookOpen,
  TrendingUp,
  Users,
  Compass,
  ChevronDown,
  Sun,
  Moon,
  LogOut,
  User,
  ShieldCheck,
  Settings,
  LucideIcon
} from 'lucide-react'

type NavItem = {
  href: string
  icon: LucideIcon
  label: string
  desc?: string
  badge?: string
}

type NavCategory = {
  id: string
  title: string
  icon: LucideIcon
  items: NavItem[]
}

const CATEGORIES: NavCategory[] = [
  {
    id: 'lms',
    title: 'Learning Hub',
    icon: BookOpen,
    items: [
      { href: '/institution/lms', icon: BookOpen, label: 'LMS Overview', desc: 'Institutional Curriculum Hub' },
      { href: '/institution/lms/analytics', icon: TrendingUp, label: 'LMS Analytics', badge: 'NEW', desc: 'KPIs, Drop-offs & Intelligence' },
      { href: '/institution/lms/courses', icon: Compass, label: 'All Courses', desc: 'Course Management & Review' },
      { href: '/institution/trainers', icon: Presentation, label: 'Trainers & Faculty', desc: 'Trainer Profiles & Metrics' },
      { href: '/institution/lms/students', icon: Users, label: 'Enrolled Students', desc: 'Learner Cohorts & Tracking' },
    ]
  },
  {
    id: 'placements',
    title: 'Placements & Drives',
    icon: GraduationCap,
    items: [
      { href: '/institution/placements', icon: GraduationCap, label: 'Placement Drives', desc: 'Drive Schedules & Offers' },
      { href: '/institution/internships', icon: BriefcaseBusiness, label: 'Partner Internships', desc: 'Opportunities & Applications' },
      { href: '/institution/certifications', icon: ChartNoAxesCombined, label: 'Certifications', desc: 'Issued Verified Credentials' },
    ]
  },
  {
    id: 'campus',
    title: 'Campus & Vault',
    icon: FolderLock,
    items: [
      { href: '/institution/documents', icon: FolderLock, label: 'Student Documents', desc: 'Document Vault & Verifications' },
      { href: '/institution/resources', icon: Share2, label: 'Campus Resources', desc: 'Labs, Halls & Venue Bookings' },
    ]
  }
]

export default function InstitutionSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [logoDropdownOpen, setLogoDropdownOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [showSecurityModal, setShowSecurityModal] = useState(false)
  const [userData, setUserData] = useState<any>({ name: 'Institution Admin' })
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const logoMenuRef = useRef<HTMLDivElement>(null)
  const userDropdownRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveCategory(null)
      }
      if (logoMenuRef.current && !logoMenuRef.current.contains(e.target as Node)) {
        setLogoDropdownOpen(false)
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  // Close mobile menu and dropdowns on route change
  useEffect(() => {
    setMobileOpen(false)
    setActiveCategory(null)
    setLogoDropdownOpen(false)
    setDropdownOpen(false)
  }, [pathname])

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'IN'
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <>
      <header className={`${styles.sidebar} ${styles.sidebarInstitution}`} suppressHydrationWarning>

        {/* Left Logo with Quick Dropdown */}
        <div className={styles.sidebarTop} ref={logoMenuRef}>
          <button
            type="button"
            className={styles.logoBtnWrapper}
            onClick={() => setLogoDropdownOpen(!logoDropdownOpen)}
            title="PlaceIQ Account & Security Menu"
            aria-expanded={logoDropdownOpen}
          >
            <Logo variant="institution" size="md" href={undefined} />
            <ChevronDown
              size={14}
              strokeWidth={2}
              className={styles.logoChevron}
              style={{
                transform: logoDropdownOpen ? 'rotate(180deg)' : 'rotate(0)'
              }}
            />
          </button>

          {logoDropdownOpen && (
            <div className={styles.logoDropdown}>
              <Link
                href="/institution/dashboard"
                className={styles.dropdownItem}
                onClick={() => setLogoDropdownOpen(false)}
              >
                <User size={15} strokeWidth={2} />
                <span>Account</span>
              </Link>
              <button
                type="button"
                className={styles.dropdownItem}
                onClick={() => {
                  setLogoDropdownOpen(false)
                  setShowSecurityModal(true)
                }}
              >
                <ShieldCheck size={15} strokeWidth={2} color="#10b981" />
                <span>Security Activity 🔐</span>
              </button>
              <Link
                href="/institution/dashboard"
                className={styles.dropdownItem}
                onClick={() => setLogoDropdownOpen(false)}
              >
                <Settings size={15} strokeWidth={2} />
                <span>Settings</span>
              </Link>
              <div className={styles.dropdownDivider} />
              <button
                type="button"
                onClick={handleLogout}
                className={styles.dropdownItem}
                style={{ color: '#f87171' }}
              >
                <LogOut size={15} strokeWidth={2} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Backdrop */}
        {mobileOpen && (
          <div className={styles.mobileBackdrop} onClick={() => setMobileOpen(false)} />
        )}

        {/* Center Nav with Categorized Mega Dropdowns */}
        <nav className={`${styles.nav} ${mobileOpen ? styles.mobileOpenNav : ''}`} ref={navRef} suppressHydrationWarning>
          {/* Direct Dashboard Link */}
          <Link
            href="/institution/dashboard"
            className={`${styles.categoryBtn} ${pathname === '/institution/dashboard' ? styles.activeInstitution : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <span className={styles.navIcon}>
              <LayoutDashboard size={15} strokeWidth={2} />
            </span>
            <span className={styles.navLabel}>Dashboard</span>
          </Link>

          {/* Categorized Dropdowns */}
          {CATEGORIES.map(cat => {
            const CatIcon = cat.icon
            const isOpen = activeCategory === cat.id
            const hasActiveItem = cat.items.some(i => pathname === i.href || pathname.startsWith(i.href + '/'))

            return (
              <div key={cat.id} className={styles.categoryGroup} suppressHydrationWarning>
                <button
                  type="button"
                  suppressHydrationWarning
                  className={`${styles.categoryBtn} ${hasActiveItem || isOpen ? styles.activeInstitution : ''}`}
                  onClick={() => setActiveCategory(isOpen ? null : cat.id)}
                >
                  <span className={styles.navIcon}>
                    <CatIcon size={15} strokeWidth={2} />
                  </span>
                  <span className={styles.navLabel}>{cat.title}</span>
                  <ChevronDown
                    size={13}
                    strokeWidth={2}
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform 0.2s ease',
                      opacity: 0.8
                    }}
                  />
                </button>

                {isOpen && (
                  <div className={`${styles.megaDropdown} ${styles.megaDropdownInstitution}`}>
                    <div className={styles.megaHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{cat.title}</span>
                    </div>
                    <div className={styles.megaGrid}>
                      {cat.items.map(item => {
                        const ItemIcon = item.icon
                        const isItemActive = pathname === item.href || pathname.startsWith(item.href + '/')
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.megaItem} ${isItemActive ? styles.megaItemActive : ''}`}
                            onClick={() => {
                              setActiveCategory(null)
                              setMobileOpen(false)
                            }}
                          >
                            <div className={styles.megaIconWrap}>
                              <ItemIcon size={16} strokeWidth={2} />
                            </div>
                            <div className={styles.megaText}>
                              <div className={styles.megaLabelRow}>
                                <span className={styles.megaLabel}>{item.label}</span>
                                {item.badge && (
                                  <span className={styles.megaBadge} style={{ background: 'rgba(168, 85, 247, 0.25)', color: '#c084fc' }}>
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              {item.desc && <span className={styles.megaDesc}>{item.desc}</span>}
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Right User & Controls */}
        <div className={`${styles.userTag} ${styles.userTagInstitution}`} ref={userDropdownRef} suppressHydrationWarning>
          <NotificationBell role="institution" />
          {userData && (
            <button
              type="button"
              suppressHydrationWarning
              className={styles.userPillBtn}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              title="Open Institution Menu"
              aria-expanded={dropdownOpen}
            >
              <div className={styles.avatarWrapper}>
                <div className={`${styles.userAvatar} ${styles.userAvatarInstitution}`}>{getInitials(userData.name)}</div>
                <span className={styles.onlineDot} />
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{userData.name}</span>
                <span className={styles.userRoleBadge} style={{ color: '#c084fc' }}>Admin</span>
              </div>
              <ChevronDown
                size={13}
                strokeWidth={2.2}
                className={styles.userChevron}
                style={{
                  transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)'
                }}
              />
            </button>
          )}

          <button type="button" suppressHydrationWarning className={styles.hamburger} onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            <span /><span /><span />
          </button>


          {dropdownOpen && (
            <div className={styles.userDropdown} suppressHydrationWarning>
              <Link
                href="/institution/dashboard"
                className={styles.dropdownItem}
                onClick={() => setDropdownOpen(false)}
              >
                <User size={16} strokeWidth={2} />
                <span>Admin Account</span>
              </Link>
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => {
                  setDropdownOpen(false)
                  setShowSecurityModal(true)
                }}
                className={styles.dropdownItem}
              >
                <ShieldCheck size={16} strokeWidth={2} color="#10b981" />
                <span>Security Activity 🔐</span>
              </button>
              <button type="button" suppressHydrationWarning onClick={toggleTheme} className={styles.dropdownItem}>
                {theme === 'dark' ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              <div className={styles.dropdownDivider} />
              <button
                type="button"
                suppressHydrationWarning
                onClick={handleLogout}
                className={styles.dropdownItem}
                style={{ color: '#f87171' }}
              >
                <LogOut size={16} strokeWidth={2} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Security & Account Activity Responsive Modal */}
      <SecurityActivityModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
      />
    </>
  )
}

