'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import StudentSidebar from '@/components/StudentSidebar'
import BackButton from '@/components/BackButton'
import { BookOpen, Zap, CheckCircle2, AlertCircle, ArrowRight, KeyRound } from 'lucide-react'
import styles from './join.module.css'

const CODE_LENGTH = 8

export default function JoinCoursePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefillCode = searchParams?.get('code') || ''

  const [chars, setChars] = useState<string[]>(Array(CODE_LENGTH).fill(''))
  const [joining, setJoining] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; courseId?: number; courseTitle?: string } | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Prefill from URL param
  useEffect(() => {
    if (prefillCode) {
      const cleaned = prefillCode.replace(/-/g, '').toUpperCase().slice(0, CODE_LENGTH)
      const arr = Array(CODE_LENGTH).fill('')
      cleaned.split('').forEach((c, i) => { arr[i] = c })
      setChars(arr)
    }
  }, [prefillCode])

  const getFullCode = () => chars.join('')

  const handleCharInput = (index: number, value: string) => {
    const char = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(-1)
    const newChars = [...chars]
    newChars[index] = char
    setChars(newChars)
    // Auto-advance
    if (char && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (!chars[index] && index > 0) {
        const newChars = [...chars]
        newChars[index - 1] = ''
        setChars(newChars)
        inputRefs.current[index - 1]?.focus()
      } else {
        const newChars = [...chars]
        newChars[index] = ''
        setChars(newChars)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, CODE_LENGTH)
    const arr = Array(CODE_LENGTH).fill('')
    pasted.split('').forEach((c, i) => { arr[i] = c })
    setChars(arr)
    const nextEmpty = arr.findIndex(c => !c)
    inputRefs.current[nextEmpty === -1 ? CODE_LENGTH - 1 : nextEmpty]?.focus()
  }

  const handleJoin = async () => {
    const code = getFullCode()
    if (code.length < CODE_LENGTH) {
      setResult({ success: false, message: `Please enter the full ${CODE_LENGTH}-character code.` })
      return
    }

    setJoining(true)
    setResult(null)

    try {
      const res = await fetch('/api/courses/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
      const data = await res.json()

      if (res.ok && data.success) {
        if (data.alreadyEnrolled) {
          setResult({
            success: true,
            message: `You're already enrolled in "${data.course.title}". Redirecting...`,
            courseId: data.course.id,
            courseTitle: data.course.title
          })
        } else {
          setResult({
            success: true,
            message: `Successfully enrolled in "${data.course.title}"! Redirecting to your course...`,
            courseId: data.course.id,
            courseTitle: data.course.title
          })
        }
        setTimeout(() => router.push(`/student/courses/${data.course.id}`), 2000)
      } else {
        setResult({ success: false, message: data.error || 'Failed to join. Please try again.' })
      }
    } catch {
      setResult({ success: false, message: 'Network error. Please try again.' })
    } finally {
      setJoining(false)
    }
  }

  const isComplete = chars.every(c => c !== '')

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.content}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <BackButton fallbackHref="/student/courses" />
            <div>
              <h1 className={styles.pageTitle}>
                <KeyRound size={22} color="#8b5cf6" strokeWidth={2} />
                <span>Join a Course</span>
              </h1>
              <p className={styles.pageSubtitle}>Enter the join code your trainer shared with you</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Link href="/student/courses" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={14} />
              <span>My Courses</span>
            </Link>
          </div>
        </header>

        <main className={styles.main}>
          <div className={styles.centerCard}>
            {/* Icon */}
            <div className={styles.heroIcon}>
              <KeyRound size={32} color="#a78bfa" strokeWidth={1.5} />
            </div>

            <h2 className={styles.cardTitle}>Enter Your Join Code</h2>
            <p className={styles.cardSubtitle}>
              Ask your trainer for the course join code. Enter it below to get instant access.
            </p>

            {/* Code Input — Google Classroom style individual boxes */}
            <div className={styles.codeInputRow} onPaste={handlePaste}>
              {chars.map((char, i) => (
                <>
                  {i === 4 && (
                    <span key="dash" className={styles.inputDash}>–</span>
                  )}
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el }}
                    type="text"
                    inputMode="text"
                    maxLength={1}
                    value={char}
                    onChange={e => handleCharInput(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className={`${styles.codeBox} ${char ? styles.codeBoxFilled : ''}`}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </>
              ))}
            </div>

            {/* Result Message */}
            {result && (
              <div className={`${styles.resultMsg} ${result.success ? styles.resultSuccess : styles.resultError}`}>
                {result.success
                  ? <CheckCircle2 size={16} color="#10b981" />
                  : <AlertCircle size={16} color="#f87171" />
                }
                <span>{result.message}</span>
              </div>
            )}

            {/* Join Button */}
            <button
              type="button"
              onClick={handleJoin}
              disabled={joining || !isComplete || result?.success === true}
              className={`${styles.joinBtn} ${isComplete && !result?.success ? styles.joinBtnReady : ''}`}
            >
              {joining ? (
                <>
                  <span className={styles.spinner} />
                  <span>Joining Course...</span>
                </>
              ) : result?.success ? (
                <>
                  <CheckCircle2 size={18} />
                  <span>Enrolled! Redirecting...</span>
                </>
              ) : (
                <>
                  <Zap size={18} />
                  <span>Join Course</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Helper text */}
            <p className={styles.helperText}>
              The code is case-insensitive and usually looks like <code>ABCD-1234</code>
            </p>
          </div>

          {/* Bottom hint */}
          <div className={styles.hintRow}>
            <BookOpen size={14} color="var(--text-muted)" />
            <span>Want to explore courses without a code?</span>
            <Link href="/student/courses/explore" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 600 }}>
              Browse Course Catalog →
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}
