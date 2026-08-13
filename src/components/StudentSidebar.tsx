'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './sidebar.module.css'
import { useTheme } from '@/contexts/ThemeContext'
import { logout } from '@/app/actions/logout'

type NavItem = {
  href: string;
  icon: string;
  label: string;
  badge?: string;
}

type NavGroup = {
  group: string;
  items: NavItem[];
}

const STUDENT_NAV: NavGroup[] = [
  {
    group: 'Overview',
    items: [
      { href: '/student/dashboard', icon: '🏠', label: 'Dashboard' },
      { href: '/student/profile', icon: '👤', label: 'My Profile' },
    ]
  },
  {
    group: 'Tools',
    items: [
      { href: '/student/documents', icon: '📁', label: 'Document Vault' },
      { href: '/student/resume', icon: '📄', label: 'Resume Analyzer' },
      { href: '/student/skill-gap', icon: '🔍', label: 'Skill Gap Detector' },
      { href: '/student/roadmap', icon: '🗺️', label: 'My Roadmap' },
    ]
  },
  {
    group: 'Campus',
    items: [
      { href: '/student/campus-resources', icon: '🎓', label: 'Campus Resources' },
      { href: '/student/bookings', icon: '📅', label: 'My Bookings' },
    ]
  },
  {
    group: 'Interviews',
    items: [
      { href: '/student/mock-interview', icon: '🎤', label: 'Mock Interview' },
      { href: '/student/coding-judge', icon: '💻', label: 'Coding Judge' },
      { href: '/student/behavioral-analysis', icon: '🎭', label: 'Behavioral Analysis' },
    ]
  },
  {
    group: 'Jobs',
    items: [
      { href: '/student/internships', icon: '🎯', label: 'Internships', badge: 'NEW' },
      { href: '/student/jobs', icon: '💼', label: 'Browse Jobs' },
      { href: '/student/companies', icon: '🏢', label: 'Company Profiles' },
      { href: '/student/dream-mode', icon: '🌟', label: 'Dream Company Mode' },
    ]
  },
  {
    group: 'Growth',
    items: [
      { href: '/student/resources', icon: '📚', label: 'Learning Resources' },
      { href: '/student/trainers', icon: '🧑‍🏫', label: 'Book a Trainer' },
      { href: '/student/mentor', icon: '🤖', label: 'Mentor Chat' },
      { href: '/student/skills', icon: '📊', label: 'Skill Radar Chart' },
    ]
  },
]

export default function StudentSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()

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

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'ST'
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && <div className={styles.overlay} onClick={() => setMobileOpen(false)} />}

      {/* Mobile hamburger */}
      <button className={styles.hamburger} onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
        <span /><span /><span />
      </button>

      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${mobileOpen ? styles.mobileOpen : ''}`}>
        {/* Logo */}
        <div className={styles.sidebarTop}>
          <Link href="/" className={styles.logo}>
            <div className={styles.logoIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            {!collapsed && <span className={styles.logoText}>Place<span className="grad-text">IQ</span></span>}
          </Link>
          <button className={styles.collapseBtn} onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {collapsed ? <path d="M9 18l6-6-6-6"/> : <path d="M15 18l-6-6 6-6"/>}
            </svg>
          </button>
        </div>

        {/* User Tag */}
        {!collapsed && userData && (
          <div className={styles.userTag}>
            <div className={styles.userAvatar}>{getInitials(userData.name)}</div>
            <div className={styles.userInfo}>
              <button className={styles.userNameBtn} onClick={() => setDropdownOpen(!dropdownOpen)}>
                <span className={styles.userName}>{userData.name}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              <div className={styles.userRole}>
                <span className="badge badge-purple" style={{fontSize:'10px',padding:'2px 8px'}}>Student</span>
              </div>
            </div>
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
        )}

        {/* Nav */}
        <nav className={styles.nav}>
          {STUDENT_NAV.map(group => (
            <div key={group.group} className={styles.navGroup}>
              {!collapsed && <span className={styles.groupLabel}>{group.group}</span>}
              {group.items.map(item => {
                const active = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.navItem} ${active ? styles.active : ''}`}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    {!collapsed && (
                      <>
                        <span className={styles.navLabel}>{item.label}</span>
                        {item.badge && <span className={styles.navBadge}>{item.badge}</span>}
                      </>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        {!collapsed && (
          <div className={styles.sidebarBottom}>
            <button onClick={toggleTheme} className={styles.themeBtn}>
              <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
