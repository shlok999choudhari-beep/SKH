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
  BookOpen,
  PlusCircle,
  FolderKanban,
  Users,
  FileCheck,
  HelpCircle,
  Megaphone,
  MessageSquare,
  Award,
  Sparkles,
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

const TRAINER_CATEGORIES: NavCategory[] = [
  {
    id: 'courses',
    title: 'Courses',
    icon: BookOpen,
    items: [
      { href: '/trainer/courses', icon: BookOpen, label: 'My Courses', desc: 'Manage curriculum & lessons' },
      { href: '/trainer/courses/create', icon: PlusCircle, label: 'Create Course', desc: 'Build new course modules' },
    ]
  },
  {
    id: 'assessments',
    title: 'Assessments',
    icon: FileCheck,
    items: [
      { href: '/trainer/assignments', icon: FileCheck, label: 'Assignments', desc: 'Grade student submissions' },
      { href: '/trainer/quizzes', icon: HelpCircle, label: 'Quizzes & Tests', desc: 'Assessment diagnostics' },
      { href: '/trainer/certificates', icon: Award, label: 'Certificates', desc: 'Course completions & badges' },
    ]
  },
  {
    id: 'community',
    title: 'Community',
    icon: Users,
    items: [
      { href: '/trainer/students', icon: Users, label: 'Students', desc: 'Learner roster & skill verification' },
      { href: '/trainer/announcements', icon: Megaphone, label: 'Announcements', desc: 'Broadcast updates & alerts' },
      { href: '/trainer/discussions', icon: MessageSquare, label: 'Discussions', desc: 'Q&A community & replies' },
    ]
  }
]

export default function TrainerSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [logoDropdownOpen, setLogoDropdownOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [showSecurityModal, setShowSecurityModal] = useState(false)
  const [userData, setUserData] = useState<{ name: string; email: string } | null>({
    name: 'Trainer Faculty',
    email: 'trainer@placeiq.internal'
  })
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const logoMenuRef = useRef<HTMLDivElement>(null)
  const userDropdownRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    setMobileOpen(false)
    setActiveCategory(null)
    setLogoDropdownOpen(false)
    setDropdownOpen(false)
  }, [pathname])

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'TR'
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <>
      <header className={`${styles.sidebar} ${styles.sidebarInstitution}`} suppressHydrationWarning>
        {/* Left Logo */}
        <div className={styles.sidebarTop} ref={logoMenuRef}>
          <button
            type="button"
            className={styles.logoBtnWrapper}
            onClick={() => setLogoDropdownOpen(!logoDropdownOpen)}
            title="PlaceIQ Trainer Account Menu"
            aria-expanded={logoDropdownOpen}
          >
            <Logo variant="student" size="md" href={undefined} />
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
                href="/trainer/dashboard"
                className={styles.dropdownItem}
                onClick={() => setLogoDropdownOpen(false)}
              >
                <User size={15} strokeWidth={2} />
                <span>Trainer Profile</span>
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

        {/* Center Nav: Exactly 5 Top-Level Options */}
        <nav className={`${styles.nav} ${mobileOpen ? styles.mobileOpenNav : ''}`} ref={navRef} suppressHydrationWarning>
          {/* Option 1: Dashboard */}
          <Link
            href="/trainer/dashboard"
            className={`${styles.categoryBtn} ${pathname === '/trainer/dashboard' ? styles.activeInstitution : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <span className={styles.navIcon}>
              <LayoutDashboard size={15} strokeWidth={2} />
            </span>
            <span className={styles.navLabel}>Dashboard</span>
          </Link>

          {/* Options 2, 3, 4: Dropdown Folders/Tabs (Courses, Assessments, Community) */}
          {TRAINER_CATEGORIES.map(cat => {
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

          {/* Option 5: AI Tools */}
          <Link
            href="/trainer/ai-tools"
            className={`${styles.categoryBtn} ${pathname === '/trainer/ai-tools' ? styles.activeInstitution : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <span className={styles.navIcon}>
              <Sparkles size={15} strokeWidth={2} color="#c084fc" />
            </span>
            <span className={styles.navLabel}>AI Tools</span>
            <span className={styles.megaBadge} style={{ background: 'rgba(168, 85, 247, 0.25)', color: '#c084fc', fontSize: '8.5px', padding: '1px 5px', marginLeft: '2px' }}>
              AI
            </span>
          </Link>
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
              title="Open Trainer Menu"
              aria-expanded={dropdownOpen}
            >
              <div className={styles.avatarWrapper}>
                <div className={`${styles.userAvatar} ${styles.userAvatarInstitution}`}>{getInitials(userData.name)}</div>
                <span className={styles.onlineDot} />
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{userData.name}</span>
                <span className={styles.userRoleBadge} style={{ color: '#a855f7' }}>Trainer</span>
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

          <button
            type="button"
            suppressHydrationWarning
            className={styles.hamburger}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>

          {dropdownOpen && (
            <div className={styles.userDropdown} suppressHydrationWarning>
              <Link
                href="/trainer/dashboard"
                className={styles.dropdownItem}
                onClick={() => setDropdownOpen(false)}
              >
                <User size={16} strokeWidth={2} />
                <span>Trainer Dashboard</span>
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

      <SecurityActivityModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
      />
    </>
  )
}
