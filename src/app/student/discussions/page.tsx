'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import StudentSidebar from '@/components/StudentSidebar'
import BackButton from '@/components/BackButton'
import styles from './discussions.module.css'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  MessageSquare,
  Plus,
  Search,
  Pin,
  Lock,
  ThumbsUp,
  MessageCircle,
  Clock,
  Sparkles,
  BookOpen,
  Filter,
  X
} from 'lucide-react'

export default function StudentDiscussionsPage() {
  const [discussions, setDiscussions] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('ALL')
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)

  // New discussion form
  const [newCourseId, setNewCourseId] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    fetchDiscussions()
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

  const fetchDiscussions = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/discussions')
      const data = await res.json()
      if (data.discussions) setDiscussions(data.discussions)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCourseId || !newTitle.trim() || !newContent.trim()) {
      setFormError('All fields are required')
      return
    }

    setCreating(true)
    setFormError('')
    try {
      const res = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: parseInt(newCourseId, 10),
          title: newTitle.trim(),
          content: newContent.trim()
        })
      })
      const data = await res.json()
      if (data.success) {
        setShowModal(false)
        setNewTitle('')
        setNewContent('')
        setNewCourseId('')
        fetchDiscussions()
      } else {
        setFormError(data.error || 'Failed to post discussion')
      }
    } catch (err: any) {
      setFormError(err.message || 'An error occurred')
    } finally {
      setCreating(false)
    }
  }

  const filteredDiscussions = discussions.filter(d => {
    const matchesCourse = selectedCourse === 'ALL' || d.courseId.toString() === selectedCourse
    const matchesSearch = !search ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.content.toLowerCase().includes(search.toLowerCase()) ||
      d.course?.title?.toLowerCase().includes(search.toLowerCase())
    return matchesCourse && matchesSearch
  })

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.content}>
        {/* Sticky Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <BackButton fallbackHref="/student/dashboard" />
            <div>
              <h1 className={styles.pageTitle}>
                <MessageSquare size={22} color="#8b5cf6" strokeWidth={2} />
                <span>Discussions & Community</span>
              </h1>
              <p className={styles.pageSubtitle}>
                Collaborate with instructors, mentors, and peers across your enrolled courses.
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                if (courses.length > 0) setNewCourseId(courses[0].id.toString())
                setShowModal(true)
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={15} strokeWidth={2} />
              <span>New Discussion</span>
            </button>
          </div>
        </header>

        <main className={styles.main}>
          {/* Toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.searchBox}>
              <Search size={15} color="var(--text-muted)" />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search learning topics, questions, or keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={14} color="var(--text-muted)" />
              <select
                className={styles.filterSelect}
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                <option value="ALL">All Enrolled Courses</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id.toString()}>{c.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Loading State — fixed spinner with proper size */}
          {loading ? (
            <div className={styles.loadingBox}>
              <MorphingInfinity
                style={{
                  width: '52px',
                  height: '52px',
                  color: '#8b5cf6',
                  filter: 'drop-shadow(0 0 16px rgba(139, 92, 246, 0.5))'
                }}
              />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '4px' }}>
                  Loading Discussions
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0 }}>
                  Fetching community threads across your courses...
                </p>
              </div>
            </div>
          ) : filteredDiscussions.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-xl)',
              border: '1px dashed var(--border)'
            }}>
              <MessageSquare size={44} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {search || selectedCourse !== 'ALL' ? 'No Matching Discussions' : 'No Discussions Yet'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 1.5rem', fontSize: '0.875rem' }}>
                {search || selectedCourse !== 'ALL'
                  ? 'Try clearing your search or selecting a different course filter.'
                  : 'Start a conversation with instructors and classmates — ask questions, share insights, or discuss concepts.'}
              </p>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  if (courses.length > 0) setNewCourseId(courses[0].id.toString())
                  setShowModal(true)
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={14} />
                <span>Start a Discussion</span>
              </button>
            </div>
          ) : (
            <div className={styles.threadList}>
              {filteredDiscussions.map((d) => (
                <Link
                  key={d.id}
                  href={`/student/discussions/${d.id}`}
                  className={`${styles.threadCard} ${d.isPinned ? styles.threadCardPinned : ''}`}
                >
                  <div className={styles.threadHeader}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {d.isPinned && (
                          <span className={`${styles.badge} ${styles.badgePinned}`}>
                            <Pin size={10} /> Pinned
                          </span>
                        )}
                        {d.isLocked && (
                          <span className={`${styles.badge} ${styles.badgeLocked}`}>
                            <Lock size={10} /> Locked
                          </span>
                        )}
                        <span className={`${styles.badge} ${styles.badgeCourse}`}>
                          <BookOpen size={10} /> {d.course?.title || 'General Course'}
                        </span>
                      </div>
                      <h3 className={styles.threadTitle}>{d.title}</h3>
                    </div>
                  </div>

                  <p className={styles.threadSnippet}>{d.content}</p>

                  <div className={styles.threadFooter}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span>
                        Posted by{' '}
                        <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                          {d.author?.name || 'Student'}
                        </strong>
                      </span>
                      <span style={{ opacity: 0.4 }}>•</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={11} />
                        {new Date(d.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <div className={styles.statGroup}>
                      <div className={styles.statItem} title="Helpful votes">
                        <ThumbsUp size={12} />
                        <span>{d.helpfulCount || 0}</span>
                      </div>
                      <div className={styles.statItem} title="Replies">
                        <MessageCircle size={12} />
                        <span>{d._count?.replies || 0} replies</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* New Discussion Modal */}
      {showModal && (
        <div className={styles.modalBackdrop} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#a78bfa" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Start a New Discussion
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDiscussion}>
              <div className={styles.modalBody}>
                {formError && (
                  <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: '0.85rem' }}>
                    {formError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Course *</label>
                  <select
                    className="form-select"
                    value={newCourseId}
                    onChange={(e) => setNewCourseId(e.target.value)}
                    required
                  >
                    <option value="">— Choose a Course —</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id.toString()}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Discussion Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. How do I optimize dynamic routing for large catalogues?"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Detailed Question or Context *</label>
                  <textarea
                    className={styles.replyTextarea}
                    placeholder="Describe your question, code snippet, or concept you'd like clarification on..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ padding: '1.1rem 1.5rem', background: 'rgba(0,0,0,0.15)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowModal(false)}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={creating}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <MessageSquare size={14} />
                  <span>{creating ? 'Publishing...' : 'Publish Discussion'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
