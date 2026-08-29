'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './courses.module.css'
import StudentSidebar from '@/components/StudentSidebar'
import BackButton from '@/components/BackButton'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  BookOpen,
  Compass,
  CheckCircle2,
  Clock,
  PlayCircle,
  Award,
  ArrowRight,
  TrendingUp,
  Flame,
  Search,
  Plus,
  KeyRound,
  Sparkles,
  ChevronRight,
  Users,
  Check,
  AlertCircle
} from 'lucide-react'

type EnrolledCourse = {
  enrollmentId: number
  courseId: number
  title: string
  shortName: string
  academicYear: string
  semester: string
  department: string
  slug: string
  description: string
  thumbnail: string
  category: string
  difficulty: string
  estimatedDuration: string
  trainerName: string
  trainerRating: number
  progressPercent: number
  status: string
  enrolledAt: string
  lastAccessedAt: string
  totalModules: number
  totalLessons: number
  totalActivities: number
  completedLessonsCount: number
}

export default function MyCoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<EnrolledCourse[]>([])
  const [recentlyAccessed, setRecentlyAccessed] = useState<EnrolledCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed'>('all')
  const [search, setSearch] = useState('')

  // Join Course Modal State
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinCodeInput, setJoinCodeInput] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [joinSuccess, setJoinSuccess] = useState('')

  useEffect(() => {
    fetchEnrolledCourses()
  }, [])

  const fetchEnrolledCourses = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/student/courses', { cache: 'no-store' })
      const data = await res.json()
      if (data.courses) {
        setCourses(data.courses)
        setRecentlyAccessed(data.recentlyAccessed || data.courses.slice(0, 4))
      }
    } catch (err) {
      console.error('Error fetching enrolled courses:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = joinCodeInput.trim().toUpperCase()
    if (!code) {
      setJoinError('Please enter a course code.')
      return
    }

    setJoining(true)
    setJoinError('')
    setJoinSuccess('')

    try {
      const res = await fetch('/api/courses/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setJoinSuccess(data.alreadyEnrolled ? `Enrolled! Redirecting to ${data.course.title}...` : `🎉 Successfully joined ${data.course.title}!`)
        setTimeout(() => {
          setShowJoinModal(false)
          setJoinCodeInput('')
          fetchEnrolledCourses()
          router.push(`/student/courses/${data.course.id}`)
        }, 1200)
      } else {
        setJoinError(data.error || 'Invalid course code. Please verify and try again.')
      }
    } catch {
      setJoinError('Network error. Please try again.')
    } finally {
      setJoining(false)
    }
  }

  // Filtered list for "All My Courses"
  const filteredCourses = courses.filter(course => {
    if (filter === 'completed' && !(course.progressPercent === 100 || course.status === 'completed')) return false
    if (filter === 'in_progress' && (course.progressPercent === 100 || course.status === 'completed')) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        course.title?.toLowerCase().includes(q) ||
        course.shortName?.toLowerCase().includes(q) ||
        course.description?.toLowerCase().includes(q) ||
        course.department?.toLowerCase().includes(q) ||
        course.trainerName?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const formatLastAccessed = (dateStr: string) => {
    if (!dateStr) return 'Recently accessed'
    const date = new Date(dateStr)
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'Yesterday'
    return `${diffDays} days ago`
  }

  if (loading) {
    return (
      <div className={styles.layout}>
        <StudentSidebar />
        <div className={styles.content} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.25rem' }}>
          <MorphingInfinity className="size-14" style={{ width: '56px', height: '56px', color: '#8b5cf6', filter: 'drop-shadow(0 0 16px rgba(139, 92, 246, 0.4))' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '4px' }}>
              Loading Learning Hub Courses
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              Retrieving active enrollments and curriculum progress...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.content}>
        {/* Top Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <BackButton fallbackHref="/student/dashboard" />
            <div>
              <h1 className={styles.pageTitle}>
                <BookOpen size={22} color="#8b5cf6" strokeWidth={2} />
                <span>My Courses</span>
              </h1>
              <p className={styles.pageSubtitle}>
                Enrolled academic lab courses, practical curriculums, and syllabus milestones.
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              onClick={() => setShowJoinModal(true)}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Join Course</span>
            </button>
            <Link href="/student/courses/explore" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Compass size={15} strokeWidth={2} />
              <span>Explore Courses</span>
            </Link>
          </div>
        </header>

        <main className={styles.main}>
          {/* ================= 1. RECENTLY ACCESSED COURSES ================= */}
          {recentlyAccessed.length > 0 && (
            <section className={styles.recentSection}>
              <div className={styles.sectionHeadingRow}>
                <h2 className={styles.sectionHeading}>
                  <span>Recently Accessed Courses</span>
                </h2>
              </div>

              <div className={styles.recentDeck}>
                {recentlyAccessed.map(course => (
                  <div key={`recent-${course.enrollmentId}`} className={styles.recentCard}>
                    <div className={styles.recentThumbWrap}>
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className={styles.recentThumb}
                      />
                      <div className={styles.recentYearBadge}>
                        {course.academicYear || 'AY 2026-27'}
                      </div>
                    </div>

                    <div className={styles.recentCardBody}>
                      <h3 className={styles.recentCardTitle}>{course.title}</h3>
                      <div className={styles.recentMetaRow}>
                        <span>{course.semester || 'Semester I'}</span>
                        <span>•</span>
                        <span className={styles.recentTeacher}>{course.trainerName}</span>
                      </div>

                      {/* Progress */}
                      <div className={styles.progressSection}>
                        <div className={styles.progressHeader}>
                          <span className={styles.progressLabel}>Progress</span>
                          <span className={styles.progressValue}>{course.progressPercent}%</span>
                        </div>
                        <div className={styles.progressBarBg}>
                          <div
                            className={`${styles.progressBarFill} ${course.progressPercent === 100 ? styles.progressBarComplete : ''}`}
                            style={{ width: `${course.progressPercent}%` }}
                          />
                        </div>
                        <div className={styles.recentLastAccessed} style={{ marginTop: '6px' }}>
                          Last accessed: {formatLastAccessed(course.lastAccessedAt)}
                        </div>
                      </div>
                    </div>

                    <div className={styles.recentCardFooter}>
                      <Link
                        href={`/student/courses/${course.courseId}`}
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none' }}
                      >
                        <PlayCircle size={15} />
                        <span>Open Course</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ================= 2. ALL MY COURSES ================= */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className={styles.sectionHeadingRow}>
              <h2 className={styles.sectionHeading}>
                <span>All My Courses ({courses.length})</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowJoinModal(true)}
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={14} />
                <span>+ Join Course with Code</span>
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className={styles.filterBar}>
              <div className={styles.tabsGroup}>
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`${styles.tabBtn} ${filter === 'all' ? styles.tabBtnActive : ''}`}
                >
                  All ({courses.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('in_progress')}
                  className={`${styles.tabBtn} ${filter === 'in_progress' ? styles.tabBtnActive : ''}`}
                >
                  In Progress ({courses.filter(c => c.progressPercent < 100).length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('completed')}
                  className={`${styles.tabBtn} ${filter === 'completed' ? styles.tabBtnActive : ''}`}
                >
                  Completed ({courses.filter(c => c.progressPercent === 100).length})
                </button>
              </div>

              <div className={styles.searchBox}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search learning resources or courses..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
            </div>

            {/* Grid of Courses */}
            {courses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border)' }}>
                <BookOpen size={44} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>No Courses Joined Yet</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
                  Enter the course code provided by your instructor or browse available college curriculum modules.
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setShowJoinModal(true)}
                    className="btn btn-primary"
                    style={{ padding: '8px 20px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={15} />
                    <span>Join Course (e.g. CGL-7F42K9)</span>
                  </button>
                  <Link href="/student/courses/explore" className="btn btn-secondary" style={{ padding: '8px 18px' }}>
                    Browse Catalog
                  </Link>
                </div>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                <p style={{ color: 'var(--text-secondary)' }}>No courses match your filter or search criteria.</p>
              </div>
            ) : (
              <div className={styles.courseGrid}>
                {filteredCourses.map(course => {
                  const isComplete = course.progressPercent === 100

                  return (
                    <div key={course.enrollmentId} className={styles.courseCard}>
                      <div>
                        <div className={styles.thumbnailWrap}>
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className={styles.thumbnail}
                          />
                          <div className={styles.thumbnailBadge}>
                            {course.academicYear || 'AY 2026-27'} • {course.semester || 'Semester I'}
                          </div>
                        </div>

                        <div className={styles.cardBody}>
                          <h3 className={styles.cardTitle}>{course.title}</h3>
                          <p className={styles.cardDescription}>{course.description}</p>

                          <div className={styles.trainerRow}>
                            <div className={styles.trainerAvatar}>
                              {(course.trainerName || 'T')[0]}
                            </div>
                            <div>
                              <div className={styles.trainerName}>{course.trainerName}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{course.department}</div>
                            </div>
                          </div>

                          <div className={styles.progressSection}>
                            <div className={styles.progressHeader}>
                              <span className={styles.progressLabel}>Course Progress</span>
                              <span className={styles.progressValue}>{course.progressPercent}%</span>
                            </div>
                            <div className={styles.progressBarBg}>
                              <div
                                className={`${styles.progressBarFill} ${isComplete ? styles.progressBarComplete : ''}`}
                                style={{ width: `${course.progressPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={styles.cardFooter}>
                        <Link
                          href={`/student/courses/${course.courseId}`}
                          className="btn btn-primary btn-sm"
                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none' }}
                        >
                          <PlayCircle size={15} />
                          <span>{isComplete ? 'Review Course' : 'Open Course Workspace'}</span>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* ================= JOIN COURSE MODAL ================= */}
      {showJoinModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowJoinModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.2)', color: '#c4b5fd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className={styles.modalTitle}>Join a Course</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Enter the code provided by your instructor</div>
                </div>
              </div>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowJoinModal(false)}>✕</button>
            </div>

            {joinError && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={15} />
                <span>{joinError}</span>
              </div>
            )}

            {joinSuccess && (
              <div style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={15} />
                <span>{joinSuccess}</span>
              </div>
            )}

            <form onSubmit={handleJoinSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
                  Enter Course Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CGL-7F42K9"
                  value={joinCodeInput}
                  onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
                  className="form-input"
                  style={{
                    width: '100%',
                    fontSize: '1.15rem',
                    fontFamily: 'Geist Mono, monospace',
                    letterSpacing: '2px',
                    textAlign: 'center',
                    padding: '12px',
                    textTransform: 'uppercase'
                  }}
                  autoFocus
                />
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'center' }}>
                  Case-insensitive (e.g. <code>CGL-7F42K9</code>)
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowJoinModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joining || !joinCodeInput.trim()}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 20px' }}
                >
                  {joining ? (
                    <span>Validating &amp; Enrolling...</span>
                  ) : (
                    <>
                      <span>Join Course</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
