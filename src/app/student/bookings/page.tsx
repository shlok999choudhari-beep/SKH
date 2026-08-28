'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import StudentSidebar from '@/components/StudentSidebar'
import BackButton from '@/components/BackButton'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import layoutStyles from '../dashboard.module.css'
import styles from './bookings.module.css'
import {
  CalendarDays,
  Bell,
  CheckCircle2,
  CircleX,
  Clock,
  MapPin,
  Calendar,
  ArrowRight,
  TriangleAlert,
  X,
  Laptop,
  School,
  Lightbulb,
  Search,
  RefreshCw,
  Plus,
  Presentation,
  Landmark,
  FileCheck2,
  Sparkles,
  Building2,
  Download,
  AlertCircle
} from 'lucide-react'

const getCategoryIcon = (category: string = '') => {
  const cat = category.toLowerCase()
  if (cat.includes('lab') || cat.includes('computer')) return <Laptop size={22} color="#60a5fa" />
  if (cat.includes('seminar') || cat.includes('hall')) return <Building2 size={22} color="#c084fc" />
  if (cat.includes('trainer') || cat.includes('mentor')) return <Presentation size={22} color="#34d399" />
  return <Landmark size={22} color="#fbbf24" />
}

export default function StudentBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const [actionSubmitting, setActionSubmitting] = useState(false)

  // Filter & Search states
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'pending' | 'history'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [bookingToCancel, setBookingToCancel] = useState<any>(null)
  const [viewingBooking, setViewingBooking] = useState<any>(null)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/student/bookings')
      const data = await res.json()
      if (res.ok && data.success) {
        setBookings(data.bookings || [])
      } else {
        setError(true)
      }
    } catch (err) {
      console.error('Error fetching bookings:', err)
      setError(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleManualRefresh = () => {
    setRefreshing(true)
    fetchBookings()
  }

  const handleCancelBooking = async () => {
    if (!bookingToCancel) return
    setActionSubmitting(true)
    try {
      const res = await fetch(`/api/student/bookings/${bookingToCancel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setBookingToCancel(null)
        fetchBookings()
      } else {
        alert(data.error || 'Failed to cancel booking')
      }
    } catch (err) {
      console.error('Cancel booking error:', err)
      alert('Network error. Please try again.')
    } finally {
      setActionSubmitting(false)
    }
  }

  // Formatting helpers
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (timeStr: string) => {
    if (!timeStr) return 'N/A'
    return new Date(timeStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  // Filter logic
  const now = new Date()

  const upcomingBookings = useMemo(() => {
    return bookings.filter(b => {
      const isApproved = b.status?.toLowerCase() === 'approved' || b.status?.toLowerCase() === 'confirmed'
      const isFuture = new Date(b.startTime) > now
      return isApproved && isFuture
    })
  }, [bookings, now])

  const pendingBookings = useMemo(() => {
    return bookings.filter(b => b.status?.toLowerCase() === 'pending')
  }, [bookings])

  const completedBookings = useMemo(() => {
    return bookings.filter(b => {
      const isPast = new Date(b.startTime) <= now
      const isApproved = b.status?.toLowerCase() === 'approved' || b.status?.toLowerCase() === 'confirmed'
      const isCancelledOrRejected = b.status?.toLowerCase() === 'cancelled' || b.status?.toLowerCase() === 'rejected'
      return isCancelledOrRejected || (isApproved && isPast)
    })
  }, [bookings, now])

  // Filtered list by active tab and search
  const filteredBookings = useMemo(() => {
    let list = bookings
    if (activeTab === 'upcoming') list = upcomingBookings
    else if (activeTab === 'pending') list = pendingBookings
    else if (activeTab === 'history') list = completedBookings

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(b => 
        (b.resourceName && b.resourceName.toLowerCase().includes(q)) ||
        (b.location && b.location.toLowerCase().includes(q)) ||
        (b.category && b.category.toLowerCase().includes(q)) ||
        (b.purpose && b.purpose.toLowerCase().includes(q))
      )
    }
    return list
  }, [bookings, activeTab, upcomingBookings, pendingBookings, completedBookings, searchQuery])

  // Dynamic notifications feed
  const notifications = useMemo(() => {
    return bookings.slice(0, 3).map(b => {
      const st = b.status?.toLowerCase()
      if (st === 'approved' || st === 'confirmed') {
        return {
          id: b.id,
          type: 'approved',
          message: `Booking for ${b.resourceName} on ${formatDate(b.startTime)} is confirmed.`,
          date: b.createdAt
        }
      } else if (st === 'rejected') {
        return {
          id: b.id,
          type: 'rejected',
          message: `Booking for ${b.resourceName} was declined. ${b.rejectionReason ? `Reason: ${b.rejectionReason}` : ''}`,
          date: b.createdAt
        }
      } else {
        return {
          id: b.id,
          type: 'pending',
          message: `Reservation request for ${b.resourceName} is pending admin review.`,
          date: b.createdAt
        }
      }
    })
  }, [bookings])

  return (
    <div className={layoutStyles.layout}>
      <StudentSidebar />

      <div className={layoutStyles.content}>
        {/* ── STICKY HEADER ── */}
        <header className={layoutStyles.header}>
          <div className={styles.headerTitleRow}>
            <BackButton fallbackHref="/student/campus" />
            <div className={styles.headerIcon}>
              <CalendarDays size={22} strokeWidth={2} />
            </div>
            <div>
              <h1 className={layoutStyles.pageTitle}>My Bookings & Reservations</h1>
              <p className={layoutStyles.pageSubtitle}>
                Track campus facility bookings, lab reservations, and 1-on-1 trainer schedules.
              </p>
            </div>
          </div>

          <div className={layoutStyles.headerActions}>
            <button
              onClick={handleManualRefresh}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              disabled={refreshing}
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>
            <Link
              href="/student/campus-resources"
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={15} />
              <span>Book Space</span>
            </Link>
          </div>
        </header>

        {/* ── MAIN CONTENT ── */}
        <main className={layoutStyles.main}>
          <div className={styles.pageContainer}>

            {/* ── STATS CARDS ROW ── */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.1))', color: '#c084fc' }}>
                  <CalendarDays size={22} />
                </div>
                <div>
                  <div className={styles.statValue}>{bookings.length}</div>
                  <div className={styles.statLabel}>Total Bookings</div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.1))', color: '#34d399' }}>
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <div className={styles.statValue} style={{ color: '#34d399' }}>{upcomingBookings.length}</div>
                  <div className={styles.statLabel}>Confirmed & Upcoming</div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(236,72,153,0.1))', color: '#fbbf24' }}>
                  <Clock size={22} />
                </div>
                <div>
                  <div className={styles.statValue} style={{ color: '#fbbf24' }}>{pendingBookings.length}</div>
                  <div className={styles.statLabel}>Pending Approval</div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.1))', color: '#60a5fa' }}>
                  <FileCheck2 size={22} />
                </div>
                <div>
                  <div className={styles.statValue}>{completedBookings.length}</div>
                  <div className={styles.statLabel}>Past / History</div>
                </div>
              </div>
            </div>

            {/* ── NOTIFICATIONS CARD (IF ANY) ── */}
            {notifications.length > 0 && (
              <div className={styles.notificationCard}>
                <div className={styles.notificationHeader}>
                  <div className={styles.notificationTitle}>
                    <Bell size={16} color="#c084fc" />
                    <span>Recent Booking Updates</span>
                  </div>
                  <span className={styles.notificationBadge}>Activity Stream</span>
                </div>
                <div className={styles.notificationList}>
                  {notifications.map((n, idx) => (
                    <div key={idx} className={styles.notificationItem}>
                      {n.type === 'approved' ? (
                        <CheckCircle2 size={15} color="#34d399" />
                      ) : n.type === 'rejected' ? (
                        <CircleX size={15} color="#f87171" />
                      ) : (
                        <Clock size={15} color="#fbbf24" />
                      )}
                      <span className={styles.notificationMsg}>{n.message}</span>
                      {n.date && (
                        <span className={styles.notificationTime}>{formatDate(n.date)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── TOOLBAR: FILTER TABS & SEARCH ── */}
            <div className={styles.toolbar}>
              <div className={styles.tabGroup}>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabBtnActive : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  <span>All Reservations</span>
                  <span className={styles.tabCount}>{bookings.length}</span>
                </button>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${activeTab === 'upcoming' ? styles.tabBtnActive : ''}`}
                  onClick={() => setActiveTab('upcoming')}
                >
                  <span>Upcoming</span>
                  <span className={styles.tabCount}>{upcomingBookings.length}</span>
                </button>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${activeTab === 'pending' ? styles.tabBtnActive : ''}`}
                  onClick={() => setActiveTab('pending')}
                >
                  <span>Pending</span>
                  <span className={styles.tabCount}>{pendingBookings.length}</span>
                </button>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${activeTab === 'history' ? styles.tabBtnActive : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  <span>History</span>
                  <span className={styles.tabCount}>{completedBookings.length}</span>
                </button>
              </div>

              <div className={styles.searchBox}>
                <Search size={15} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search bookings..."
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* ── MAIN CONTENT AREA ── */}
            {loading ? (
              <div className={styles.emptyCard} style={{ borderStyle: 'solid' }}>
                <MorphingInfinity className="size-16" style={{ width: '56px', height: '56px', color: '#8b5cf6' }} />
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Loading reservation cards...</p>
              </div>
            ) : error ? (
              <div className={styles.emptyCard}>
                <div className={styles.emptyIconWrap} style={{ color: '#f87171' }}>
                  <TriangleAlert size={28} />
                </div>
                <h3 className={styles.emptyTitle}>Unable to load bookings</h3>
                <p className={styles.emptyDesc}>There was a connection issue loading your schedule data.</p>
                <button className="btn btn-primary" onClick={fetchBookings}>Try Again</button>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className={styles.emptyCard}>
                <div className={styles.emptyIconWrap}>
                  <CalendarDays size={28} />
                </div>
                <h3 className={styles.emptyTitle}>
                  {searchQuery ? 'No matching bookings found' : 
                   activeTab === 'upcoming' ? 'No upcoming confirmed reservations' :
                   activeTab === 'pending' ? 'No pending requests at this time' :
                   activeTab === 'history' ? 'No completed reservation history' :
                   'You have no resource bookings yet'}
                </h3>
                <p className={styles.emptyDesc}>
                  {searchQuery ? 'Try adjusting your search keywords or clear filters.' :
                   'Browse available campus computer labs, seminar halls, hardware pods, or schedule 1-on-1 industry trainer sessions.'}
                </p>
                <div className={styles.emptyActions}>
                  <Link href="/student/campus-resources" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Landmark size={14} />
                    <span>Explore Campus Spaces</span>
                  </Link>
                  <Link href="/student/trainers" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Presentation size={14} />
                    <span>Explore Industry Trainers</span>
                  </Link>
                </div>
              </div>
            ) : (
              /* ── CARDS GRID ── */
              <div className={styles.bookingsGrid}>
                {filteredBookings.map((b) => {
                  const statusLower = (b.status || 'pending').toLowerCase()
                  const isApproved = statusLower === 'approved' || statusLower === 'confirmed'
                  const isPending = statusLower === 'pending'
                  const isRejected = statusLower === 'rejected'
                  const isCancelled = statusLower === 'cancelled'
                  const isPast = new Date(b.startTime) <= now

                  const accentGrad = isApproved 
                    ? 'linear-gradient(90deg, #10b981, #34d399)'
                    : isPending
                    ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                    : isRejected || isCancelled
                    ? 'linear-gradient(90deg, #ef4444, #f87171)'
                    : 'linear-gradient(90deg, #8b5cf6, #c084fc)'

                  return (
                    <div
                      key={b.id}
                      className={styles.bookingCard}
                      style={{ '--card-accent': accentGrad } as React.CSSProperties}
                    >
                      <div className={styles.cardTopAccent} />

                      {/* Header */}
                      <div className={styles.cardHeader}>
                        <div className={styles.resourceWrapper}>
                          <div
                            className={styles.resourceIcon}
                            style={{
                              background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))'
                            }}
                          >
                            {getCategoryIcon(b.category || b.resourceName)}
                          </div>
                          <div className={styles.resourceTitleGroup}>
                            <span className={styles.resourceCategory}>{b.category || 'Facility Resource'}</span>
                            <h4 className={styles.resourceName} title={b.resourceName}>{b.resourceName}</h4>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`${styles.statusBadge} ${
                            isApproved ? styles.statusConfirmed :
                            isPending ? styles.statusPending :
                            isRejected || isCancelled ? styles.statusRejected :
                            styles.statusCompleted
                          }`}
                        >
                          <span className={styles.pulseDot} />
                          <span>
                            {isApproved ? (isPast ? 'Completed' : 'Confirmed') :
                             isPending ? 'Pending Approval' :
                             isRejected ? 'Rejected' :
                             isCancelled ? 'Cancelled' :
                             'Completed'}
                          </span>
                        </span>
                      </div>

                      {/* Schedule Block */}
                      <div className={styles.scheduleBlock}>
                        <div className={styles.scheduleItem}>
                          <Calendar size={18} className={styles.scheduleIcon} />
                          <div className={styles.scheduleText}>
                            <span className={styles.scheduleLabel}>Date</span>
                            <span className={styles.scheduleValue}>{formatDate(b.startTime)}</span>
                          </div>
                        </div>
                        <div className={styles.scheduleItem}>
                          <Clock size={18} className={styles.scheduleIcon} />
                          <div className={styles.scheduleText}>
                            <span className={styles.scheduleLabel}>Time Slot</span>
                            <span className={styles.scheduleValue}>{formatTime(b.startTime)} – {formatTime(b.endTime)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Metadata List */}
                      <div className={styles.metaList}>
                        <div className={styles.metaItem}>
                          <MapPin size={14} className={styles.metaIcon} />
                          <span>Location: <strong className={styles.metaValue}>{b.location || 'Main Campus'}</strong></span>
                        </div>

                        {b.ownerName && (
                          <div className={styles.metaItem}>
                            <School size={14} className={styles.metaIcon} />
                            <span>Host: <strong className={styles.metaValue}>{b.ownerName}</strong></span>
                          </div>
                        )}

                        {b.purpose && (
                          <div className={styles.purposeBox}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                              <Lightbulb size={12} color="#fbbf24" />
                              <span>Purpose</span>
                            </div>
                            <span>{b.purpose}</span>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className={styles.cardFooter}>
                        <span className={styles.bookingIdBadge}>
                          PIQ-{b.id.toString().padStart(4, '0')}
                        </span>

                        <div className={styles.actionBtnGroup}>
                          <button
                            type="button"
                            className={styles.btnDetails}
                            onClick={() => setViewingBooking(b)}
                          >
                            <span>View Details</span>
                          </button>

                          {(isPending || (isApproved && !isPast)) && (
                            <button
                              type="button"
                              className={styles.btnCancel}
                              onClick={() => setBookingToCancel(b)}
                            >
                              <span>Cancel</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

          </div>
        </main>
      </div>

      {/* ── CANCEL CONFIRMATION MODAL ── */}
      {bookingToCancel && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="glass" style={{ width: '420px', maxWidth: '90vw', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', borderRadius: '16px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(18, 12, 30, 0.95)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
                <TriangleAlert size={20} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Cancel Reservation?</h3>
            </div>
            
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Are you sure you want to cancel your reservation for <strong>{bookingToCancel.resourceName}</strong> on <strong>{formatDate(bookingToCancel.startTime)}</strong>?
            </p>

            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: '0.8rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>This action cannot be undone and your slot will be reopened for other students.</span>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setBookingToCancel(null)} disabled={actionSubmitting}>
                Keep Reservation
              </button>
              <button
                className="btn btn-sm"
                onClick={handleCancelBooking}
                disabled={actionSubmitting}
                style={{ background: '#ef4444', color: '#ffffff', borderColor: '#ef4444' }}
              >
                {actionSubmitting ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW BOOKING DETAILS MODAL ── */}
      {viewingBooking && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="glass" style={{ width: '480px', maxWidth: '90vw', padding: '26px', display: 'flex', flexDirection: 'column', gap: '18px', borderRadius: '16px', border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(18, 12, 34, 0.95)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getCategoryIcon(viewingBooking.category || viewingBooking.resourceName)}
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#c084fc', textTransform: 'uppercase' }}>
                    {viewingBooking.category || 'Resource'}
                  </span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {viewingBooking.resourceName}
                  </h3>
                </div>
              </div>
              <button
                className="btn btn-ghost"
                style={{ padding: '4px 8px', display: 'flex', alignItems: 'center' }}
                onClick={() => setViewingBooking(null)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Detail Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Status</span>
                <span style={{ fontWeight: 700, color: viewingBooking.status === 'approved' ? '#34d399' : viewingBooking.status === 'rejected' ? '#f87171' : '#fbbf24', textTransform: 'capitalize' }}>
                  {viewingBooking.status || 'Pending'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={15} color="#c084fc" />
                <span>Date: <strong style={{ color: 'var(--text-primary)' }}>{formatDate(viewingBooking.startTime)}</strong></span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={15} color="#c084fc" />
                <span>Time: <strong style={{ color: 'var(--text-primary)' }}>{formatTime(viewingBooking.startTime)} – {formatTime(viewingBooking.endTime)}</strong></span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={15} color="#60a5fa" />
                <span>Location: <strong style={{ color: 'var(--text-primary)' }}>{viewingBooking.location || 'Campus Center'}</strong></span>
              </div>

              {viewingBooking.ownerName && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <School size={15} color="#34d399" />
                  <span>Host: <strong style={{ color: 'var(--text-primary)' }}>{viewingBooking.ownerName}</strong></span>
                </div>
              )}

              {viewingBooking.purpose && (
                <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginTop: '4px' }}>
                  <div style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 600, marginBottom: '2px' }}>Purpose of Booking:</div>
                  <div style={{ color: 'var(--text-primary)', fontSize: '0.825rem' }}>{viewingBooking.purpose}</div>
                </div>
              )}

              {viewingBooking.rejectionReason && (
                <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
                  <strong>Rejection Note:</strong> {viewingBooking.rejectionReason}
                </div>
              )}

              <div style={{ marginTop: '6px', paddingTop: '10px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>Booking Reference:</span>
                <span style={{ fontFamily: 'Geist Mono, monospace', fontWeight: 700, color: 'var(--text-primary)' }}>
                  PIQ-BOOK-{viewingBooking.id.toString().padStart(4, '0')}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setViewingBooking(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
