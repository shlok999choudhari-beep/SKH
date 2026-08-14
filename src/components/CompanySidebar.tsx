'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from '@/components/Logo'
import NotificationBell from '@/components/NotificationBell'
import styles from './sidebar.module.css'
import { useTheme } from '@/contexts/ThemeContext'
import { logout } from '@/app/actions/logout'

const COMPANY_NAV = [
  {
    group: 'Overview',
    items: [
      { href: '/company/dashboard', icon: '🏠', label: 'Dashboard' },
      { href: '/company/internships', icon: '💼', label: 'Internships', badge: 'NEW' },
      { href: '/company/profile', icon: '🏢', label: 'Company Profile' },
      { href: '/company/coding-judge', icon: '💻', label: 'Coding Judge' },
    ]
  },
]

export default function CompanySidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/company/profile')
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
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'CO'
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header className={`${styles.sidebar} ${styles.sidebarCompany}`}>

      {/* Left Logo */}
      <div className={styles.sidebarTop}>
        <Logo variant="company" size="md" href="/" />
      </div>

      {/* Center Nav */}
      <nav className={`${styles.nav} ${mobileOpen ? styles.mobileOpenNav : ''}`}>
        {COMPANY_NAV.map(group => (
          <div key={group.group} className={styles.navGroup}>
            {group.items.map(item => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.categoryBtn} ${active ? styles.activeCompany : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navLabel}>{item.label}</span>
                  {item.badge && <span className={`${styles.megaBadge} ${styles.megaBadgeGreen}`}>{item.badge}</span>}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Right User & Controls */}
      <div className={`${styles.userTag} ${styles.userTagCompany}`}>
        <NotificationBell role="company" />
        {userData && (
          <>
            <div className={`${styles.userAvatar} ${styles.userAvatarCompany}`}>{getInitials(userData.company_name)}</div>
            <div className={styles.userInfo}>
              <button className={styles.userNameBtn} onClick={() => setDropdownOpen(!dropdownOpen)}>
                <span className={styles.userName}>{userData.company_name}</span>
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
