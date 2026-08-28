'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from '../../quizzes-manage.module.css'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  HelpCircle,
  Plus,
  ArrowLeft,
  Edit2,
  Trash2,
  CheckCircle2,
  Eye,
  Sparkles,
  Check,
  X,
  Clock,
  Award,
  Layers,
  Zap
} from 'lucide-react'

export default function QuizBuilderPage() {
  const params = useParams()
  const router = useRouter()
  const quizId = params?.id as string

  const [quiz, setQuiz] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modal states
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  // Question form
  const [questionType, setQuestionType] = useState('mcq')
  const [questionText, setQuestionText] = useState('')
  const [marks, setMarks] = useState('2')
  const [explanation, setExplanation] = useState('')
  const [options, setOptions] = useState<any[]>([
    { optionText: '', isCorrect: true },
    { optionText: '', isCorrect: false },
    { optionText: '', isCorrect: false },
    { optionText: '', isCorrect: false }
  ])

  useEffect(() => {
    if (quizId) fetchQuizAndQuestions()
  }, [quizId])

  const fetchQuizAndQuestions = async () => {
    setLoading(true)
    try {
      const [quizRes, questionsRes] = await Promise.all([
        fetch(`/api/quizzes/${quizId}`),
        fetch(`/api/quizzes/${quizId}/questions`)
      ])

      const [quizJson, questionsJson] = await Promise.all([
        quizRes.json(),
        questionsRes.json()
      ])

      if (quizJson.quiz) setQuiz(quizJson.quiz)
      if (questionsJson.questions) setQuestions(questionsJson.questions)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePublish = async () => {
    try {
      const res = await fetch(`/api/quizzes/${quizId}/publish`, { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.success) {
        setQuiz((prev: any) => ({ ...prev, status: data.status }))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const openAddQuestion = () => {
    setEditingQuestion(null)
    setQuestionType('mcq')
    setQuestionText('')
    setMarks('2')
    setExplanation('')
    setOptions([
      { optionText: '', isCorrect: true },
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false }
    ])
    setShowQuestionModal(true)
  }

  const openEditQuestion = (q: any) => {
    setEditingQuestion(q)
    setQuestionType(q.type)
    setQuestionText(q.question)
    setMarks(String(q.marks))
    setExplanation(q.explanation || '')
    setOptions(q.options.map((opt: any) => ({
      optionText: opt.optionText,
      isCorrect: opt.isCorrect
    })))
    setShowQuestionModal(true)
  }

  const handleTypeChange = (newType: string) => {
    setQuestionType(newType)
    if (newType === 'true_false') {
      setOptions([
        { optionText: 'True', isCorrect: true },
        { optionText: 'False', isCorrect: false }
      ])
    } else if (options.length < 2) {
      setOptions([
        { optionText: '', isCorrect: true },
        { optionText: '', isCorrect: false }
      ])
    }
  }

  const handleOptionChange = (idx: number, field: string, value: any) => {
    const updated = [...options]
    if (field === 'isCorrect') {
      if (questionType === 'mcq' || questionType === 'true_false') {
        // Single correct answer
        updated.forEach((opt, i) => {
          opt.isCorrect = i === idx
        })
      } else {
        // Multiple select
        updated[idx].isCorrect = value
      }
    } else {
      updated[idx][field] = value
    }
    setOptions(updated)
  }

  const addOption = () => {
    setOptions([...options, { optionText: '', isCorrect: false }])
  }

  const removeOption = (idx: number) => {
    if (options.length <= 2) {
      alert('A question must have at least 2 options.')
      return
    }
    setOptions(options.filter((_, i) => i !== idx))
  }

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!questionText.trim()) return

    // Ensure at least one correct option is marked
    const hasCorrect = options.some(opt => opt.isCorrect && opt.optionText.trim())
    if (!hasCorrect) {
      alert('Please mark at least one correct answer option and enter its text.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        type: questionType,
        question: questionText.trim(),
        marks: parseFloat(marks),
        explanation: explanation.trim(),
        orderIndex: questions.length,
        options: options.filter(opt => opt.optionText.trim().length > 0)
      }

      if (editingQuestion) {
        const res = await fetch(`/api/quizzes/${quizId}/questions/${editingQuestion.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (res.ok) {
          fetchQuizAndQuestions()
          setShowQuestionModal(false)
        }
      } else {
        const res = await fetch(`/api/quizzes/${quizId}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (res.ok) {
          fetchQuizAndQuestions()
          setShowQuestionModal(false)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteQuestion = async (qId: number) => {
    if (!confirm('Delete this question?')) return
    try {
      const res = await fetch(`/api/quizzes/${quizId}/questions/${qId}`, { method: 'DELETE' })
      if (res.ok) fetchQuizAndQuestions()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '14px' }}>
        <MorphingInfinity className="size-16" style={{ width: '56px', height: '56px', color: '#8b5cf6' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading question builder workspace...</p>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
        <h3>Quiz Not Found</h3>
        <Link href="/trainer/quizzes" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
          Back to Quizzes
        </Link>
      </div>
    )
  }

  const isPublished = quiz.status === 'published'
  const totalMarks = questions.reduce((acc, q) => acc + q.marks, 0)

  return (
    <div className={styles.container} style={{ maxWidth: '1080px' }}>
      {/* Top Header */}
      <div className={styles.header}>
        <div>
          <Link href="/trainer/quizzes" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem', marginBottom: '4px' }}>
            <ArrowLeft size={14} />
            <span>Manage Quizzes</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
            <h1 className={styles.title} style={{ fontSize: '1.6rem', margin: 0 }}>
              {quiz.title}
            </h1>
            <button
              onClick={handleTogglePublish}
              className={`badge ${isPublished ? 'badge-green' : 'badge-orange'}`}
              style={{ cursor: 'pointer', border: 'none' }}
              title="Click to toggle publish status"
            >
              {isPublished ? 'Published' : 'Draft'}
            </button>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            onClick={openAddQuestion}
            className="btn btn-primary btn-sm"
          >
            <Plus size={14} />
            <span>Add Question</span>
          </button>
          <Link
            href={`/trainer/quizzes/${quiz.id}/analytics`}
            className="btn btn-secondary btn-sm"
          >
            <span>Analytics</span>
          </Link>
          <Link
            href={`/student/quizzes/${quiz.id}`}
            target="_blank"
            className="btn btn-ghost btn-sm"
            title="Preview as Student"
          >
            <Eye size={14} />
            <span>Preview</span>
          </Link>
        </div>
      </div>

      {/* Overview Stats Bar */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Questions: </span>
            <strong style={{ color: 'var(--text-primary)' }}>{questions.length} Items</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Total Marks: </span>
            <strong style={{ color: '#c4b5fd' }}>{totalMarks} Points</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Time Limit: </span>
            <strong style={{ color: 'var(--text-primary)' }}>{quiz.timeLimit > 0 ? `${quiz.timeLimit} Mins` : 'Untimed'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Passing Score: </span>
            <strong style={{ color: '#6ee7b7' }}>{quiz.passingScore}%</strong>
          </div>
        </div>
      </div>

      {/* Question Tree */}
      <div className={styles.treeLayout}>
        {questions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border)' }}>
            <HelpCircle size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
            <h3>No Questions in this Quiz</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Click &quot;Add Question&quot; above to create multiple choice, multiple select, or true/false items.</p>
            <button onClick={openAddQuestion} className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
              <Plus size={14} />
              <span>Add First Question</span>
            </button>
          </div>
        ) : (
          questions.map((q, idx) => (
            <div key={q.id} className={styles.questionBox}>
              <div className={styles.questionBoxHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="badge badge-purple" style={{ fontSize: '11px', padding: '2px 8px' }}>
                    Q{idx + 1}
                  </span>
                  <span className="badge badge-blue" style={{ fontSize: '10px' }}>
                    {q.type === 'mcq' ? 'MCQ (Single)' : q.type === 'multiple_select' ? 'Multiple Select' : 'True / False'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {q.marks} Marks
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => openEditQuestion(q)}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '5px' }}
                    title="Edit Question"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '5px', color: '#ef4444' }}
                    title="Delete Question"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div style={{ padding: '1.25rem 1.5rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem', lineHeight: '1.4' }}>
                  {q.question}
                </h3>

                <div className={styles.optionsList} style={{ padding: 0 }}>
                  {q.options?.map((opt: any) => (
                    <div
                      key={opt.id}
                      className={`${styles.optionRow} ${opt.isCorrect ? styles.optionRowCorrect : ''}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {opt.isCorrect ? (
                          <CheckCircle2 size={16} color="#10b981" />
                        ) : (
                          <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1px solid var(--border)' }} />
                        )}
                        <span style={{ color: opt.isCorrect ? '#6ee7b7' : 'var(--text-primary)' }}>
                          {opt.optionText}
                        </span>
                      </div>

                      {opt.isCorrect && (
                        <span style={{ fontSize: '0.725rem', fontWeight: 600, color: '#10b981' }}>
                          Correct Answer ✓
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {q.explanation && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- Add / Edit Question Modal --- */}
      {showQuestionModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowQuestionModal(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                {editingQuestion ? 'Edit Question' : 'Add Question'}
              </h3>
              <button onClick={() => setShowQuestionModal(false)} className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className={styles.modalBody}>
              {/* Question Type & Marks */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Question Format</label>
                  <select
                    value={questionType}
                    onChange={e => handleTypeChange(e.target.value)}
                    className="form-select"
                  >
                    <option value="mcq">Single Correct Answer (MCQ)</option>
                    <option value="multiple_select">Multiple Correct Answers</option>
                    <option value="true_false">True / False</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Marks</label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={marks}
                    onChange={e => setMarks(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Question Text */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Question Statement *</label>
                <textarea
                  rows={3}
                  required
                  value={questionText}
                  onChange={e => setQuestionText(e.target.value)}
                  placeholder="e.g. What is the average time complexity of searching an element in a Hash Map?"
                  className="form-input"
                  style={{ resize: 'vertical' }}
                  autoFocus
                />
              </div>

              {/* Answer Options */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', margin: 0 }}>
                    Answer Options (Check the correct answer{questionType === 'multiple_select' ? 's' : ''})
                  </label>
                  {questionType !== 'true_false' && (
                    <button
                      type="button"
                      onClick={addOption}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '11px', padding: '2px 8px', color: '#c4b5fd' }}
                    >
                      <Plus size={11} />
                      <span>Add Option</span>
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {options.map((opt, oIdx) => (
                    <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type={questionType === 'multiple_select' ? 'checkbox' : 'radio'}
                        name="correctOption"
                        checked={opt.isCorrect}
                        onChange={e => handleOptionChange(oIdx, 'isCorrect', e.target.checked)}
                        title="Mark as correct answer"
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                      <input
                        type="text"
                        required
                        value={opt.optionText}
                        onChange={e => handleOptionChange(oIdx, 'optionText', e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                        className="form-input"
                        style={{ flex: 1, padding: '6px 12px', fontSize: '0.85rem' }}
                      />
                      {questionType !== 'true_false' && (
                        <button
                          type="button"
                          onClick={() => removeOption(oIdx)}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '4px', color: 'var(--text-muted)' }}
                          title="Remove option"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Explanation */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>
                  Explanation / Rational (Shown to students in results)
                </label>
                <input
                  type="text"
                  value={explanation}
                  onChange={e => setExplanation(e.target.value)}
                  placeholder="e.g. Hash tables provide expected O(1) time complexity through hash key hashing."
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <button type="button" onClick={() => setShowQuestionModal(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
                  {saving ? 'Saving...' : editingQuestion ? 'Save Changes' : 'Add Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
