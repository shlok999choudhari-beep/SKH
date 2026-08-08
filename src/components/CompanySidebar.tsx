'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/company/profile')
      const data = await res.json()
      setUserData(data)
    } catch (error) {
      console.error('Failed to fetch user data:', error)
    }
  }

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'CO'
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <>
      {mobileOpen && <div className={styles.overlay} onClick={() => setMobileOpen(false)} />}
      <button className={`${styles.hamburger} ${styles.hamburgerGreen}`} onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
        <span /><span /><span />
      </button>
      <aside className={`${styles.sidebar} ${styles.sidebarCompany} ${collapsed ? styles.collapsed : ''} ${mobileOpen ? styles.mobileOpen : ''}`}>
        <div className={styles.sidebarTop}>
          <Link href="/" className={styles.logo}>
            <div className={`${styles.logoIcon} ${styles.logoIconGreen}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            {!collapsed && <span className={styles.logoText}>Place<span className="grad-text-green">IQ</span></span>}
          </Link>
          <button className={styles.collapseBtn} onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {collapsed ? <path d="M9 18l6-6-6-6"/> : <path d="M15 18l-6-6 6-6"/>}
            </svg>
          </button>
        </div>

        {!collapsed && userData && (
          <div className={`${styles.userTag} ${styles.userTagCompany}`}>
            <div className={`${styles.userAvatar} ${styles.userAvatarCompany}`}>{getInitials(userData.company_name)}</div>
            <div className={styles.userInfo}>
              <button className={styles.userNameBtn} onClick={() => setDropdownOpen(!dropdownOpen)}>
                <span className={styles.userName}>{userData.company_name}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              <div className={styles.userRole}>
                <span className="badge badge-green" style={{fontSize:'10px',padding:'2px 8px'}}>Recruiter</span>
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

        <nav className={styles.nav}>
          {COMPANY_NAV.map(group => (
            <div key={group.group} className={styles.navGroup}>
              {!collapsed && <span className={styles.groupLabel}>{group.group}</span>}
              {group.items.map(item => {
                const active = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.navItem} ${active ? styles.activeCompany : ''}`}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    {!collapsed && (
                      <>
                        <span className={styles.navLabel}>{item.label}</span>
                        {item.badge && <span className={`${styles.navBadge} ${styles.navBadgeGreen}`}>{item.badge}</span>}
                      </>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

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
