'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './courses-manage.module.css'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  Plus,
  Search,
  BookOpen,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Layers,
  Users,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ExternalLink
} from 'lucide-react'

export default function TrainerCoursesManagePage() {
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
      console.error('Error fetching courses:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePublish = async (courseId: number, currentStatus: string) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/publish`, {
        method: 'POST'
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setCourses(prev =>
          prev.map(c => (c.id === courseId ? { ...c, status: data.status } : c))
        )
      } else {
        alert(data.error || 'Failed to toggle status')
      }
    } catch (err) {
      console.error(err)
      alert('Error updating course status')
    }
  }

  const handleDeleteCourse = async (courseId: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This will also remove all its modules and lessons.`)) {
      return
    }

    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setCourses(prev => prev.filter(c => c.id !== courseId))
      } else {
        alert(data.error || 'Failed to delete course')
      }
    } catch (err) {
      console.error(err)
      alert('Error deleting course')
    }
  }

  const filtered = courses.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    if (search.trim() && !c.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const publishedCount = courses.filter(c => c.status === 'published').length
  const draftCount = courses.filter(c => c.status === 'draft').length
  const totalStudentsCount = courses.reduce((acc, c) => acc + (c.enrolledStudentsCount || 0), 0)

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Authored Courses</h1>
          <p className={styles.subtitle}>
            Publish, edit structure, build modules, and manage course curriculums for your cohorts.
          </p>
        </div>
        <div className={styles.actions}>
          <Link href="/trainer/courses/create" className="btn btn-primary btn-sm" style={{ padding: '8px 18px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={15} strokeWidth={2} />
            <span>Create New Course</span>
          </Link>
        </div>
      </div>

      {/* Quick Stats Summary Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc', flexShrink: 0 }}>
            <BookOpen size={20} strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{courses.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Courses</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', flexShrink: 0 }}>
            <CheckCircle2 size={20} strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{publishedCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Published & Active</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', flexShrink: 0 }}>
            <Users size={20} strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{totalStudentsCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Learners</div>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className={styles.filterBar} style={{ marginBottom: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '0.875rem 1.25rem' }}>
        <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search courses by title..."
            className="form-input"
            style={{ paddingLeft: '38px', width: '100%' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
            Published ({publishedCount})
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`btn btn-sm ${statusFilter === 'draft' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Draft ({draftCount})
          </button>
        </div>
      </div>

      {/* Table of Courses */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <MorphingInfinity className="size-14" style={{ width: '48px', height: '48px', color: '#a855f7' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading course curriculum...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <BookOpen size={40} strokeWidth={1.5} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>No Courses Found</h3>
          <p style={{ maxWidth: '400px', margin: '0 auto 1rem', fontSize: '0.875rem' }}>You have not created any courses matching the selected filters.</p>
          <Link href="/trainer/courses/create" className="btn btn-primary btn-sm">
            <Plus size={14} strokeWidth={2} />
            <span>Create Course Now</span>
          </Link>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Course Title</th>
                  <th>Category</th>
                  <th>Difficulty</th>
                  <th>Curriculum</th>
                  <th>Enrolled</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(course => (
                  <tr key={course.id}>
                    <td>
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block', fontSize: '0.95rem' }}>
                          {course.title}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <Clock size={11} />
                          <span>{course.estimatedDuration}</span>
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {course.category}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-purple" style={{ fontSize: '10px' }}>
                        {course.difficulty}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Layers size={13} color="#c084fc" />
                        <span>{course.moduleCount} Modules • {course.lessonCount} Lessons</span>
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#c4b5fd' }}>
                        {course.enrolledStudentsCount} Students
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(course.id, course.status)}
                        className={`badge ${course.status === 'published' ? 'badge-green' : 'badge-orange'}`}
                        style={{ cursor: 'pointer', border: 'none', padding: '4px 10px' }}
                        title="Click to toggle publish status"
                      >
                        {course.status === 'published' ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Link
                          href={`/trainer/courses/${course.id}/builder`}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        >
                          <Edit size={12} strokeWidth={2} />
                          <span>Builder</span>
                        </Link>
                        <Link
                          href={`/student/courses/${course.id}`}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 10px' }}
                          title="Preview Student View"
                        >
                          <Eye size={13} strokeWidth={2} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteCourse(course.id, course.title)}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '6px 10px', color: '#ef4444' }}
                          title="Delete Course"
                        >
                          <Trash2 size={13} strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
