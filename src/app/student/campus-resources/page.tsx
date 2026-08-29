'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import StudentSidebar from '@/components/StudentSidebar'
import BackButton from '@/components/BackButton'
import styles from '../../institution/institution.module.css'
import layoutStyles from '../dashboard.module.css'
import {
  Landmark,
  CheckCircle2,
  Handshake,
  FlaskConical,
  Target,
  Search,
  Users,
  MapPin,
  Calendar,
  School,
  ArrowRight,
  Clock,
  ShieldCheck,
  Laptop,
  Lightbulb,
  TriangleAlert,
  X,
  BookOpen,
  Wrench,
  Building2,
  Globe
} from 'lucide-react'

const getCategoryIconComponent = (cat: string) => {
  const lower = cat.toLowerCase()
  if (lower.includes('lab') && lower.includes('computer')) return <Laptop size={20} color="#3b82f6" />
  if (lower.includes('lab')) return <FlaskConical size={20} color="#a855f7" />
  if (lower.includes('classroom')) return <School size={20} color="#10b981" />
  if (lower.includes('library')) return <BookOpen size={20} color="#f59e0b" />
  if (lower.includes('training') || lower.includes('facility')) return <Target size={20} color="#ec4899" />
  if (lower.includes('equipment')) return <Wrench size={20} color="#6366f1" />
  if (lower.includes('software')) return <Laptop size={20} color="#06b6d4" />
  if (lower.includes('seminar') || lower.includes('hall')) return <Building2 size={20} color="#8b5cf6" />
  return <Globe size={20} color="#64748b" />
}

const CATEGORIES = [
  { value: 'Computer Labs' },
  { value: 'Classrooms' },
  { value: 'Laboratories' },
  { value: 'Library' },
  { value: 'Training Facilities' },
  { value: 'Equipment' },
  { value: 'Software/Licenses' },
  { value: 'Seminar Halls' },
  { value: 'Other' }
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
      const data = await res.json()
      if (res.ok && data.resources) {
        setResources(data.resources || [])
        setStats(data.stats || { availableCount: 0, sharedCount: 0, labsCount: 0, facilitiesCount: 0 })
      } else {
        setError(true)
      }
    } catch (err) {
      console.error('Error fetching resources:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <BackButton fallbackHref="/student/campus" />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Landmark size={24} strokeWidth={2} color="#8b5cf6" />
                <h1 className={styles.pageTitle} style={{ fontFamily: 'Outfit, sans-serif' }}>Campus Resources</h1>
              </div>
              <p className={styles.pageSubtitle}>Explore labs, facilities, training infrastructure, and other resources available through your institution.</p>
            </div>
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
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
              <TriangleAlert size={48} strokeWidth={1.5} color="#ef4444" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#ef4444' }}>Unable to load campus resources</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>A network error occurred while connecting to the resource server.</p>
            <button className="btn btn-primary" onClick={fetchResources}>Try Again</button>
          </div>
        ) : resources.length === 0 ? (
          // Empty State
          <div className="glass" style={{ padding: '5rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Landmark size={48} strokeWidth={1.5} color="#8b5cf6" />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>No Campus Resources Available</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '480px', margin: 0 }}>
              Your institution has not added any student-accessible resources yet.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '480px', margin: 0 }}>
              Resources are managed by your institution. Check back when new facilities become available.
            </p>
            <div style={{ marginTop: '16px' }}>
              <Link href="/student/resources" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span>View Learning Resources</span>
                <ArrowRight size={14} strokeWidth={2} />
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Stats Row */}
            <div className={styles.statsRow}>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={20} strokeWidth={2} color="#10b981" />
                </div>
                <div>
                  <div className={styles.statLabel}>Available Resources</div>
                  <div className={styles.statValue}>{stats.availableCount}</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Handshake size={20} strokeWidth={2} color="#3b82f6" />
                </div>
                <div>
                  <div className={styles.statLabel}>Shared via Partnerships</div>
                  <div className={styles.statValue}>{stats.sharedCount}</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FlaskConical size={20} strokeWidth={2} color="#a855f7" />
                </div>
                <div>
                  <div className={styles.statLabel}>Available Labs</div>
                  <div className={styles.statValue}>{stats.labsCount}</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'rgba(236,72,153,0.1)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Target size={20} strokeWidth={2} color="#ec4899" />
                </div>
                <div>
                  <div className={styles.statLabel}>Training Facilities</div>
                  <div className={styles.statValue}>{stats.facilitiesCount}</div>
                </div>
              </div>
            </div>


            {/* Filter Bar */}
            <div className="glass" style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 170px), 1fr))', gap: '12px', alignItems: 'center' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search learning resources, labs, spaces..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ minWidth: '160px' }}
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
                placeholder="Min Capacity"
                value={capacityFilter}
                onChange={(e) => setCapacityFilter(e.target.value)}
              />
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="available">Available</option>
                <option value="booked">Booked</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>


            {/* A. Partnership Resources Section */}
            {sharedResources.length > 0 && (
              <div className="glass" style={{ padding: '24px', background: 'rgba(59,130,246,0.03)', borderLeft: '4px solid #3b82f6', borderRadius: '16px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Handshake size={18} strokeWidth={2} color="#3b82f6" />
                  <span>Resources Available Through Partnerships</span>
                  <span className="badge badge-blue" style={{ fontSize: '10px', padding: '2px 8px' }}>
                    {sharedResources.length} Assets
                  </span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                  {sharedResources.map((resource) => (
                    <div key={resource.id} className="glass" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-secondary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {getCategoryIconComponent(resource.category)}
                        </div>
                        <span className="badge badge-blue" style={{ fontSize: '10px' }}>
                          Shared with Your Institution
                        </span>
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{resource.name}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{resource.category}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} strokeWidth={2} />
                          <span>{resource.location}</span>
                        </span>
                        <span>•</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Users size={12} strokeWidth={2} />
                          <span>{resource.capacity ? `Capacity: ${resource.capacity}` : 'N/A'}</span>
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <School size={13} strokeWidth={2} color="#8b5cf6" />
                        <span>Shared by: <strong>{resource.ownerName}</strong></span>
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
                          style={{ padding: '4px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => openDetailsModal(resource)}
                        >
                          <span>View Details</span>
                          <ArrowRight size={12} strokeWidth={2} />
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
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {getCategoryIconComponent(resource.category)}
                        </div>
                        <span className={`badge ${
                          resource.accessType === 'SHARED_RESOURCE' ? 'badge-blue' : 'badge-green'
                        }`} style={{ fontSize: '10px' }}>
                          {resource.accessType === 'SHARED_RESOURCE' ? 'Shared with Your Institution' : 'Institution Resource'}
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} strokeWidth={2} />
                          <span><strong>Location:</strong> {resource.location || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Users size={12} strokeWidth={2} />
                          <span><strong>Capacity:</strong> {resource.capacity ? `${resource.capacity}` : 'N/A'}</span>
                        </div>
                        <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} strokeWidth={2} />
                          <span><strong>Availability:</strong> {resource.availability || 'N/A'}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <School size={13} strokeWidth={2} color="#8b5cf6" />
                        {resource.accessType === 'SHARED_RESOURCE' ? (
                          <span>Shared by: <strong>{resource.ownerName}</strong></span>
                        ) : (
                          <span>Available through: <strong>Your Institution</strong></span>
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
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => openDetailsModal(resource)}
                        >
                          <span>View Details</span>
                          <ArrowRight size={12} strokeWidth={2} />
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
                style={{ padding: '4px 8px', display: 'flex', alignItems: 'center' }}
                onClick={() => setSelectedResource(null)}
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} strokeWidth={2} />
                <span><strong>Location:</strong> {selectedResource.location || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={14} strokeWidth={2} />
                <span><strong>Capacity:</strong> {selectedResource.capacity ? `${selectedResource.capacity} students` : 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} strokeWidth={2} />
                <span><strong>Availability:</strong> {selectedResource.availability}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <School size={14} strokeWidth={2} />
                <span><strong>Owner Institution:</strong> {selectedResource.ownerName}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={14} strokeWidth={2} />
                <span><strong>Access Type:</strong> {selectedResource.accessType === 'SHARED_RESOURCE' ? 'Shared with Your Institution' : 'Host Institution Resource'}</span>
              </div>
              
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <Calendar size={16} strokeWidth={2} color="#8b5cf6" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Check Availability & Book</h4>
              </div>
              
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 80px), 1fr))', gap: '8px' }}>

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
                          {isBooked ? 'Booked' : 'Free'}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Laptop size={14} strokeWidth={2} />
                <span><strong>Resource:</strong> {selectedResource.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} strokeWidth={2} />
                <span><strong>Date:</strong> {bookingDate}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} strokeWidth={2} />
                <span><strong>Time:</strong> {bookingStartTime} - {bookingEndTime}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={14} strokeWidth={2} />
                <span><strong>Number of Students:</strong> 1</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lightbulb size={14} strokeWidth={2} />
                <span><strong>Purpose:</strong> {bookingPurpose || 'N/A'}</span>
              </div>
            </div>

            {confirmError && (
              <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TriangleAlert size={14} strokeWidth={2} />
                <span>{confirmError}</span>
              </div>
            )}

            {confirmSuccess && (
              <div style={{ padding: '8px 12px', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} strokeWidth={2} />
                <span>{confirmSuccess}</span>
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

