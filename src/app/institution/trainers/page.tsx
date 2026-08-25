'use client'
import { useState, useEffect } from 'react'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import styles from '../institution.module.css'
import {
  UserCheck,
  Search,
  Plus,
  Calendar,
  Mail,
  BookOpen,
  Award,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Star,
  Zap,
  ArrowRight,
  User,
  GraduationCap,
  Phone,
  FileText,
  Check
} from 'lucide-react'

const SPECIALTY_OPTIONS = [
  'Data Structures & Algorithms',
  'Web Development',
  'AI & Machine Learning',
  'System Design',
  'Cloud & DevOps',
  'Soft Skills & Behavioral',
  'Cybersecurity',
  'Mobile Development',
  'Data Science & Analytics'
]

const SUBJECT_OPTIONS = [
  'React.js & Next.js',
  'Node.js & Express',
  'Python Programming',
  'Java & Spring Boot',
  'C++ & Competitive Coding',
  'LeetCode Problem Solving',
  'System Design & Architecture',
  'SQL & Database Design',
  'AWS & Cloud Architecture',
  'Mock Technical Interviews',
  'Resume & Portfolio Review'
]

export default function TrainersPage() {
  const [trainers, setTrainers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedSpecialtyFilter, setSelectedSpecialtyFilter] = useState('all')

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    bio: '',
    selectedSpecialties: [] as string[],
    selectedSubjects: [] as string[],
    customSubject: ''
  })

  // Schedule Modal State
  const [selectedTrainerForSchedule, setSelectedTrainerForSchedule] = useState<any>(null)
  const [trainerSessions, setTrainerSessions] = useState<any[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)

  useEffect(() => {
    fetchTrainers()
  }, [selectedSpecialtyFilter])

  const fetchTrainers = async () => {
    setLoading(true)
    try {
      let url = '/api/trainers?'
      if (selectedSpecialtyFilter !== 'all') {
        url += `specialty=${encodeURIComponent(selectedSpecialtyFilter)}&`
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
      console.error('Error fetching trainers:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchTrainers()
  }

  const toggleSpecialty = (spec: string) => {
    setFormData(prev => {
      const exists = prev.selectedSpecialties.includes(spec)
      return {
        ...prev,
        selectedSpecialties: exists
          ? prev.selectedSpecialties.filter(s => s !== spec)
          : [...prev.selectedSpecialties, spec]
      }
    })
  }

  const toggleSubject = (sub: string) => {
    setFormData(prev => {
      const exists = prev.selectedSubjects.includes(sub)
      return {
        ...prev,
        selectedSubjects: exists
          ? prev.selectedSubjects.filter(s => s !== sub)
          : [...prev.selectedSubjects, sub]
      }
    })
  }

  const addCustomSubject = () => {
    if (!formData.customSubject.trim()) return
    const sub = formData.customSubject.trim()
    if (!formData.selectedSubjects.includes(sub)) {
      setFormData(prev => ({
        ...prev,
        selectedSubjects: [...prev.selectedSubjects, sub],
        customSubject: ''
      }))
    }
  }

  const handleAddTrainerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!formData.name.trim() || !formData.email.trim()) {
      setErrorMsg('Trainer Name and Email are required.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password || 'trainer123',
        bio: formData.bio.trim(),
        specialties: formData.selectedSpecialties,
        subjects: formData.selectedSubjects
      }

      const res = await fetch('/api/trainers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (res.ok && data.trainer) {
        setSuccessMsg('Trainer added successfully!')
        setTrainers(prev => [data.trainer, ...prev])
        setTimeout(() => {
          setShowAddModal(false)
          setFormData({
            name: '',
            email: '',
            password: '',
            bio: '',
            selectedSpecialties: [],
            selectedSubjects: [],
            customSubject: ''
          })
          setSuccessMsg('')
        }, 1200)
      } else {
        setErrorMsg(data.error || 'Failed to add trainer')
      }
    } catch (err) {
      console.error(err)
      setErrorMsg('An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTrainer = async (trainerId: number, trainerName: string) => {
    if (!confirm(`Are you sure you want to remove ${trainerName}?`)) return

    try {
      const res = await fetch(`/api/trainers/${trainerId}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok && data.success) {
        setTrainers(prev => prev.filter(t => t.id !== trainerId))
      } else {
        alert(data.error || 'Failed to delete trainer')
      }
    } catch (err) {
      console.error(err)
      alert('Error deleting trainer')
    }
  }

  const openScheduleModal = async (trainer: any) => {
    setSelectedTrainerForSchedule(trainer)
    setLoadingSessions(true)
    try {
      const res = await fetch(`/api/trainers/${trainer.id}/sessions`)
      const data = await res.json()
      setTrainerSessions(data.sessions || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingSessions(false)
    }
  }

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Trainers Directory</h1>
          <p className={styles.pageSubtitle}>Add instructors, define teaching specialties, and manage booking schedules.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary btn-sm"
        >
          <Plus size={15} strokeWidth={2} />
          <span>Add Trainer</span>
        </button>
      </header>

      <main className={styles.main}>
        {/* Filter & Search Bar */}
        <div className={styles.card} style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search trainers by name, email, specialty or subject..."
                className="form-input"
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Specialty:</span>
              <select
                value={selectedSpecialtyFilter}
                onChange={(e) => setSelectedSpecialtyFilter(e.target.value)}
                className="form-select"
                style={{ width: 'auto', minWidth: '180px' }}
              >
                <option value="all">All Specialties</option>
                {SPECIALTY_OPTIONS.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-secondary btn-sm">
              <Search size={14} strokeWidth={2} />
              <span>Search</span>
            </button>
          </form>
        </div>

        {/* Directory Grid */}
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Registered Trainers
            </h2>
            <span className="badge badge-purple">{trainers.length} Trainers</span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <MorphingInfinity className="size-16" style={{ width: '64px', height: '64px', color: '#8b5cf6' }} />
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Loading trainers directory...</p>
            </div>
          ) : trainers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <UserCheck size={36} strokeWidth={1.5} color="var(--text-muted)" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                No Trainers Found
              </h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 1.25rem', fontSize: '0.875rem' }}>
                Start adding your institutional trainers with their areas of expertise and course subjects.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary btn-sm"
              >
                <Plus size={15} strokeWidth={2} />
                <span>Add Trainer Now</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
              {trainers.map((trainer) => (
                <div
                  key={trainer.id}
                  style={{
                    padding: '1.25rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: 'rgba(139, 92, 246, 0.12)', border: '1px solid rgba(139, 92, 246, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7', fontWeight: 600, fontSize: '0.95rem' }}>
                          {trainer.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'TR'}
                        </div>
                        <div>
                          <h3 style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0 }}>
                            {trainer.name}
                          </h3>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '1px 0' }}>{trainer.email}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                            <Star size={12} fill="#f59e0b" color="#f59e0b" />
                            <span style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 600 }}>{trainer.rating || 4.9}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• {trainer.institutionName || 'Institutional Faculty'}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteTrainer(trainer.id, trainer.name)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '6px', color: 'var(--text-muted)' }}
                        title="Remove Trainer"
                      >
                        <Trash2 size={14} strokeWidth={2} />
                      </button>
                    </div>

                    {trainer.bio && (
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '0.875rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {trainer.bio}
                      </p>
                    )}

                    {/* Specialties */}
                    {trainer.expertise_tags && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Specialties
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {trainer.expertise_tags.split(',').map((tag: string) => (
                            <span key={tag} className="badge badge-purple" style={{ fontSize: '0.725rem', padding: '2px 8px' }}>
                              <Zap size={10} strokeWidth={2} />
                              <span>{tag.trim()}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Subjects Taught */}
                    {trainer.subjects && (
                      <div style={{ marginBottom: '0.875rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Course Subjects
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {trainer.subjects.split(',').map((sub: string) => (
                            <span
                              key={sub}
                              className="badge badge-blue"
                              style={{ fontSize: '0.725rem', padding: '2px 8px' }}
                            >
                              <BookOpen size={10} strokeWidth={2} />
                              <span>{sub.trim()}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.875rem', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <Calendar size={13} strokeWidth={2} color="var(--text-muted)" />
                      <span>{trainer.upcomingSessionsCount || 0} Scheduled Sessions</span>
                    </div>
                    <button
                      onClick={() => openScheduleModal(trainer)}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <span>Schedule</span>
                      <ArrowRight size={12} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal: Add Trainer */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setShowAddModal(false)}>
          <div style={{ background: 'var(--bg-secondary)', width: '100%', maxWidth: '640px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={18} strokeWidth={2} color="#8b5cf6" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Add New Trainer
                </h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleAddTrainerSubmit} style={{ padding: '1.5rem', maxHeight: '80vh', overflowY: 'auto' }}>
              {errorMsg && (
                <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={15} strokeWidth={2} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div style={{ padding: '10px 14px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#22c55e', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={15} strokeWidth={2} />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Name & Email */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label" style={{ marginBottom: '6px' }}>
                    Trainer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dr. Alex Morgan"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ marginBottom: '6px' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="alex.morgan@institution.edu"
                    className="form-input"
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ marginBottom: '6px' }}>
                  Account Password (Default: trainer123)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Set login password..."
                  className="form-input"
                />
              </div>

              {/* Specialties Multi-select */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ marginBottom: '6px' }}>
                  Areas of Specialty
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {SPECIALTY_OPTIONS.map((spec) => {
                    const selected = formData.selectedSpecialties.includes(spec)
                    return (
                      <button
                        type="button"
                        key={spec}
                        onClick={() => toggleSpecialty(spec)}
                        className="btn btn-sm"
                        style={{
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.78rem',
                          background: selected ? 'rgba(139, 92, 246, 0.2)' : 'var(--bg-primary)',
                          borderColor: selected ? 'rgba(139, 92, 246, 0.5)' : 'var(--border)',
                          color: selected ? '#c4b5fd' : 'var(--text-secondary)'
                        }}
                      >
                        {selected ? <Check size={12} strokeWidth={2} /> : <Plus size={12} strokeWidth={2} />}
                        <span>{spec}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* What They Teach / Subjects Multi-select */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ marginBottom: '6px' }}>
                  Course Subjects Taught
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {SUBJECT_OPTIONS.map((sub) => {
                    const selected = formData.selectedSubjects.includes(sub)
                    return (
                      <button
                        type="button"
                        key={sub}
                        onClick={() => toggleSubject(sub)}
                        className="btn btn-sm"
                        style={{
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.78rem',
                          background: selected ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-primary)',
                          borderColor: selected ? 'rgba(59, 130, 246, 0.5)' : 'var(--border)',
                          color: selected ? '#93c5fd' : 'var(--text-secondary)'
                        }}
                      >
                        {selected ? <Check size={12} strokeWidth={2} /> : <BookOpen size={12} strokeWidth={2} />}
                        <span>{sub}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Custom Subject Input */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <input
                    type="text"
                    value={formData.customSubject}
                    onChange={(e) => setFormData({ ...formData, customSubject: e.target.value })}
                    placeholder="Add custom course/subject..."
                    className="form-input"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={addCustomSubject}
                    className="btn btn-secondary btn-sm"
                  >
                    <Plus size={13} strokeWidth={2} />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Bio */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ marginBottom: '6px' }}>
                  Biography & Qualifications
                </label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Senior engineer with 8+ years experience in distributed systems and algorithms..."
                  className="form-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary btn-sm"
                >
                  {submitting ? 'Saving...' : 'Save Trainer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Trainer Schedule */}
      {selectedTrainerForSchedule && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setSelectedTrainerForSchedule(null)}>
          <div style={{ background: 'var(--bg-secondary)', width: '100%', maxWidth: '600px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} strokeWidth={2} color="#8b5cf6" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    Schedule: {selectedTrainerForSchedule.name}
                  </h3>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Booked student teaching sessions</p>
              </div>
              <button onClick={() => setSelectedTrainerForSchedule(null)} className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
              {loadingSessions ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <MorphingInfinity className="size-10" style={{ width: '40px', height: '40px', color: '#8b5cf6' }} />
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading schedule...</p>
                </div>
              ) : trainerSessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No booked sessions yet for this trainer.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {trainerSessions.map((session) => (
                    <div
                      key={session.id}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                            {session.topic || 'Training Session'}
                          </span>
                          <span className={`badge ${session.status === 'CONFIRMED' ? 'badge-green' : 'badge-purple'}`}>
                            {session.status}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                          Student: {session.student?.name || 'Student'} ({session.student?.email || 'N/A'})
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <Clock size={11} strokeWidth={2} />
                          <span>{new Date(session.startTime).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
