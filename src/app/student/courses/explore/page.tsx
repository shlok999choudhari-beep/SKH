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
  KeyRound,
  Lock,
  Plus
} from 'lucide-react'

type CourseItem = {
  id: number
  title: string
  shortName: string
  academicYear: string
  semester: string
  department: string
  slug: string
  description: string
  thumbnail: string
  category: string
  categorySlug: string
  difficulty: string
  estimatedDuration: string
  joinCode?: string
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
              Retrieving academic curriculums, practical labs, and faculty courses...
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
                <span>Explore Courses</span>
              </h1>
              <p className={styles.pageSubtitle}>
                Browse available college courses, lab curriculums, and lecture materials.
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Link href="/student/courses" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={15} strokeWidth={2} />
              <span>My Courses</span>
            </Link>
          </div>
        </header>

        <main className={styles.main}>
          {/* Search & Filter Bar */}
          <div className={styles.filterBar} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '1rem' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search courses by title, department, or keyword..."
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

                <select
                  value={selectedDifficulty}
                  onChange={e => setSelectedDifficulty(e.target.value)}
                  className="form-select"
                  style={{ padding: '4px 10px', fontSize: '0.8rem', width: 'auto' }}
                >
                  <option value="all">All Difficulty Levels</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="form-select"
                  style={{ padding: '4px 10px', fontSize: '0.8rem', width: 'auto' }}
                >
                  <option value="newest">Recently Published</option>
                  <option value="title">Alphabetical (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Grid */}
          {courses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border)' }}>
              <Compass size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Courses Found</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Try adjusting your search query or reset filters.
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
                        src={course.thumbnail}
                        alt={course.title}
                        className={styles.thumbnail}
                      />
                      <div className={styles.thumbnailBadge}>
                        {course.academicYear || 'AY 2026-27'} • {course.semester || 'Semester I'}
                      </div>
                      <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                        {course.isEnrolled ? (
                          <span className="badge badge-green" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <CheckCircle2 size={11} /> Enrolled
                          </span>
                        ) : (
                          <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
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
                        <div>
                          <div className={styles.trainerName}>Teacher: {course.trainer?.name || 'Prof. Rajesh Sharma'}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{course.department || 'Computer Engineering'}</div>
                        </div>
                      </div>

                      {/* Course Code Info Box */}
                      <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <strong style={{ color: 'var(--text-secondary)' }}>Course Code:</strong> Available through teacher
                      </div>
                    </div>
                  </Link>

                  <div className={styles.cardFooter}>
                    {course.isEnrolled ? (
                      <Link
                        href={`/student/courses/${course.id}`}
                        className="btn btn-secondary btn-sm"
                        style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none' }}
                      >
                        <span>Open Workspace</span>
                        <ArrowRight size={13} strokeWidth={2} />
                      </Link>
                    ) : (
                      <Link
                        href={`/student/courses/${course.id}`}
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none' }}
                      >
                        <span>View Course Preview</span>
                        <ArrowRight size={13} strokeWidth={2} />
                      </Link>
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
