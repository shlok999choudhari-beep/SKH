'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import styles from './NotificationBell.module.css'

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
      id: 'st-1',
      type: 'recommendation',
      title: 'AI Roadmap Recommendation',
      message: 'Week 2 System Design modules recommended based on your recent ATS target for Google.',
      category: 'AI Insight',
      time: '10m ago',
      read: false,
      actionUrl: '/student/roadmap',
      actionLabel: 'Open Roadmap',
      icon: '🧠',
      color: '#8b5cf6',
    },
    {
      id: 'st-2',
      type: 'update',
      title: 'New Campus Placement Drive',
      message: 'Microsoft SWE Drive applications close in 3 days. Your ATS match score is 94%.',
      category: 'Placement',
      time: '1h ago',
      read: false,
      actionUrl: '/student/placements',
      actionLabel: 'View Drive',
      icon: '🎓',
      color: '#3b82f6',
    },
    {
      id: 'st-3',
      type: 'recommendation',
      title: 'Voice Interview Simulation',
      message: 'Practice Behavioral Tone analysis to boost your interview confidence score from 84% to 95%.',
      category: 'Interview AI',
      time: '3h ago',
      read: false,
      actionUrl: '/student/mock-interview',
      actionLabel: 'Start Practice',
      icon: '🎙️',
      color: '#ec4899',
    },
    {
      id: 'st-4',
      type: 'update',
      title: 'Internship Shortlist Update',
      message: 'Uber Frontend Internship shortlisted your profile for the technical assessment round.',
      category: 'Internship',
      time: 'Yesterday',
      read: true,
      actionUrl: '/student/internships',
      actionLabel: 'View Status',
      icon: '💼',
      color: '#10b981',
    },
    {
      id: 'st-5',
      type: 'recommendation',
      title: 'Resume Skill Gap Alert',
      message: 'Adding Next.js Server Actions & Go to your resume can increase ATS match by +18%.',
      category: 'Resume AI',
      time: '2d ago',
      read: true,
      actionUrl: '/student/resume',
      actionLabel: 'Analyze Resume',
      icon: '⚡',
      color: '#f59e0b',
    },
  ],
  company: [
    {
      id: 'co-1',
      type: 'recommendation',
      title: 'AI Top Candidate Matches',
      message: '8 candidates from IIT & NIT cohorts match 92%+ with your Senior Backend opening.',
      category: 'AI Talent Match',
      time: '5m ago',
      read: false,
      actionUrl: '/company/dashboard',
      actionLabel: 'View Candidates',
      icon: '🎯',
      color: '#10b981',
    },
    {
      id: 'co-2',
      type: 'update',
      title: 'Coding Judge Assessments Completed',
      message: '14 candidates completed the DSA Online Assessment Round with 100% test cases passed.',
      category: 'Coding Judge',
      time: '45m ago',
      read: false,
      actionUrl: '/company/coding-judge',
      actionLabel: 'Review Scores',
      icon: '💻',
      color: '#06b6d4',
    },
    {
      id: 'co-3',
      type: 'update',
      title: 'New Internship Applications',
      message: '23 verified students applied for the Summer 2026 AI Research Intern position.',
      category: 'Internship',
      time: '2h ago',
      read: false,
      actionUrl: '/company/internships',
      actionLabel: 'Review Applicants',
      icon: '💼',
      color: '#34d399',
    },
    {
      id: 'co-4',
      type: 'recommendation',
      title: 'Verified Cohort Recommendation',
      message: 'Pre-vetted Fullstack engineering candidates are available for fast-track interview scheduling.',
      category: 'Talent Pool',
      time: '1d ago',
      read: true,
      actionUrl: '/company/dashboard',
      actionLabel: 'Explore Pool',
      icon: '⚡',
      color: '#8b5cf6',
    },
  ],
  institution: [
    {
      id: 'in-1',
      type: 'update',
      title: 'Resource Sharing Request',
      message: 'MIT Partner Campus requested access to the Robotics & IoT Lab for next Friday.',
      category: 'Resource Sharing',
      time: '15m ago',
      read: false,
      actionUrl: '/institution/resources',
      actionLabel: 'Review Request',
      icon: '🏛️',
      color: '#a855f7',
    },
    {
      id: 'in-2',
      type: 'recommendation',
      title: 'Cohort Placement Readiness AI',
      message: '82% of Computer Science batch is verified and ready for Tier-1 upcoming placement drives.',
      category: 'Placement AI',
      time: '1h ago',
      read: false,
      actionUrl: '/institution/analytics',
      actionLabel: 'View Analytics',
      icon: '📈',
      color: '#ec4899',
    },
    {
      id: 'in-3',
      type: 'update',
      title: 'Student Documents Pending',
      message: '15 internship completion certificates submitted and pending institutional verification.',
      category: 'Verification',
      time: '3h ago',
      read: false,
      actionUrl: '/institution/documents',
      actionLabel: 'Verify Docs',
      icon: '📁',
      color: '#c084fc',
    },
    {
      id: 'in-4',
      type: 'update',
      title: 'Industry Trainer Workshop',
      message: 'Trainer Alex confirmed 1-on-1 System Design workshop for next Monday.',
      category: 'Trainers',
      time: 'Yesterday',
      read: true,
      actionUrl: '/institution/trainers',
      actionLabel: 'Manage Sessions',
      icon: '👨‍🏫',
      color: '#3b82f6',
    },
  ],
}

export default function NotificationBell({ role }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'update' | 'recommendation'>('all')
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize and sync with localStorage
  useEffect(() => {
    const storageKey = `placeiq_notifications_${role}`
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      try {
        setNotifications(JSON.parse(stored))
        return
      } catch (e) {
        console.error('Failed to parse notifications:', e)
      }
    }
    setNotifications(DEFAULT_NOTIFICATIONS[role] || [])
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
    <div className={`${styles.container} ${roleClass}`} ref={containerRef}>
      {/* ── BELL BUTTON ── */}
      <button
        className={`${styles.bellBtn} ${isOpen ? styles.bellBtnActive : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications & Recommendations"
        title="Notifications & AI Recommendations"
      >
        <div className={styles.bellIconWrapper}>
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={styles.bellSvg}
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>

          {/* Unread badge / beacon */}
          {unreadCount > 0 && (
            <span className={styles.unreadBadge}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </button>

      {/* ── NOTIFICATION FLYOUT DROPDOWN ── */}
      {isOpen && (
        <div className={styles.dropdown}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerTitleRow}>
              <div className={styles.headerTitle}>
                <span className={styles.headerIcon}>🔔</span>
                <span className={styles.headerText}>Notifications</span>
                {unreadCount > 0 && (
                  <span className={styles.unreadPill}>{unreadCount} new</span>
                )}
              </div>
              {unreadCount > 0 && (
                <button className={styles.markAllBtn} onClick={handleMarkAllRead}>
                  Mark all as read
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className={styles.tabRow}>
              <button
                className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All ({notifications.length})
              </button>
              <button
                className={`${styles.tabBtn} ${activeTab === 'recommendation' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('recommendation')}
              >
                🧠 Recommendations (
                {notifications.filter(n => n.type === 'recommendation').length})
              </button>
              <button
                className={`${styles.tabBtn} ${activeTab === 'update' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('update')}
              >
                ⚡ Updates ({notifications.filter(n => n.type === 'update').length})
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className={styles.list}>
            {filteredNotifications.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>✨</span>
                <p className={styles.emptyTitle}>You're all caught up!</p>
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
                    {item.icon}
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
                        >
                          {item.actionLabel || 'View Details'} →
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Dismiss Button */}
                  <button
                    className={styles.dismissBtn}
                    onClick={e => handleDismiss(e, item.id)}
                    title="Dismiss"
                    aria-label="Dismiss notification"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className={styles.footer}>
              <button className={styles.clearAllBtn} onClick={handleClearAll}>
                Clear all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
