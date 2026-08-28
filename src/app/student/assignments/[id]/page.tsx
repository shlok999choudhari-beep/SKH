'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from '../assignments.module.css'
import StudentSidebar from '@/components/StudentSidebar'
import BackButton from '@/components/BackButton'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  FileCheck,
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Award,
  Sparkles,
  Download,
  ExternalLink,
  RotateCcw,
  Check,
  X,
  Bot
} from 'lucide-react'

export default function AssignmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const assignmentId = params?.id as string

  const [assignment, setAssignment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Form states
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [textAnswer, setTextAnswer] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [aiFeedback, setAiFeedback] = useState<any>(null)
  const [reviewingAi, setReviewingAi] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (assignmentId) fetchAssignment()
  }, [assignmentId])

  const handleRequestAiFeedback = async () => {
    if (!textAnswer.trim()) {
      setErrorMsg('Please write your draft text answer first to request AI feedback.')
      return
    }
    setErrorMsg('')
    setReviewingAi(true)
    try {
      const res = await fetch('/api/ai/assignment-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: parseInt(assignmentId, 10),
          submissionText: textAnswer.trim()
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setAiFeedback(data.feedback)
      } else {
        setErrorMsg(data.error || 'Failed to generate AI feedback')
      }
    } catch (err) {
      console.error('AI feedback error:', err)
      setErrorMsg('An error occurred contacting the AI tutor.')
    } finally {
      setReviewingAi(false)
    }
  }

  const fetchAssignment = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/assignments/${assignmentId}`)
      const data = await res.json()
      if (data.assignment) {
        setAssignment(data.assignment)
        if (data.assignment.studentSubmission?.textAnswer) {
          setTextAnswer(data.assignment.studentSubmission.textAnswer)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileValidate(e.dataTransfer.files[0])
    }
  }

  const handleFileValidate = (file: File) => {
    setErrorMsg('')
    const maxMb = assignment?.maxFileSizeMb || 10
    if (file.size > maxMb * 1024 * 1024) {
      setErrorMsg(`File size exceeds maximum allowed limit of ${maxMb} MB.`)
      return
    }

    const allowed = (assignment?.allowedFileTypes || 'pdf, zip, docx, png, jpg, txt')
      .split(',')
      .map((s: string) => s.trim().toLowerCase().replace('.', ''))
    
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    if (allowed.length > 0 && !allowed.includes(ext) && !allowed.includes('*')) {
      setErrorMsg(`File format '.${ext}' is not permitted. Allowed: ${assignment?.allowedFileTypes}`)
      return
    }

    setSelectedFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!selectedFile && !textAnswer.trim()) {
      setErrorMsg('Please upload a file or enter a text submission answer.')
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      if (selectedFile) formData.append('file', selectedFile)
      if (textAnswer.trim()) formData.append('textAnswer', textAnswer.trim())

      const res = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        body: formData
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setSuccessMsg(data.isLate ? 'Assignment submitted (marked Late).' : 'Assignment submitted successfully!')
        fetchAssignment()
      } else {
        setErrorMsg(data.error || 'Failed to submit assignment.')
      }
    } catch (err) {
      console.error(err)
      setErrorMsg('A network error occurred while submitting.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.layout}>
        <StudentSidebar />
        <div className={styles.content} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.25rem' }}>
          <MorphingInfinity className="size-14" style={{ width: '56px', height: '56px', color: '#8b5cf6', filter: 'drop-shadow(0 0 16px rgba(139, 92, 246, 0.4))' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '4px' }}>
              Loading Assignment Workspace
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              Retrieving project instructions and submission rubric...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className={styles.layout}>
        <StudentSidebar />
        <div className={styles.content}>
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <BackButton fallbackHref="/student/assignments" />
              <h1 className={styles.pageTitle}>Assignment Not Found</h1>
            </div>
          </header>
          <main className={styles.main}>
            <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border)' }}>
              <h3>The requested assignment does not exist.</h3>
              <Link href="/student/assignments" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
                Back to All Assignments
              </Link>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const sub = assignment.studentSubmission
  const isGraded = sub?.status === 'graded' && sub?.grade
  const isReturned = sub?.status === 'returned' || sub?.grade?.status === 'returned_for_revision'
  const isSubmitted = sub && (sub.status === 'submitted' || sub.status === 'late')

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.content}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <BackButton fallbackHref="/student/assignments" />
            <div>
              <h1 className={styles.pageTitle}>
                <FileCheck size={22} color="#8b5cf6" strokeWidth={2} />
                <span>{assignment.title}</span>
              </h1>
              <p className={styles.pageSubtitle}>
                {assignment.course?.title} • Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No Deadline'}
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Link href="/student/assignments" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={14} />
              <span>All Tasks</span>
            </Link>
          </div>
        </header>

        <main className={styles.main}>
          <div className={styles.detailLayout}>
            {/* Left Side: Instructions & Markdown */}
            <div className={styles.instructionsCard}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="badge badge-purple">{assignment.course?.title}</span>
                {assignment.module?.title && (
                  <span className="badge badge-blue">Module: {assignment.module.title}</span>
                )}
                <span className="badge badge-green">{assignment.maxMarks || 100} Max Marks</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', paddingBottom: '1rem', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={14} color="#c4b5fd" />
                  <span>Due Date: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleString() : 'No Deadline'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FileText size={14} color="#93c5fd" />
                  <span>Allowed Formats: {assignment.allowedFileTypes || 'pdf, zip, docx, png'} (Max {assignment.maxFileSizeMb || 10}MB)</span>
                </div>
              </div>

              {/* Instructions Body */}
              <div style={{ fontSize: '0.95rem', lineHeight: '1.7', color: 'var(--text-primary)' }}>
                {assignment.description?.split('\n\n').map((para: string, idx: number) => {
                  if (para.startsWith('# ')) return <h2 key={idx} style={{ fontSize: '1.3rem', fontWeight: 700, color: '#c4b5fd', margin: '1.5rem 0 0.5rem' }}>{para.replace('# ', '')}</h2>
                  if (para.startsWith('## ')) return <h3 key={idx} style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '1.25rem 0 0.4rem' }}>{para.replace('## ', '')}</h3>
                  if (para.startsWith('- ')) {
                    return (
                      <ul key={idx} style={{ margin: '0.5rem 0 1rem 1.5rem', color: 'var(--text-secondary)' }}>
                        {para.split('\n').map((li, i) => <li key={i}>{li.replace('- ', '')}</li>)}
                      </ul>
                    )
                  }
                  if (para.startsWith('1. ')) {
                    return (
                      <ol key={idx} style={{ margin: '0.5rem 0 1rem 1.5rem', color: 'var(--text-secondary)' }}>
                        {para.split('\n').map((li, i) => <li key={i}>{li.replace(/^\d+\.\s*/, '')}</li>)}
                      </ol>
                    )
                  }
                  return <p key={idx} style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>{para}</p>
                })}
              </div>
            </div>

            {/* Right Side: Submission & Grading Status */}
            <div className={styles.submissionCard}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Submission Status
              </h2>

              {/* Success / Error Banners */}
              {successMsg && (
                <div style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={15} />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={15} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Feedback Alert if Graded */}
              {isGraded && (
                <div className={styles.feedbackBox}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 700 }}>
                      <CheckCircle2 size={16} />
                      <span>Graded Score</span>
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>
                      {sub.grade.score} / {assignment.maxMarks}
                    </span>
                  </div>
                  {sub.grade.feedback && (
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                      <strong>Trainer Feedback:</strong> {sub.grade.feedback}
                    </p>
                  )}
                </div>
              )}

              {/* Submission Form */}
              <form onSubmit={handleSubmit}>
                {/* Drag and Drop Zone */}
                <div
                  className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => e.target.files && handleFileValidate(e.target.files[0])}
                    style={{ display: 'none' }}
                  />
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.15)', color: '#c4b5fd', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                    <Upload size={20} strokeWidth={2} />
                  </div>
                  {selectedFile ? (
                    <div>
                      <div style={{ fontWeight: 600, color: '#c4b5fd', fontSize: '0.9rem' }}>{selectedFile.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                  ) : sub?.fileUrl ? (
                    <div>
                      <div style={{ fontWeight: 600, color: '#34d399', fontSize: '0.9rem' }}>Attached Submission File</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click or drop to replace existing file</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '2px' }}>
                        Click to upload or drag & drop
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {assignment.allowedFileTypes || 'pdf, zip, docx, png'} (Max {assignment.maxFileSizeMb || 10}MB)
                      </div>
                    </div>
                  )}
                </div>

                {/* Text Submission / Notes */}
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>
                      Text Answer / Submission Notes
                    </label>
                    <button
                      type="button"
                      onClick={handleRequestAiFeedback}
                      disabled={reviewingAi}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Sparkles size={11} color="#c084fc" />
                      <span>{reviewingAi ? 'Evaluating...' : 'AI Pre-Review'}</span>
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    placeholder="Type your response, summary of approach, or GitHub repository link..."
                    className="form-input"
                    style={{ resize: 'vertical', fontSize: '0.85rem', width: '100%' }}
                  />
                </div>

                {/* AI Pre-Review Feedback Box */}
                {aiFeedback && (
                  <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: 'var(--radius-md)', padding: '0.875rem', marginBottom: '1.25rem', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 700, color: '#818cf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Sparkles size={13} />
                        <span>AI Pre-Submission Review</span>
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>
                        {aiFeedback.structureRating}
                      </span>
                    </div>

                    {aiFeedback.strengths && aiFeedback.strengths.length > 0 && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong style={{ color: '#34d399', fontSize: '0.75rem' }}>Strengths:</strong>
                        <ul style={{ margin: '2px 0 0 1rem', padding: 0, color: 'var(--text-primary)' }}>
                          {aiFeedback.strengths.map((s: string, i: number) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiFeedback.improvements && aiFeedback.improvements.length > 0 && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong style={{ color: '#fbbf24', fontSize: '0.75rem' }}>Suggested Improvements:</strong>
                        <ul style={{ margin: '2px 0 0 1rem', padding: 0, color: 'var(--text-primary)' }}>
                          {aiFeedback.improvements.map((imp: string, i: number) => (
                            <li key={i}>{imp}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.4rem', marginTop: '0.4rem' }}>
                      {aiFeedback.disclaimer}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Upload size={14} strokeWidth={2} />
                  <span>{submitting ? 'Submitting...' : sub ? 'Update / Replace Submission' : 'Submit Assignment'}</span>
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
