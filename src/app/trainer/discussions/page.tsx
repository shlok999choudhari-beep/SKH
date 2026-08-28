'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from '../../student/discussions/discussions.module.css'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  MessageSquare,
  Pin,
  Lock,
  Unlock,
  Trash2,
  ThumbsUp,
  MessageCircle,
  Clock,
  BookOpen,
  Search,
  Filter,
  ShieldAlert,
  ArrowRight
} from 'lucide-react'

export default function TrainerDiscussionsPage() {
  const [discussions, setDiscussions] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('ALL')

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

  const handleTogglePin = async (id: number) => {
    try {
      const res = await fetch(`/api/discussions/${id}/pin`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setDiscussions(prev => prev.map(d => d.id === id ? { ...d, isPinned: data.isPinned } : d))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleToggleLock = async (id: number) => {
    try {
      const res = await fetch(`/api/discussions/${id}/lock`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setDiscussions(prev => prev.map(d => d.id === id ? { ...d, isLocked: data.isLocked } : d))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this discussion thread and all its replies?')) return
    try {
      const res = await fetch(`/api/discussions/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setDiscussions(prev => prev.filter(d => d.id !== id))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const filtered = discussions.filter(d => {
    const matchesCourse = selectedCourse === 'ALL' || d.courseId.toString() === selectedCourse
    const matchesSearch = !search ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.content.toLowerCase().includes(search.toLowerCase()) ||
      d.course?.title?.toLowerCase().includes(search.toLowerCase())
    return matchesCourse && matchesSearch
  })

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Discussion Forums & Moderation</h1>
          <p className={styles.subtitle}>Moderate student inquiries, pin essential clarifications, and answer curriculum doubts.</p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search discussions or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Filter size={16} color="var(--text-muted)" />
          <select
            className={styles.filterSelect}
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="ALL">All Courses</option>
            {courses.map(c => (
              <option key={c.id} value={c.id.toString()}>{c.title}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', padding: '5rem 2rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
          <MorphingInfinity className="size-14" style={{ width: '52px', height: '52px', color: '#a855f7', filter: 'drop-shadow(0 0 12px rgba(168,85,247,0.4))' }} />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '4px' }}>
              Loading Community Discussions
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              Retrieving forum threads and learner Q&A...
            </p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <MessageSquare size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No discussions found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>There are no active student discussion threads matching your filter.</p>
        </div>
      ) : (
        <div className={styles.threadList}>
          {filtered.map((d) => (
            <div
              key={d.id}
              className={`${styles.threadCard} ${d.isPinned ? styles.threadCardPinned : ''}`}
            >
              <div className={styles.threadHeader}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {d.isPinned && (
                      <span className={`${styles.badge} ${styles.badgePinned}`}>
                        <Pin size={11} /> Pinned
                      </span>
                    )}
                    {d.isLocked && (
                      <span className={`${styles.badge} ${styles.badgeLocked}`}>
                        <Lock size={11} /> Locked
                      </span>
                    )}
                    <span className={`${styles.badge} ${styles.badgeCourse}`}>
                      <BookOpen size={11} /> {d.course?.title}
                    </span>
                  </div>
                  <h3 className={styles.threadTitle}>{d.title}</h3>
                </div>

                {/* Moderation Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '4px 8px', color: d.isPinned ? '#818cf8' : 'inherit' }}
                    onClick={() => handleTogglePin(d.id)}
                    title={d.isPinned ? 'Unpin' : 'Pin to top'}
                  >
                    <Pin size={13} />
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '4px 8px', color: d.isLocked ? '#f87171' : 'inherit' }}
                    onClick={() => handleToggleLock(d.id)}
                    title={d.isLocked ? 'Unlock thread' : 'Lock thread'}
                  >
                    {d.isLocked ? <Unlock size={13} /> : <Lock size={13} />}
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '4px 8px', color: '#f87171' }}
                    onClick={() => handleDelete(d.id)}
                    title="Delete discussion"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <p className={styles.threadSnippet}>{d.content}</p>

              <div className={styles.threadFooter}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>Author: <strong style={{ color: 'var(--text-primary)' }}>{d.author?.name || 'Student'}</strong></span>
                  <span>•</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={12} /> {new Date(d.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className={styles.statItem}>
                    <ThumbsUp size={13} />
                    <span>{d.helpfulCount || 0}</span>
                  </div>
                  <div className={styles.statItem}>
                    <MessageCircle size={13} />
                    <span>{d._count?.replies || 0} replies</span>
                  </div>
                  <Link
                    href={`/student/discussions/${d.id}`}
                    className="btn btn-primary btn-sm"
                    style={{ padding: '3px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <span>View Thread</span>
                    <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
