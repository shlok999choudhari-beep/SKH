'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from '../quizzes-manage.module.css'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  HelpCircle,
  ArrowLeft,
  Sparkles,
  Zap,
  Clock,
  Award,
  AlertCircle
} from 'lucide-react'

export default function CreateQuizPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [formData, setFormData] = useState({
    courseId: '',
    moduleId: '',
    title: '',
    description: '',
    timeLimit: '20',
    maxAttempts: '3',
    passingScore: '60',
    randomizeQuestions: false,
    showResultsAfter: true,
    status: 'draft'
  })

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses')
      const data = await res.json()
      if (data.courses) {
        setCourses(data.courses)
        if (data.courses.length > 0) {
          setFormData(prev => ({ ...prev, courseId: String(data.courses[0].id) }))
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!formData.courseId || !formData.title.trim()) {
      setErrorMsg('Course and Quiz Title are required.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          timeLimit: parseInt(formData.timeLimit, 10),
          maxAttempts: parseInt(formData.maxAttempts, 10),
          passingScore: parseFloat(formData.passingScore),
          moduleId: formData.moduleId ? parseInt(formData.moduleId, 10) : null
        })
      })

      const data = await res.json()
      if (res.ok && data.quiz) {
        router.push(`/trainer/quizzes/${data.quiz.id}/builder`)
      } else {
        setErrorMsg(data.error || 'Failed to create quiz.')
      }
    } catch (err) {
      console.error(err)
      setErrorMsg('A network error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.container} style={{ maxWidth: '840px' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <Link href="/trainer/quizzes" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>
          <ArrowLeft size={14} strokeWidth={2} />
          <span>Back to Quizzes</span>
        </Link>
      </div>

      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
        <div style={{ paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HelpCircle size={20} color="#a855f7" />
            <h1 className={styles.title} style={{ fontSize: '1.4rem', margin: 0 }}>
              Create Assessment Quiz
            </h1>
          </div>
          <p className={styles.subtitle} style={{ marginTop: '4px' }}>
            Configure timing, attempt allowances, passing thresholds, and build your question bank.
          </p>
        </div>

        {errorMsg && (
          <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Course */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Course *</label>
            <select
              required
              value={formData.courseId}
              onChange={e => setFormData({ ...formData, courseId: e.target.value })}
              className="form-select"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Quiz Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Distributed Systems & Caching Mastery Quiz"
              className="form-input"
            />
          </div>

          {/* Description */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Description / Instructions</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Test understanding of cache invalidation, write-through strategies, and Redis cluster scaling..."
              className="form-input"
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Time Limit, Max Attempts, Passing Score */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Time Limit (Mins)</label>
              <input
                type="number"
                min="0"
                value={formData.timeLimit}
                onChange={e => setFormData({ ...formData, timeLimit: e.target.value })}
                placeholder="0 for untimed"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Max Attempts</label>
              <input
                type="number"
                min="0"
                value={formData.maxAttempts}
                onChange={e => setFormData({ ...formData, maxAttempts: e.target.value })}
                placeholder="0 for unlimited"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Passing Score (%)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.passingScore}
                onChange={e => setFormData({ ...formData, passingScore: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          {/* Toggles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
              <input
                type="checkbox"
                checked={formData.randomizeQuestions}
                onChange={e => setFormData({ ...formData, randomizeQuestions: e.target.checked })}
              />
              <span style={{ color: 'var(--text-primary)' }}>Randomize question order for each attempt</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
              <input
                type="checkbox"
                checked={formData.showResultsAfter}
                onChange={e => setFormData({ ...formData, showResultsAfter: e.target.checked })}
              />
              <span style={{ color: 'var(--text-primary)' }}>Display correct answers and explanations after submission</span>
            </label>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
            <Link href="/trainer/quizzes" className="btn btn-secondary btn-sm">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary btn-sm"
            >
              {submitting ? 'Creating...' : 'Continue to Question Builder'}
              <Zap size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
