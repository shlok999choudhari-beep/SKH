'use client'

import { useState, useEffect } from 'react'
import styles from './ai-tools.module.css'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  Sparkles,
  HelpCircle,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Plus,
  BookOpen,
  Send,
  Layers,
  BarChart3,
  Award,
  AlertCircle
} from 'lucide-react'

export default function TrainerAIToolsPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [loading, setLoading] = useState(true)

  // Generator Config
  const [topic, setTopic] = useState('React Server Components & Next.js 15 Streaming')
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate')
  const [questionCount, setQuestionCount] = useState('5')
  const [questionTypes, setQuestionTypes] = useState('mixed')
  const [generating, setGenerating] = useState(false)

  // Draft Questions State
  const [draftQuizTitle, setDraftQuizTitle] = useState('')
  const [draftQuestions, setDraftQuestions] = useState<any[]>([])
  const [timeLimit, setTimeLimit] = useState('20')
  const [passingScore, setPassingScore] = useState('60')
  const [publishing, setPublishing] = useState(false)
  const [publishSuccess, setPublishSuccess] = useState('')

  // Single Question Re-roll Loading State
  const [rerollingIdx, setRerollingIdx] = useState<number | null>(null)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/courses')
      const data = await res.json()
      if (data.courses && data.courses.length > 0) {
        setCourses(data.courses)
        setSelectedCourseId(data.courses[0].id.toString())
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateDraft = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCourseId || !topic.trim()) return

    setGenerating(true)
    setPublishSuccess('')
    try {
      const res = await fetch('/api/ai/quiz-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: parseInt(selectedCourseId, 10),
          topic: topic.trim(),
          difficulty,
          questionCount: parseInt(questionCount, 10) || 5,
          questionTypes
        })
      })
      const data = await res.json()
      if (data.success && data.questions) {
        setDraftQuestions(data.questions)
        setDraftQuizTitle(`Mastery Assessment: ${topic.trim()}`)
      } else {
        alert(data.error || 'Failed to generate quiz draft')
      }
    } catch (err: any) {
      alert(err.message || 'Error generating quiz draft')
    } finally {
      setGenerating(false)
    }
  }

  const handleRerollQuestion = async (idx: number) => {
    setRerollingIdx(idx)
    try {
      const res = await fetch('/api/ai/quiz-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'regenerate_single',
          courseId: parseInt(selectedCourseId, 10),
          topic,
          difficulty,
          type: draftQuestions[idx]?.type || 'mcq'
        })
      })
      const data = await res.json()
      if (data.success && data.question) {
        setDraftQuestions(prev => {
          const clone = [...prev]
          clone[idx] = data.question
          return clone
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setRerollingIdx(null)
    }
  }

  const handleDeleteQuestion = (idx: number) => {
    setDraftQuestions(prev => prev.filter((_, i) => i !== idx))
  }

  const handleUpdateQuestionText = (idx: number, text: string) => {
    setDraftQuestions(prev => {
      const clone = [...prev]
      clone[idx].question = text
      return clone
    })
  }

  const handleUpdateOptionText = (qIdx: number, optIdx: number, text: string) => {
    setDraftQuestions(prev => {
      const clone = [...prev]
      clone[qIdx].options[optIdx].optionText = text
      return clone
    })
  }

  const handleSetCorrectOption = (qIdx: number, optIdx: number) => {
    setDraftQuestions(prev => {
      const clone = [...prev]
      clone[qIdx].options.forEach((opt: any, i: number) => {
        opt.isCorrect = i === optIdx
      })
      return clone
    })
  }

  const handleApproveAndPublish = async () => {
    if (!draftQuizTitle.trim() || draftQuestions.length === 0) {
      alert('Please provide a quiz title and at least 1 question.')
      return
    }

    setPublishing(true)
    setPublishSuccess('')
    try {
      const res = await fetch('/api/ai/quiz-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve_and_publish',
          courseId: parseInt(selectedCourseId, 10),
          title: draftQuizTitle.trim(),
          description: `AI-generated assessment for ${topic}. Verified by course instructor.`,
          timeLimit: parseInt(timeLimit, 10) || 20,
          passingScore: parseFloat(passingScore) || 60,
          questions: draftQuestions
        })
      })
      const data = await res.json()
      if (data.success) {
        setPublishSuccess('🎉 Quiz approved and published to live course curriculum!')
        setDraftQuestions([])
      } else {
        alert(data.error || 'Failed to publish quiz')
      }
    } catch (err: any) {
      alert(err.message || 'Error publishing quiz')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <Sparkles size={24} color="#818cf8" />
            <h1 className={styles.title}>AI Teaching Tools</h1>
          </div>
          <p className={styles.subtitle}>
            Pedagogical AI Generator: Draft Assessments, Regenerate Questions, and Review Before Publishing.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <BookOpen size={16} color="var(--text-muted)" />
          <select
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.5rem 0.875rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', outline: 'none' }}
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
          >
            {courses.map(c => (
              <option key={c.id} value={c.id.toString()}>{c.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Generator Form */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>
            <HelpCircle size={18} color="#818cf8" />
            <span>Generate Course Quiz with AI</span>
          </div>
        </div>

        <form onSubmit={handleGenerateDraft}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Assessment Topic or Module Keyword *
              </label>
              <input
                type="text"
                className={styles.questionInput}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Difficulty Level
              </label>
              <select
                className={styles.questionInput}
                value={difficulty}
                onChange={(e: any) => setDifficulty(e.target.value)}
              >
                <option value="Beginner">Beginner (Foundational)</option>
                <option value="Intermediate">Intermediate (Practical Application)</option>
                <option value="Advanced">Advanced (Architectural / Edge Cases)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Number of Questions
              </label>
              <select
                className={styles.questionInput}
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
              >
                <option value="3">3 Questions</option>
                <option value="5">5 Questions</option>
                <option value="10">10 Questions</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Question Formats
              </label>
              <select
                className={styles.questionInput}
                value={questionTypes}
                onChange={(e) => setQuestionTypes(e.target.value)}
              >
                <option value="mixed">Mixed (MCQs + True/False)</option>
                <option value="mcq">Multiple Choice Only</option>
                <option value="true_false">True / False Only</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={generating}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Sparkles size={16} />
              <span>{generating ? 'Drafting Questions with AI...' : 'Generate Draft Questions'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Success Notification */}
      {publishSuccess && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', borderRadius: 'var(--radius-lg)', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          <span>{publishSuccess}</span>
        </div>
      )}

      {/* Draft Review Workspace */}
      {draftQuestions.length > 0 && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                Trainer Review & Governance
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Review Draft Quiz Questions ({draftQuestions.length})
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                className="btn btn-primary"
                onClick={handleApproveAndPublish}
                disabled={publishing}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#10b981', borderColor: '#10b981' }}
              >
                <CheckCircle2 size={15} />
                <span>{publishing ? 'Publishing...' : 'Approve & Publish Quiz'}</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem', background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                Quiz Title *
              </label>
              <input
                type="text"
                className={styles.questionInput}
                value={draftQuizTitle}
                onChange={(e) => setDraftQuizTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                Time Limit (Minutes)
              </label>
              <input
                type="number"
                className={styles.questionInput}
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                Passing Score (%)
              </label>
              <input
                type="number"
                className={styles.questionInput}
                value={passingScore}
                onChange={(e) => setPassingScore(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {draftQuestions.map((q, idx) => (
              <div key={idx} className={styles.questionCard}>
                <div className={styles.questionHeader}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#818cf8' }}>
                    Question {idx + 1} ({q.type})
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '3px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      onClick={() => handleRerollQuestion(idx)}
                      disabled={rerollingIdx === idx}
                    >
                      <RefreshCw size={11} className={rerollingIdx === idx ? 'spin' : ''} />
                      <span>{rerollingIdx === idx ? 'Re-rolling...' : 'Re-roll Question'}</span>
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '3px 8px', fontSize: '11px', color: '#f87171' }}
                      onClick={() => handleDeleteQuestion(idx)}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  className={styles.questionInput}
                  value={q.question}
                  onChange={(e) => handleUpdateQuestionText(idx, e.target.value)}
                />

                <div className={styles.optionsGrid}>
                  {(q.options || []).map((opt: any, optIdx: number) => (
                    <div key={optIdx} className={styles.optionRow}>
                      <input
                        type="radio"
                        name={`correct-opt-${idx}`}
                        checked={Boolean(opt.isCorrect)}
                        onChange={() => handleSetCorrectOption(idx, optIdx)}
                        style={{ cursor: 'pointer' }}
                        title="Mark as correct answer"
                      />
                      <input
                        type="text"
                        className={styles.optionInput}
                        value={opt.optionText}
                        onChange={(e) => handleUpdateOptionText(idx, optIdx, e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                {q.explanation && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
