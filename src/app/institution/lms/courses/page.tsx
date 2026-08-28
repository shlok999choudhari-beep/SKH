'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from '../../institution.module.css'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  Search,
  BookOpen,
  Eye,
  CheckCircle2,
  Clock,
  Layers,
  Users,
  ExternalLink,
  Filter,
  Plus
} from 'lucide-react'

export default function InstitutionAllCoursesPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/courses')
      const data = await res.json()
      if (data.courses) {
        setCourses(data.courses)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePublish = async (courseId: number) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/publish`, { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.success) {
        setCourses(prev =>
          prev.map(c => (c.id === courseId ? { ...c, status: data.status } : c))
        )
      }
    } catch (err) {
      console.error(err)
    }
  }

  const filtered = courses.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    if (search.trim() && !c.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>All Institutional Courses</h1>
          <p className={styles.pageSubtitle}>
            Review and oversee curriculums, syllabuses, and publish status across all departments.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/institution/lms" className="btn btn-secondary btn-sm">
            <BookOpen size={14} strokeWidth={2} />
            <span>LMS Overview</span>
          </Link>
          <Link href="/trainer/courses/create" className="btn btn-primary btn-sm">
            <Plus size={14} strokeWidth={2} />
            <span>Create Course</span>
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.card} style={{ padding: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search courses by title..."
                className="form-input"
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setStatusFilter('all')}
                className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              >
                All ({courses.length})
              </button>
              <button
                onClick={() => setStatusFilter('published')}
                className={`btn btn-sm ${statusFilter === 'published' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Published ({courses.filter(c => c.status === 'published').length})
              </button>
              <button
                onClick={() => setStatusFilter('draft')}
                className={`btn btn-sm ${statusFilter === 'draft' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Draft ({courses.filter(c => c.status === 'draft').length})
              </button>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <MorphingInfinity className="size-14" style={{ width: '48px', height: '48px', color: '#8b5cf6' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Loading courses...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
              No courses matching criteria.
            </div>
          ) : (
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Title</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Instructor</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Difficulty</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Modules</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Enrolled</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>{c.title}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.category} • {c.estimatedDuration}</span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span>{c.trainer?.name || 'Institutional Faculty'}</span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span className="badge badge-purple" style={{ fontSize: '10px' }}>{c.difficulty}</span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span>{c.moduleCount} Modules ({c.lessonCount} Lessons)</span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{ fontWeight: 600, color: '#c4b5fd' }}>{c.enrolledStudentsCount} Learners</span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(c.id)}
                          className={`badge ${c.status === 'published' ? 'badge-green' : 'badge-orange'}`}
                          style={{ cursor: 'pointer', border: 'none' }}
                          title="Click to toggle status"
                        >
                          {c.status === 'published' ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <Link href={`/trainer/courses/${c.id}/builder`} className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '12px' }}>
                            <span>Builder</span>
                          </Link>
                          <Link href={`/student/courses/${c.id}`} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>
                            <Eye size={13} strokeWidth={2} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
