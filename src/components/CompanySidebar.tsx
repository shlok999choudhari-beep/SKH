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
  BriefcaseBusiness,
  Building2,
  Code2,
  ChevronDown,
  Sun,
  Moon,
  LogOut,
  User,
  ShieldCheck,
  Settings,
  Sparkles,
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
      { href: '/company/candidates', icon: Sparkles, label: 'Candidate Intelligence', badge: 'SMART' },
      { href: '/company/internships', icon: BriefcaseBusiness, label: 'Internships', badge: 'NEW' },
      { href: '/company/profile', icon: Building2, label: 'Company Profile' },
      { href: '/company/coding-judge', icon: Code2, label: 'Coding Judge' },
    ]
  },
]

export default function CompanySidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [logoDropdownOpen, setLogoDropdownOpen] = useState(false)
  const [showSecurityModal, setShowSecurityModal] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const logoMenuRef = useRef<HTMLDivElement>(null)
  const userDropdownRef = useRef<HTMLDivElement>(null)

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

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
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
    setLogoDropdownOpen(false)
    setDropdownOpen(false)
  }, [pathname])

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'CO'
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <>
      <header className={`${styles.sidebar} ${styles.sidebarCompany}`} suppressHydrationWarning>

        {/* Left Logo with Quick Dropdown */}
        <div className={styles.sidebarTop} ref={logoMenuRef}>
          <button
            type="button"
            className={styles.logoBtnWrapper}
            onClick={() => setLogoDropdownOpen(!logoDropdownOpen)}
            title="PlaceIQ Account & Security Menu"
            aria-expanded={logoDropdownOpen}
          >
            <Logo variant="company" size="md" href={undefined} />
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
                href="/company/profile"
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
                href="/company/profile"
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

        {/* Mobile Backdrop */}
        {mobileOpen && (
          <div className={styles.mobileBackdrop} onClick={() => setMobileOpen(false)} />
        )}

        {/* Center Nav */}
        <nav className={`${styles.nav} ${mobileOpen ? styles.mobileOpenNav : ''}`} suppressHydrationWarning>
          {COMPANY_NAV.map(group => (
            <div key={group.group} className={styles.navGroup} suppressHydrationWarning>
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
        <div className={`${styles.userTag} ${styles.userTagCompany}`} ref={userDropdownRef} suppressHydrationWarning>
          <NotificationBell role="company" />
          {userData && (
            <button
              type="button"
              suppressHydrationWarning
              className={styles.userPillBtn}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              title="Open Company Menu"
              aria-expanded={dropdownOpen}
            >
              <div className={styles.avatarWrapper}>
                <div className={`${styles.userAvatar} ${styles.userAvatarCompany}`}>{getInitials(userData.company_name)}</div>
                <span className={styles.onlineDot} />
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{userData.company_name}</span>
                <span className={styles.userRoleBadge} style={{ color: '#34d399' }}>Company</span>
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
                href="/company/profile"
                className={styles.dropdownItem}
                onClick={() => setDropdownOpen(false)}
              >
                <User size={16} strokeWidth={2} />
                <span>Company Profile</span>
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

      {/* Security & Account Activity Responsive Modal */}
      <SecurityActivityModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
      />
    </>
  )
}

