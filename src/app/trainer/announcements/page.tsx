'use client'

import { useState, useEffect } from 'react'
import styles from './announcements.module.css'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  Megaphone,
  Plus,
  Pin,
  Trash2,
  Edit,
  Clock,
  BookOpen,
  X,
  Sparkles,
  Layers,
  Search,
  Filter,
  AlertCircle,
  Users,
  CheckCircle2,
  Send
} from 'lucide-react'

export default function TrainerAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('all')

  // Form State
  const [courseId, setCourseId] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    fetchAnnouncements()
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses')
      const data = await res.json()
      if (data.courses) setCourses(data.courses)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/announcements')
      const data = await res.json()
      if (data.announcements) setAnnouncements(data.announcements)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseId || !title.trim() || !content.trim()) {
      setFormError('Please select a course and provide both a title and message.')
      return
    }

    setCreating(true)
    setFormError('')
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: parseInt(courseId, 10),
          title: title.trim(),
          content: content.trim(),
          isPinned
        })
      })
      const data = await res.json()
      if (data.success) {
        setShowModal(false)
        setTitle('')
        setContent('')
        setIsPinned(false)
        fetchAnnouncements()
      } else {
        setFormError(data.error || 'Failed to post announcement')
      }
    } catch (err: any) {
      setFormError(err.message || 'An unexpected network error occurred')
    } finally {
      setCreating(false)
    }
  }

  const handleTogglePin = async (id: number) => {
    try {
      const res = await fetch(`/api/announcements/${id}/pin`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isPinned: data.isPinned } : a))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this course announcement?')) return
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setAnnouncements(prev => prev.filter(a => a.id !== id))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const pinnedCount = announcements.filter(a => a.isPinned).length
  const uniqueCoursesCount = Array.from(new Set(announcements.map(a => a.courseId))).length

  const filtered = announcements.filter(a => {
    if (selectedCourse !== 'all' && a.courseId !== parseInt(selectedCourse, 10)) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      a.title?.toLowerCase().includes(q) ||
      a.content?.toLowerCase().includes(q) ||
      a.course?.title?.toLowerCase().includes(q)
    )
  })

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Course Announcements & Broadcasts</h1>
          <p className={styles.subtitle}>
            Publish important notifications, schedule updates, and live session links to your enrolled learners.
          </p>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              if (courses.length > 0) setCourseId(courses[0].id.toString())
              setShowModal(true)
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 18px' }}
          >
            <Plus size={15} strokeWidth={2} />
            <span>New Broadcast</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Strip */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
            <Megaphone size={22} strokeWidth={2} />
          </div>
          <div>
            <div className={styles.statValue}>{announcements.length}</div>
            <div className={styles.statLabel}>Total Broadcasts</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <Pin size={22} strokeWidth={2} />
          </div>
          <div>
            <div className={styles.statValue}>{pinnedCount}</div>
            <div className={styles.statLabel}>Pinned Priority</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
            <BookOpen size={22} strokeWidth={2} />
          </div>
          <div>
            <div className={styles.statValue}>{uniqueCoursesCount}</div>
            <div className={styles.statLabel}>Courses Active</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <CheckCircle2 size={22} strokeWidth={2} />
          </div>
          <div>
            <div className={styles.statValue}>100%</div>
            <div className={styles.statLabel}>Delivery Status</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className={styles.filterBar}>
        <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search broadcasts by title or message contents..."
            className="form-input"
            style={{ paddingLeft: '38px', width: '100%' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>

        <div style={{ minWidth: '220px' }}>
          <select
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            className="form-select"
            style={{ width: '100%' }}
          >
            <option value="all">All Authored Courses ({courses.length})</option>
            {courses.map(c => (
              <option key={c.id} value={c.id.toString()}>{c.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Feed Content */}
      {loading ? (
        <div className={styles.loadingBox} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '30vh', gap: '1rem', padding: '3rem 1rem', textAlign: 'center' }}>
          <MorphingInfinity className="size-12" style={{ width: '48px', height: '48px', color: '#8b5cf6', margin: '0 auto' }} />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '4px' }}>
              Loading Announcements
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              Retrieving broadcast feed and student course notices...
            </p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <Megaphone size={44} strokeWidth={1.5} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
          <h3>No Announcements Found</h3>
          <p style={{ maxWidth: '440px', margin: '0 auto 1.5rem', fontSize: '0.875rem' }}>
            Broadcast important updates, assignment deadlines, or meeting links to keep your learners synchronized.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              if (courses.length > 0) setCourseId(courses[0].id.toString())
              setShowModal(true)
            }}
          >
            <Plus size={14} />
            <span>Create First Broadcast</span>
          </button>
        </div>
      ) : (
        <div className={styles.feedList}>
          {filtered.map(ann => (
            <div
              key={ann.id}
              className={`${styles.announcementCard} ${ann.isPinned ? styles.announcementCardPinned : ''}`}
            >
              <div className={styles.cardHeader}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                    {ann.isPinned && (
                      <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '2px 8px' }}>
                        <Pin size={11} /> Pinned Priority
                      </span>
                    )}
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <BookOpen size={12} color="#c084fc" /> {ann.course?.title}
                    </span>
                  </div>
                  <h3 className={styles.cardTitle}>{ann.title}</h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '5px 10px', color: ann.isPinned ? '#c084fc' : 'inherit' }}
                    onClick={() => handleTogglePin(ann.id)}
                    title={ann.isPinned ? 'Unpin broadcast' : 'Pin to top of course'}
                  >
                    <Pin size={14} />
                    <span style={{ fontSize: '11.5px', marginLeft: '4px' }}>{ann.isPinned ? 'Pinned' : 'Pin'}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '5px 8px', color: '#f87171' }}
                    onClick={() => handleDelete(ann.id)}
                    title="Delete announcement"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className={styles.cardContent}>
                {ann.content}
              </div>

              <div className={styles.cardFooter}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#c084fc' }}>
                    {(ann.author?.name || 'T')[0]}
                  </div>
                  <span>Broadcast by <strong style={{ color: 'var(--text-primary)' }}>{ann.author?.name || 'Course Instructor'}</strong></span>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={13} /> {new Date(ann.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(ann.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Broadcast Modal */}
      {showModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowModal(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Megaphone size={18} color="#c084fc" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' }}>New Course Announcement</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className={styles.modalBody}>
                {formError && (
                  <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Target Course *</label>
                  <select
                    className="form-select"
                    style={{ width: '100%' }}
                    value={courseId}
                    onChange={e => setCourseId(e.target.value)}
                    required
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id.toString()}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Announcement Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Live Q&A Session Tomorrow at 6:00 PM"
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Announcement Message & Resources *</label>
                  <textarea
                    rows={4}
                    required
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Details about the update, zoom links, milestones, or revised due dates..."
                    className="form-input"
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={e => setIsPinned(e.target.checked)}
                    style={{ accentColor: '#a855f7' }}
                  />
                  <span>Pin this announcement to the top of the course dashboard</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1.25rem 1.75rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={13} />
                  <span>{creating ? 'Broadcasting...' : 'Publish Broadcast'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
