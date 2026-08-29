'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import StudentSidebar from '@/components/StudentSidebar'
import BackButton from '@/components/BackButton'
import { BookOpen, Zap, CheckCircle2, AlertCircle, ArrowRight, KeyRound, Lock, Sparkles, Building2, User } from 'lucide-react'
import styles from './join.module.css'

export default function JoinCoursePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefillCode = searchParams?.get('code') || ''

  const [code, setCode] = useState(prefillCode.toUpperCase())
  const [previewCourse, setPreviewCourse] = useState<any>(null)
  const [validating, setValidating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; courseId?: number } | null>(null)

  useEffect(() => {
    if (prefillCode) {
      setCode(prefillCode.toUpperCase())
      handlePreview(prefillCode.toUpperCase())
    }
  }, [prefillCode])

  const handlePreview = async (codeToPreview: string) => {
    const cleaned = codeToPreview.trim().toUpperCase()
    if (!cleaned || cleaned.length < 3) return

    setValidating(true)
    setResult(null)

    try {
      const res = await fetch('/api/courses/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleaned, action: 'preview' })
      })
      const data = await res.json()

      if (res.ok && data.success && data.course) {
        setPreviewCourse(data.course)
      } else {
        setPreviewCourse(null)
      }
    } catch {
      setPreviewCourse(null)
    } finally {
      setValidating(false)
    }
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase()
    setCode(val)
    if (val.length >= 4) {
      handlePreview(val)
    } else {
      setPreviewCourse(null)
    }
  }

  const handleJoin = async () => {
    const cleaned = code.trim().toUpperCase()
    if (!cleaned) {
      setResult({ success: false, message: 'Please enter a valid course code.' })
      return
    }

    setJoining(true)
    setResult(null)

    try {
      const res = await fetch('/api/courses/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleaned, action: 'join' })
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setResult({
          success: true,
          message: data.alreadyEnrolled
            ? `You are already enrolled in "${data.course.title}". Opening course workspace...`
            : `🎉 Enrolled in "${data.course.title}"! Redirecting to workspace...`,
          courseId: data.course.id
        })
        setTimeout(() => router.push(`/student/courses/${data.course.id}`), 1500)
      } else {
        setResult({ success: false, message: data.error || 'Failed to join course. Verify the code and try again.' })
      }
    } catch {
      setResult({ success: false, message: 'Network error. Please try again.' })
    } finally {
      setJoining(false)
    }
  }

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
              <p className={styles.pageSubtitle}>Enter the course join code shared by your teacher</p>
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
            {/* Hero Icon */}
            <div className={styles.heroIcon}>
              <KeyRound size={32} color="#a78bfa" strokeWidth={1.5} />
            </div>

            <h2 className={styles.cardTitle}>Enter Course Code</h2>
            <p className={styles.cardSubtitle}>
              Ask your teacher for the course code (e.g. <code>CGL-7F42K9</code>). Enter it below to join.
            </p>

            {/* Input Box */}
            <div style={{ width: '100%', maxWidth: '380px', margin: '0 auto 1.5rem' }}>
              <input
                type="text"
                value={code}
                onChange={handleCodeChange}
                placeholder="e.g. CGL-7F42K9"
                className="form-input"
                style={{
                  width: '100%',
                  fontSize: '1.25rem',
                  fontFamily: 'Geist Mono, monospace',
                  letterSpacing: '2px',
                  textAlign: 'center',
                  padding: '12px',
                  textTransform: 'uppercase'
                }}
                autoFocus
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '6px' }}>
                Case-insensitive • Example: <code>CGL-7F42K9</code>
              </div>
            </div>

            {/* Live Course Preview Card if valid code */}
            {previewCourse && (
              <div style={{
                width: '100%',
                maxWidth: '440px',
                background: 'rgba(139, 92, 246, 0.08)',
                border: '1px solid rgba(139, 92, 246, 0.35)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                marginBottom: '1.5rem',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className="badge badge-purple" style={{ fontSize: '10px' }}>
                    {previewCourse.academicYear || 'AY 2026-27'} • {previewCourse.semester || 'Semester I'}
                  </span>
                </div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {previewCourse.title}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Teacher: {previewCourse.trainerName} • {previewCourse.department}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={13} /> Valid Course Code ({previewCourse.joinCode})
                </div>
              </div>
            )}

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
              disabled={joining || !code.trim() || result?.success === true}
              className={`${styles.joinBtn} ${code.trim() && !result?.success ? styles.joinBtnReady : ''}`}
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
          </div>

          {/* Bottom Hint */}
          <div className={styles.hintRow}>
            <BookOpen size={14} color="var(--text-muted)" />
            <span>Looking for open courses?</span>
            <Link href="/student/courses/explore" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 600 }}>
              Browse Course Catalog →
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}
