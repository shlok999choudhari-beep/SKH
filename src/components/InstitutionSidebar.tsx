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
  FolderLock,
  Share2,
  Presentation,
  BriefcaseBusiness,
  GraduationCap,
  ChartNoAxesCombined,
  ChevronDown,
  Sun,
  Moon,
  LogOut,
  LucideIcon
} from 'lucide-react'

type InstitutionNavItem = {
  href: string
  icon: LucideIcon
  label: string
}

const INSTITUTION_NAV: { group: string; items: InstitutionNavItem[] }[] = [
  {
    group: 'Overview',
    items: [
      { href: '/institution/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/institution/documents', icon: FolderLock, label: 'Student Documents' },
      { href: '/institution/resources', icon: Share2, label: 'Resources' },
      { href: '/institution/trainers', icon: Presentation, label: 'Trainers' },
      { href: '/institution/internships', icon: BriefcaseBusiness, label: 'Internships' },
      { href: '/institution/placements', icon: GraduationCap, label: 'Placements' },
      { href: '/institution/certifications', icon: ChartNoAxesCombined, label: 'Certifications' },
    ]
  },
]

export default function InstitutionSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [userData, setUserData] = useState<any>({ name: 'Institution Admin' })
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()

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

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div className={styles.mobileBackdrop} onClick={() => setMobileOpen(false)} />
      )}

      {/* Center Nav */}
      <nav className={`${styles.nav} ${mobileOpen ? styles.mobileOpenNav : ''}`}>
        {INSTITUTION_NAV.map(group => (
          <div key={group.group} className={styles.navGroup}>
            {group.items.map(item => {
              const ItemIcon = item.icon
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.categoryBtn} ${active ? styles.activeInstitution : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <span className={styles.navIcon}>
                    <ItemIcon size={16} strokeWidth={2} />
                  </span>
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
