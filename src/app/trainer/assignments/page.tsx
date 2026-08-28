'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './assignments-manage.module.css'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  FileCheck,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Award,
  TrendingUp,
  Edit,
  Trash2,
  Eye,
  Filter,
  ArrowRight
} from 'lucide-react'

export default function TrainerAssignmentsPage() {
  const [statsData, setStatsData] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('all')

  useEffect(() => {
    fetchAssignmentsAndStats()
  }, [])

  const fetchAssignmentsAndStats = async () => {
    setLoading(true)
    try {
      const [statsRes, coursesRes] = await Promise.all([
        fetch('/api/trainer/assignments/stats'),
        fetch('/api/courses')
      ])

      const [statsJson, coursesJson] = await Promise.all([
        statsRes.json(),
        coursesRes.json()
      ])

      if (statsJson.stats) setStatsData(statsJson)
      if (coursesJson.courses) setCourses(coursesJson.courses)
    } catch (err) {
      console.error('Error loading assignments stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAssignment = async (assignmentId: number, title: string) => {
    if (!confirm(`Delete assignment "${title}" and all its student submissions?`)) return

    try {
      const res = await fetch(`/api/assignments/${assignmentId}`, { method: 'DELETE' })
      if (res.ok) {
        fetchAssignmentsAndStats()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const stats = statsData?.stats || {
    totalAssignments: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
    gradedSubmissions: 0,
    lateSubmissions: 0,
    avgScore: 0
  }

  const assignments = statsData?.assignments || []

  const filtered = assignments.filter((a: any) => {
    if (selectedCourse !== 'all' && a.courseId !== parseInt(selectedCourse, 10)) return false
    if (search.trim() && !a.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Assignments & Grading Hub</h1>
          <p className={styles.subtitle}>
            Create course assignments, evaluate student submissions, and provide targeted feedback.
          </p>
        </div>
        <div className={styles.actions}>
          <Link href="/trainer/assignments/create" className="btn btn-primary btn-sm">
            <Plus size={15} strokeWidth={2} />
            <span>Create Assignment</span>
          </Link>
          <Link href="/trainer/quizzes" className="btn btn-secondary btn-sm">
            <span>Quizzes & Tests</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c4b5fd' }}>
            <FileCheck size={22} strokeWidth={2} />
          </div>
          <div>
            <div className={styles.statValue}>{stats.totalAssignments}</div>
            <div className={styles.statLabel}>Total Assignments</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fcd34d' }}>
            <Clock size={22} strokeWidth={2} />
          </div>
          <div>
            <div className={styles.statValue}>{stats.pendingSubmissions}</div>
            <div className={styles.statLabel}>Pending Grading</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7' }}>
            <CheckCircle2 size={22} strokeWidth={2} />
          </div>
          <div>
            <div className={styles.statValue}>{stats.gradedSubmissions}</div>
            <div className={styles.statLabel}>Graded Submissions</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd' }}>
            <TrendingUp size={22} strokeWidth={2} />
          </div>
          <div>
            <div className={styles.statValue}>{stats.avgScore}%</div>
            <div className={styles.statLabel}>Average Score</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search assignments by title..."
            className="form-input"
          />
        </div>

        <div style={{ minWidth: '220px' }}>
          <select
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            className="form-select"
          >
            <option value="all">All Authored Courses</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <MorphingInfinity className="size-14" style={{ width: '48px', height: '48px', color: '#8b5cf6' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Loading assignments dashboard...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-secondary)' }}>
            <FileCheck size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ color: 'var(--text-primary)' }}>No Assignments Found</h3>
            <p style={{ fontSize: '0.85rem' }}>Create assignments to challenge your students with practical hands-on tasks.</p>
            <Link href="/trainer/assignments/create" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
              <Plus size={14} />
              <span>Create Assignment</span>
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '0.875rem 1.25rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Title</th>
                  <th style={{ padding: '0.875rem 1.25rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Course & Module</th>
                  <th style={{ padding: '0.875rem 1.25rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Due Date</th>
                  <th style={{ padding: '0.875rem 1.25rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Max Marks</th>
                  <th style={{ padding: '0.875rem 1.25rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Submissions</th>
                  <th style={{ padding: '0.875rem 1.25rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '0.875rem 1.25rem', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a: any) => (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>{a.title}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Type: {a.submissionType}</span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{ fontWeight: 500 }}>{a.courseTitle}</span>
                      {a.moduleTitle && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {a.moduleTitle}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)' }}>
                      {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'No Deadline'}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>
                      {a.maxMarks} Pts
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 700, color: '#c4b5fd' }}>{a.totalSubmissions}</span>
                        {a.pendingSubmissions > 0 && (
                          <span className="badge badge-orange" style={{ fontSize: '10px', padding: '1px 6px' }}>
                            {a.pendingSubmissions} Pending
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span className={`badge ${a.status === 'published' ? 'badge-green' : 'badge-orange'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                        <Link
                          href={`/trainer/assignments/${a.id}/grade`}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                        >
                          <CheckCircle2 size={13} strokeWidth={2} />
                          <span>Grade ({a.totalSubmissions})</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteAssignment(a.id, a.title)}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '4px 8px', color: '#ef4444' }}
                          title="Delete Assignment"
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
        )}
      </div>
    </div>
  )
}
