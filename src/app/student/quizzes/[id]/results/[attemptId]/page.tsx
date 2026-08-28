'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from '../../../quizzes.module.css'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Check,
  X,
  BookOpen
} from 'lucide-react'

export default function QuizResultPage() {
  const params = useParams()
  const router = useRouter()
  const quizId = params?.id as string
  const attemptId = params?.attemptId as string

  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (quizId && attemptId) fetchResult()
  }, [quizId, attemptId])

  const fetchResult = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/quizzes/${quizId}/attempts/${attemptId}`)
      const data = await res.json()
      if (data.attempt) {
        setResult(data.attempt)
      }
    } catch (err) {
      console.error('Error fetching quiz result:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatSeconds = (totalSecs?: number) => {
    if (!totalSecs) return '< 1 min'
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${mins}m ${secs}s`
  }

  if (loading) {
    return (
      <div className={styles.container} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '14px' }}>
        <MorphingInfinity className="size-16" style={{ width: '56px', height: '56px', color: '#8b5cf6' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Calculating assessment performance...</p>
      </div>
    )
  }

  if (!result) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
          <h3>Results Not Found</h3>
          <Link href={`/student/quizzes/${quizId}`} className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
            Back to Quiz
          </Link>
        </div>
      </div>
    )
  }

  const isPassed = result.passed

  return (
    <div className={styles.container} style={{ maxWidth: '880px' }}>
      {/* Top Back Link */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link href={`/student/quizzes/${quizId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>
          <ArrowLeft size={14} strokeWidth={2} />
          <span>Back to Quiz Overview</span>
        </Link>
      </div>

      {/* Hero Summary Card */}
      <div className={styles.resultsSummary}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: isPassed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: isPassed ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          {isPassed ? <CheckCircle2 size={36} strokeWidth={2} /> : <XCircle size={36} strokeWidth={2} />}
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
          <span className={`badge ${isPassed ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '13px', padding: '4px 12px' }}>
            {isPassed ? 'Passed Assessment' : 'Needs Review (Failed)'}
          </span>
        </div>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--text-primary)', margin: '0.25rem 0' }}>
          {result.percentage}%
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.75rem' }}>
          You scored <strong>{result.obtainedMarks}</strong> out of <strong>{result.totalMarks}</strong> points (Passing Requirement: {result.passingScore}%)
        </p>

        {/* Metrics Pill Row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <Clock size={15} color="#c4b5fd" />
            <span>Time Taken: <strong style={{ color: 'var(--text-primary)' }}>{formatSeconds(result.timeTakenSeconds)}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <Award size={15} color="#6ee7b7" />
            <span>Attempt: <strong style={{ color: 'var(--text-primary)' }}>#{result.attemptNumber}</strong></span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '1.75rem' }}>
          <Link href={`/student/quizzes/${quizId}`} className="btn btn-secondary btn-sm">
            <RotateCcw size={14} />
            <span>Retake Assessment</span>
          </Link>
          <Link href="/student/quizzes" className="btn btn-primary btn-sm">
            <HelpCircle size={14} />
            <span>All Quizzes</span>
          </Link>
        </div>
      </div>

      {/* Detailed Question Review */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
          Question-by-Question Evaluation
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {result.questions?.map((q: any, qIdx: number) => {
            const studentAns = q.studentAnswer || {}
            const isCorrect = studentAns.isCorrect
            const selectedIds: number[] = studentAns.selectedOptionIds || []

            return (
              <div
                key={q.id}
                className={styles.reviewItem}
                style={{
                  borderLeft: `4px solid ${isCorrect ? '#10b981' : '#ef4444'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Question {qIdx + 1} • {q.marks} Marks
                  </span>
                  <span
                    className={`badge ${isCorrect ? 'badge-green' : 'badge-red'}`}
                    style={{ fontSize: '11px' }}
                  >
                    {isCorrect ? `+${studentAns.awardedMarks} Marks (Correct)` : '0 Marks (Incorrect)'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem', lineHeight: '1.4' }}>
                  {q.question}
                </h3>

                {/* Options List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  {q.options?.map((opt: any) => {
                    const isStudentSelected = selectedIds.includes(opt.id)
                    const isActuallyCorrect = opt.isCorrect

                    let optionBg = 'var(--bg-primary)'
                    let optionBorder = 'var(--border)'
                    let optionColor = 'var(--text-primary)'

                    if (isActuallyCorrect) {
                      optionBg = 'rgba(16, 185, 129, 0.12)'
                      optionBorder = 'rgba(16, 185, 129, 0.4)'
                      optionColor = '#6ee7b7'
                    } else if (isStudentSelected && !isActuallyCorrect) {
                      optionBg = 'rgba(239, 68, 68, 0.12)'
                      optionBorder = 'rgba(239, 68, 68, 0.4)'
                      optionColor = '#f87171'
                    }

                    return (
                      <div
                        key={opt.id}
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          background: optionBg,
                          border: `1px solid ${optionBorder}`,
                          color: optionColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.9rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isActuallyCorrect ? (
                            <CheckCircle2 size={16} color="#10b981" />
                          ) : isStudentSelected ? (
                            <XCircle size={16} color="#ef4444" />
                          ) : (
                            <div style={{ width: '16px' }} />
                          )}
                          <span>{opt.optionText}</span>
                        </div>

                        <div>
                          {isStudentSelected && (
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: isActuallyCorrect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }}>
                              Your Choice
                            </span>
                          )}
                          {isActuallyCorrect && !isStudentSelected && (
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981', marginLeft: '6px' }}>
                              Correct Answer
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Explanation Box */}
                {q.explanation && (
                  <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.875rem 1rem', fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Explanation:</strong> {q.explanation}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
