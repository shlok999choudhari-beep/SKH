'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import styles from './assignments.module.css'
import StudentSidebar from '@/components/StudentSidebar'
import BackButton from '@/components/BackButton'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  FileCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ArrowRight,
  Award,
  TrendingUp,
  Search,
  ChevronDown,
  ChevronUp,
  Upload,
  FileText,
  Sparkles,
  HelpCircle,
  Calendar,
  User
} from 'lucide-react'

export default function StudentAssignmentsPage() {
  const [courseAssignments, setCourseAssignments] = useState<any[]>([])
  const [allAssignments, setAllAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('by_course')
  const [search, setSearch] = useState('')
  const [expandedCourses, setExpandedCourses] = useState<Record<number, boolean>>({})
  const [uploading, setUploading] = useState<Record<number, boolean>>({})
  const [uploadSuccess, setUploadSuccess] = useState<Record<number, string>>({})
  const [uploadError, setUploadError] = useState<Record<number, string>>({})
  const [textAnswers, setTextAnswers] = useState<Record<number, string>>({})
  const fileInputRefs = useRef<Record<number, HTMLInputElement>>({})

  useEffect(() => {
    fetchAssessments()
  }, [])

  const fetchAssessments = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/student/assessments')
      const data = await res.json()
      if (data.courseAssignments) {
        setCourseAssignments(data.courseAssignments)
        // Auto-expand first course
        if (data.courseAssignments.length > 0) {
          setExpandedCourses({ [data.courseAssignments[0].courseId]: true })
        }
      }
      if (data.assignments) setAllAssignments(data.assignments)
    } catch (err) {
      console.error('Error fetching assignments:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleCourse = (courseId: number) => {
    setExpandedCourses(prev => ({ ...prev, [courseId]: !prev[courseId] }))
  }

  const handleQuickUpload = async (assignmentId: number, file: File | null, textAnswer: string) => {
    if (!file && !textAnswer.trim()) {
      setUploadError(prev => ({ ...prev, [assignmentId]: 'Please select a file or enter a text answer.' }))
      return
    }
    setUploadError(prev => ({ ...prev, [assignmentId]: '' }))
    setUploading(prev => ({ ...prev, [assignmentId]: true }))

    try {
      const formData = new FormData()
      if (file) formData.append('file', file)
      if (textAnswer.trim()) formData.append('textAnswer', textAnswer.trim())

      const res = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setUploadSuccess(prev => ({ ...prev, [assignmentId]: data.isLate ? 'Submitted (Late)' : 'Submitted successfully!' }))
        fetchAssessments()
      } else {
        setUploadError(prev => ({ ...prev, [assignmentId]: data.error || 'Submission failed.' }))
      }
    } catch {
      setUploadError(prev => ({ ...prev, [assignmentId]: 'Network error. Please retry.' }))
    } finally {
      setUploading(prev => ({ ...prev, [assignmentId]: false }))
    }
  }

  const formatDeadline = (dueDateString?: string) => {
    if (!dueDateString) return { text: 'No deadline', color: 'var(--text-muted)', isUrgent: false }
    const due = new Date(dueDateString).getTime()
    const now = Date.now()
    const diffMs = due - now
    if (diffMs < 0) {
      const daysAgo = Math.abs(Math.floor(diffMs / (1000 * 60 * 60 * 24)))
      return { text: `Overdue by ${daysAgo}d`, color: '#f87171', isUrgent: true }
    }
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    if (days === 0) return { text: `${hours}h left`, color: '#f59e0b', isUrgent: true }
    if (days <= 2) return { text: `${days}d ${hours}h left`, color: '#f59e0b', isUrgent: true }
    return { text: `${days}d left`, color: '#10b981', isUrgent: false }
  }

  const getStatusBadge = (status: string, marks?: number | null, maxMarks?: number) => {
    switch (status) {
      case 'graded': return <span className="badge badge-green" style={{ fontSize: '11px' }}>✓ Graded {marks !== null && marks !== undefined ? `${marks}/${maxMarks}` : ''}</span>
      case 'submitted': return <span className="badge badge-blue" style={{ fontSize: '11px' }}>Submitted</span>
      case 'late': return <span className="badge badge-orange" style={{ fontSize: '11px' }}>Submitted Late</span>
      case 'returned': return <span className="badge badge-orange" style={{ fontSize: '11px' }}>Returned for Revision</span>
      case 'overdue': return <span className="badge badge-red" style={{ fontSize: '11px' }}>Overdue</span>
      default: return <span className="badge badge-purple" style={{ fontSize: '11px' }}>Not Started</span>
    }
  }

  // Summary stats
  const totalCount = allAssignments.length
  const pendingCount = allAssignments.filter(a => a.status === 'not_started' || a.status === 'overdue').length
  const submittedCount = allAssignments.filter(a => a.status === 'submitted' || a.status === 'late').length
  const gradedCount = allAssignments.filter(a => a.status === 'graded').length

  if (loading) {
    return (
      <div className={styles.layout}>
        <StudentSidebar />
        <div className={styles.content} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.25rem' }}>
          <MorphingInfinity className="size-14" style={{ width: '56px', height: '56px', color: '#8b5cf6', filter: 'drop-shadow(0 0 16px rgba(139, 92, 246, 0.4))' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '4px' }}>Loading Assignments & Projects</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Fetching your coursework across all enrolled courses...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.content}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <BackButton fallbackHref="/student/dashboard" />
            <div>
              <h1 className={styles.pageTitle}>
                <FileCheck size={22} color="#8b5cf6" strokeWidth={2} />
                <span>Assignments & Projects</span>
              </h1>
              <p className={styles.pageSubtitle}>
                Tasks posted by your course instructors — submit work, track grades, and collect feedback.
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Link href="/student/quizzes" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <HelpCircle size={15} strokeWidth={2} />
              <span>Quizzes & Tests</span>
            </Link>
          </div>
        </header>

        <main className={styles.main}>
          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIconWrap} style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c4b5fd' }}>
                <FileCheck size={22} strokeWidth={2} />
              </div>
              <div>
                <div className={styles.statValue}>{totalCount}</div>
                <div className={styles.statLabel}>Total Tasks</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIconWrap} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5' }}>
                <Clock size={22} strokeWidth={2} />
              </div>
              <div>
                <div className={styles.statValue}>{pendingCount}</div>
                <div className={styles.statLabel}>Pending Due</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIconWrap} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd' }}>
                <TrendingUp size={22} strokeWidth={2} />
              </div>
              <div>
                <div className={styles.statValue}>{submittedCount}</div>
                <div className={styles.statLabel}>In Review</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIconWrap} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7' }}>
                <Award size={22} strokeWidth={2} />
              </div>
              <div>
                <div className={styles.statValue}>{gradedCount}</div>
                <div className={styles.statLabel}>Graded & Scored</div>
              </div>
            </div>
          </div>

          {/* View Toggle + Search */}
          <div className={styles.filterBar}>
            <div className={styles.tabsGroup}>
              <button
                type="button"
                onClick={() => setFilter('by_course')}
                className={`${styles.tabBtn} ${filter === 'by_course' ? styles.tabBtnActive : ''}`}
              >
                📚 By Course ({courseAssignments.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`${styles.tabBtn} ${filter === 'all' ? styles.tabBtnActive : ''}`}
              >
                All ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('pending')}
                className={`${styles.tabBtn} ${filter === 'pending' ? styles.tabBtnActive : ''}`}
              >
                Pending ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('graded')}
                className={`${styles.tabBtn} ${filter === 'graded' ? styles.tabBtnActive : ''}`}
              >
                Graded ({gradedCount})
              </button>
            </div>

            <div className={styles.searchBox}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search learning resources, assignments, or courses..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          {/* ─── BY COURSE VIEW ─── */}
          {filter === 'by_course' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {courseAssignments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border)' }}>
                  <FileCheck size={44} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
                  <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Assignments Yet</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                    Enroll in courses to receive trainer-posted assignments and projects.
                  </p>
                  <Link href="/student/courses/explore" className="btn btn-primary btn-sm">
                    Explore Courses
                  </Link>
                </div>
              ) : (
                courseAssignments
                  .filter(ca => !search || ca.courseTitle.toLowerCase().includes(search.toLowerCase()) ||
                    ca.assignments.some((a: any) => a.title.toLowerCase().includes(search.toLowerCase())))
                  .map(ca => (
                    <div key={ca.courseId} className={styles.courseGroup}>
                      {/* Course Header */}
                      <button
                        type="button"
                        className={styles.courseGroupHeader}
                        onClick={() => toggleCourse(ca.courseId)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                          <div className={styles.courseGroupIcon}>
                            <BookOpen size={18} strokeWidth={2} color="#a78bfa" />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className={styles.courseGroupTitle}>{ca.courseTitle}</div>
                            <div className={styles.courseGroupMeta}>
                              {ca.assignments.length} assignment{ca.assignments.length !== 1 ? 's' : ''} •{' '}
                              {ca.assignments.filter((a: any) => a.status === 'not_started' || a.status === 'overdue').length} pending •{' '}
                              {ca.assignments.filter((a: any) => a.status === 'graded').length} graded
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                          <Link
                            href={`/student/courses/${ca.courseId}`}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '11px', padding: '3px 10px' }}
                            onClick={e => e.stopPropagation()}
                          >
                            View Course
                          </Link>
                          {expandedCourses[ca.courseId]
                            ? <ChevronUp size={16} color="var(--text-muted)" />
                            : <ChevronDown size={16} color="var(--text-muted)" />
                          }
                        </div>
                      </button>

                      {/* Assignment Cards */}
                      {expandedCourses[ca.courseId] && (
                        <div className={styles.courseGroupBody}>
                          {ca.assignments.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                              No assignments published in this course yet.
                            </div>
                          ) : (
                            ca.assignments.map((assignment: any) => {
                              const deadlineInfo = formatDeadline(assignment.dueDate)
                              const isSubmitted = ['submitted', 'late', 'graded', 'returned'].includes(assignment.status)
                              const sub = assignment.studentSubmission

                              return (
                                <div key={assignment.id} className={styles.assignmentRow}>
                                  {/* Assignment Info */}
                                  <div className={styles.assignmentInfo}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                      <h4 className={styles.assignmentTitle}>{assignment.title}</h4>
                                      {getStatusBadge(assignment.status, assignment.marks, assignment.maxMarks)}
                                    </div>

                                    {assignment.description && (
                                      <p className={styles.assignmentDescription}>
                                        {assignment.description.replace(/#+\s|[-*]\s/g, '').substring(0, 160)}
                                        {assignment.description.length > 160 ? '...' : ''}
                                      </p>
                                    )}

                                    <div className={styles.assignmentMetaRow}>
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: deadlineInfo.color }}>
                                        <Calendar size={12} />
                                        <span>{assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No deadline'}</span>
                                        <span style={{ opacity: 0.8 }}>({deadlineInfo.text})</span>
                                      </span>

                                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                                        <User size={12} />
                                        <span>{assignment.trainerName}</span>
                                      </span>

                                      <span style={{ color: 'var(--text-muted)' }}>
                                        Max: <strong style={{ color: 'var(--text-primary)' }}>{assignment.maxMarks} pts</strong>
                                      </span>

                                      {assignment.moduleTitle && (
                                        <span className="badge badge-purple" style={{ fontSize: '10px' }}>
                                          {assignment.moduleTitle}
                                        </span>
                                      )}
                                    </div>

                                    {/* Grader Feedback */}
                                    {assignment.feedback && (
                                      <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginTop: '10px', fontSize: '0.8rem' }}>
                                        <strong style={{ color: '#10b981' }}>Trainer Feedback: </strong>
                                        <span style={{ color: 'var(--text-secondary)' }}>{assignment.feedback}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Upload / Submission Panel */}
                                  <div className={styles.uploadPanel}>
                                    {isSubmitted ? (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <CheckCircle2 size={14} />
                                          <span>
                                            {assignment.status === 'graded' ? `Graded: ${assignment.marks}/${assignment.maxMarks}` : 'Submitted'}
                                          </span>
                                        </div>
                                        {sub?.fileName && (
                                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <FileText size={11} />
                                            <span>{sub.fileName}</span>
                                          </div>
                                        )}
                                        <Link
                                          href={`/student/assignments/${assignment.id}`}
                                          className="btn btn-secondary btn-sm"
                                          style={{ fontSize: '11px', textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                        >
                                          <span>{assignment.status === 'graded' ? 'View Feedback' : 'View Submission'}</span>
                                          <ArrowRight size={11} />
                                        </Link>
                                      </div>
                                    ) : (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {uploadSuccess[assignment.id] ? (
                                          <div style={{ padding: '8px 12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <CheckCircle2 size={13} />
                                            <span>{uploadSuccess[assignment.id]}</span>
                                          </div>
                                        ) : (
                                          <>
                                            <div
                                              className={styles.miniDropzone}
                                              onClick={() => fileInputRefs.current[assignment.id]?.click()}
                                            >
                                              <input
                                                type="file"
                                                ref={el => { if (el) fileInputRefs.current[assignment.id] = el }}
                                                style={{ display: 'none' }}
                                                onChange={e => {
                                                  const f = e.target.files?.[0]
                                                  if (f) handleQuickUpload(assignment.id, f, textAnswers[assignment.id] || '')
                                                }}
                                                accept={assignment.allowedFileTypes?.split(',').map((t: string) => `.${t.trim()}`).join(',')}
                                              />
                                              <Upload size={14} color="#a78bfa" />
                                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                {uploading[assignment.id] ? 'Uploading...' : `Upload file (${assignment.allowedFileTypes || 'pdf, zip, docx'})`}
                                              </span>
                                            </div>

                                            <textarea
                                              rows={2}
                                              placeholder="Or type your answer / link here..."
                                              value={textAnswers[assignment.id] || ''}
                                              onChange={e => setTextAnswers(prev => ({ ...prev, [assignment.id]: e.target.value }))}
                                              className="form-input"
                                              style={{ fontSize: '0.78rem', resize: 'vertical', padding: '6px 10px' }}
                                            />

                                            <button
                                              type="button"
                                              className="btn btn-primary btn-sm"
                                              disabled={uploading[assignment.id]}
                                              onClick={() => handleQuickUpload(assignment.id, null, textAnswers[assignment.id] || '')}
                                              style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                                            >
                                              <Upload size={11} />
                                              <span>{uploading[assignment.id] ? 'Submitting...' : 'Submit Answer'}</span>
                                            </button>
                                          </>
                                        )}

                                        {uploadError[assignment.id] && (
                                          <div style={{ fontSize: '0.75rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <AlertCircle size={11} />
                                            <span>{uploadError[assignment.id]}</span>
                                          </div>
                                        )}

                                        <Link
                                          href={`/student/assignments/${assignment.id}`}
                                          style={{ fontSize: '11px', color: '#a78bfa', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                                        >
                                          <FileText size={11} />
                                          <span>Full submission workspace →</span>
                                        </Link>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
          )}

          {/* ─── FLAT LIST VIEW (All / Pending / Graded) ─── */}
          {filter !== 'by_course' && (
            <div className={styles.grid}>
              {allAssignments
                .filter(a => {
                  if (filter === 'pending' && !['not_started', 'overdue'].includes(a.status)) return false
                  if (filter === 'graded' && a.status !== 'graded') return false
                  if (search.trim()) {
                    const q = search.toLowerCase()
                    return a.title.toLowerCase().includes(q) || a.courseTitle.toLowerCase().includes(q)
                  }
                  return true
                })
                .map(item => {
                  const deadline = formatDeadline(item.dueDate)
                  const isSubmitted = ['submitted', 'late', 'graded', 'returned'].includes(item.status)

                  return (
                    <div key={item.id} className={styles.card}>
                      <div>
                        <div className={styles.cardHeader}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, background: 'rgba(255,255,255,0.05)', color: '#c4b5fd', padding: '3px 10px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <BookOpen size={12} /> {item.courseTitle}
                          </span>
                          {getStatusBadge(item.status, item.marks, item.maxMarks)}
                        </div>

                        <h3 className={styles.cardTitle}>{item.title}</h3>
                        {item.description && (
                          <p className={styles.cardDescription}>
                            {item.description.replace(/#+\s|[-*]\s/g, '').substring(0, 120)}...
                          </p>
                        )}

                        <div className={styles.cardMeta}>
                          <div className={styles.metaRow}>
                            <span>Deadline</span>
                            <span style={{ color: deadline.color, fontWeight: 500 }}>{deadline.text}</span>
                          </div>
                          <div className={styles.metaRow}>
                            <span>Max Score</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.maxMarks} pts</span>
                          </div>
                        </div>
                      </div>

                      <Link
                        href={`/student/assignments/${item.id}`}
                        className={`btn ${isSubmitted ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none' }}
                      >
                        <span>{item.status === 'graded' ? 'View Grade & Feedback' : isSubmitted ? 'View Submission' : 'Open & Submit Task'}</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  )
                })}

              {allAssignments.filter(a => {
                if (filter === 'pending' && !['not_started', 'overdue'].includes(a.status)) return false
                if (filter === 'graded' && a.status !== 'graded') return false
                if (search.trim()) {
                  const q = search.toLowerCase()
                  return a.title.toLowerCase().includes(q) || a.courseTitle.toLowerCase().includes(q)
                }
                return true
              }).length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border)' }}>
                  <Search size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                  <p>No assignments match your current filter.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
