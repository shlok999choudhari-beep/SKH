'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import StudentSidebar from '@/components/StudentSidebar'
import styles from '../../institution/institution.module.css'
import layoutStyles from '../dashboard.module.css'

export default function StudentBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [actionSubmitting, setActionSubmitting] = useState(false)

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
    }
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

  // Format Helper
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  // Group Bookings
  const now = new Date()
  
  const upcomingBookings = bookings.filter(b => {
    const isApproved = b.status === 'approved' || b.status === 'confirmed'
    const isFuture = new Date(b.startTime) > now
    return isApproved && isFuture
  })

  const pendingBookings = bookings.filter(b => b.status === 'pending')

  const completedBookings = bookings.filter(b => {
    const isPast = new Date(b.startTime) <= now
    const isApproved = b.status === 'approved' || b.status === 'confirmed'
    const isCancelledOrRejected = b.status === 'cancelled' || b.status === 'rejected'
    return isCancelledOrRejected || (isApproved && isPast)
  })

  // Dynamic notification messages for the alert banner feed (Recent status changes)
  const notifications = bookings.slice(0, 5).map(b => {
    if (b.status === 'approved' || b.status === 'confirmed') {
      return {
        id: b.id,
        type: 'approved',
        message: `Your booking request for ${b.resourceName} on ${formatDate(b.startTime)} has been approved.`,
        date: b.createdAt
      }
    } else if (b.status === 'rejected') {
      return {
        id: b.id,
        type: 'rejected',
        message: `Your booking request for ${b.resourceName} was rejected. Reason: ${b.rejectionReason || 'N/A'}.`,
        date: b.createdAt
      }
    } else {
      return {
        id: b.id,
        type: 'pending',
        message: `Your booking request for ${b.resourceName} has been submitted.`,
        date: b.createdAt
      }
    }
  })

  return (
    <div className={layoutStyles.layout}>
      <StudentSidebar />
      <div className={layoutStyles.content}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.pageTitle} style={{ fontFamily: 'Outfit, sans-serif' }}>📅 My Bookings</h1>
            <p className={styles.pageSubtitle}>Manage your campus facility reservations, schedules, and approval logs.</p>
          </div>
        </header>

        <main className={styles.main}>
          {loading ? (
            <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>Loading reservations...</div>
          ) : error ? (
            <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: '#ef4444', marginBottom: '16px' }}>Failed to load reservations</p>
              <button className="btn btn-primary" onClick={fetchBookings}>Try Again</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Dynamic Notification Banners */}
              {notifications.length > 0 && (
                <div className="glass" style={{ padding: '16px', borderLeft: '4px solid var(--accent-purple)' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>🔔 Booking Notifications</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {notifications.map((n, idx) => (
                      <div key={idx} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{n.type === 'approved' ? '🟢' : n.type === 'rejected' ? '🔴' : '🟡'}</span>
                        <span>{n.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {bookings.length === 0 ? (
                <div className="glass" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>You have no resource bookings yet</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Reserve seminar halls, lab rooms, or specialized systems to get started.</p>
                  <Link href="/student/campus-resources" className="btn btn-primary">Book Campus Resources →</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  
                  {/* A. Upcoming Confirmed Section */}
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🟢 Upcoming Bookings
                      <span className="badge badge-green" style={{ fontSize: '10px' }}>{upcomingBookings.length} Approved</span>
                    </h3>
                    {upcomingBookings.length === 0 ? (
                      <div className="glass" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No upcoming confirmed reservations.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                        {upcomingBookings.map(b => (
                          <div key={b.id} className="glass" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(16,185,129,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <h4 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{b.resourceName}</h4>
                              <span className="badge badge-green" style={{ fontSize: '10px' }}>Confirmed</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              <div>📍 <strong>Location:</strong> {b.location || 'N/A'}</div>
                              <div>📅 <strong>Date:</strong> {formatDate(b.startTime)}</div>
                              <div>⏰ <strong>Time:</strong> {formatTime(b.startTime)} - {formatTime(b.endTime)}</div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                              <button className="btn btn-sm btn-ghost" onClick={() => setViewingBooking(b)}>View Details</button>
                              <button className="btn btn-sm btn-danger" onClick={() => setBookingToCancel(b)}>Cancel</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* B. Pending Section */}
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🟡 Pending Approval
                      <span className="badge badge-orange" style={{ fontSize: '10px' }}>{pendingBookings.length} Requests</span>
                    </h3>
                    {pendingBookings.length === 0 ? (
                      <div className="glass" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No pending booking requests.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                        {pendingBookings.map(b => (
                          <div key={b.id} className="glass" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(251,191,36,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <h4 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{b.resourceName}</h4>
                              <span className="badge badge-orange" style={{ fontSize: '10px' }}>Pending Approval</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              <div>📍 <strong>Location:</strong> {b.location || 'N/A'}</div>
                              <div>📅 <strong>Date:</strong> {formatDate(b.startTime)}</div>
                              <div>⏰ <strong>Time:</strong> {formatTime(b.startTime)} - {formatTime(b.endTime)}</div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                              <button className="btn btn-sm btn-ghost" onClick={() => setViewingBooking(b)}>View Details</button>
                              <button className="btn btn-sm btn-danger" onClick={() => setBookingToCancel(b)}>Cancel</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* C. Completed & Cancelled Section */}
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>Reservation History</h3>
                    {completedBookings.length === 0 ? (
                      <div className="glass" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No previous booking history.
                      </div>
                    ) : (
                      <div className="glass" style={{ padding: 0, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)' }}>
                              <th style={{ padding: '12px 16px' }}>Resource</th>
                              <th style={{ padding: '12px 16px' }}>Schedule</th>
                              <th style={{ padding: '12px 16px' }}>Status</th>
                              <th style={{ padding: '12px 16px' }}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {completedBookings.map(b => (
                              <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '12px 16px' }}>
                                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.resourceName}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.category} | {b.location}</div>
                                </td>
                                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                                  <div>{formatDate(b.startTime)}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatTime(b.startTime)} - {formatTime(b.endTime)}</div>
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                  <span className={`badge ${
                                    b.status === 'rejected' ? 'badge-orange' :
                                    b.status === 'cancelled' ? 'badge-orange' :
                                    'badge-green'
                                  }`} style={{ fontSize: '10px' }}>
                                    {b.status === 'rejected' ? 'Rejected' :
                                     b.status === 'cancelled' ? 'Cancelled' :
                                     'Completed'}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                  <button className="btn btn-sm btn-ghost" onClick={() => setViewingBooking(b)}>Details</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Confirmation Cancel Modal */}
      {bookingToCancel && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="glass" style={{ width: '400px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Cancel Reservation?</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Are you sure you want to cancel your booking request for <strong>{bookingToCancel.resourceName}</strong> on {formatDate(bookingToCancel.startTime)}?
            </p>
            <p style={{ fontSize: '0.75rem', color: '#f59e0b', margin: 0 }}>
              ⚠️ This action is irreversible and the time slot will immediately become available for other students.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setBookingToCancel(null)} disabled={actionSubmitting}>No, Keep It</button>
              <button className="btn btn-danger" onClick={handleCancelBooking} disabled={actionSubmitting}>
                {actionSubmitting ? 'Cancelling...' : 'Yes, Cancel Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Booking Details Modal */}
      {viewingBooking && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="glass" style={{ width: '450px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="badge badge-purple" style={{ fontSize: '10px', marginBottom: '6px' }}>{viewingBooking.category}</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Booking Details</h3>
              </div>
              <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '18px', fontWeight: 'bold' }} onClick={() => setViewingBooking(null)}>✕</button>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>🖥️ <strong>Resource Name:</strong> {viewingBooking.resourceName}</div>
              <div>📍 <strong>Location:</strong> {viewingBooking.location || 'N/A'}</div>
              <div>🏫 <strong>Owner Institution:</strong> {viewingBooking.ownerName}</div>
              <div>📅 <strong>Date:</strong> {formatDate(viewingBooking.startTime)}</div>
              <div>⏰ <strong>Time:</strong> {formatTime(viewingBooking.startTime)} - {formatTime(viewingBooking.endTime)}</div>
              <div>💡 <strong>Purpose:</strong> {viewingBooking.purpose || 'N/A'}</div>
              
              <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong>Status:</strong>
                <span className={`badge ${
                  viewingBooking.status === 'pending' ? 'badge-orange' :
                  viewingBooking.status === 'rejected' ? 'badge-orange' :
                  viewingBooking.status === 'cancelled' ? 'badge-orange' :
                  'badge-green'
                }`} style={{ fontSize: '10px' }}>
                  {viewingBooking.status === 'pending' ? 'Pending Approval' :
                   viewingBooking.status === 'rejected' ? 'Rejected' :
                   viewingBooking.status === 'cancelled' ? 'Cancelled' :
                   'Confirmed'}
                </span>
              </div>

              {viewingBooking.status === 'rejected' && (
                <div style={{ marginTop: '8px', padding: '10px', background: 'rgba(239,68,68,0.05)', borderLeft: '3px solid #ef4444', borderRadius: '4px' }}>
                  <strong style={{ color: '#ef4444' }}>Rejection Reason:</strong>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>{viewingBooking.rejectionReason}</p>
                </div>
              )}

              <div style={{ marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Booking ID: <strong>PIQ-BOOK-{viewingBooking.id.toString().padStart(4, '0')}</strong>
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setViewingBooking(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
