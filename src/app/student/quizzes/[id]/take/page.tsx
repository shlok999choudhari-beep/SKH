'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from '../../quizzes.module.css'
import StudentSidebar from '@/components/StudentSidebar'
import BackButton from '@/components/BackButton'
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
  AlertTriangle,
  LogOut
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
  const [showExitConfirm, setShowExitConfirm] = useState(false)

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
      setErrorMsg('A network error occurred while initializing assessment.')
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
        router.push(`/student/quizzes/${quizId}/results/${attemptData.attemptId}`)
      } else {
        alert(data.error || 'Failed to submit assessment.')
        setSubmitting(false)
      }
    } catch (err) {
      console.error(err)
      alert('Error submitting assessment.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.layout}>
        <StudentSidebar />
        <div className={styles.content} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '14px' }}>
          <MorphingInfinity className="size-16" style={{ width: '56px', height: '56px', color: '#8b5cf6' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Preparing your assessment environment...</p>
        </div>
      </div>
    )
  }

  if (errorMsg || !attemptData) {
    return (
      <div className={styles.layout}>
        <StudentSidebar />
        <div className={styles.content}>
          <div className={styles.main}>
            <div style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '2.5rem' }}>
              <AlertCircle size={44} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
              <h2 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Cannot Start Assessment</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>{errorMsg}</p>
              <Link href={`/student/quizzes/${quizId}`} className="btn btn-primary btn-sm">
                Back to Quiz Overview
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const questions = attemptData.questions || []
  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1
  const answeredCount = Object.keys(selectedAnswers).filter(k => (selectedAnswers[Number(k)] || []).length > 0).length
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100)
  const isTimeWarning = secondsRemaining !== null && secondsRemaining < 120 // less than 2 mins

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.content}>
        <main className={styles.main}>
          <div className={styles.playerLayout}>
            {/* Player Top Navigation Bar */}
            <div className={styles.playerHeader}>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Attempt #{attemptData.attemptNumber} • {attemptData.quizTitle}
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  Question {currentIndex + 1} of {questions.length}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className={`${styles.timerBadge} ${isTimeWarning ? styles.timerWarning : ''}`}>
                  <Clock size={16} strokeWidth={2.5} />
                  <span>{formatTimer(secondsRemaining)}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowExitConfirm(true)}
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  <LogOut size={13} />
                  <span>Exit</span>
                </button>
              </div>
            </div>

            {/* Progress Track */}
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)',
                  borderRadius: '99px',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>

            {/* Question Card */}
            {currentQuestion && (
              <div className={styles.questionCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <span className="badge badge-purple" style={{ textTransform: 'uppercase', fontSize: '10.5px' }}>
                    {currentQuestion.type === 'mcq' ? 'Single Choice (MCQ)' : currentQuestion.type === 'multiple_select' ? 'Multiple Select' : 'True / False'}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {currentQuestion.marks} {currentQuestion.marks === 1 ? 'Mark' : 'Marks'}
                  </span>
                </div>

                <h2 className={styles.questionTitle}>{currentQuestion.question}</h2>

                {/* Options List */}
                <div className={styles.optionsList}>
                  {currentQuestion.options?.map((opt: any) => {
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
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', padding: '8px 0' }}>
              {questions.map((q: any, idx: number) => {
                const isAnswered = (selectedAnswers[q.id] || []).length > 0
                const isCurrent = idx === currentIndex

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`${styles.navPill} ${isCurrent ? styles.navPillCurrent : isAnswered ? styles.navPillAnswered : ''}`}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>

            {/* Footer Navigation Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', paddingTop: '10px' }}>
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(prev => prev - 1)}
                className="btn btn-secondary btn-sm"
                style={{ opacity: currentIndex === 0 ? 0.4 : 1, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowLeft size={14} />
                <span>Previous Question</span>
              </button>

              {isLastQuestion ? (
                <button
                  type="button"
                  onClick={() => setShowConfirmSubmit(true)}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>Finish &amp; Submit Assessment</span>
                  <Send size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCurrentIndex(prev => prev + 1)}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>Next Question</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirmSubmit && (
        <div className={styles.modalBackdrop} onClick={() => setShowConfirmSubmit(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <AlertTriangle size={40} color="#f59e0b" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: 700 }}>Submit Assessment?</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              You have answered <strong>{answeredCount}</strong> of <strong>{questions.length}</strong> questions. Are you ready to submit your answers for evaluation?
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

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className={styles.modalBackdrop} onClick={() => setShowExitConfirm(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <AlertCircle size={40} color="#ef4444" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: 700 }}>Exit Assessment?</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Your timer is currently running. Exiting without submitting will forfeit this attempt.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="btn btn-secondary btn-sm"
              >
                Continue Quiz
              </button>
              <Link
                href={`/student/quizzes/${quizId}`}
                className="btn btn-primary btn-sm"
                style={{ background: '#ef4444', borderColor: '#ef4444', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                Exit Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
