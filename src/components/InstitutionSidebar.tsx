'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './sidebar.module.css'
import { useTheme } from '@/contexts/ThemeContext'
import { logout } from '@/app/actions/logout'

const INSTITUTION_NAV = [
  {
    group: 'Overview',
    items: [
      { href: '/institution/dashboard', icon: '🏛️', label: 'Dashboard' },
      { href: '/institution/resources', icon: '🏢', label: 'Resources' },
      { href: '/institution/trainers', icon: '👨‍🏫', label: 'Trainers' },
      { href: '/institution/internships', icon: '💼', label: 'Internships' },
      { href: '/institution/placements', icon: '📈', label: 'Placements' },
      { href: '/institution/analytics', icon: '📊', label: 'Analytics' },
    ]
  },
]

export default function InstitutionSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    // In a real implementation this would fetch from /api/institution/profile
    setUserData({ name: 'Institution Admin' })
  }, [])

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'IN'
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <>
      {mobileOpen && <div className={styles.overlay} onClick={() => setMobileOpen(false)} />}
      <button className={`${styles.hamburger} ${styles.hamburgerPurple}`} onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
        <span /><span /><span />
      </button>
      <aside className={`${styles.sidebar} ${styles.sidebarInstitution} ${collapsed ? styles.collapsed : ''} ${mobileOpen ? styles.mobileOpen : ''}`}>
        <div className={styles.sidebarTop}>
          <Link href="/" className={styles.logo}>
            <div className={`${styles.logoIcon} ${styles.logoIconPurple}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            {!collapsed && <span className={styles.logoText}>Place<span className="grad-text-purple">IQ</span></span>}
          </Link>
          <button className={styles.collapseBtn} onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {collapsed ? <path d="M9 18l6-6-6-6"/> : <path d="M15 18l-6-6 6-6"/>}
            </svg>
          </button>
        </div>

        {!collapsed && userData && (
          <div className={`${styles.userTag} ${styles.userTagInstitution}`}>
            <div className={`${styles.userAvatar} ${styles.userAvatarInstitution}`}>{getInitials(userData.name)}</div>
            <div className={styles.userInfo}>
              <button className={styles.userNameBtn} onClick={() => setDropdownOpen(!dropdownOpen)}>
                <span className={styles.userName}>{userData.name}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              <div className={styles.userRole}>
                <span className="badge badge-purple" style={{fontSize:'10px',padding:'2px 8px'}}>Institution Admin</span>
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
          {INSTITUTION_NAV.map(group => (
            <div key={group.group} className={styles.navGroup}>
              {!collapsed && <span className={styles.groupLabel}>{group.group}</span>}
              {group.items.map(item => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.navItem} ${active ? styles.activeInstitution : ''}`}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    {!collapsed && (
                      <>
                        <span className={styles.navLabel}>{item.label}</span>
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
