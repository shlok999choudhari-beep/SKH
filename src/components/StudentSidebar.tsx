'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from '@/components/Logo'
import NotificationBell from '@/components/NotificationBell'
import BackButton from '@/components/BackButton'
import styles from './sidebar.module.css'
import { useTheme } from '@/contexts/ThemeContext'
import { logout } from '@/app/actions/logout'
import {
  LayoutDashboard,
  Zap,
  FileText,
  Mic,
  Code2,
  Compass,
  ChartNoAxesCombined,
  Brain,
  Bot,
  Sparkles,
  BriefcaseBusiness,
  Target,
  GraduationCap,
  Building2,
  User,
  Presentation,
  Landmark,
  BookOpen,
  CalendarDays,
  FolderLock,
  Search,
  ChevronDown,
  Sun,
  Moon,
  LogOut,
  ArrowRight,
  LucideIcon
} from 'lucide-react'

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: string;
  desc?: string;
}

type NavCategory = {
  id: string;
  title: string;
  icon: LucideIcon;
  items: NavItem[];
}

const CATEGORIES: NavCategory[] = [
  {
    id: 'ai-tools',
    title: 'AI & Practice Tools',
    icon: Sparkles,
    items: [
      { href: '/student/resume', icon: FileText, label: 'Resume Builder', badge: 'AI', desc: 'ATS Optimization' },
      { href: '/student/mock-interview', icon: Mic, label: 'Mock Interview', badge: 'Vapi', desc: 'Voice AI Practice' },
      { href: '/student/coding-judge', icon: Code2, label: 'Coding Judge', desc: 'LeetCode Style' },
      { href: '/student/roadmap', icon: Compass, label: 'Learning Roadmap', desc: 'AI Career Path' },
      { href: '/student/skill-gap', icon: ChartNoAxesCombined, label: 'Skill Gap Analysis', desc: 'Role Alignment' },
      { href: '/student/skills', icon: Zap, label: 'Skill Insights', desc: 'Radar Analytics' },
      { href: '/student/behavioral-analysis', icon: Brain, label: 'Behavioral Analysis', desc: 'Tone & Soft Skills' },
      { href: '/student/mentor', icon: Bot, label: 'AI Mentor', desc: '24/7 Chat Guidance' },
      { href: '/student/dream-mode', icon: Sparkles, label: 'Dream Mode', badge: 'HOT', desc: 'Company Targeting' },
    ]
  },
  {
    id: 'career',
    title: 'Jobs & Placement',
    icon: BriefcaseBusiness,
    items: [
      { href: '/student/jobs', icon: BriefcaseBusiness, label: 'Job Openings', desc: 'Live Listings' },
      { href: '/student/internships', icon: Target, label: 'Internships', desc: 'Paid Roles' },
      { href: '/student/placements', icon: GraduationCap, label: 'Placements', desc: 'On-Campus Drives' },
      { href: '/student/companies', icon: Building2, label: 'Top Companies', desc: 'Hiring Insights' },
    ]
  },
  {
    id: 'campus',
    title: 'Campus & Resources',
    icon: Landmark,
    items: [
      { href: '/student/trainers', icon: Presentation, label: 'Industry Trainers', desc: '1-on-1 Sessions' },
      { href: '/student/campus-resources', icon: Landmark, label: 'Campus Resources', desc: 'Labs & Hubs' },
      { href: '/student/resources', icon: BookOpen, label: 'Study Resources', desc: 'Curated Notes' },
      { href: '/student/bookings', icon: CalendarDays, label: 'My Bookings', desc: 'Session Timetable' },
      { href: '/student/documents', icon: FolderLock, label: 'My Documents', desc: 'Verified Proofs' },
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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
    setActiveCategory(null)
  }, [pathname])

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
    <header className={styles.sidebar} suppressHydrationWarning>

      {/* Left Logo */}
      <div className={styles.sidebarTop}>
        <Logo variant="student" size="md" href="/" />
        {pathname !== '/student/dashboard' && (
          <BackButton
            variant="compact"
            label="Back"
            showLabel={false}
            fallbackHref="/student/dashboard"
            title="Go back"
            style={{ marginLeft: '6px' }}
          />
        )}
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div className={styles.mobileBackdrop} onClick={() => setMobileOpen(false)} />
      )}

      {/* Center Navbar Categories & Search */}
      <div className={`${styles.nav} ${mobileOpen ? styles.mobileOpenNav : ''}`} ref={navRef} suppressHydrationWarning>
        {/* Dashboard Direct Link */}
        <Link
          href="/student/dashboard"
          className={`${styles.activeLink} ${pathname === '/student/dashboard' ? styles.categoryBtnActive : ''}`}
          onClick={() => setMobileOpen(false)}
        >
          <LayoutDashboard size={17} strokeWidth={2} />
          <span>Dashboard</span>
        </Link>

        {/* Category Mega Dropdowns */}
        {CATEGORIES.map(cat => {
          const CatIcon = cat.icon
          const isOpen = activeCategory === cat.id
          const hasActiveItem = cat.items.some(i => pathname === i.href)

          return (
            <div key={cat.id} className={styles.categoryGroup} suppressHydrationWarning>
              <button
                type="button"
                suppressHydrationWarning
                className={`${styles.categoryBtn} ${hasActiveItem || isOpen ? styles.categoryBtnActive : ''}`}
                onClick={() => setActiveCategory(isOpen ? null : cat.id)}
              >
                <CatIcon size={16} strokeWidth={2} />
                <span>{cat.title}</span>
                <ChevronDown
                  size={14}
                  strokeWidth={2}
                  style={{
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.2s'
                  }}
                />
              </button>

              {isOpen && (
                <div className={`${styles.megaDropdown} ${cat.id === 'ai-tools' ? styles.megaDropdownWide : ''}`}>
                  <div className={styles.megaHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{cat.title}</span>
                    {cat.id === 'campus' && (
                      <Link
                        href="/student/campus"
                        onClick={() => {
                          setActiveCategory(null)
                          setMobileOpen(false)
                        }}
                        style={{
                          fontSize: '10px',
                          color: '#c084fc',
                          textDecoration: 'none',
                          fontWeight: 600,
                          textTransform: 'none',
                          letterSpacing: 'normal',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <span>Open Hub</span>
                        <ArrowRight size={11} />
                      </Link>
                    )}
                  </div>
                  <div className={styles.megaGrid}>
                    {cat.items.map(item => {
                      const ItemIcon = item.icon
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
                          <span className={styles.megaIcon}>
                            <ItemIcon size={18} strokeWidth={2} />
                          </span>
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
        <div className={styles.searchBox} suppressHydrationWarning>
          <Search className={styles.searchIcon} size={14} strokeWidth={2} />
          <input
            type="text"
            suppressHydrationWarning
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
                  filteredItems.map(item => {
                    const SearchItemIcon = item.icon
                    return (
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
                        <span className={styles.megaIcon}>
                          <SearchItemIcon size={16} strokeWidth={2} />
                        </span>
                        <span className={styles.megaLabel}>{item.label}</span>
                      </Link>
                    )
                  })
                ) : (
                  <div style={{ padding: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>No features found</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right User & Controls */}
      <div className={styles.userTag} suppressHydrationWarning>
        <NotificationBell role="student" />
        {userData && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              title="Open Profile Menu"
            >
              <div className={styles.userAvatar}>{getInitials(userData.name)}</div>
            </button>
            <div className={styles.userInfo}>
              <button type="button" suppressHydrationWarning className={styles.userNameBtn} onClick={() => setDropdownOpen(!dropdownOpen)}>
                <span className={styles.userName}>{userData.name}</span>
                <ChevronDown size={14} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}

        <button type="button" suppressHydrationWarning className={styles.hamburger} onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          <span /><span /><span />
        </button>

        {dropdownOpen && (
          <div className={styles.userDropdown} suppressHydrationWarning>
            <Link
              href="/student/profile"
              className={styles.dropdownItem}
              onClick={() => setDropdownOpen(false)}
            >
              <User size={16} strokeWidth={2} />
              <span>My Profile</span>
            </Link>
            <button type="button" suppressHydrationWarning onClick={toggleTheme} className={styles.dropdownItem}>
              {theme === 'dark' ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <button type="button" suppressHydrationWarning onClick={handleLogout} className={styles.dropdownItem}>
              <LogOut size={16} strokeWidth={2} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

