'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import StudentSidebar from '@/components/StudentSidebar'
import styles from '../../institution/institution.module.css'
import layoutStyles from '../dashboard.module.css'

const CATEGORIES = [
  { value: 'Computer Labs', icon: '🖥️' },
  { value: 'Classrooms', icon: '🏫' },
  { value: 'Laboratories', icon: '🔬' },
  { value: 'Library', icon: '📚' },
  { value: 'Training Facilities', icon: '🎯' },
  { value: 'Equipment', icon: '🛠️' },
  { value: 'Software/Licenses', icon: '💻' },
  { value: 'Seminar Halls', icon: '🏢' },
  { value: 'Other', icon: '🌐' }
]

export default function StudentCampusResources() {
  const [resources, setResources] = useState<any[]>([])
  const [stats, setStats] = useState<any>({
    availableCount: 0,
    sharedCount: 0,
    labsCount: 0,
    facilitiesCount: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [availabilityFilter, setAvailabilityFilter] = useState('all')
  const [capacityFilter, setCapacityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modals
  const [selectedResource, setSelectedResource] = useState<any>(null)

  // Booking Form States
  const [bookingDate, setBookingDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [bookingStartTime, setBookingStartTime] = useState('10:00')
  const [bookingEndTime, setBookingEndTime] = useState('11:00')
  const [bookingPurpose, setBookingPurpose] = useState('')
  const [bookingCount, setBookingCount] = useState('1')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmSubmitting, setConfirmSubmitting] = useState(false)
  const [confirmSuccess, setConfirmSuccess] = useState('')
  const [confirmError, setConfirmError] = useState('')

  const openDetailsModal = (res: any) => {
    setSelectedResource(res)
    const today = new Date()
    setBookingDate(today.toISOString().split('T')[0])
    setBookingStartTime('10:00')
    setBookingEndTime('11:00')
    setBookingPurpose('')
    setBookingCount('1')
    setConfirmSuccess('')
    setConfirmError('')
  }

  const handleBookingSubmit = async () => {
    if (!selectedResource) return
    if (!bookingPurpose.trim()) {
      setConfirmError('Please describe the purpose of your reservation request.')
      return
    }

    setConfirmSubmitting(true)
    setConfirmError('')
    setConfirmSuccess('')

    try {
      const startDateTime = new Date(`${bookingDate}T${bookingStartTime}:00`)
      const endDateTime = new Date(`${bookingDate}T${bookingEndTime}:00`)

      const response = await fetch('/api/student/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId: selectedResource.id,
          purpose: bookingPurpose.trim(),
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString()
        })
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setConfirmSuccess('Your booking request has been submitted successfully!')
        setTimeout(() => {
          setShowConfirmModal(false)
          setSelectedResource(null)
          fetchResources()
        }, 2000)
      } else {
        setConfirmError(data.error || 'Failed to submit booking request.')
      }
    } catch (err: any) {
      console.error(err)
      setConfirmError('Network error. Please try again.')
    } finally {
      setConfirmSubmitting(false)
    }
  }

  useEffect(() => {
    fetchResources()
  }, [])

  const fetchResources = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/student/resources')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setResources(data.resources || [])
      setStats(data.stats || { availableCount: 0, sharedCount: 0, labsCount: 0, facilitiesCount: 0 })
    } catch (err) {
      console.error(err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  // Get icon based on category
  const getIcon = (cat: string) => {
    const found = CATEGORIES.find(c => cat.toLowerCase().includes(c.value.toLowerCase().split('/')[0].trim()))
    return found?.icon || '🏢'
  }

  // Formatting helper
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
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

  // Filter resources
  const filteredResources = resources.filter(res => {
    const matchesSearch =
      res.name.toLowerCase().includes(search.toLowerCase()) ||
      res.description.toLowerCase().includes(search.toLowerCase()) ||
      res.location.toLowerCase().includes(search.toLowerCase())

    const matchesCategory =
      categoryFilter === 'all' ||
      res.category.toLowerCase().includes(categoryFilter.toLowerCase().split('/')[0].trim())

    const matchesAvailability =
      availabilityFilter === 'all' ||
      res.availability.toLowerCase().includes(availabilityFilter.toLowerCase())

    const matchesCapacity =
      !capacityFilter ||
      (res.capacity && res.capacity >= parseInt(capacityFilter, 10))

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'available' && (res.status === 'AVAILABLE' || res.status === 'active' || res.status === 'ACTIVE')) ||
      (statusFilter === 'booked' && res.status === 'FULLY_BOOKED') ||
      (statusFilter === 'maintenance' && res.status === 'MAINTENANCE')

    return matchesSearch && matchesCategory && matchesAvailability && matchesCapacity && matchesStatus
  })

  // Separate Shared Resources for the top section
  const sharedResources = filteredResources.filter(r => r.accessType === 'SHARED_RESOURCE')

  return (
    <div className={layoutStyles.layout}>
      <StudentSidebar />
      <div className={layoutStyles.content}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.pageTitle} style={{ fontFamily: 'Outfit, sans-serif' }}>🎓 Campus Resources</h1>
            <p className={styles.pageSubtitle}>Explore labs, facilities, training infrastructure, and other resources available through your institution.</p>
          </div>
        </header>

      <main className={styles.main}>
        {loading ? (
          // Loading skeletons
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className={styles.statsRow}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className={styles.statCard} style={{ opacity: 0.6 }}>
                  <div className={styles.statIcon} style={{ background: 'var(--border)' }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: '12px', background: 'var(--border)', width: '60%', marginBottom: '6px', borderRadius: '4px' }}></div>
                    <div style={{ height: '24px', background: 'var(--border)', width: '30%', borderRadius: '4px' }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="glass" style={{ height: '80px', opacity: 0.6 }}></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="glass" style={{ height: '280px', opacity: 0.6 }}></div>
              ))}
            </div>
          </div>
        ) : error ? (
          // Error State
          <div className="glass" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#ef4444' }}>Unable to load campus resources</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>A network error occurred while connecting to the resource server.</p>
            <button className="btn btn-primary" onClick={fetchResources}>Try Again</button>
          </div>
        ) : resources.length === 0 ? (
          // Empty State
          <div className="glass" style={{ padding: '5rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '4rem' }}>🎓</div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>No Campus Resources Available</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '480px', margin: 0 }}>
              Your institution has not added any student-accessible resources yet.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '480px', margin: 0 }}>
              Resources are managed by your institution. Check back when new facilities become available.
            </p>
            <div style={{ marginTop: '16px' }}>
              <Link href="/student/resources" className="btn btn-secondary">
                View Learning Resources →
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Stats Row */}
            <div className={styles.statsRow}>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>🟢</div>
                <div>
                  <div className={styles.statLabel}>Available Resources</div>
                  <div className={styles.statValue}>{stats.availableCount}</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>🤝</div>
                <div>
                  <div className={styles.statLabel}>Shared via Partnerships</div>
                  <div className={styles.statValue}>{stats.sharedCount}</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>🔬</div>
                <div>
                  <div className={styles.statLabel}>Available Labs</div>
                  <div className={styles.statValue}>{stats.labsCount}</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'rgba(236,72,153,0.1)', color: '#ec4899' }}>🎯</div>
                <div>
                  <div className={styles.statLabel}>Training Facilities</div>
                  <div className={styles.statValue}>{stats.facilitiesCount}</div>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="glass" style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr repeat(4, minmax(130px, 170px))', gap: '12px', alignItems: 'center' }}>
              <input
                type="text"
                className="form-input"
                placeholder="🔍 Search resources, labs, spaces..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="form-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.value}</option>
                ))}
              </select>
              <select
                className="form-select"
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
              >
                <option value="all">Availability</option>
                <option value="Mon-Fri">Mon-Fri</option>
                <option value="Sat-Sun">Weekends</option>
              </select>
              <input
                type="number"
                className="form-input"
                placeholder="👥 Min Capacity"
                value={capacityFilter}
                onChange={(e) => setCapacityFilter(e.target.value)}
              />
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="available">🟢 Available</option>
                <option value="booked">🟡 Booked</option>
                <option value="maintenance">🔴 Maintenance</option>
              </select>
            </div>

            {/* A. Partnership Resources Section */}
            {sharedResources.length > 0 && (
              <div className="glass" style={{ padding: '24px', background: 'rgba(59,130,246,0.03)', borderLeft: '4px solid #3b82f6', borderRadius: '16px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🤝 Resources Available Through Partnerships
                  <span className="badge badge-blue" style={{ fontSize: '10px', padding: '2px 8px' }}>
                    {sharedResources.length} Assets
                  </span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                  {sharedResources.map((resource) => (
                    <div key={resource.id} className="glass" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-secondary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '1.4rem' }}>{getIcon(resource.category)}</span>
                        <span className="badge badge-blue" style={{ fontSize: '10px' }}>
                          🔵 Shared with Your Institution
                        </span>
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{resource.name}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{resource.category}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        📍 {resource.location} | 👥 {resource.capacity ? `Capacity: ${resource.capacity}` : 'N/A'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Shared by: 🏫 <strong>{resource.ownerName}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                        <span className={`badge ${
                          resource.status === 'FULLY_BOOKED' ? 'badge-orange' :
                          resource.status === 'MAINTENANCE' ? 'badge-orange' :
                          'badge-green'
                        }`}>
                          {resource.status === 'FULLY_BOOKED' ? 'Booked' :
                           resource.status === 'MAINTENANCE' ? 'Maintenance' :
                           'Available'}
                        </span>
                        <button
                          className="btn btn-sm btn-ghost"
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                          onClick={() => openDetailsModal(resource)}
                        >
                          View Details →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* B. All Resources Section */}
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>All Campus Assets</h3>
              {filteredResources.length === 0 ? (
                <div className="glass" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No resources match your search or filter criteria.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                  {filteredResources.map((resource) => (
                    <div key={resource.id} className="glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '1.5rem' }}>{getIcon(resource.category)}</span>
                        <span className={`badge ${
                          resource.accessType === 'SHARED_RESOURCE' ? 'badge-blue' : 'badge-green'
                        }`} style={{ fontSize: '10px' }}>
                          {resource.accessType === 'SHARED_RESOURCE' ? '🔵 Shared with Your Institution' : '🟢 Institution Resource'}
                        </span>
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{resource.name}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{resource.category}</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', minHeight: '38px', lineBreak: 'anywhere' }}>
                        {resource.description || 'No description provided.'}
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '8px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                        <div>📍 <strong>Location:</strong> {resource.location || 'N/A'}</div>
                        <div>👥 <strong>Capacity:</strong> {resource.capacity ? `${resource.capacity}` : 'N/A'}</div>
                        <div style={{ gridColumn: 'span 2' }}>📅 <strong>Availability:</strong> {resource.availability || 'N/A'}</div>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {resource.accessType === 'SHARED_RESOURCE' ? (
                          <>Shared by: 🏫 <strong>{resource.ownerName}</strong></>
                        ) : (
                          <>Available through: 🏫 <strong>Your Institution</strong></>
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                        <span className={`badge ${
                          resource.status === 'FULLY_BOOKED' ? 'badge-orange' :
                          resource.status === 'MAINTENANCE' ? 'badge-orange' :
                          'badge-green'
                        }`}>
                          {resource.status === 'FULLY_BOOKED' ? 'Booked' :
                           resource.status === 'MAINTENANCE' ? 'Maintenance' :
                           'Available'}
                        </span>
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => openDetailsModal(resource)}
                        >
                          View Details →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Resource Details Modal */}
      {selectedResource && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="glass" style={{ width: '550px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="badge badge-purple" style={{ fontSize: '10px', marginBottom: '6px' }}>
                  {selectedResource.category}
                </span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>{selectedResource.name}</h3>
              </div>
              <button
                className="btn btn-ghost"
                style={{ padding: '4px 8px', fontSize: '18px', fontWeight: 'bold' }}
                onClick={() => setSelectedResource(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>📍 <strong>Location:</strong> {selectedResource.location || 'N/A'}</div>
              <div>👥 <strong>Capacity:</strong> {selectedResource.capacity ? `${selectedResource.capacity} students` : 'N/A'}</div>
              <div>🕐 <strong>Availability:</strong> {selectedResource.availability}</div>
              <div>🏫 <strong>Owner Institution:</strong> {selectedResource.ownerName}</div>
              <div>🛡️ <strong>Access Type:</strong> {selectedResource.accessType === 'SHARED_RESOURCE' ? '🔵 Shared with Your Institution' : '🟢 Host Institution Resource'}</div>
              
              {selectedResource.description && (
                <div style={{ marginTop: '4px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                  <strong>Description:</strong>
                  <p style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>{selectedResource.description}</p>
                </div>
              )}

              {selectedResource.facilities && (
                <div style={{ marginTop: '4px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                  <strong>Facilities & Specifications:</strong>
                  <p style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>{selectedResource.facilities}</p>
                </div>
              )}
            </div>

            {/* Check Availability Section */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '4px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>📅 Check Availability & Book</h4>
              
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ fontSize: '12px' }}>Select Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={bookingDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBookingDate(e.target.value)}
                />
              </div>

              {/* Hourly Timeline */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontSize: '12px', marginBottom: '8px', display: 'block' }}>Daily Slots Schedule (Select a Slot to Prefill)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {[
                    { start: '09:00', end: '10:00' },
                    { start: '10:00', end: '11:00' },
                    { start: '11:00', end: '12:00' },
                    { start: '12:00', end: '13:00' },
                    { start: '13:00', end: '14:00' },
                    { start: '14:00', end: '15:00' },
                    { start: '15:00', end: '16:00' },
                    { start: '16:00', end: '17:00' }
                  ].map((slot) => {
                    // Check if overlaps
                    const isBooked = selectedResource.bookings?.some((b: any) => {
                      const bStart = new Date(b.startTime)
                      const bEnd = new Date(b.endTime)
                      const slotStart = new Date(`${bookingDate}T${slot.start}:00`)
                      const slotEnd = new Date(`${bookingDate}T${slot.end}:00`)
                      return b.status !== 'cancelled' && b.status !== 'rejected' && bStart < slotEnd && bEnd > slotStart
                    })

                    return (
                      <button
                        key={slot.start}
                        type="button"
                        onClick={() => {
                          if (!isBooked) {
                            setBookingStartTime(slot.start)
                            setBookingEndTime(slot.end)
                          }
                        }}
                        disabled={isBooked}
                        style={{
                          padding: '6px 4px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          background: isBooked ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.05)',
                          color: isBooked ? '#ef4444' : '#10b981',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: isBooked ? 'not-allowed' : 'pointer',
                          textAlign: 'center'
                        }}
                      >
                        {slot.start} - {slot.end}
                        <div style={{ fontSize: '9px', fontWeight: 400, marginTop: '2px' }}>
                          {isBooked ? '🔴 Booked' : '🟢 Free'}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Time fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px' }}>Start Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={bookingStartTime}
                    onChange={(e) => setBookingStartTime(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px' }}>End Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={bookingEndTime}
                    onChange={(e) => setBookingEndTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Purpose field */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontSize: '12px' }}>Purpose of Booking</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '50px', resize: 'vertical' }}
                  placeholder="e.g. Lab experiment, project review session, personal coding study..."
                  value={bookingPurpose}
                  onChange={(e) => setBookingPurpose(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedResource(null)}>Close</button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowConfirmModal(true)}
                >
                  Request Booking
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Booking Confirmation Dialog Modal */}
      {showConfirmModal && selectedResource && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="glass" style={{ width: '420px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Confirm Booking Request</h3>
            
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>🖥️ <strong>Resource:</strong> {selectedResource.name}</div>
              <div>📅 <strong>Date:</strong> {bookingDate}</div>
              <div>⏰ <strong>Time:</strong> {bookingStartTime} - {bookingEndTime}</div>
              <div>👥 <strong>Number of Students:</strong> 1</div>
              <div>💡 <strong>Purpose:</strong> {bookingPurpose || 'N/A'}</div>
            </div>

            {confirmError && (
              <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 500 }}>
                ⚠️ {confirmError}
              </div>
            )}

            {confirmSuccess && (
              <div style={{ padding: '8px 12px', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 500 }}>
                🎉 {confirmSuccess}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setShowConfirmModal(false)} disabled={confirmSubmitting}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleBookingSubmit}
                disabled={confirmSubmitting}
              >
                {confirmSubmitting ? 'Submitting...' : 'Submit Booking Request'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
