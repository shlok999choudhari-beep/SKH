'use client'
import { useState, useEffect } from 'react'
import styles from '../institution.module.css'

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
        password: formData.password.trim() || 'trainer123',
        expertise_tags: formData.selectedSpecialties.join(', '),
        subjects: formData.selectedSubjects.join(', '),
        bio: formData.bio.trim()
      }

      const res = await fetch('/api/trainers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSuccessMsg(data.updated ? 'Trainer profile updated successfully!' : 'Trainer added successfully!')
        setFormData({
          name: '',
          email: '',
          password: '',
          bio: '',
          selectedSpecialties: [],
          selectedSubjects: [],
          customSubject: ''
        })
        fetchTrainers()
        setTimeout(() => {
          setShowAddModal(false)
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
          <h1 className={styles.pageTitle}>👨‍🏫 Trainers Management</h1>
          <p className={styles.pageSubtitle}>Add instructors, define teaching specialties, and manage booking schedules.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-sm btn-primary"
          style={{ background: 'var(--grad-purple)', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span>✨</span> + Add Trainer
        </button>
      </header>

      <main className={styles.main}>
        {/* Filter & Search Bar */}
        <div className={styles.card} style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search trainers by name, email, specialty or subject..."
                className="form-input"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Specialty:</span>
              <select
                value={selectedSpecialtyFilter}
                onChange={(e) => setSelectedSpecialtyFilter(e.target.value)}
                className="form-input"
                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              >
                <option value="all">All Specialties</option>
                {SPECIALTY_OPTIONS.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-sm btn-secondary" style={{ padding: '10px 16px', borderRadius: '8px' }}>
              🔍 Search
            </button>
          </form>
        </div>

        {/* Directory Grid */}
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Trainer Directory ({trainers.length})
            </h2>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              ⏳ Loading trainers directory...
            </div>
          ) : trainers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👨‍🏫</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                No Trainers Found
              </h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
                Start adding your institutional trainers with their areas of expertise and what subjects they will teach.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary"
                style={{ background: 'var(--grad-purple)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px' }}
              >
                + Add Trainer Now
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
              {trainers.map((trainer) => (
                <div
                  key={trainer.id}
                  style={{
                    padding: '1.5rem',
                    border: '1px solid var(--border)',
                    borderRadius: '14px',
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                        <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--grad-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
                          {trainer.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'TR'}
                        </div>
                        <div>
                          <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
                            {trainer.name}
                          </h3>
                          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>{trainer.email}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                            <span style={{ color: '#f59e0b', fontSize: '0.875rem' }}>★ {trainer.rating || 4.9}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• {trainer.institutionName}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteTrainer(trainer.id, trainer.name)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.6, fontSize: '1.1rem' }}
                        title="Remove Trainer"
                      >
                        🗑️
                      </button>
                    </div>

                    {trainer.bio && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {trainer.bio}
                      </p>
                    )}

                    {/* Specialties */}
                    {trainer.expertise_tags && (
                      <div style={{ marginBottom: '0.875rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Specialties:
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                          {trainer.expertise_tags.split(',').map((tag: string) => (
                            <span key={tag} className="badge badge-purple" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                              ⚡ {tag.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Subjects Taught */}
                    {trainer.subjects && (
                      <div style={{ marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Teaches:
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                          {trainer.subjects.split(',').map((sub: string) => (
                            <span
                              key={sub}
                              style={{
                                fontSize: '0.75rem',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                color: '#3b82f6',
                                fontWeight: 500
                              }}
                            >
                              📘 {sub.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                      📅 {trainer.upcomingSessionsCount || 0} Scheduled Sessions
                    </span>
                    <button
                      onClick={() => openScheduleModal(trainer)}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--accent-purple)' }}
                    >
                      View Schedule →
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-secondary)', width: '100%', maxWidth: '650px', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                ✨ Add New Trainer
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTrainerSubmit} style={{ padding: '1.5rem', maxHeight: '80vh', overflowY: 'auto' }}>
              {errorMsg && (
                <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              {successMsg && (
                <div style={{ padding: '10px 14px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#22c55e', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  ✅ {successMsg}
                </div>
              )}

              {/* Name & Email */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                    Trainer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dr. Alex Morgan"
                    className="form-input"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="alex.morgan@institution.edu"
                    className="form-input"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Account Password (Default: trainer123)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Set login password..."
                  className="form-input"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Specialties Multi-select */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Areas of Specialty (Select All That Apply)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {SPECIALTY_OPTIONS.map((spec) => {
                    const selected = formData.selectedSpecialties.includes(spec)
                    return (
                      <button
                        type="button"
                        key={spec}
                        onClick={() => toggleSpecialty(spec)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          border: selected ? '1px solid var(--accent-purple)' : '1px solid var(--border)',
                          background: selected ? 'var(--grad-purple)' : 'var(--bg-primary)',
                          color: selected ? 'white' : 'var(--text-secondary)'
                        }}
                      >
                        {selected ? '✓ ' : '+ '} {spec}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* What They Teach / Subjects Multi-select */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  What They Will Teach / Courses
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {SUBJECT_OPTIONS.map((sub) => {
                    const selected = formData.selectedSubjects.includes(sub)
                    return (
                      <button
                        type="button"
                        key={sub}
                        onClick={() => toggleSubject(sub)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          border: selected ? '1px solid #3b82f6' : '1px solid var(--border)',
                          background: selected ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-primary)',
                          color: selected ? '#3b82f6' : 'var(--text-secondary)'
                        }}
                      >
                        {selected ? '✓ ' : '📘 '} {sub}
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
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  />
                  <button
                    type="button"
                    onClick={addCustomSubject}
                    className="btn btn-sm btn-secondary"
                    style={{ padding: '8px 14px', borderRadius: '8px' }}
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Bio */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Biography & Qualifications
                </label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Senior engineer with 8+ years experience in distributed systems and algorithms..."
                  className="form-input"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'vertical' }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '10px 18px', borderRadius: '8px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ background: 'var(--grad-purple)', color: 'white', border: 'none', padding: '10px 22px', borderRadius: '8px', fontWeight: 600 }}
                >
                  {submitting ? 'Saving...' : 'Confirm & Save Trainer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Trainer Schedule */}
      {selectedTrainerForSchedule && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-secondary)', width: '100%', maxWidth: '600px', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  📅 Schedule: {selectedTrainerForSchedule.name}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Booked student teaching sessions</p>
              </div>
              <button onClick={() => setSelectedTrainerForSchedule(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                ✕
              </button>
            </div>

            <div style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
              {loadingSessions ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading schedule...</div>
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
                        padding: '1.25rem',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-primary)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.625rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: '2px' }}>
                            👤 {session.student_name}
                          </div>
                          {session.student_email && (
                            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                              ✉️ {session.student_email}
                            </div>
                          )}
                        </div>
                        <span className={`badge ${session.status === 'scheduled' ? 'badge-purple' : session.status === 'completed' ? 'badge-green' : 'badge-orange'}`} style={{ textTransform: 'capitalize' }}>
                          {session.status}
                        </span>
                      </div>

                      {/* Student Academic & Contact Details */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        {session.student_college && (
                          <span>🎓 College: <strong style={{ color: 'var(--text-primary)' }}>{session.student_college}</strong></span>
                        )}
                        {session.student_degree && (
                          <span>📜 Degree: <strong style={{ color: 'var(--text-primary)' }}>{session.student_degree}</strong></span>
                        )}
                        {session.student_graduation && (
                          <span>🗓️ Class: <strong style={{ color: 'var(--text-primary)' }}>{session.student_graduation}</strong></span>
                        )}
                        {session.student_phone && (
                          <span>📞 Contact: <strong style={{ color: 'var(--text-primary)' }}>{session.student_phone}</strong></span>
                        )}
                      </div>

                      {/* Topic & Notes */}
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        📝 <strong>Topic / Notes:</strong> {session.notes || 'General 1-on-1 Mentorship Session'}
                      </div>

                      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', paddingTop: '4px' }}>
                        🕒 <strong>Schedule:</strong> {new Date(session.startTime).toLocaleString()} - {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
