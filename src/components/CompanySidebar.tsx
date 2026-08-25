'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from '@/components/Logo'
import NotificationBell from '@/components/NotificationBell'
import styles from './sidebar.module.css'
import { useTheme } from '@/contexts/ThemeContext'
import { logout } from '@/app/actions/logout'
import {
  LayoutDashboard,
  BriefcaseBusiness,
  Building2,
  Code2,
  ChevronDown,
  Sun,
  Moon,
  LogOut,
  LucideIcon
} from 'lucide-react'

type CompanyNavItem = {
  href: string
  icon: LucideIcon
  label: string
  badge?: string
}

const COMPANY_NAV: { group: string; items: CompanyNavItem[] }[] = [
  {
    group: 'Overview',
    items: [
      { href: '/company/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/company/internships', icon: BriefcaseBusiness, label: 'Internships', badge: 'NEW' },
      { href: '/company/profile', icon: Building2, label: 'Company Profile' },
      { href: '/company/coding-judge', icon: Code2, label: 'Coding Judge' },
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
  }, [pathname])

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

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div className={styles.mobileBackdrop} onClick={() => setMobileOpen(false)} />
      )}

      {/* Center Nav */}
      <nav className={`${styles.nav} ${mobileOpen ? styles.mobileOpenNav : ''}`}>
        {COMPANY_NAV.map(group => (
          <div key={group.group} className={styles.navGroup}>
            {group.items.map(item => {
              const ItemIcon = item.icon
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.categoryBtn} ${active ? styles.activeCompany : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <span className={styles.navIcon}>
                    <ItemIcon size={16} strokeWidth={2} />
                  </span>
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
                <ChevronDown size={14} strokeWidth={2} />
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
              {theme === 'dark' ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <button onClick={handleLogout} className={styles.dropdownItem}>
              <LogOut size={16} strokeWidth={2} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
