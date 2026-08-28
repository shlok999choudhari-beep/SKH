'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from '../courses.module.css'
import StudentSidebar from '@/components/StudentSidebar'
import BackButton from '@/components/BackButton'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  Search,
  Filter,
  Compass,
  Layers,
  Clock,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Sparkles,
  Zap,
  Users,
  GraduationCap
} from 'lucide-react'

type CourseItem = {
  id: number
  title: string
  slug: string
  description: string
  thumbnail: string
  category: string
  categorySlug: string
  difficulty: string
  estimatedDuration: string
  trainer: {
    id?: number
    name: string
    rating: number
    bio?: string
  }
  moduleCount: number
  lessonCount: number
  resourceCount: number
  enrolledStudentsCount: number
  isEnrolled: boolean
  enrollment?: {
    id: number
    status: string
    progressPercent: number
  } | null
}

export default function ExploreCoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [enrollingId, setEnrollingId] = useState<number | null>(null)

  useEffect(() => {
    fetchCategories()
    fetchCourses()
  }, [selectedCategory, selectedDifficulty, sortBy])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/courses/categories')
      const data = await res.json()
      if (data.categories) setCategories(data.categories)
    } catch (err) {
      console.error('Error loading categories:', err)
    }
  }

  const fetchCourses = async () => {
    setLoading(true)
    try {
      let url = `/api/courses?sort=${sortBy}&`
      if (selectedCategory !== 'all') url += `category=${encodeURIComponent(selectedCategory)}&`
      if (selectedDifficulty !== 'all') url += `difficulty=${encodeURIComponent(selectedDifficulty)}&`
      if (search.trim()) url += `search=${encodeURIComponent(search.trim())}&`

      const res = await fetch(url)
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchCourses()
  }

  const handleQuickEnroll = async (courseId: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEnrollingId(courseId)
    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST'
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setCourses(prev =>
          prev.map(c =>
            c.id === courseId
              ? { ...c, isEnrolled: true, enrollment: data.enrollment }
              : c
          )
        )
        router.push(`/student/courses/${courseId}/learn`)
      } else {
        alert(data.error || 'Failed to enroll')
      }
    } catch (err) {
      console.error('Enroll error:', err)
      alert('An error occurred during enrollment.')
    } finally {
      setEnrollingId(null)
    }
  }

  if (loading && courses.length === 0) {
    return (
      <div className={styles.layout}>
        <StudentSidebar />
        <div className={styles.content} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.25rem' }}>
          <MorphingInfinity className="size-14" style={{ width: '56px', height: '56px', color: '#8b5cf6', filter: 'drop-shadow(0 0 16px rgba(139, 92, 246, 0.4))' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '4px' }}>
              Loading Course Catalog
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              Retrieving curriculum pathways and verified trainer tracks...
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
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <BackButton fallbackHref="/student/courses" />
            <div>
              <h1 className={styles.pageTitle}>
                <Compass size={22} color="#8b5cf6" strokeWidth={2} />
                <span>Explore Course Catalog</span>
              </h1>
              <p className={styles.pageSubtitle}>
                Browse curated curriculums taught by industry professionals to master engineering and placement interview topics.
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Link href="/student/courses" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={15} strokeWidth={2} />
              <span>My Enrolled Courses</span>
            </Link>
          </div>
        </header>

        <main className={styles.main}>
          {/* Search & Filter Card */}
          <div className={styles.filterBar} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '1rem' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search courses by title, topic, or keyword..."
                  className="form-input"
                  style={{ paddingLeft: '38px', width: '100%' }}
                />
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>

              <button type="submit" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Search size={14} />
                <span>Search</span>
              </button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Filter size={13} /> Filters:
                </span>

                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="form-select"
                  style={{ padding: '4px 10px', fontSize: '0.8rem', width: 'auto' }}
                >
                  <option value="all">All Domains & Categories</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>

                {/* Difficulty Filter */}
                <select
                  value={selectedDifficulty}
                  onChange={e => setSelectedDifficulty(e.target.value)}
                  className="form-select"
                  style={{ padding: '4px 10px', fontSize: '0.8rem', width: 'auto' }}
                >
                  <option value="all">All Difficulty Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              {/* Sort Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="form-select"
                  style={{ padding: '4px 10px', fontSize: '0.8rem', width: 'auto' }}
                >
                  <option value="newest">Recently Published</option>
                  <option value="popular">Most Popular</option>
                  <option value="title">Alphabetical (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Grid */}
          {courses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border)' }}>
              <Compass size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Courses Matched</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Try adjusting your keyword search, category filter, or difficulty settings.
              </p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSearch('')
                  setSelectedCategory('all')
                  setSelectedDifficulty('all')
                }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className={styles.courseGrid}>
              {courses.map(course => (
                <div key={course.id} className={styles.courseCard}>
                  <Link href={`/student/courses/${course.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className={styles.thumbnailWrap}>
                      <img
                        src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60'}
                        alt={course.title}
                        className={styles.thumbnail}
                      />
                      <div className={styles.thumbnailBadge}>
                        {course.category || 'Engineering'}
                      </div>
                      <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                        {course.isEnrolled ? (
                          <span className="badge badge-green" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <CheckCircle2 size={11} /> Enrolled
                          </span>
                        ) : (
                          <span className="badge badge-purple" style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>
                            {course.difficulty || 'All Levels'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={styles.cardBody}>
                      <h3 className={styles.cardTitle}>{course.title}</h3>
                      <p className={styles.cardDescription}>{course.description}</p>

                      <div className={styles.trainerRow}>
                        <div className={styles.trainerAvatar}>
                          {(course.trainer?.name || 'T')[0]}
                        </div>
                        <div className={styles.trainerName}>{course.trainer?.name || 'Industry Expert'}</div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.78rem', color: 'var(--text-muted)', paddingTop: '10px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Layers size={13} /> {course.moduleCount || 0} Modules
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={13} /> {course.estimatedDuration || '4h 30m'}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Users size={13} /> {course.enrolledStudentsCount || 0} learners
                        </span>
                      </div>
                    </div>
                  </Link>

                  <div className={styles.cardFooter}>
                    {course.isEnrolled ? (
                      <Link
                        href={`/student/courses/${course.id}/learn`}
                        className="btn btn-secondary btn-sm"
                        style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none' }}
                      >
                        <span>Continue Learning</span>
                        <ArrowRight size={13} strokeWidth={2} />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleQuickEnroll(course.id, e)}
                        disabled={enrollingId === course.id}
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        {enrollingId === course.id ? (
                          <span>Enrolling...</span>
                        ) : (
                          <>
                            <span>Enroll in Course</span>
                            <Zap size={13} strokeWidth={2} />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
