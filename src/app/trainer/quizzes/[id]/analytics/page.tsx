'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import styles from '../../quizzes-manage.module.css'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  BarChart2,
  ArrowLeft,
  Users,
  CheckCircle2,
  TrendingUp,
  Award,
  Clock,
  AlertCircle,
  Sparkles,
  HelpCircle
} from 'lucide-react'

export default function QuizAnalyticsPage() {
  const params = useParams()
  const quizId = params?.id as string

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (quizId) fetchAnalytics()
  }, [quizId])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/quizzes/${quizId}/analytics`)
      const json = await res.json()
      if (json.quiz) {
        setData(json)
      }
    } catch (err) {
      console.error(err)
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '14px' }}>
        <MorphingInfinity className="size-16" style={{ width: '56px', height: '56px', color: '#8b5cf6' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Calculating assessment statistics...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
        <h3>Analytics Not Found</h3>
        <Link href="/trainer/quizzes" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
          Back to Quizzes
        </Link>
      </div>
    )
  }

  const { quiz, stats, questionAnalytics = [], recentAttempts = [] } = data

  return (
    <div className={styles.container} style={{ maxWidth: '1100px' }}>
      {/* Back Link */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link href="/trainer/quizzes" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>
          <ArrowLeft size={14} />
          <span>Back to Quizzes</span>
        </Link>
      </div>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={20} color="#a855f7" />
            <h1 className={styles.title} style={{ fontSize: '1.6rem', margin: 0 }}>
              Analytics: {quiz.title}
            </h1>
          </div>
          <p className={styles.subtitle} style={{ marginTop: '4px' }}>
            Course: {quiz.courseTitle} • Passing Threshold: {quiz.passingScore}%
          </p>
        </div>

        <div className={styles.actions}>
          <Link href={`/trainer/quizzes/${quiz.id}/builder`} className="btn btn-primary btn-sm">
            <span>Question Builder</span>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c4b5fd' }}>
            <Users size={22} />
          </div>
          <div>
            <div className={styles.statValue}>{stats.totalAttempts}</div>
            <div className={styles.statLabel}>Total Attempts ({stats.uniqueStudents} Students)</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd' }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <div className={styles.statValue}>{stats.avgScore}%</div>
            <div className={styles.statLabel}>Average Score</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className={styles.statValue}>{stats.passRate}%</div>
            <div className={styles.statLabel}>Pass Rate ({stats.passCount}/{stats.totalAttempts})</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fcd34d' }}>
            <Award size={22} />
          </div>
          <div>
            <div className={styles.statValue}>{stats.highestScore}%</div>
            <div className={styles.statLabel}>Highest Score (Min {stats.lowestScore}%)</div>
          </div>
        </div>
      </div>

      {/* Question Accuracy Matrix */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '1.75rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Question Accuracy Matrix
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Identify tricky questions and concepts where students most frequently struggle.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {questionAnalytics.map((q: any, idx: number) => {
            const isHighDifficulty = q.totalAnswers > 0 && q.accuracyPercent < 50

            return (
              <div key={q.id} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    Q{idx + 1}. {q.question}
                  </span>
                  <span className={`badge ${q.accuracyPercent >= 70 ? 'badge-green' : isHighDifficulty ? 'badge-red' : 'badge-orange'}`} style={{ fontSize: '11px' }}>
                    {q.accuracyPercent}% Accuracy
                  </span>
                </div>

                <div className={styles.accuracyBarTrack}>
                  <div
                    className={styles.accuracyBarFill}
                    style={{
                      width: `${q.accuracyPercent}%`,
                      background: q.accuracyPercent >= 70 ? '#10b981' : isHighDifficulty ? '#ef4444' : '#f59e0b'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  <span>{q.correctCount} Correct Answers</span>
                  <span>{q.incorrectCount} Incorrect Answers</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Attempts Table */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '1.75rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
          Recent Student Attempts
        </h2>

        {recentAttempts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            No student attempts recorded yet.
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Student</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Attempt #</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Score</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Time Taken</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {recentAttempts.map((att: any) => (
                  <tr key={att.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>{att.studentName}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{att.studentEmail}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>#{att.attemptNumber}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: att.passed ? '#6ee7b7' : '#f87171' }}>
                      {att.percentage}%
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className={`badge ${att.passed ? 'badge-green' : 'badge-red'}`}>
                        {att.passed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                      {formatSeconds(att.timeTakenSeconds)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {new Date(att.submittedAt).toLocaleString()}
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
