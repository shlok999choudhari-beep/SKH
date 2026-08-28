'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './quizzes.module.css'
import StudentSidebar from '@/components/StudentSidebar'
import BackButton from '@/components/BackButton'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ArrowRight,
  Sparkles,
  Award,
  RotateCcw,
  Zap,
  TrendingUp,
  Search,
  FileCheck
} from 'lucide-react'

export default function StudentQuizzesPage() {
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchQuizzes()
  }, [])

  const fetchQuizzes = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/quizzes')
      const data = await res.json()
      if (data.quizzes) {
        setQuizzes(data.quizzes)
      }
    } catch (err) {
      console.error('Error fetching quizzes:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = quizzes.filter(q => {
    const isCompleted = q.userAttempts && q.userAttempts.length > 0 && q.userAttempts.some((att: any) => att.score >= q.passingScore)
    if (filter === 'completed' && !isCompleted) return false
    if (filter === 'pending' && isCompleted) return false
    if (search.trim()) {
      const query = search.toLowerCase()
      return (
        q.title?.toLowerCase().includes(query) ||
        q.description?.toLowerCase().includes(query) ||
        q.course?.title?.toLowerCase().includes(query)
      )
    }
    return true
  })

  const totalCount = quizzes.length
  const completedCount = quizzes.filter(q => q.userAttempts && q.userAttempts.some((att: any) => att.score >= q.passingScore)).length
  const pendingCount = totalCount - completedCount
  const avgScore = quizzes.reduce((acc, q) => {
    const highest = q.userAttempts?.reduce((max: number, a: any) => Math.max(max, a.score || 0), 0) || 0
    return acc + highest
  }, 0) / (quizzes.length || 1)

  if (loading) {
    return (
      <div className={styles.layout}>
        <StudentSidebar />
        <div className={styles.content} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.25rem' }}>
          <MorphingInfinity className="size-14" style={{ width: '56px', height: '56px', color: '#8b5cf6', filter: 'drop-shadow(0 0 16px rgba(139, 92, 246, 0.4))' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '4px' }}>
              Loading Quizzes & Assessments
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              Retrieving timed exams and evaluation tests...
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
            <BackButton fallbackHref="/student/dashboard" />
            <div>
              <h1 className={styles.pageTitle}>
                <HelpCircle size={22} color="#8b5cf6" strokeWidth={2} />
                <span>Quizzes & Timed Assessments</span>
              </h1>
              <p className={styles.pageSubtitle}>
                Test your conceptual understanding, unlock verified skill endorsements, and earn course certificates.
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Link href="/student/assignments" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <FileCheck size={15} strokeWidth={2} />
              <span>Assignments & Tasks</span>
            </Link>
          </div>
        </header>

        <main className={styles.main}>
          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIconWrap} style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c4b5fd' }}>
                <HelpCircle size={22} strokeWidth={2} />
              </div>
              <div>
                <div className={styles.statValue}>{totalCount}</div>
                <div className={styles.statLabel}>Total Quizzes</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconWrap} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5' }}>
                <Clock size={22} strokeWidth={2} />
              </div>
              <div>
                <div className={styles.statValue}>{pendingCount}</div>
                <div className={styles.statLabel}>Available to Take</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconWrap} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7' }}>
                <CheckCircle2 size={22} strokeWidth={2} />
              </div>
              <div>
                <div className={styles.statValue}>{completedCount}</div>
                <div className={styles.statLabel}>Passed & Cleared</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconWrap} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fcd34d' }}>
                <Award size={22} strokeWidth={2} />
              </div>
              <div>
                <div className={styles.statValue}>{Math.round(avgScore)}%</div>
                <div className={styles.statLabel}>Average Accuracy</div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className={styles.filterBar}>
            <div className={styles.tabsGroup}>
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`${styles.tabBtn} ${filter === 'all' ? styles.tabBtnActive : ''}`}
              >
                All Quizzes ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('pending')}
                className={`${styles.tabBtn} ${filter === 'pending' ? styles.tabBtnActive : ''}`}
              >
                Available ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('completed')}
                className={`${styles.tabBtn} ${filter === 'completed' ? styles.tabBtnActive : ''}`}
              >
                Passed ({completedCount})
              </button>
            </div>

            <div className={styles.searchBox}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search quizzes by title or course..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          {/* Quizzes Grid */}
          {quizzes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border)' }}>
              <HelpCircle size={44} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Quizzes Available</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Course instructors schedule quizzes and milestone tests as modules are published.
              </p>
              <Link href="/student/courses" className="btn btn-primary btn-sm">
                Go to My Courses
              </Link>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border)' }}>
              <Search size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.4rem' }}>No Matching Quizzes</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Try clearing your search query or switching your filter.</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {filtered.map(quiz => {
                const highestAttempt = quiz.userAttempts?.reduce((max: any, a: any) => (!max || a.score > max.score ? a : max), null)
                const isPassed = highestAttempt && highestAttempt.score >= quiz.passingScore

                return (
                  <div key={quiz.id} className={styles.card}>
                    <div>
                      <div className={styles.cardHeader}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, background: 'rgba(255, 255, 255, 0.05)', color: '#c4b5fd', padding: '3px 10px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <BookOpen size={12} /> {quiz.course?.title || 'Course Quiz'}
                        </span>

                        {isPassed ? (
                          <span className="badge badge-green" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={11} /> Passed ({highestAttempt.score}%)
                          </span>
                        ) : highestAttempt ? (
                          <span className="badge badge-orange" style={{ fontSize: '11px' }}>
                            Score: {highestAttempt.score}%
                          </span>
                        ) : (
                          <span className="badge badge-purple" style={{ fontSize: '11px' }}>
                            Pass Mark: {quiz.passingScore}%
                          </span>
                        )}
                      </div>

                      <h3 className={styles.cardTitle}>{quiz.title}</h3>
                      <p className={styles.cardDescription}>{quiz.description}</p>

                      <div className={styles.cardMeta}>
                        <div className={styles.metaRow}>
                          <span>Time Limit</span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                            {quiz.timeLimitMinutes ? `${quiz.timeLimitMinutes} minutes` : 'Untimed'}
                          </span>
                        </div>
                        <div className={styles.metaRow}>
                          <span>Questions</span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                            {quiz._count?.questions || quiz.questions?.length || 10} Questions
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Link
                        href={`/student/quizzes/${quiz.id}`}
                        className={`btn ${isPassed ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none' }}
                      >
                        <span>{isPassed ? 'Retake Quiz' : highestAttempt ? 'Retry Quiz' : 'Start Assessment'}</span>
                        <Zap size={14} />
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
