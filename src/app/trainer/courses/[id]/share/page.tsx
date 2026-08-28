'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import TrainerSidebar from '@/components/TrainerSidebar'
import BackButton from '@/components/BackButton'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  Share2,
  RefreshCw,
  Copy,
  Check,
  Users,
  Eye,
  EyeOff,
  BookOpen,
  Zap,
  QrCode,
  ExternalLink,
  AlertCircle,
  ChevronRight,
  Clock,
  ShieldCheck
} from 'lucide-react'
import styles from './share.module.css'

export default function ShareCoursePage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params?.id as string

  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [copied, setCopied] = useState(false)
  const [enrolledCount, setEnrolledCount] = useState(0)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchCourse = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch(`/api/trainer/courses/${courseId}`)
      const data = await res.json()
      if (data.course) {
        setCourse(data.course)
        setEnrolledCount(data.course._count?.enrollments || 0)
        setLastRefresh(new Date())
      }
    } catch (err) {
      console.error(err)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    fetchCourse()
    // Poll every 10 seconds for real-time enrollment count
    pollRef.current = setInterval(() => fetchCourse(true), 10000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [fetchCourse])

  const handleGenerateCode = async () => {
    setGenerating(true)
    try {
      const res = await fetch(`/api/trainer/courses/${courseId}/join-code`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setCourse((prev: any) => ({ ...prev, joinCode: data.joinCode, joinCodeEnabled: true }))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  const handleToggleCode = async () => {
    if (!course?.joinCode) return
    setToggling(true)
    try {
      const res = await fetch(`/api/trainer/courses/${courseId}/join-code`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !course.joinCodeEnabled })
      })
      const data = await res.json()
      if (data.success) {
        setCourse((prev: any) => ({ ...prev, joinCodeEnabled: data.joinCodeEnabled }))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setToggling(false)
    }
  }

  const handlePublish = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' })
      })
      if (res.ok) {
        setCourse((prev: any) => ({ ...prev, status: 'published' }))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const copyCode = () => {
    if (course?.joinCode) {
      navigator.clipboard.writeText(course.joinCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const copyLink = () => {
    const url = `${window.location.origin}/student/courses/join?code=${course?.joinCode}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Format join code as groups of 4 for readability: ABCD-1234
  const formattedCode = course?.joinCode
    ? `${course.joinCode.slice(0, 4)}-${course.joinCode.slice(4)}`
    : null

  if (loading) {
    return (
      <div className={styles.layout}>
        <TrainerSidebar />
        <div className={styles.content}>
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <BackButton fallbackHref="/trainer/courses" />
              <h1 className={styles.pageTitle}><Share2 size={20} color="#8b5cf6" /> <span>Share Course</span></h1>
            </div>
          </header>
          <div className={styles.loadingBox}>
            <MorphingInfinity style={{ width: '52px', height: '52px', color: '#8b5cf6', filter: 'drop-shadow(0 0 16px rgba(139,92,246,0.5))' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Loading Course</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0 }}>Fetching course details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!course) return null

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/student/courses/join?code=${course.joinCode || ''}`
    : ''

  return (
    <div className={styles.layout}>
      <TrainerSidebar />
      <div className={styles.content}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <BackButton fallbackHref="/trainer/courses" />
            <div>
              <h1 className={styles.pageTitle}>
                <Share2 size={20} color="#8b5cf6" strokeWidth={2} />
                <span>Share Course</span>
              </h1>
              <p className={styles.pageSubtitle}>{course.title}</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Link href={`/trainer/courses/${courseId}`} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={14} />
              <span>Course Details</span>
            </Link>
            {course.status !== 'published' && (
              <button onClick={handlePublish} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} />
                <span>Publish Course</span>
              </button>
            )}
          </div>
        </header>

        <main className={styles.main}>
          {/* Status Warning */}
          {course.status !== 'published' && (
            <div className={styles.warningBanner}>
              <AlertCircle size={16} color="#f59e0b" />
              <span>This course is <strong>not published</strong>. Students cannot join until you publish it.</span>
              <button onClick={handlePublish} className="btn btn-primary btn-sm" style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Zap size={12} /> <span>Publish Now</span>
              </button>
            </div>
          )}

          <div className={styles.twoCol}>
            {/* Left: Join Code Card */}
            <div className={styles.codeCard}>
              <div className={styles.codeCardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <QrCode size={18} color="#a78bfa" />
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Course Join Code</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Real-time badge */}
                  <span className={styles.liveBadge}>
                    <span className={styles.liveDot} />
                    Live
                  </span>
                </div>
              </div>

              {course.joinCode ? (
                <>
                  {/* The Code Display */}
                  <div className={`${styles.codeDisplay} ${!course.joinCodeEnabled ? styles.codeDisplayDisabled : ''}`}>
                    <div className={styles.codeText}>
                      {formattedCode?.split('').map((char, i) => (
                        <span key={i} className={char === '-' ? styles.codeDash : styles.codeChar}>
                          {char}
                        </span>
                      ))}
                    </div>
                    {!course.joinCodeEnabled && (
                      <div className={styles.codeDisabledOverlay}>
                        <EyeOff size={20} color="#94a3b8" />
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '6px' }}>Code disabled</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className={styles.codeActions}>
                    <button
                      type="button"
                      onClick={copyCode}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleGenerateCode}
                      disabled={generating}
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      title="Generate a new code (old one becomes invalid)"
                    >
                      <RefreshCw size={13} style={{ animation: generating ? 'spin 1s linear infinite' : 'none' }} />
                      <span>{generating ? 'Regenerating...' : 'Regenerate'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleCode}
                      disabled={toggling}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: course.joinCodeEnabled ? '#f87171' : '#10b981' }}
                    >
                      {course.joinCodeEnabled ? <EyeOff size={13} /> : <Eye size={13} />}
                      <span>{course.joinCodeEnabled ? 'Disable' : 'Enable'}</span>
                    </button>
                  </div>

                  {/* Share Link */}
                  <div className={styles.linkRow}>
                    <div className={styles.linkBox}>
                      <ExternalLink size={12} color="#a78bfa" style={{ flexShrink: 0 }} />
                      <span className={styles.linkText}>
                        {`/student/courses/join?code=${course.joinCode}`}
                      </span>
                    </div>
                    <button type="button" onClick={copyLink} className="btn btn-secondary btn-sm" style={{ fontSize: '11px', flexShrink: 0 }}>
                      Copy Link
                    </button>
                  </div>
                </>
              ) : (
                <div className={styles.noCodeBox}>
                  <QrCode size={36} color="var(--text-muted)" style={{ margin: '0 auto 10px' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem', textAlign: 'center' }}>
                    No join code yet. Generate one and share it with your students.
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    disabled={generating}
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Zap size={16} />
                    <span>{generating ? 'Generating...' : 'Generate Join Code'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right: Stats + Instructions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Enrollment Count — real-time */}
              <div className={styles.statsCard}>
                <div className={styles.bigStat}>
                  <div className={styles.bigStatValue}>{enrolledCount}</div>
                  <div className={styles.bigStatLabel}>Students Enrolled</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <Clock size={11} />
                  <span>Last refreshed: {lastRefresh.toLocaleTimeString()}</span>
                  <button
                    type="button"
                    onClick={() => fetchCourse(true)}
                    style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', padding: '0', marginLeft: '4px', display: 'inline-flex' }}
                  >
                    <RefreshCw size={11} />
                  </button>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Auto-refreshes every 10 seconds
                </div>
              </div>

              {/* Course Status */}
              <div className={styles.statusCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Course Status</span>
                  <span className={`badge ${course.status === 'published' ? 'badge-green' : 'badge-orange'}`} style={{ fontSize: '11px' }}>
                    {course.status === 'published' ? '✓ Published' : '◷ Draft'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <ShieldCheck size={13} color="#10b981" />
                  <span>Code: </span>
                  <span style={{ color: course.joinCodeEnabled ? '#10b981' : '#f87171', fontWeight: 600 }}>
                    {course.joinCodeEnabled ? 'Active — students can join' : 'Disabled — joining paused'}
                  </span>
                </div>
              </div>

              {/* How it Works */}
              <div className={styles.instructCard}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpen size={15} color="#a78bfa" /> How it works
                </div>
                {[
                  ['1', 'Generate a join code above'],
                  ['2', 'Share the code or link with your students'],
                  ['3', 'Students go to "Join Course" and enter the code'],
                  ['4', 'They\'re instantly enrolled — no approval needed'],
                  ['5', 'Regenerate the code anytime to revoke old access']
                ].map(([num, text]) => (
                  <div key={num} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <span style={{ minWidth: '20px', height: '20px', borderRadius: '50%', background: 'rgba(139,92,246,0.15)', color: '#a78bfa', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{num}</span>
                    <span style={{ lineHeight: 1.45 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Enrolled Students Preview */}
          {course.enrollments && course.enrollments.length > 0 && (
            <div className={styles.enrolledCard}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={16} color="#a78bfa" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    Recent Enrollments ({enrolledCount})
                  </span>
                </div>
                <Link href={`/trainer/courses/${courseId}/students`} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px' }}>
                  <span>All Students</span>
                  <ChevronRight size={12} />
                </Link>
              </div>
              <div className={styles.enrolledGrid}>
                {course.enrollments.slice(0, 8).map((enr: any) => (
                  <div key={enr.id} className={styles.enrolledStudent}>
                    <div className={styles.studentAvatar}>
                      {(enr.student?.name || 'S')[0].toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {enr.student?.name || 'Student'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {Math.round(enr.progressPercent)}% complete
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
