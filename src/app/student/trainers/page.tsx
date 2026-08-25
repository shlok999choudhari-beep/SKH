'use client'
import { useState, useEffect } from 'react'
import StudentSidebar from '@/components/StudentSidebar'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import styles from '../dashboard.module.css'
import {
  Presentation,
  Search,
  CalendarDays,
  Calendar,
  Star,
  Zap,
  BookOpen,
  Clock,
  FileText,
  TriangleAlert,
  CheckCircle2,
  X,
  Loader2
} from 'lucide-react'

const SPECIALTY_FILTERS = [
  'All',
  'Data Structures & Algorithms',
  'Web Development',
  'AI & Machine Learning',
  'System Design',
  'Cloud & DevOps',
  'Soft Skills & Behavioral',
  'Cybersecurity'
]

const TIME_SLOTS = [
  { label: '09:00 AM - 10:00 AM', start: '09:00', end: '10:00' },
  { label: '10:30 AM - 11:30 AM', start: '10:30', end: '11:30' },
  { label: '02:00 PM - 03:00 PM', start: '14:00', end: '15:00' },
  { label: '04:00 PM - 05:00 PM', start: '16:00', end: '17:00' },
  { label: '06:00 PM - 07:00 PM', start: '18:00', end: '19:00' },
]

export default function StudentTrainersPage() {
  const [activeTab, setActiveTab] = useState<'browse' | 'my-sessions'>('browse')
  const [trainers, setTrainers] = useState<any[]>([])
  const [mySessions, setMySessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('All')

  // Booking Modal States
  const [selectedTrainer, setSelectedTrainer] = useState<any>(null)
  const [bookingDate, setBookingDate] = useState(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  })
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[0])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [bookingNotes, setBookingNotes] = useState('')
  const [bookingSubmitting, setBookingSubmitting] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState('')

  const [studentData, setStudentData] = useState<any>(null)

  useEffect(() => {
    fetchStudentProfile()
    fetchTrainers()
  }, [selectedSpecialty])

  useEffect(() => {
    fetchMySessions()
  }, [studentData])

  const fetchStudentProfile = async () => {
    try {
      const res = await fetch('/api/student/profile')
      const data = await res.json()
      if (data && data.id) {
        setStudentData(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchTrainers = async () => {
    setLoading(true)
    try {
      let url = '/api/trainers?'
      if (selectedSpecialty !== 'All') {
        url += `specialty=${encodeURIComponent(selectedSpecialty)}&`
      }
      if (search.trim()) {
        url += `search=${encodeURIComponent(search.trim())}`
      }
      const res = await fetch(url)
      const data = await res.json()
      if (data.trainers) {
        setTrainers(data.trainers)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMySessions = async () => {
    try {
      let url = '/api/student/trainer-sessions'
      if (studentData?.id) {
        url += `?studentId=${studentData.id}`
      }
      const res = await fetch(url)
      const data = await res.json()
      if (data.sessions) {
        setMySessions(data.sessions)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchTrainers()
  }

  const openBookingModal = (trainer: any) => {
    setSelectedTrainer(trainer)
    setBookingError('')
    setBookingSuccess('')
    setBookingNotes('')
    const subjects = trainer.subjects ? trainer.subjects.split(',').map((s: string) => s.trim()) : []
    setSelectedSubject(subjects[0] || '1-on-1 Mentorship')
  }

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTrainer || !bookingDate || !selectedSlot) return

    setBookingError('')
    setBookingSuccess('')
    setBookingSubmitting(true)

    try {
      const startDateTimeStr = `${bookingDate}T${selectedSlot.start}:00`
      const endDateTimeStr = `${bookingDate}T${selectedSlot.end}:00`

      const payload = {
        student_id: studentData?.id || undefined,
        start_time: startDateTimeStr,
        end_time: endDateTimeStr,
        notes: `Topic: ${selectedSubject} | Notes: ${bookingNotes.trim() || 'General 1-on-1 teaching session'}`
      }

      const res = await fetch(`/api/trainers/${selectedTrainer.id}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setBookingSuccess('Session booked successfully!')
        await fetchMySessions()
        setTimeout(() => {
          setSelectedTrainer(null)
          setBookingSuccess('')
          setActiveTab('my-sessions')
        }, 800)
      } else {
        setBookingError(data.error || 'Failed to book session')
      }
    } catch (err) {
      console.error(err)
      setBookingError('An unexpected error occurred.')
    } finally {
      setBookingSubmitting(false)
    }
  }

  const handleCancelSession = async (sessionId: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return
    try {
      const res = await fetch('/api/student/trainer-sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, status: 'cancelled' })
      })
      if (res.ok) {
        setMySessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'cancelled' } : s))
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Presentation size={24} strokeWidth={2} color="#8b5cf6" />
              <h1 className={styles.pageTitle}>Book a Trainer & 1-on-1 Sessions</h1>
            </div>
            <p className={styles.pageSubtitle}>Find expert trainers, select your subject, and schedule personalized 1-on-1 teaching sessions.</p>
          </div>
        </header>

        <main className={styles.main}>
          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', paddingBottom: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('browse')}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px 16px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                color: activeTab === 'browse' ? 'var(--accent-purple)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'browse' ? '3px solid var(--accent-purple)' : '3px solid transparent',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Search size={16} strokeWidth={2} />
              <span>Browse Available Trainers ({trainers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('my-sessions')}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px 16px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                color: activeTab === 'my-sessions' ? 'var(--accent-purple)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'my-sessions' ? '3px solid var(--accent-purple)' : '3px solid transparent',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <CalendarDays size={16} strokeWidth={2} />
              <span>My Booked Sessions ({mySessions.filter(s => s.status !== 'cancelled').length})</span>
            </button>
          </div>

          {activeTab === 'browse' && (
            <>
              {/* Search & Specialty Filters */}
              <div className={`glass ${styles.panel}`} style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
                <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search trainer by name, subject (e.g. React, LeetCode, DSA)..."
                      className="form-input"
                      style={{ width: '100%', padding: '12px 14px 12px 40px', fontSize: '0.95rem' }}
                    />
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                      <Search size={16} strokeWidth={2} color="var(--text-muted)" />
                    </span>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ background: 'var(--grad-purple)', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', fontWeight: 600 }}>
                    Search Trainers
                  </button>
                </form>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Filter by Specialty:</span>
                  {SPECIALTY_FILTERS.map(spec => (
                    <button
                      key={spec}
                      onClick={() => setSelectedSpecialty(spec)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        border: selectedSpecialty === spec ? '1px solid var(--accent-purple)' : '1px solid var(--border)',
                        background: selectedSpecialty === spec ? 'var(--grad-purple)' : 'var(--bg-secondary)',
                        color: selectedSpecialty === spec ? 'white' : 'var(--text-secondary)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>


              {/* Trainers Directory */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <MorphingInfinity className="size-16" style={{ width: '64px', height: '64px', color: '#8b5cf6' }} />
                  <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Fetching available trainers...</p>
                </div>
              ) : trainers.length === 0 ? (
                <div className={`glass ${styles.panel}`} style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                  <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                    <Presentation size={48} strokeWidth={1.5} color="#8b5cf6" />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    No Trainers Found
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto' }}>
                    Try adjusting your search query or specialty filter to find available trainers.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                  {trainers.map((trainer) => {
                    const subjectsList = trainer.subjects ? trainer.subjects.split(',').map((s: string) => s.trim()) : []
                    const specialtiesList = trainer.expertise_tags ? trainer.expertise_tags.split(',').map((s: string) => s.trim()) : []

                    return (
                      <div
                        key={trainer.id}
                        className={`glass ${styles.panel}`}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          padding: '1.5rem',
                          borderRadius: '16px',
                          border: '1px solid var(--border)',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                        }}
                      >
                        <div>
                          {/* Header */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--grad-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.25rem', flexShrink: 0, boxShadow: '0 4px 12px rgba(147, 51, 234, 0.3)' }}>
                              {trainer.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'TR'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {trainer.name}
                              </h3>
                              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>{trainer.institutionName}</p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                <span style={{ color: '#f59e0b', fontSize: '0.875rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                  <Star size={13} fill="#f59e0b" strokeWidth={0} />
                                  <span>{trainer.rating || 4.9}</span>
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• Certified Instructor</span>
                              </div>
                            </div>
                          </div>

                          {/* Bio */}
                          {trainer.bio && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {trainer.bio}
                            </p>
                          )}

                          {/* Specialties */}
                          {specialtiesList.length > 0 && (
                            <div style={{ marginBottom: '0.875rem' }}>
                              <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Specialties:
                              </span>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                                {specialtiesList.map((tag: string) => (
                                  <span key={tag} className="badge badge-purple" style={{ fontSize: '0.725rem', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <Zap size={11} strokeWidth={2} />
                                    <span>{tag}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Subjects Taught */}
                          {subjectsList.length > 0 && (
                            <div style={{ marginBottom: '1.25rem' }}>
                              <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                What They Teach:
                              </span>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                                {subjectsList.map((sub: string) => (
                                  <span
                                    key={sub}
                                    style={{
                                      fontSize: '0.75rem',
                                      padding: '3px 8px',
                                      borderRadius: '6px',
                                      background: 'rgba(59, 130, 246, 0.1)',
                                      border: '1px solid rgba(59, 130, 246, 0.25)',
                                      color: '#3b82f6',
                                      fontWeight: 500,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    <BookOpen size={11} strokeWidth={2} />
                                    <span>{sub}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action */}
                        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                          <button
                            onClick={() => openBookingModal(trainer)}
                            className="btn btn-primary"
                            style={{
                              width: '100%',
                              background: 'var(--grad-purple)',
                              color: 'white',
                              border: 'none',
                              padding: '12px',
                              borderRadius: '10px',
                              fontWeight: 600,
                              fontSize: '0.95rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px'
                            }}
                          >
                            <Calendar size={15} strokeWidth={2} />
                            <span>Book 1-on-1 Session</span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* Tab: My Booked Sessions */}
          {activeTab === 'my-sessions' && (
            <div className={`glass ${styles.panel}`}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                My Scheduled Trainer Sessions
              </h2>

              {mySessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                  <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                    <CalendarDays size={48} strokeWidth={1.5} color="#8b5cf6" />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    No Bookings Yet
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                    You haven&apos;t booked any 1-on-1 trainer sessions yet. Switch to the Browse tab to schedule a lesson.
                  </p>
                  <button
                    onClick={() => setActiveTab('browse')}
                    className="btn btn-primary"
                    style={{ background: 'var(--grad-purple)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px' }}
                  >
                    Browse Available Trainers
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                  {mySessions.map((session) => (
                    <div
                      key={session.id}
                      style={{
                        padding: '1.25rem',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-secondary)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Presentation size={16} strokeWidth={2} color="#8b5cf6" />
                              <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                                {session.trainerName}
                              </h3>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{session.institutionName}</p>
                          </div>
                          <span
                            className={`badge ${session.status === 'scheduled' ? 'badge-purple' : session.status === 'completed' ? 'badge-green' : 'badge-orange'}`}
                            style={{ textTransform: 'capitalize' }}
                          >
                            {session.status}
                          </span>
                        </div>

                        <div style={{ background: 'var(--bg-primary)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FileText size={13} strokeWidth={2} color="#8b5cf6" />
                            <span>{session.notes || '1-on-1 Mentorship'}</span>
                          </p>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={13} strokeWidth={2} />
                            <span>{new Date(session.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </p>
                        </div>
                      </div>

                      {session.status === 'scheduled' && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleCancelSession(session.id)}
                            style={{
                              background: 'transparent',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#ef4444',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                          >
                            Cancel Session
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Booking Modal */}
      {selectedTrainer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-secondary)', width: '100%', maxWidth: '560px', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={18} strokeWidth={2} color="#8b5cf6" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Book Session with {selectedTrainer.name}
                  </h3>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Select date, time, and topic to confirm booking</p>
              </div>
              <button onClick={() => setSelectedTrainer(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleConfirmBooking} style={{ padding: '1.5rem', maxHeight: '80vh', overflowY: 'auto' }}>
              {bookingError && (
                <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TriangleAlert size={15} strokeWidth={2} />
                  <span>{bookingError}</span>
                </div>
              )}

              {bookingSuccess && (
                <div style={{ padding: '10px 14px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#22c55e', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={15} strokeWidth={2} />
                  <span>{bookingSuccess}</span>
                </div>
              )}

              {/* Subject Selection */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Select Topic / Subject to Learn *
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                >
                  {selectedTrainer.subjects ? (
                    selectedTrainer.subjects.split(',').map((sub: string) => (
                      <option key={sub.trim()} value={sub.trim()}>{sub.trim()}</option>
                    ))
                  ) : (
                    <option value="1-on-1 Mentorship">1-on-1 Mentorship</option>
                  )}
                </select>
              </div>

              {/* Date Picker */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Session Date *
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Time Slot Picker */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Available Time Slot *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem' }}>
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = selectedSlot.start === slot.start
                    return (
                      <button
                        type="button"
                        key={slot.start}
                        onClick={() => setSelectedSlot(slot)}
                        style={{
                          padding: '10px 8px',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: isSelected ? '1px solid var(--accent-purple)' : '1px solid var(--border)',
                          background: isSelected ? 'var(--grad-purple)' : 'var(--bg-primary)',
                          color: isSelected ? 'white' : 'var(--text-secondary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <Clock size={13} strokeWidth={2} />
                        <span>{slot.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Notes / Specific Questions */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Session Notes / What do you want help with?
                </label>
                <textarea
                  rows={3}
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="e.g., I need help understanding Dynamic Programming memoization tables and mock code review..."
                  className="form-input"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'vertical' }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setSelectedTrainer(null)}
                  className="btn btn-secondary"
                  style={{ padding: '10px 18px', borderRadius: '8px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingSubmitting}
                  className="btn btn-primary"
                  style={{ background: 'var(--grad-purple)', color: 'white', border: 'none', padding: '10px 22px', borderRadius: '8px', fontWeight: 600 }}
                >
                  {bookingSubmitting ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

