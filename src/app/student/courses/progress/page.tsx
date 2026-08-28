'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from '../courses.module.css'
import StudentSidebar from '@/components/StudentSidebar'
import BackButton from '@/components/BackButton'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  BookOpen,
  ArrowRight,
  Award,
  Layers,
  Sparkles,
  PlayCircle
} from 'lucide-react'

export default function CourseProgressPage() {
  const [progressData, setProgressData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProgress()
  }, [])

  const fetchProgress = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/student/progress')
      const data = await res.json()
      setProgressData(data)
    } catch (err) {
      console.error('Error loading progress:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.layout}>
        <StudentSidebar />
        <div className={styles.content} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.25rem' }}>
          <MorphingInfinity className="size-14" style={{ width: '56px', height: '56px', color: '#8b5cf6', filter: 'drop-shadow(0 0 16px rgba(139, 92, 246, 0.4))' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '4px' }}>
              Calculating Progress Analytics
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              Compiling syllabus milestones and completion stats...
            </p>
          </div>
        </div>
      </div>
    )
  }

  const summary = progressData?.summary || {
    totalEnrolled: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    overallAverageProgress: 0,
    totalCompletedLessons: 0
  }

  const courses = progressData?.courses || []

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.content}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <BackButton fallbackHref="/student/courses" />
            <div>
              <h1 className={styles.pageTitle}>
                <TrendingUp size={22} color="#8b5cf6" strokeWidth={2} />
                <span>Learning & Course Progress</span>
              </h1>
              <p className={styles.pageSubtitle}>
                Detailed breakdown of your completed modules, active lesson objectives, and mastery metrics.
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Link href="/student/courses" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={15} strokeWidth={2} />
              <span>My Enrolled Courses</span>
            </Link>
            <Link href="/student/courses/explore" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={15} strokeWidth={2} />
              <span>Explore Catalog</span>
            </Link>
          </div>
        </header>

        <main className={styles.main}>
          {/* Progress Metric Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIconWrap} style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c4b5fd' }}>
                <TrendingUp size={22} strokeWidth={2} />
              </div>
              <div>
                <div className={styles.statValue}>{summary.overallAverageProgress}%</div>
                <div className={styles.statLabel}>Average Progress</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconWrap} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7' }}>
                <CheckCircle2 size={22} strokeWidth={2} />
              </div>
              <div>
                <div className={styles.statValue}>{summary.completedCourses}</div>
                <div className={styles.statLabel}>Completed Courses</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconWrap} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd' }}>
                <Clock size={22} strokeWidth={2} />
              </div>
              <div>
                <div className={styles.statValue}>{summary.inProgressCourses}</div>
                <div className={styles.statLabel}>Active Courses</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconWrap} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fcd34d' }}>
                <Award size={22} strokeWidth={2} />
              </div>
              <div>
                <div className={styles.statValue}>{summary.totalCompletedLessons}</div>
                <div className={styles.statLabel}>Completed Lessons</div>
              </div>
            </div>
          </div>

          {/* Detailed Course Progress List */}
          {courses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border)' }}>
              <TrendingUp size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Active Course Enrollments</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Enroll in a course from our catalog to start tracking your module progression and earning credentials.
              </p>
              <Link href="/student/courses/explore" className="btn btn-primary btn-sm">
                Explore Courses
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {courses.map((c: any) => {
                const isComplete = c.progressPercent === 100 || c.status === 'completed'
                return (
                  <div
                    key={c.courseId}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-xl)',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.15)', color: '#c4b5fd', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <BookOpen size={24} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{c.title}</h3>
                            {isComplete ? (
                              <span className="badge badge-green" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle2 size={11} /> 100% Completed
                              </span>
                            ) : (
                              <span className="badge badge-purple" style={{ fontSize: '11px' }}>
                                {c.progressPercent}% Completed
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                            {c.completedLessons} of {c.totalLessons} lessons finished • Enrolled on {new Date(c.enrolledAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Link href={`/student/courses/${c.courseId}/learn`} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <PlayCircle size={14} />
                          <span>{isComplete ? 'Review Content' : 'Continue Lesson'}</span>
                        </Link>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                        <span>Syllabus Completion Rate</span>
                        <span style={{ fontWeight: 600, color: isComplete ? '#34d399' : '#c4b5fd' }}>{c.progressPercent}%</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', borderRadius: '9999px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            borderRadius: '9999px',
                            background: isComplete
                              ? 'linear-gradient(90deg, #10b981, #34d399)'
                              : 'linear-gradient(90deg, #8b5cf6, #3b82f6)',
                            width: `${c.progressPercent}%`,
                            transition: 'width 0.4s ease'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
