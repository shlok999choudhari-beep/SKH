'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from '@/components/Logo'
import NotificationBell from '@/components/NotificationBell'
import styles from './sidebar.module.css'
import { useTheme } from '@/contexts/ThemeContext'
import { logout } from '@/app/actions/logout'

const INSTITUTION_NAV = [
  {
    group: 'Overview',
    items: [
      { href: '/institution/dashboard', icon: '🏛️', label: 'Dashboard' },
      { href: '/institution/documents', icon: '📁', label: 'Student Documents' },
      { href: '/institution/resources', icon: '🏢', label: 'Resources' },
      { href: '/institution/trainers', icon: '👨‍🏫', label: 'Trainers' },
      { href: '/institution/internships', icon: '💼', label: 'Internships' },
      { href: '/institution/placements', icon: '📈', label: 'Placements' },
      { href: '/institution/analytics', icon: '📊', label: 'Analytics' },
    ]
  },
]

export default function InstitutionSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [userData, setUserData] = useState<any>({ name: 'Institution Admin' })
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'IN'
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header className={`${styles.sidebar} ${styles.sidebarInstitution}`}>

      {/* Left Logo */}
      <div className={styles.sidebarTop}>
        <Logo variant="institution" size="md" href="/" />
      </div>

      {/* Center Nav */}
      <nav className={`${styles.nav} ${mobileOpen ? styles.mobileOpenNav : ''}`}>
        {INSTITUTION_NAV.map(group => (
          <div key={group.group} className={styles.navGroup}>
            {group.items.map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.categoryBtn} ${active ? styles.activeInstitution : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navLabel}>{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Right User & Controls */}
      <div className={`${styles.userTag} ${styles.userTagInstitution}`}>
        <NotificationBell role="institution" />
        {userData && (
          <>
            <div className={`${styles.userAvatar} ${styles.userAvatarInstitution}`}>{getInitials(userData.name)}</div>
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
