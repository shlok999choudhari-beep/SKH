'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from '@/components/Logo'
import NotificationBell from '@/components/NotificationBell'
import styles from './sidebar.module.css'
import { useTheme } from '@/contexts/ThemeContext'
import { logout } from '@/app/actions/logout'

type NavItem = {
  href: string;
  icon: string;
  label: string;
  badge?: string;
  desc?: string;
}

type NavCategory = {
  id: string;
  title: string;
  icon: string;
  items: NavItem[];
}

const CATEGORIES: NavCategory[] = [
  {
    id: 'ai-tools',
    title: 'AI & Practice Tools',
    icon: '⚡',
    items: [
      { href: '/student/resume', icon: '📄', label: 'Resume Builder', badge: 'AI', desc: 'ATS Optimization' },
      { href: '/student/mock-interview', icon: '🎙️', label: 'Mock Interview', badge: 'Vapi', desc: 'Voice AI Practice' },
      { href: '/student/coding-judge', icon: '💻', label: 'Coding Judge', desc: 'LeetCode Style' },
      { href: '/student/roadmap', icon: '🗺️', label: 'Learning Roadmap', desc: 'AI Career Path' },
      { href: '/student/skill-gap', icon: '📊', label: 'Skill Gap Analysis', desc: 'Role Alignment' },
      { href: '/student/skills', icon: '⚡', label: 'Skill Insights', desc: 'Radar Analytics' },
      { href: '/student/behavioral-analysis', icon: '🧠', label: 'Behavioral Analysis', desc: 'Tone & Soft Skills' },
      { href: '/student/mentor', icon: '💬', label: 'AI Mentor', desc: '24/7 Chat Guidance' },
      { href: '/student/dream-mode', icon: '✨', label: 'Dream Mode', badge: 'HOT', desc: 'Company Targeting' },
    ]
  },
  {
    id: 'career',
    title: 'Jobs & Placement',
    icon: '💼',
    items: [
      { href: '/student/jobs', icon: '💼', label: 'Job Openings', desc: 'Live Listings' },
      { href: '/student/internships', icon: '🎯', label: 'Internships', desc: 'Paid Roles' },
      { href: '/student/placements', icon: '🎓', label: 'Placements', desc: 'On-Campus Drives' },
      { href: '/student/companies', icon: '🏢', label: 'Top Companies', desc: 'Hiring Insights' },
      { href: '/student/profile', icon: '👤', label: 'My Profile', desc: 'Skills & Achievements' },
    ]
  },
  {
    id: 'campus',
    title: 'Campus & Resources',
    icon: '🏛️',
    items: [
      { href: '/student/trainers', icon: '👨‍🏫', label: 'Industry Trainers', desc: '1-on-1 Sessions' },
      { href: '/student/campus-resources', icon: '🏫', label: 'Campus Resources', desc: 'Labs & Hubs' },
      { href: '/student/resources', icon: '📚', label: 'Study Resources', desc: 'Curated Notes' },
      { href: '/student/bookings', icon: '📅', label: 'My Bookings', desc: 'Session Timetable' },
      { href: '/student/documents', icon: '📁', label: 'My Documents', desc: 'Verified Proofs' },
    ]
  }
]

// All items flat for search
const ALL_ITEMS = CATEGORIES.flatMap(c => c.items)

export default function StudentSidebar() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [userData, setUserData] = useState<any>(null)

  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const navRef = useRef<HTMLDivElement>(null)

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/student/profile')
      const data = await res.json()
      setUserData(data)
    } catch (error) {
      console.error('Failed to fetch user data:', error)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveCategory(null)
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'ST'
  }

  const handleLogout = async () => {
    await logout()
  }

  const filteredItems = searchQuery.trim()
    ? ALL_ITEMS.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.desc?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  return (
    <header className={styles.sidebar}>

      {/* Left Logo */}
      <div className={styles.sidebarTop}>
        <Logo variant="student" size="md" href="/" />
      </div>

      {/* Center Navbar Categories & Search */}
      <div className={`${styles.nav} ${mobileOpen ? styles.mobileOpenNav : ''}`} ref={navRef}>
        {/* Dashboard Direct Link */}
        <Link
          href="/student/dashboard"
          className={`${styles.activeLink} ${pathname === '/student/dashboard' ? styles.categoryBtnActive : ''}`}
          onClick={() => setMobileOpen(false)}
        >
          <span>🏠</span>
          <span>Dashboard</span>
        </Link>

        {/* Category Mega Dropdowns */}
        {CATEGORIES.map(cat => {
          const isOpen = activeCategory === cat.id
          const hasActiveItem = cat.items.some(i => pathname === i.href)

          return (
            <div key={cat.id} className={styles.categoryGroup}>
              <button
                className={`${styles.categoryBtn} ${hasActiveItem || isOpen ? styles.categoryBtnActive : ''}`}
                onClick={() => setActiveCategory(isOpen ? null : cat.id)}
              >
                <span>{cat.icon}</span>
                <span>{cat.title}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>

              {isOpen && (
                <div className={`${styles.megaDropdown} ${cat.id === 'ai-tools' ? styles.megaDropdownWide : ''}`}>
                  <div className={styles.megaHeader}>{cat.title}</div>
                  <div className={styles.megaGrid}>
                    {cat.items.map(item => {
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`${styles.megaItem} ${isActive ? styles.megaItemActive : ''}`}
                          onClick={() => {
                            setActiveCategory(null)
                            setMobileOpen(false)
                          }}
                        >
                          <span className={styles.megaIcon}>{item.icon}</span>
                          <span className={styles.megaLabel}>{item.label}</span>
                          {item.badge && <span className={styles.megaBadge}>{item.badge}</span>}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )})}

        {/* Feature Quick Search Bar */}
        <div className={styles.searchBox}>
          <svg className={styles.searchIcon} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search features..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setSearchOpen(true)
            }}
            onFocus={() => setSearchOpen(true)}
          />

          {searchOpen && searchQuery.trim().length > 0 && (
            <div className={styles.megaDropdown} style={{ width: '260px', right: 0, left: 'auto' }}>
              <div className={styles.megaHeader}>Search Results</div>
              <div className={styles.megaGrid} style={{ gridTemplateColumns: '1fr' }}>
                {filteredItems.length > 0 ? (
                  filteredItems.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={styles.megaItem}
                      onClick={() => {
                        setSearchOpen(false)
                        setSearchQuery('')
                        setMobileOpen(false)
                      }}
                    >
                      <span className={styles.megaIcon}>{item.icon}</span>
                      <span className={styles.megaLabel}>{item.label}</span>
                    </Link>
                  ))
                ) : (
                  <div style={{ padding: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>No features found</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right User & Controls */}
      <div className={styles.userTag}>
        <NotificationBell role="student" />
        {userData && (
          <>
            <div className={styles.userAvatar}>{getInitials(userData.name)}</div>
            <div className={styles.userInfo}>
              <button className={styles.userNameBtn} onClick={() => setDropdownOpen(!dropdownOpen)}>
                <span className={styles.userName}>{userData.name}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
            </div>
          </>
        )}

        <button className={styles.hamburger} onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          <span /><span /><span />
        </button>

        {dropdownOpen && (
          <div className={styles.userDropdown}>
            <button onClick={toggleTheme} className={styles.dropdownItem}>
              <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <button onClick={handleLogout} className={styles.dropdownItem}>
              <span>🚪</span>
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
