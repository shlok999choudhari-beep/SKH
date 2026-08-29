'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from '../quizzes.module.css'
import StudentSidebar from '@/components/StudentSidebar'
import BackButton from '@/components/BackButton'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  HelpCircle,
  ArrowLeft,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Eye,
  ShieldCheck,
  Zap,
  ListOrdered,
  BookOpen,
  Calendar,
  ArrowRight
} from 'lucide-react'

export default function QuizDetailPage() {
  const params = useParams()
  const router = useRouter()
  const quizId = params?.id as string

  const [quiz, setQuiz] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (quizId) fetchQuiz()
  }, [quizId])

  const fetchQuiz = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/quizzes/${quizId}`)
      const data = await res.json()
      if (data.quiz) {
        setQuiz(data.quiz)
      }
    } catch (err) {
      console.error('Error fetching quiz details:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.layout}>
        <StudentSidebar />
        <div className={styles.content} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '14px' }}>
          <MorphingInfinity className="size-16" style={{ width: '56px', height: '56px', color: '#8b5cf6' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading assessment guidelines...</p>
        </div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className={styles.layout}>
        <StudentSidebar />
        <div className={styles.content}>
          <div className={styles.main}>
            <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <HelpCircle size={48} color="#8b5cf6" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Assessment Not Found</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>This quiz may have been archived or removed by the instructor.</p>
              <Link href="/student/quizzes" className="btn btn-primary btn-sm">
                Back to Quizzes
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const stats = quiz.studentStats || {}
  const attempts = stats.attempts || []
  const attemptsUsed = stats.attemptsUsed || 0
  const canAttempt = stats.canAttempt !== false
  const hasPassed = stats.hasPassed

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.content}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <BackButton fallbackHref="/student/quizzes" />
            <div>
              <h1 className={styles.pageTitle}>
                <HelpCircle size={22} color="#8b5cf6" strokeWidth={2} />
                <span>Quiz Overview</span>
              </h1>
              <p className={styles.pageSubtitle}>
                {quiz.course?.title ? `Course: ${quiz.course.title}` : 'Assessment Details & Guidelines'}
              </p>
            </div>
          </div>

          <div className={styles.headerActions}>
            <Link href="/student/quizzes" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={14} />
              <span>All Quizzes</span>
            </Link>
          </div>
        </header>

        <main className={styles.main}>
          <div className={styles.detailContainer}>
            {/* Hero Card */}
            <div className={styles.heroCard}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                <span className="badge badge-purple">{quiz.course?.title || 'General Course'}</span>
                {quiz.module?.title && <span className="badge badge-blue">Module: {quiz.module.title}</span>}
                {hasPassed && (
                  <span className="badge badge-green">
                    <CheckCircle2 size={12} strokeWidth={2} />
                    <span>Passed ({stats.bestPercentage}%)</span>
                  </span>
                )}
              </div>

              <h2 className={styles.heroTitle}>{quiz.title}</h2>
              {quiz.description && <p className={styles.heroDesc}>{quiz.description}</p>}

              {/* Assessment Specs Grid */}
              <div className={styles.quizInfoGrid}>
                <div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Time Limit</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={16} color="#c4b5fd" />
                    <span>{quiz.timeLimit > 0 ? `${quiz.timeLimit} Minutes` : 'Untimed'}</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Total Questions</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ListOrdered size={16} color="#93c5fd" />
                    <span>{quiz.questionCount || quiz.questions?.length || 0} Items ({quiz.totalMarks || 0} Pts)</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Passing Score</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34d399', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={16} color="#10b981" />
                    <span>{quiz.passingScore}% Required</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Attempts Left</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: canAttempt ? '#c4b5fd' : '#ef4444', marginTop: '4px' }}>
                    {quiz.maxAttempts > 0 ? `${quiz.maxAttempts - attemptsUsed} of ${quiz.maxAttempts}` : 'Unlimited'}
                  </div>
                </div>
              </div>

              {/* Start Button */}
              <div>
                {canAttempt ? (
                  <Link
                    href={`/student/quizzes/${quiz.id}/take`}
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', justifyContent: 'center', padding: '14px 24px', fontSize: '1.05rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Play size={18} fill="currentColor" />
                    <span>Start Timed Assessment Now</span>
                  </Link>
                ) : (
                  <div style={{ padding: '14px 20px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-lg)', textAlign: 'center', color: '#f87171', fontSize: '0.95rem' }}>
                    Maximum attempt limit reached for this assessment.
                  </div>
                )}
              </div>
            </div>

            {/* Attempt History Card */}
            <div className={styles.historyCard}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
                Attempt History
              </h3>

              {attempts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  You haven&apos;t taken this quiz yet. Click &quot;Start Timed Assessment Now&quot; above to begin your first attempt.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {attempts.map((att: any, idx: number) => {
                    const isPass = att.passed || att.score >= quiz.passingScore
                    return (
                      <div
                        key={att.id || idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '14px 18px',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-lg)',
                          flexWrap: 'wrap',
                          gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isPass ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: isPass ? '#34d399' : '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                            #{att.attemptNumber || idx + 1}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                              Score: {att.score}% ({att.earnedMarks || 0}/{att.totalMarks || quiz.totalMarks || 0} Pts)
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Submitted on {new Date(att.completedAt || att.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span className={`badge ${isPass ? 'badge-green' : 'badge-red'}`}>
                            {isPass ? 'Passed' : 'Needs Review'}
                          </span>
                          <Link href={`/student/quizzes/${quiz.id}/results/${att.id}`} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Eye size={13} />
                            <span>View Review</span>
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
