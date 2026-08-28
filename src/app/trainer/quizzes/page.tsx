'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './quizzes-manage.module.css'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  HelpCircle,
  Plus,
  Search,
  Clock,
  Edit,
  Trash2,
  Eye,
  BarChart2,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react'

export default function TrainerQuizzesPage() {
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
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
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePublish = async (quizId: number) => {
    try {
      const res = await fetch(`/api/quizzes/${quizId}/publish`, { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.success) {
        setQuizzes(prev =>
          prev.map(q => (q.id === quizId ? { ...q, status: data.status } : q))
        )
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteQuiz = async (quizId: number, title: string) => {
    if (!confirm(`Delete quiz "${title}" and all its questions and attempts?`)) return
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, { method: 'DELETE' })
      if (res.ok) fetchQuizzes()
    } catch (err) {
      console.error(err)
    }
  }

  const filtered = quizzes.filter(q => {
    if (search.trim() && !q.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Quizzes & Assessment Builder</h1>
          <p className={styles.subtitle}>
            Build timed knowledge checks, manage question banks, and analyze student accuracy.
          </p>
        </div>
        <div className={styles.actions}>
          <Link href="/trainer/quizzes/create" className="btn btn-primary btn-sm">
            <Plus size={15} strokeWidth={2} />
            <span>Create Quiz</span>
          </Link>
          <Link href="/trainer/assignments" className="btn btn-secondary btn-sm">
            <span>Assignments</span>
          </Link>
        </div>
      </div>

      {/* Filter / Search */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search quizzes by title..."
            className="form-input"
            style={{ paddingLeft: '36px' }}
          />
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>
      </div>

      {/* Table Card */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <MorphingInfinity className="size-14" style={{ width: '48px', height: '48px', color: '#8b5cf6' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Loading quizzes...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-secondary)' }}>
            <HelpCircle size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ color: 'var(--text-primary)' }}>No Quizzes Created Yet</h3>
            <p style={{ fontSize: '0.85rem' }}>Build timed multiple choice and true/false assessments for your courses.</p>
            <Link href="/trainer/quizzes/create" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
              <Plus size={14} />
              <span>Create First Quiz</span>
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '0.875rem 1.25rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Quiz Title</th>
                  <th style={{ padding: '0.875rem 1.25rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Course</th>
                  <th style={{ padding: '0.875rem 1.25rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Questions</th>
                  <th style={{ padding: '0.875rem 1.25rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Duration</th>
                  <th style={{ padding: '0.875rem 1.25rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Attempts & Avg</th>
                  <th style={{ padding: '0.875rem 1.25rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '0.875rem 1.25rem', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(q => (
                  <tr key={q.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>{q.title}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Passing score: {q.passingScore}%
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{ fontWeight: 500 }}>{q.courseTitle}</span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span>{q.questionCount} Questions ({q.totalMarks} Pts)</span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)' }}>
                      {q.timeLimit > 0 ? `${q.timeLimit} Mins` : 'Untimed'}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{ fontWeight: 600, color: '#c4b5fd' }}>{q.totalAttempts} Attempts</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg: {q.avgScore}%</div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(q.id)}
                        className={`badge ${q.status === 'published' ? 'badge-green' : 'badge-orange'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                        title="Click to toggle publish status"
                      >
                        {q.status === 'published' ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                        <Link
                          href={`/trainer/quizzes/${q.id}/builder`}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                        >
                          <Edit size={12} />
                          <span>Builder ({q.questionCount})</span>
                        </Link>
                        <Link
                          href={`/trainer/quizzes/${q.id}/analytics`}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px' }}
                          title="View Analytics"
                        >
                          <BarChart2 size={13} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuiz(q.id, q.title)}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '4px 8px', color: '#ef4444' }}
                          title="Delete Quiz"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
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
