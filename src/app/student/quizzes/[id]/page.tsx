'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from '../quizzes.module.css'
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
  ListOrdered
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
      <div className={styles.container} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '14px' }}>
        <MorphingInfinity className="size-16" style={{ width: '56px', height: '56px', color: '#8b5cf6' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading assessment guidelines...</p>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
          <h3>Quiz Not Found</h3>
          <Link href="/student/quizzes" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
            Back to Quizzes
          </Link>
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
    <div className={styles.container} style={{ maxWidth: '960px' }}>
      {/* Back link */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link href="/student/quizzes" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>
          <ArrowLeft size={14} strokeWidth={2} />
          <span>Back to Quizzes</span>
        </Link>
      </div>

      {/* Main Banner Card */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          <span className="badge badge-purple">{quiz.course?.title}</span>
          {quiz.module?.title && <span className="badge badge-blue">Module: {quiz.module.title}</span>}
          {hasPassed && (
            <span className="badge badge-green">
              <CheckCircle2 size={12} strokeWidth={2} />
              <span>Passed ({stats.bestPercentage}%)</span>
            </span>
          )}
        </div>

        <h1 className={styles.title} style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
          {quiz.title}
        </h1>
        {quiz.description && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            {quiz.description}
          </p>
        )}

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', padding: '1.25rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '1.75rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Time Limit</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={16} color="#c4b5fd" />
              <span>{quiz.timeLimit > 0 ? `${quiz.timeLimit} Minutes` : 'Untimed'}</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Questions</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ListOrdered size={16} color="#93c5fd" />
              <span>{quiz.questionCount} Items ({quiz.totalMarks} Pts)</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Passing Score</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#6ee7b7', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Award size={16} color="#10b981" />
              <span>{quiz.passingScore}% Required</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Attempts Left</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: canAttempt ? '#c4b5fd' : '#ef4444', marginTop: '2px' }}>
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
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Play size={18} strokeWidth={2} />
              <span>{attemptsUsed > 0 ? `Start Attempt ${attemptsUsed + 1}` : 'Start Timed Assessment Now'}</span>
            </Link>
          ) : (
            <button
              disabled
              className="btn btn-secondary btn-lg"
              style={{ width: '100%', justifyContent: 'center', opacity: 0.6, cursor: 'not-allowed' }}
            >
              <AlertCircle size={18} />
              <span>Maximum Attempts Reached ({attemptsUsed}/{quiz.maxAttempts})</span>
            </button>
          )}
        </div>
      </div>

      {/* Attempt History Table */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '1.75rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
          Attempt History
        </h2>

        {attempts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            You haven&apos;t taken this quiz yet. Click &quot;Start Assessment&quot; above to begin your first attempt.
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Attempt</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Date Taken</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Score</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Percentage</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Result</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Review</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((att: any) => (
                  <tr key={att.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>
                      Attempt {att.attemptNumber}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)' }}>
                      {new Date(att.startedAt).toLocaleDateString()} at {new Date(att.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      {att.obtainedMarks} / {att.totalMarks}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: att.passed ? '#6ee7b7' : '#f87171' }}>
                      {att.percentage}%
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span className={`badge ${att.passed ? 'badge-green' : 'badge-red'}`}>
                        {att.passed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                      <Link
                        href={`/student/quizzes/${quiz.id}/results/${att.id}`}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                      >
                        <Eye size={13} strokeWidth={2} />
                        <span>View Breakdown</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
