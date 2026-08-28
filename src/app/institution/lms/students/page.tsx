'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from '../../institution.module.css'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  Users,
  Search,
  BookOpen,
  CheckCircle2,
  Clock,
  Award,
  Layers,
  GraduationCap
} from 'lucide-react'

export default function InstitutionLmsStudentsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    setLoading(true)
    try {
      let url = '/api/trainer/students?'
      if (search.trim()) url += `search=${encodeURIComponent(search.trim())}&`

      const res = await fetch(url)
      const data = await res.json()
      if (data.students) {
        setStudents(data.students)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchStudents()
  }

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Student LMS Enrollments & Progress</h1>
          <p className={styles.pageSubtitle}>
            Monitor student course completion metrics, active curriculum engagement, and study progress.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/institution/lms" className="btn btn-secondary btn-sm">
            <BookOpen size={14} strokeWidth={2} />
            <span>LMS Overview</span>
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.card} style={{ padding: '1rem', marginBottom: '1.5rem' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search student by name or email..."
                className="form-input"
              />
            </div>
            <button type="submit" className="btn btn-secondary btn-sm">
              <Search size={14} strokeWidth={2} />
              <span>Search</span>
            </button>
          </form>
        </div>

        <div className={styles.card}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <MorphingInfinity className="size-14" style={{ width: '48px', height: '48px', color: '#8b5cf6' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Loading student enrollment records...</p>
            </div>
          ) : students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
              No student enrollments found.
            </div>
          ) : (
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Student</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Course</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Progress</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Completed Lessons</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Enrolled Date</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s: any) => {
                    const isDone = s.progressPercent === 100 || s.status === 'completed'
                    return (
                      <tr key={s.enrollmentId} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                            {s.studentName}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {s.studentEmail}
                          </span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <span style={{ fontWeight: 500 }}>{s.courseTitle}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                            {s.courseCategory}
                          </span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
                            <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  height: '100%',
                                  width: `${s.progressPercent}%`,
                                  background: isDone ? '#10b981' : '#8b5cf6',
                                  borderRadius: '99px'
                                }}
                              />
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isDone ? '#6ee7b7' : '#c4b5fd' }}>
                              {s.progressPercent}%
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <span>{s.completedLessonsCount} Lessons</span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <span className={`badge ${isDone ? 'badge-green' : s.progressPercent > 0 ? 'badge-purple' : 'badge-blue'}`}>
                            {isDone ? 'Completed' : s.progressPercent > 0 ? 'In Progress' : 'Not Started'}
                          </span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {new Date(s.enrolledAt).toLocaleDateString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
