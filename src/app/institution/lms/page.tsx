'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from '../institution.module.css'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  BookOpen,
  Users,
  Presentation,
  CheckCircle2,
  TrendingUp,
  Layers,
  ArrowRight,
  Sparkles,
  Compass,
  Award
} from 'lucide-react'

export default function InstitutionLmsOverviewPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [trainers, setTrainers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLmsData()
  }, [])

  const fetchLmsData = async () => {
    setLoading(true)
    try {
      const [coursesRes, studentsRes, trainersRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/trainer/students'),
        fetch('/api/trainers')
      ])

      const [coursesData, studentsData, trainersData] = await Promise.all([
        coursesRes.json(),
        studentsRes.json(),
        trainersRes.json()
      ])

      if (coursesData.courses) setCourses(coursesData.courses)
      if (studentsData.students) setStudents(studentsData.students)
      if (trainersData.trainers) setTrainers(trainersData.trainers)
    } catch (err) {
      console.error('Error loading LMS data:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalCourses = courses.length
  const publishedCourses = courses.filter(c => c.status === 'published').length
  const totalEnrollments = students.length
  const completedEnrollments = students.filter(s => s.progressPercent === 100 || s.status === 'completed').length

  const avgCompletion = totalEnrollments > 0
    ? Math.round(students.reduce((acc, s) => acc + s.progressPercent, 0) / totalEnrollments)
    : 0

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Learning Hub (LMS) Overview</h1>
          <p className={styles.pageSubtitle}>
            Institution-wide course metrics, curriculum delivery analytics, and trainer deployment.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/institution/lms/courses" className="btn btn-primary btn-sm">
            <Compass size={14} strokeWidth={2} />
            <span>All Courses</span>
          </Link>
          <Link href="/institution/trainers" className="btn btn-secondary btn-sm">
            <Presentation size={14} strokeWidth={2} />
            <span>Trainers</span>
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        {/* Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          <div className={styles.card} style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'rgba(139, 92, 246, 0.15)', color: '#c4b5fd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={24} strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'Outfit', color: 'var(--text-primary)' }}>{totalCourses}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Courses</div>
            </div>
          </div>

          <div className={styles.card} style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Presentation size={24} strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'Outfit', color: 'var(--text-primary)' }}>{trainers.length}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Trainers</div>
            </div>
          </div>

          <div className={styles.card} style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={24} strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'Outfit', color: 'var(--text-primary)' }}>{totalEnrollments}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Student Enrollments</div>
            </div>
          </div>

          <div className={styles.card} style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'rgba(245, 158, 11, 0.15)', color: '#fcd34d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={24} strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'Outfit', color: 'var(--text-primary)' }}>{avgCompletion}%</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg Completion</div>
            </div>
          </div>
        </div>

        {/* Popular Courses & Quick Review */}
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Institutional Course Catalog
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Courses active in your institution
              </p>
            </div>
            <Link href="/institution/lms/courses" style={{ fontSize: '0.85rem', color: '#c084fc', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span>View All Courses</span>
              <ArrowRight size={13} strokeWidth={2} />
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
              <MorphingInfinity className="size-14" style={{ width: '48px', height: '48px', color: '#8b5cf6' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Loading LMS overview...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Course</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Instructor</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Curriculum</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Enrollments</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 600 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.slice(0, 6).map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>{c.title}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.category} • {c.difficulty}</span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span>{c.trainer?.name || 'Institutional Faculty'}</span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span>{c.moduleCount} Modules ({c.lessonCount} Lessons)</span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{ fontWeight: 600, color: '#c4b5fd' }}>{c.enrolledStudentsCount} Students</span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span className={`badge ${c.status === 'published' ? 'badge-green' : 'badge-orange'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                        <Link href={`/student/courses/${c.id}`} className="btn btn-secondary btn-sm">
                          <span>Preview</span>
                        </Link>
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
