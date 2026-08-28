'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
  FolderLock,
  Layers,
  Sparkles,
  Flame,
  Search,
  Bot,
  Brain,
  Code2,
  ChevronRight,
  Target
} from 'lucide-react'

type EnrolledCourse = {
  enrollmentId: number
  courseId: number
  title: string
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
  completedAt: string | null
  lastAccessedAt: string | null
  currentModuleName: string
  lastLessonTitle: string
  lastLessonId: number | null
  totalModules: number
  totalLessons: number
  completedLessonsCount: number
}

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<EnrolledCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed' | 'not_started'>('all')
  const [search, setSearch] = useState('')

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
      }
    } catch (err) {
      console.error('Error fetching enrolled courses:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filtered list
  const filteredCourses = courses.filter(course => {
    if (filter === 'completed' && !(course.progressPercent === 100 || course.status === 'completed')) return false
    if (filter === 'in_progress' && !(course.progressPercent > 0 && course.progressPercent < 100)) return false
    if (filter === 'not_started' && course.progressPercent !== 0) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        course.title?.toLowerCase().includes(q) ||
        course.description?.toLowerCase().includes(q) ||
        course.category?.toLowerCase().includes(q) ||
        course.trainerName?.toLowerCase().includes(q)
      )
    }
    return true
  })

  // Metrics
  const totalEnrolled = courses.length
  const completedCount = courses.filter(c => c.progressPercent === 100 || c.status === 'completed').length
  const inProgressCount = courses.filter(c => c.progressPercent > 0 && c.progressPercent < 100).length
  const totalCompletedLessons = courses.reduce((acc, c) => acc + (c.completedLessonsCount || 0), 0)

  if (loading) {
    return (
      <div className={styles.layout}>
        <StudentSidebar />
        <div className={styles.content} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.25rem' }}>
          <MorphingInfinity className="size-14" style={{ width: '56px', height: '56px', color: '#8b5cf6', filter: 'drop-shadow(0 0 16px rgba(139, 92, 246, 0.4))' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '4px' }}>
              Loading Learning Hub
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
                <span>My Learning Hub</span>
              </h1>
              <p className={styles.pageSubtitle}>
                Track your course progress, continue active modules, and develop industry-ready skills.
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Link href="/student/courses/explore" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Compass size={15} strokeWidth={2} />
              <span>Explore Courses</span>
            </Link>
            <Link href="/student/courses/progress" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={15} strokeWidth={2} />
              <span>Detailed Progress</span>
            </Link>
          </div>
        </header>

        <main className={styles.main}>
          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIconWrap} style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c4b5fd' }}>
                <BookOpen size={22} strokeWidth={2} />
              </div>
              <div>
                <div className={styles.statValue}>{totalEnrolled}</div>
                <div className={styles.statLabel}>Enrolled Courses</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconWrap} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd' }}>
                <Flame size={22} strokeWidth={2} />
              </div>
              <div>
                <div className={styles.statValue}>{inProgressCount}</div>
                <div className={styles.statLabel}>In Progress</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconWrap} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7' }}>
                <CheckCircle2 size={22} strokeWidth={2} />
              </div>
              <div>
                <div className={styles.statValue}>{completedCount}</div>
                <div className={styles.statLabel}>Completed</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconWrap} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fcd34d' }}>
                <Award size={22} strokeWidth={2} />
              </div>
              <div>
                <div className={styles.statValue}>{totalCompletedLessons}</div>
                <div className={styles.statLabel}>Lessons Finished</div>
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className={styles.filterBar}>
            <div className={styles.tabsGroup}>
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`${styles.tabBtn} ${filter === 'all' ? styles.tabBtnActive : ''}`}
              >
                All Courses ({courses.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('in_progress')}
                className={`${styles.tabBtn} ${filter === 'in_progress' ? styles.tabBtnActive : ''}`}
              >
                In Progress ({inProgressCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('completed')}
                className={`${styles.tabBtn} ${filter === 'completed' ? styles.tabBtnActive : ''}`}
              >
                Completed ({completedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('not_started')}
                className={`${styles.tabBtn} ${filter === 'not_started' ? styles.tabBtnActive : ''}`}
              >
                Not Started ({courses.filter(c => c.progressPercent === 0).length})
              </button>
            </div>

            <div className={styles.searchBox}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search enrolled courses..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          {/* Content Area */}
          {courses.length === 0 ? (
            <div className={styles.emptyHero}>
              <div className={styles.emptyIconCircle}>
                <BookOpen size={28} strokeWidth={2} />
              </div>
              <h2 className={styles.emptyTitle}>No Courses Enrolled Yet</h2>
              <p className={styles.emptySubtitle}>
                Discover industry-aligned learning tracks, hands-on coding exercises, and AI-grounded tutor support to prepare for placement interviews.
              </p>
              <div className={styles.emptyActions}>
                <Link href="/student/courses/explore" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px' }}>
                  <Compass size={16} strokeWidth={2} />
                  <span>Browse Course Catalog</span>
                </Link>
                <Link href="/student/roadmap" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
                  <Sparkles size={16} strokeWidth={2} color="#c4b5fd" />
                  <span>View Career Roadmap</span>
                </Link>
              </div>

              {/* Recommended Tracks Shortcut Grid */}
              <div className={styles.recommendedTracks}>
                <Link href="/student/courses/explore" className={styles.trackCard} style={{ textDecoration: 'none' }}>
                  <div className={styles.trackHeader}>
                    <div className={styles.trackIcon}>
                      <Bot size={18} />
                    </div>
                    <div>
                      <div className={styles.trackTitle}>Generative AI & LLMs</div>
                      <div className={styles.trackDesc}>Prompt engineering, RAG pipelines & vector search architectures.</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#c4b5fd', fontWeight: 600 }}>
                    <span>Explore Track</span>
                    <ChevronRight size={14} />
                  </div>
                </Link>

                <Link href="/student/courses/explore" className={styles.trackCard} style={{ textDecoration: 'none' }}>
                  <div className={styles.trackHeader}>
                    <div className={styles.trackIcon} style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' }}>
                      <Code2 size={18} />
                    </div>
                    <div>
                      <div className={styles.trackTitle}>Full-Stack Engineering</div>
                      <div className={styles.trackDesc}>Next.js 16, TypeScript, REST APIs & Prisma relational data models.</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#93c5fd', fontWeight: 600 }}>
                    <span>Explore Track</span>
                    <ChevronRight size={14} />
                  </div>
                </Link>

                <Link href="/student/courses/explore" className={styles.trackCard} style={{ textDecoration: 'none' }}>
                  <div className={styles.trackHeader}>
                    <div className={styles.trackIcon} style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7' }}>
                      <Brain size={18} />
                    </div>
                    <div>
                      <div className={styles.trackTitle}>System Design & DSA</div>
                      <div className={styles.trackDesc}>Algorithmic problem solving, complexity analysis & high scale design.</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#6ee7b7', fontWeight: 600 }}>
                    <span>Explore Track</span>
                    <ChevronRight size={14} />
                  </div>
                </Link>
              </div>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border)' }}>
              <BookOpen size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Courses Found</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No enrolled courses match your current search or filter criteria.</p>
            </div>
          ) : (
            <div className={styles.courseGrid}>
              {filteredCourses.map(course => {
                const isComplete = course.progressPercent === 100 || course.status === 'completed'
                return (
                  <div key={course.enrollmentId} className={styles.courseCard}>
                    <div>
                      <div className={styles.thumbnailWrap}>
                        <img
                          src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60'}
                          alt={course.title}
                          className={styles.thumbnail}
                        />
                        <div className={styles.thumbnailBadge}>
                          {course.category || 'Engineering'}
                        </div>
                      </div>

                      <div className={styles.cardBody}>
                        <h3 className={styles.cardTitle}>{course.title}</h3>
                        <p className={styles.cardDescription}>{course.description}</p>

                        <div className={styles.trainerRow}>
                          <div className={styles.trainerAvatar}>
                            {(course.trainerName || 'T')[0]}
                          </div>
                          <div className={styles.trainerName}>{course.trainerName || 'Industry Trainer'}</div>
                        </div>

                        {/* Progress Section */}
                        <div className={styles.progressSection}>
                          <div className={styles.progressHeader}>
                            <span className={styles.progressLabel}>
                              {isComplete ? 'Course Completed' : 'Syllabus Progress'}
                            </span>
                            <span className={styles.progressValue}>{course.progressPercent || 0}%</span>
                          </div>
                          <div className={styles.progressBarBg}>
                            <div
                              className={`${styles.progressBarFill} ${isComplete ? styles.progressBarComplete : ''}`}
                              style={{ width: `${course.progressPercent || 0}%` }}
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
                        <PlayCircle size={15} strokeWidth={2} />
                        <span>{isComplete ? 'Review Course' : 'Resume Learning'}</span>
                      </Link>
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
