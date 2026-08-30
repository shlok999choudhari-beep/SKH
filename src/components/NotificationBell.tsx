'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import styles from './NotificationBell.module.css'
import {
  Bell,
  Brain,
  GraduationCap,
  Mic,
  Briefcase,
  Zap,
  Target,
  Code2,
  Landmark,
  TrendingUp,
  FolderLock,
  Presentation,
  Sparkles,
  X,
  ArrowRight,
  CheckCheck
} from 'lucide-react'

export type NotificationRole = 'student' | 'company' | 'institution'
export type NotificationType = 'update' | 'recommendation'

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  message: string
  category: string
  time: string
  read: boolean
  actionUrl?: string
  actionLabel?: string
  icon: string
  color: string
}

interface NotificationBellProps {
  role: NotificationRole
}

const DEFAULT_NOTIFICATIONS: Record<NotificationRole, NotificationItem[]> = {
  student: [
    {
      id: 'st-academics',
      type: 'update',
      title: 'Academic Records & Document Verification',
      message: 'Verified 10th and 12th percentage records are cryptographically locked and visible to campus recruiters.',
      category: 'Academic Progress',
      time: 'Live',
      read: false,
      actionUrl: '/student/documents',
      actionLabel: 'View Marksheets',
      icon: 'document',
      color: '#10b981',
    },
    {
      id: 'st-readiness',
      type: 'recommendation',
      title: 'Placement Readiness & ATS Benchmark',
      message: 'Target skill competencies and technical evidence are active in the PlaceIQ talent matchmaking engine.',
      category: 'Career Progress',
      time: 'Real-time',
      read: false,
      actionUrl: '/student/roadmap',
      actionLabel: 'View Roadmap',
      icon: 'brain',
      color: '#8b5cf6',
    },
    {
      id: 'st-coding',
      type: 'update',
      title: 'Real-Time Coding Judge Benchmarking',
      message: 'Live test case execution benchmarks and algorithmic problem sessions are saved to your technical profile.',
      category: 'Coding Skills',
      time: 'Live',
      read: false,
      actionUrl: '/student/coding-judge',
      actionLabel: 'Coding Judge',
      icon: 'code',
      color: '#06b6d4',
    },
    {
      id: 'st-courses',
      type: 'update',
      title: 'Learning Modules & Training Roadmaps',
      message: 'Access your curated software engineering curriculum modules and domain training sessions.',
      category: 'Roadmap Progress',
      time: 'Active',
      read: true,
      actionUrl: '/student/courses',
      actionLabel: 'Explore Courses',
      icon: 'placement',
      color: '#3b82f6',
    },
    {
      id: 'st-shortlist',
      type: 'update',
      title: 'Campus Recruiter Discovery Pool',
      message: 'Your verified skill profile is active in company talent discovery and ranking pipelines.',
      category: 'Placement Pipeline',
      time: 'Active',
      read: true,
      actionUrl: '/student/internships',
      actionLabel: 'Placement Status',
      icon: 'target',
      color: '#10b981',
    },
  ],
  company: [
    {
      id: 'co-intelligence',
      type: 'recommendation',
      title: 'AI Candidate Intelligence Engine Active',
      message: 'Multi-dimensional candidate discovery engine is active. Top talent is automatically ranked and surfaced for your roles.',
      category: 'Talent Match',
      time: 'Real-time',
      read: false,
      actionUrl: '/company/candidates',
      actionLabel: 'Discover Candidates',
      icon: 'target',
      color: '#10b981',
    },
    {
      id: 'co-coding',
      type: 'update',
      title: 'Candidate Live Code Benchmark Reports',
      message: 'Candidate algorithmic submissions, test case executions, and language performance metrics are ready for review.',
      category: 'Coding Judge',
      time: 'Live',
      read: false,
      actionUrl: '/company/coding-judge',
      actionLabel: 'Review Code Benchmarks',
      icon: 'code',
      color: '#06b6d4',
    },
    {
      id: 'co-profile',
      type: 'update',
      title: 'Recruitment Settings & Partner Institutions',
      message: 'Custom qualification cutoffs, skill weighting preferences, and institution partnership settings are active.',
      category: 'Recruitment Settings',
      time: 'Active',
      read: true,
      actionUrl: '/company/profile',
      actionLabel: 'Manage Settings',
      icon: 'zap',
      color: '#8b5cf6',
    },
  ],
  institution: [
    {
      id: 'in-docs',
      type: 'update',
      title: 'Cohort Academic Verification Hub',
      message: 'Student marksheet OCR extractions and cryptographic percentage locks are active for current cohort.',
      category: 'Verification Hub',
      time: 'Real-time',
      read: false,
      actionUrl: '/institution/students',
      actionLabel: 'View Cohort',
      icon: 'document',
      color: '#10b981',
    },
    {
      id: 'in-analytics',
      type: 'recommendation',
      title: 'Placement Readiness & Skill Distribution',
      message: 'Real-time cohort competency indexes and recruiter talent readiness metrics are active across all branches.',
      category: 'Placement Analytics',
      time: 'Updated',
      read: false,
      actionUrl: '/institution/analytics',
      actionLabel: 'View Analytics',
      icon: 'analytics',
      color: '#8b5cf6',
    },
    {
      id: 'in-shortlists',
      type: 'update',
      title: 'Industry Recruiter Candidate Inquiries',
      message: 'Company discovery sessions, shortlist requests, and student selections are tracked in real time.',
      category: 'Placement Drives',
      time: 'Active',
      read: true,
      actionUrl: '/institution/students',
      actionLabel: 'Review Activity',
      icon: 'resource',
      color: '#a855f7',
    },
  ],
}

function renderNotificationIcon(icon: string) {
  switch (icon) {
    case 'brain':
    case '🧠':
      return <Brain size={18} strokeWidth={2} />
    case 'placement':
    case '🎓':
      return <GraduationCap size={18} strokeWidth={2} />
    case 'interview':
    case '🎙️':
    case '🎤':
      return <Mic size={18} strokeWidth={2} />
    case 'internship':
    case '💼':
      return <Briefcase size={18} strokeWidth={2} />
    case 'zap':
    case '⚡':
      return <Zap size={18} strokeWidth={2} />
    case 'target':
    case '🎯':
      return <Target size={18} strokeWidth={2} />
    case 'code':
    case '💻':
      return <Code2 size={18} strokeWidth={2} />
    case 'resource':
    case '🏛️':
    case '🏢':
      return <Landmark size={18} strokeWidth={2} />
    case 'analytics':
    case '📈':
    case '📊':
      return <TrendingUp size={18} strokeWidth={2} />
    case 'document':
    case '📁':
      return <FolderLock size={18} strokeWidth={2} />
    case 'trainer':
    case '👨‍🏫':
      return <Presentation size={18} strokeWidth={2} />
    default:
      return <Sparkles size={18} strokeWidth={2} />
  }
}

export function dispatchPortalNotification(params: {
  role?: NotificationRole | 'all'
  title: string
  message: string
  category: string
  actionUrl?: string
  actionLabel?: string
  icon?: string
  color?: string
}) {
  if (typeof window === 'undefined') return

  const roles: NotificationRole[] =
    params.role === 'all'
      ? ['student', 'company', 'institution']
      : [params.role || 'company']

  const newItem: NotificationItem = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: 'update',
    title: params.title,
    message: params.message,
    category: params.category,
    time: 'Just now',
    read: false,
    actionUrl: params.actionUrl || '/company/candidates',
    actionLabel: params.actionLabel || 'View Status',
    icon: params.icon || 'target',
    color: params.color || '#10b981'
  }

  roles.forEach(r => {
    const storageKey = `placeiq_notifications_${r}`
    try {
      const stored = localStorage.getItem(storageKey)
      const list: NotificationItem[] = stored ? JSON.parse(stored) : (DEFAULT_NOTIFICATIONS[r] || [])
      const updated = [newItem, ...list.filter(item => item.id !== newItem.id)]
      localStorage.setItem(storageKey, JSON.stringify(updated))
    } catch (e) {
      console.error('Failed to update localStorage notifications:', e)
    }

    window.dispatchEvent(
      new CustomEvent('placeiq_notification_added', {
        detail: { role: r, notification: newItem }
      })
    )
  })
}

export default function NotificationBell({ role }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'update' | 'recommendation'>('all')
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize and fetch authentic progress notifications
  useEffect(() => {
    const storageKey = `placeiq_notifications_${role}`
    
    // Load initial from storage or defaults
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // Clean out any legacy dummy notifications
        const clean = parsed.filter((n: any) => !n.id.startsWith('st-1') && !n.id.startsWith('st-2') && !n.id.startsWith('co-1') && !n.id.startsWith('in-1') || n.id.startsWith('auth-'))
        setNotifications(clean.length > 0 ? clean : (DEFAULT_NOTIFICATIONS[role] || []))
      } catch {
        setNotifications(DEFAULT_NOTIFICATIONS[role] || [])
      }
    } else {
      setNotifications(DEFAULT_NOTIFICATIONS[role] || [])
    }

    // Fetch live progress-based notifications from the backend API
    const fetchAuthenticNotifications = async () => {
      try {
        const res = await fetch(`/api/notifications?role=${role}`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.notifications) && data.notifications.length > 0) {
            setNotifications(prev => {
              // Preserve any real-time user-triggered notifications (like shortlists)
              const runtimeItems = prev.filter(n => n.id.startsWith('notif-'))
              const merged = [...runtimeItems, ...data.notifications.filter((dn: any) => !runtimeItems.some(rn => rn.id === dn.id))]
              try {
                localStorage.setItem(storageKey, JSON.stringify(merged))
              } catch {}
              return merged
            })
          }
        }
      } catch (err) {
        console.warn('Authentic notifications fetch warning (using defaults):', err)
      }
    }

    fetchAuthenticNotifications()

    // Real-time custom event listener for instant notification delivery
    const handleCustomNotification = (e: Event) => {
      const customEvent = e as CustomEvent<{ role: NotificationRole; notification: NotificationItem }>
      if (customEvent.detail && (customEvent.detail.role === role || customEvent.detail.role === ('all' as any))) {
        setNotifications(prev => [customEvent.detail.notification, ...prev.filter(n => n.id !== customEvent.detail.notification.id)])
      }
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        try {
          setNotifications(JSON.parse(e.newValue))
        } catch {}
      }
    }

    window.addEventListener('placeiq_notification_added', handleCustomNotification)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('placeiq_notification_added', handleCustomNotification)
      window.removeEventListener('storage', handleStorage)
    }
  }, [role])

  // Save changes
  const saveNotifications = (items: NotificationItem[]) => {
    setNotifications(items)
    try {
      localStorage.setItem(`placeiq_notifications_${role}`, JSON.stringify(items))
    } catch (e) {
      console.error('Failed to save notifications:', e)
    }
  }

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const handleMarkAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }))
    saveNotifications(updated)
  }

  const handleMarkSingleRead = (id: string) => {
    const updated = notifications.map(n => (n.id === id ? { ...n, read: true } : n))
    saveNotifications(updated)
  }

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    e.preventDefault()
    const updated = notifications.filter(n => n.id !== id)
    saveNotifications(updated)
  }

  const handleClearAll = () => {
    saveNotifications([])
  }

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true
    return n.type === activeTab
  })

  // Variant class for color accent
  const roleClass =
    role === 'company'
      ? styles.companyTheme
      : role === 'institution'
      ? styles.institutionTheme
      : styles.studentTheme

  return (
    <div className={`${styles.container} ${roleClass}`} ref={containerRef} suppressHydrationWarning>
      {/* ── BELL BUTTON ── */}
      <button
        type="button"
        suppressHydrationWarning
        className={`${styles.bellBtn} ${isOpen ? styles.bellBtnActive : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications & Recommendations"
        title="Notifications & AI Recommendations"
      >
        <div className={styles.bellIconWrapper} suppressHydrationWarning>
          <Bell size={18} strokeWidth={2} className={styles.bellSvg} />

          {/* Unread badge / beacon */}
          {unreadCount > 0 && (
            <span className={styles.unreadBadge} suppressHydrationWarning>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </button>

      {/* ── NOTIFICATION FLYOUT DROPDOWN ── */}
      {isOpen && (
        <div className={styles.dropdown} suppressHydrationWarning>
          {/* Header */}
          <div className={styles.header} suppressHydrationWarning>
            <div className={styles.headerTitleRow}>
              <div className={styles.headerTitle}>
                <span className={styles.headerIcon}>
                  <Bell size={16} strokeWidth={2} />
                </span>
                <span className={styles.headerText}>Notifications</span>
                {unreadCount > 0 && (
                  <span className={styles.unreadPill}>{unreadCount} new</span>
                )}
              </div>
              {unreadCount > 0 && (
                <button type="button" suppressHydrationWarning className={styles.markAllBtn} onClick={handleMarkAllRead}>
                  <CheckCheck size={13} strokeWidth={2} style={{ display: 'inline', marginRight: 4 }} />
                  Mark all as read
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className={styles.tabRow} suppressHydrationWarning>
              <button
                type="button"
                suppressHydrationWarning
                className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                suppressHydrationWarning
                className={`${styles.tabBtn} ${activeTab === 'recommendation' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('recommendation')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <Brain size={13} strokeWidth={2} />
                <span>Recommendations ({notifications.filter(n => n.type === 'recommendation').length})</span>
              </button>
              <button
                type="button"
                suppressHydrationWarning
                className={`${styles.tabBtn} ${activeTab === 'update' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('update')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <Zap size={13} strokeWidth={2} />
                <span>Updates ({notifications.filter(n => n.type === 'update').length})</span>
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className={styles.list} suppressHydrationWarning>
            {filteredNotifications.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>
                  <Sparkles size={28} strokeWidth={1.75} />
                </span>
                <p className={styles.emptyTitle}>You&apos;re all caught up!</p>
                <p className={styles.emptySubtitle}>
                  No new {activeTab !== 'all' ? activeTab + ' ' : ''}notifications at the moment.
                </p>
              </div>
            ) : (
              filteredNotifications.map(item => (
                <div
                  key={item.id}
                  className={`${styles.item} ${!item.read ? styles.itemUnread : ''}`}
                  onClick={() => handleMarkSingleRead(item.id)}
                >
                  {/* Left Icon */}
                  <div
                    className={styles.itemIcon}
                    style={{ background: `${item.color}20`, color: item.color }}
                  >
                    {renderNotificationIcon(item.icon)}
                  </div>

                  {/* Content */}
                  <div className={styles.itemBody}>
                    <div className={styles.itemHeader}>
                      <span
                        className={styles.categoryBadge}
                        style={{
                          color: item.color,
                          borderColor: `${item.color}40`,
                          background: `${item.color}15`,
                        }}
                      >
                        {item.category}
                      </span>
                      <span className={styles.itemTime}>{item.time}</span>
                      {!item.read && <span className={styles.dot} />}
                    </div>

                    <h4 className={styles.itemTitle}>{item.title}</h4>
                    <p className={styles.itemMessage}>{item.message}</p>

                    {item.actionUrl && (
                      <div className={styles.actionRow}>
                        <Link
                          href={item.actionUrl}
                          className={styles.actionBtn}
                          onClick={() => {
                            handleMarkSingleRead(item.id)
                            setIsOpen(false)
                          }}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <span>{item.actionLabel || 'View Details'}</span>
                          <ArrowRight size={13} strokeWidth={2} />
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Dismiss Button */}
                  <button
                    type="button"
                    suppressHydrationWarning
                    className={styles.dismissBtn}
                    onClick={e => handleDismiss(e, item.id)}
                    title="Dismiss"
                    aria-label="Dismiss notification"
                  >
                    <X size={13} strokeWidth={2} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className={styles.footer} suppressHydrationWarning>
              <button type="button" suppressHydrationWarning className={styles.clearAllBtn} onClick={handleClearAll}>
                Clear all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
