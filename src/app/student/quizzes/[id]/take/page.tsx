'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from '../../quizzes.module.css'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Send,
  HelpCircle,
  Check,
  AlertTriangle
} from 'lucide-react'

export default function TakeQuizPage() {
  const params = useParams()
  const router = useRouter()
  const quizId = params?.id as string

  const [attemptData, setAttemptData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, any>>({})
  const [submitting, setSubmitting] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (quizId) startQuiz()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [quizId])

  const startQuiz = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/quizzes/${quizId}/start`, { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.success) {
        setAttemptData(data)
        if (data.timeLimit > 0) {
          const totalSeconds = data.timeLimit * 60
          setSecondsRemaining(totalSeconds)
        }
      } else {
        setErrorMsg(data.error || 'Failed to start quiz.')
      }
    } catch (err) {
      console.error(err)
      setErrorMsg('A network error occurred.')
    } finally {
      setLoading(false)
    }
  }

  // Timer Countdown
  useEffect(() => {
    if (secondsRemaining === null || secondsRemaining <= 0) return

    timerRef.current = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [secondsRemaining !== null])

  const handleAutoSubmit = () => {
    alert('Time limit expired! Submitting your answers automatically...')
    handleSubmitQuiz()
  }

  const formatTimer = (totalSecs: number | null) => {
    if (totalSecs === null) return 'Untimed'
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleSelectOption = (questionId: number, optionId: number, type: string) => {
    if (type === 'multiple_select') {
      const currentList: number[] = selectedAnswers[questionId] || []
      const exists = currentList.includes(optionId)
      const nextList = exists
        ? currentList.filter(id => id !== optionId)
        : [...currentList, optionId]
      setSelectedAnswers({ ...selectedAnswers, [questionId]: nextList })
    } else {
      // MCQ or True/False
      setSelectedAnswers({ ...selectedAnswers, [questionId]: [optionId] })
    }
  }

  const handleSubmitQuiz = async () => {
    if (submitting || !attemptData) return
    setSubmitting(true)

    try {
      const res = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: attemptData.attemptId,
          answers: selectedAnswers
        })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        router.push(`/student/quizzes/${quizId}/results/${data.attemptId}`)
      } else {
        alert(data.error || 'Failed to submit quiz.')
        setSubmitting(false)
      }
    } catch (err) {
      console.error(err)
      alert('An error occurred during submission.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.container} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: '14px' }}>
        <MorphingInfinity className="size-16" style={{ width: '56px', height: '56px', color: '#8b5cf6' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Preparing your assessment environment...</p>
      </div>
    )
  }

  if (errorMsg || !attemptData) {
    return (
      <div className={styles.container} style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2.5rem' }}>
          <AlertCircle size={40} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Cannot Start Assessment</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{errorMsg}</p>
          <Link href={`/student/quizzes/${quizId}`} className="btn btn-primary btn-sm">
            <span>Back to Quiz Overview</span>
          </Link>
        </div>
      </div>
    )
  }

  const questions = attemptData.questions || []
  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1
  const answeredCount = Object.keys(selectedAnswers).filter(k => (selectedAnswers[Number(k)] || []).length > 0).length
  const progressPercent = Math.round((answeredCount / questions.length) * 100)
  const isTimeWarning = secondsRemaining !== null && secondsRemaining < 120 // less than 2 mins

  return (
    <div className={styles.playerLayout}>
      {/* Sticky Player Header */}
      <div className={styles.playerHeader}>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Attempt {attemptData.attemptNumber} • {attemptData.quizTitle}
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
            Question {currentIndex + 1} of {questions.length}
          </div>
        </div>

        <div className={`${styles.timerBadge} ${isTimeWarning ? styles.timerWarning : ''}`}>
          <Clock size={16} strokeWidth={2.5} />
          <span>{formatTimer(secondsRemaining)}</span>
        </div>
      </div>

      {/* Progress Track */}
      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden', marginBottom: '1.5rem' }}>
        <div
          style={{
            height: '100%',
            width: `${((currentIndex + 1) / questions.length) * 100}%`,
            background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)',
            borderRadius: '99px',
            transition: 'width 0.3s ease'
          }}
        />
      </div>

      {/* Question Card */}
      {currentQuestion && (
        <div className={styles.questionCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span className="badge badge-purple" style={{ textTransform: 'uppercase', fontSize: '10.5px' }}>
              {currentQuestion.type === 'mcq' ? 'Single Choice (MCQ)' : currentQuestion.type === 'multiple_select' ? 'Multiple Select' : 'True / False'}
            </span>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {currentQuestion.marks} Marks
            </span>
          </div>

          <h2 className={styles.questionTitle}>{currentQuestion.question}</h2>

          {/* Options List */}
          <div className={styles.optionsList}>
            {currentQuestion.options?.map((opt: any, optIdx: number) => {
              const selectedList = selectedAnswers[currentQuestion.id] || []
              const isSelected = selectedList.includes(opt.id)

              return (
                <div
                  key={opt.id}
                  className={`${styles.optionItem} ${isSelected ? styles.optionItemSelected : ''}`}
                  onClick={() => handleSelectOption(currentQuestion.id, opt.id, currentQuestion.type)}
                >
                  <div className={styles.optionIndicator}>
                    {isSelected && <Check size={13} strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                    {opt.optionText}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Question Number Pills Navigation */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '2rem', justifyContent: 'center' }}>
        {questions.map((q: any, idx: number) => {
          const isAnswered = (selectedAnswers[q.id] || []).length > 0
          const isCurrent = idx === currentIndex

          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                border: isCurrent ? '2px solid #8b5cf6' : '1px solid var(--border)',
                background: isCurrent ? 'rgba(139, 92, 246, 0.2)' : isAnswered ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)',
                color: isCurrent ? '#c4b5fd' : isAnswered ? '#6ee7b7' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              {idx + 1}
            </button>
          )
        })}
      </div>

      {/* Footer Navigation Buttons */}
      <div className={styles.playerFooter}>
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(prev => prev - 1)}
          className="btn btn-secondary btn-sm"
          style={{ opacity: currentIndex === 0 ? 0.5 : 1 }}
        >
          <ArrowLeft size={14} />
          <span>Previous Question</span>
        </button>

        {isLastQuestion ? (
          <button
            type="button"
            onClick={() => setShowConfirmSubmit(true)}
            className="btn btn-primary btn-sm"
          >
            <span>Finish & Submit Assessment</span>
            <Send size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCurrentIndex(prev => prev + 1)}
            className="btn btn-primary btn-sm"
          >
            <span>Next Question</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirmSubmit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', maxWidth: '440px', width: '100%', padding: '2rem', textAlign: 'center' }}>
            <AlertTriangle size={36} color="#f59e0b" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Submit Assessment?</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              You have answered {answeredCount} of {questions.length} questions. Are you ready to submit your answers for evaluation?
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowConfirmSubmit(false)}
                className="btn btn-secondary btn-sm"
              >
                Keep Reviewing
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitQuiz}
                className="btn btn-primary btn-sm"
              >
                {submitting ? 'Evaluating...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
