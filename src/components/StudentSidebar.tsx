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
  ShieldCheck,
  Settings,
  FileCheck,
  HelpCircle,
  MessageSquare,
  Award,
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
    id: 'lms',
    title: 'Learning Hub',
    icon: BookOpen,
    items: [
      { href: '/student/courses', icon: BookOpen, label: 'My Courses', desc: 'Enrolled & Active' },
      { href: '/student/courses/explore', icon: Compass, label: 'Explore Courses', badge: 'NEW', desc: 'Course Catalog' },
      { href: '/student/courses/progress', icon: ChartNoAxesCombined, label: 'Course Progress', desc: 'Syllabus & Mastery' },
      { href: '/student/ai-learning', icon: Bot, label: 'AI Learning Center', badge: 'AI', desc: 'Grounded Assistant & Planner' },
      { href: '/student/assignments', icon: FileCheck, label: 'Assignments', desc: 'Tasks & Submissions' },
      { href: '/student/quizzes', icon: HelpCircle, label: 'Quizzes & Tests', desc: 'Timed Assessments' },
      { href: '/student/discussions', icon: MessageSquare, label: 'Discussions', desc: 'Q&A Community' },
      { href: '/student/certificates', icon: Award, label: 'Certificates', desc: 'Verified Credentials' },
    ]
  },
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
      { href: '/student/verify-academics', icon: ShieldCheck, label: 'Academic Verification', badge: 'ID', desc: 'Marksheet Proofs' },
      { href: '/student/documents', icon: FolderLock, label: 'My Documents', desc: 'Verified Proofs' },
    ]
  }
]

const ALL_ITEMS = CATEGORIES.flatMap(c => c.items)

export default function StudentSidebar() {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [logoDropdownOpen, setLogoDropdownOpen] = useState(false)
  const [showSecurityModal, setShowSecurityModal] = useState(false)
  const [userData, setUserData] = useState<{ name: string; email: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  const navRef = useRef<HTMLDivElement>(null)
  const logoMenuRef = useRef<HTMLDivElement>(null)
  const userDropdownRef = useRef<HTMLDivElement>(null)

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/student/dashboard', { cache: 'no-store' })
      const data = await res.json()
      if (data && data.student) {
        setUserData({
          name: data.student.name || 'Soham',
          email: data.student.email || ''
        })
      } else {
        setUserData({
          name: 'Soham',
          email: 'soham@placeiq.internal'
        })
      }
    } catch {
      setUserData({
        name: 'Soham',
        email: 'soham@placeiq.internal'
      })
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveCategory(null)
        setSearchOpen(false)
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
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'S'
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
    <>
      <header className={styles.sidebar} suppressHydrationWarning>
        <div className={styles.sidebarTop} ref={logoMenuRef}>
          <button
            type="button"
            className={styles.logoBtnWrapper}
            onClick={() => setLogoDropdownOpen(!logoDropdownOpen)}
            title="PlaceIQ Account & Security Menu"
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
                href="/student/profile"
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
                href="/student/profile"
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

        {mobileOpen && (
          <div className={styles.mobileBackdrop} onClick={() => setMobileOpen(false)} />
        )}

        <div className={`${styles.nav} ${mobileOpen ? styles.mobileOpenNav : ''}`} ref={navRef} suppressHydrationWarning>
          <Link
            href="/student/dashboard"
            className={`${styles.activeLink} ${pathname === '/student/dashboard' ? styles.categoryBtnActive : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <LayoutDashboard size={17} strokeWidth={2} />
            <span>Dashboard</span>
          </Link>

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
                            <div className={styles.megaIconWrap}>
                              <ItemIcon size={16} strokeWidth={2} />
                            </div>
                            <div className={styles.megaText}>
                              <div className={styles.megaLabelRow}>
                                <span className={styles.megaLabel}>{item.label}</span>
                                {item.badge && (
                                  <span className={`${styles.megaBadge} ${item.badge === 'HOT' ? styles.badgeHot : ''}`}>
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

          {/* Aesthetic Search Trigger & Flyout */}
          <div className={styles.searchContainer} suppressHydrationWarning>
            <button
              type="button"
              suppressHydrationWarning
              className={styles.searchTrigger}
              onClick={() => setSearchOpen(!searchOpen)}
              title="Search features (Ctrl+K)"
            >
              <Search size={14} strokeWidth={2.2} className={styles.searchTriggerIcon} />
              <span className={styles.searchTriggerText}>Search features...</span>
              <kbd className={styles.searchKbd}>Ctrl+K</kbd>
            </button>

            {searchOpen && (
              <div className={styles.searchFlyout}>
                <div className={styles.searchBarInner}>
                  <Search size={14} strokeWidth={2} className={styles.searchInnerIcon} />
                  <input
                    type="text"
                    placeholder="Search any tool, placement or resource..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    autoFocus
                    className={styles.searchInput}
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')} className={styles.clearSearch}>
                      ✕
                    </button>
                  )}
                </div>
                <div className={styles.searchResultList}>
                  {filteredItems.length > 0 ? (
                    filteredItems.map(item => {
                      const ItemIcon = item.icon
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={styles.searchResultItem}
                          onClick={() => {
                            setSearchOpen(false)
                            setSearchQuery('')
                            setMobileOpen(false)
                          }}
                        >
                          <div className={styles.searchResultIconWrap}>
                            <ItemIcon size={14} strokeWidth={2} />
                          </div>
                          <div className={styles.searchResultTextWrap}>
                            <span className={styles.searchResultLabel}>
                              {item.label}
                            </span>
                            {item.desc && (
                              <span className={styles.searchResultDesc}>
                                {item.desc}
                              </span>
                            )}
                          </div>
                        </Link>
                      )
                    })
                  ) : (
                    <div className={styles.searchEmpty}>No features found matching &quot;{searchQuery}&quot;</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Aesthetic User Profile Pill */}
        <div className={styles.userTag} ref={userDropdownRef} suppressHydrationWarning>
          <NotificationBell role="student" />
          {userData && (
            <button
              type="button"
              suppressHydrationWarning
              className={styles.userPillBtn}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              title="Open Profile Menu"
              aria-expanded={dropdownOpen}
            >
              <div className={styles.avatarWrapper}>
                <div className={styles.userAvatar}>{getInitials(userData.name)}</div>
                <span className={styles.onlineDot} />
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{userData.name}</span>
                <span className={styles.userRoleBadge}>Student</span>
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
                href="/student/profile"
                className={styles.dropdownItem}
                onClick={() => setDropdownOpen(false)}
              >
                <User size={16} strokeWidth={2} />
                <span>My Profile</span>
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
