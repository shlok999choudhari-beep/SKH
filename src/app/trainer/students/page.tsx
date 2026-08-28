'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from '../trainer.module.css'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  Users,
  Search,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Sparkles,
  TrendingUp,
  ArrowRight
} from 'lucide-react'

export default function TrainerStudentsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all')

  useEffect(() => {
    fetchCourses()
    fetchStudents()
  }, [selectedCourseId])

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses')
      const data = await res.json()
      if (data.courses) setCourses(data.courses)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchStudents = async () => {
    setLoading(true)
    try {
      let url = '/api/trainer/students?'
      if (selectedCourseId !== 'all') {
        url += `courseId=${selectedCourseId}&`
      }
      if (search.trim()) {
        url += `search=${encodeURIComponent(search.trim())}&`
      }

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
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Enrolled Students Roster</h1>
          <p className={styles.subtitle}>
            Monitor student engagement, lesson completion rates, and learning progress across your courses.
          </p>
        </div>
        <div className={styles.actions}>
          <span className="badge badge-purple" style={{ fontSize: '13px', padding: '6px 12px' }}>
            <Users size={14} strokeWidth={2} />
            <span>{students.length} Enrolled Learners</span>
          </span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className={styles.card} style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search student by name or email..."
              className="form-input"
            />
          </div>

          <div style={{ minWidth: '200px' }}>
            <select
              value={selectedCourseId}
              onChange={e => setSelectedCourseId(e.target.value)}
              className="form-select"
            >
              <option value="all">All Authored Courses</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-secondary btn-sm">
            <Search size={14} strokeWidth={2} />
            <span>Filter</span>
          </button>
        </form>
      </div>

      {/* Table */}
      <div className={styles.card}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <MorphingInfinity className="size-14" style={{ width: '48px', height: '48px', color: '#8b5cf6' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Loading student records...</p>
          </div>
        ) : students.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
            <Users size={36} strokeWidth={1.5} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>No Students Enrolled Yet</h3>
            <p style={{ fontSize: '0.85rem' }}>When students discover and enroll in your published courses, their progress will appear here.</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course Enrolled</th>
                  <th>Progress</th>
                  <th>Lessons Done</th>
                  <th>Status</th>
                  <th>Enrolled On</th>
                  <th>Last Active</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s: any) => {
                  const isDone = s.progressPercent === 100 || s.status === 'completed'
                  return (
                    <tr key={s.enrollmentId}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.15)', color: '#c4b5fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.8rem' }}>
                            {s.studentName?.slice(0, 2).toUpperCase() || 'ST'}
                          </div>
                          <div>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                              {s.studentName}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {s.studentEmail}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 500 }}>{s.courseTitle}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.courseCategory}</div>
                      </td>
                      <td>
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
                      <td>
                        <span style={{ fontSize: '0.825rem' }}>{s.completedLessonsCount} Completed</span>
                      </td>
                      <td>
                        <span className={`badge ${isDone ? 'badge-green' : s.progressPercent > 0 ? 'badge-purple' : 'badge-blue'}`}>
                          {isDone ? 'Completed' : s.progressPercent > 0 ? 'In Progress' : 'Not Started'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {new Date(s.enrolledAt).toLocaleDateString()}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {s.lastAccessedAt ? new Date(s.lastAccessedAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
