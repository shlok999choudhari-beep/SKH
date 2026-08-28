'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from '../../assignments-manage.module.css'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  FileCheck,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  AlertCircle,
  RotateCcw,
  User,
  ExternalLink,
  Award,
  Send,
  Sparkles
} from 'lucide-react'

export default function TrainerGradingPage() {
  const params = useParams()
  const router = useRouter()
  const assignmentId = params?.id as string

  const [assignment, setAssignment] = useState<any>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [selectedSub, setSelectedSub] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  // Grading form state
  const [marksInput, setMarksInput] = useState('')
  const [feedbackInput, setFeedbackInput] = useState('')
  const [savingGrade, setSavingGrade] = useState(false)
  const [gradeSuccessMsg, setGradeSuccessMsg] = useState('')
  const [gradeErrorMsg, setGradeErrorMsg] = useState('')

  useEffect(() => {
    if (assignmentId) fetchSubmissions()
  }, [assignmentId])

  const fetchSubmissions = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/submissions`)
      const data = await res.json()
      if (data.assignment) {
        setAssignment(data.assignment)
        setSubmissions(data.submissions || [])
        if (data.submissions && data.submissions.length > 0) {
          selectSubmission(data.submissions[0])
        }
      }
    } catch (err) {
      console.error('Error loading submissions for grading:', err)
    } finally {
      setLoading(false)
    }
  }

  const selectSubmission = (sub: any) => {
    setSelectedSub(sub)
    setGradeSuccessMsg('')
    setGradeErrorMsg('')
    if (sub.grade) {
      setMarksInput(String(sub.grade.marks))
      setFeedbackInput(sub.grade.feedback || '')
    } else {
      setMarksInput('')
      setFeedbackInput('')
    }
  }

  const handleSaveGrade = async (status: 'accepted' | 'returned_for_revision') => {
    if (!selectedSub || !marksInput) {
      setGradeErrorMsg('Please enter marks before grading.')
      return
    }

    const marksVal = parseFloat(marksInput)
    if (isNaN(marksVal) || marksVal < 0 || marksVal > (assignment?.maxMarks || 100)) {
      setGradeErrorMsg(`Marks must be a number between 0 and ${assignment?.maxMarks || 100}.`)
      return
    }

    setSavingGrade(true)
    setGradeErrorMsg('')
    setGradeSuccessMsg('')

    try {
      const res = await fetch(`/api/assignments/${assignmentId}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedSub.id,
          marks: marksVal,
          feedback: feedbackInput.trim(),
          status
        })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setGradeSuccessMsg(status === 'accepted' ? 'Grade saved successfully!' : 'Submission returned for student revision.')
        // Update local state
        setSubmissions(prev =>
          prev.map(s =>
            s.id === selectedSub.id
              ? {
                  ...s,
                  status: data.submissionStatus,
                  grade: data.grade
                }
              : s
          )
        )
        setSelectedSub((prev: any) => ({
          ...prev,
          status: data.submissionStatus,
          grade: data.grade
        }))
      } else {
        setGradeErrorMsg(data.error || 'Failed to save grade.')
      }
    } catch (err) {
      console.error(err)
      setGradeErrorMsg('A network error occurred while grading.')
    } finally {
      setSavingGrade(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.container} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '14px' }}>
        <MorphingInfinity className="size-16" style={{ width: '56px', height: '56px', color: '#8b5cf6' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading submissions roster...</p>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
          <h3>Assignment Not Found</h3>
          <Link href="/trainer/assignments" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
            Back to Assignments
          </Link>
        </div>
      </div>
    )
  }

  const filteredSubmissions = submissions.filter(s => {
    if (filter === 'all') return true
    if (filter === 'pending') return s.status === 'submitted' || s.status === 'late'
    if (filter === 'graded') return s.status === 'graded'
    if (filter === 'returned') return s.status === 'returned'
    return true
  })

  return (
    <div className={styles.container}>
      {/* Back button & Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link href="/trainer/assignments" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>
          <ArrowLeft size={14} strokeWidth={2} />
          <span>Back to Assignments Dashboard</span>
        </Link>
      </div>

      <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
          <span className="badge badge-purple">{assignment.course?.title}</span>
          <span className="badge badge-orange">{assignment.maxMarks} Maximum Marks</span>
        </div>
        <h1 className={styles.title} style={{ fontSize: '1.6rem', margin: 0 }}>
          Grading: {assignment.title}
        </h1>
      </div>

      {submissions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border)' }}>
          <FileCheck size={40} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ color: 'var(--text-primary)' }}>No Submissions Yet</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Enrolled students have not submitted solutions for this assignment yet.</p>
        </div>
      ) : (
        <div className={styles.gradingLayout}>
          {/* Left Column: Submissions List */}
          <div className={styles.submissionsListCard}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                Submissions ({submissions.length})
              </span>

              {/* Status Filter */}
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="form-select"
                style={{ width: 'auto', padding: '3px 8px', fontSize: '12px' }}
              >
                <option value="all">All ({submissions.length})</option>
                <option value="pending">Pending ({submissions.filter(s => s.status === 'submitted' || s.status === 'late').length})</option>
                <option value="graded">Graded ({submissions.filter(s => s.status === 'graded').length})</option>
                <option value="returned">Returned ({submissions.filter(s => s.status === 'returned').length})</option>
              </select>
            </div>

            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {filteredSubmissions.map(s => {
                const isSelected = selectedSub?.id === s.id
                const isGraded = s.status === 'graded'
                const isLate = s.status === 'late'
                const isReturned = s.status === 'returned'

                return (
                  <div
                    key={s.id}
                    className={`${styles.submissionItem} ${isSelected ? styles.submissionItemActive : ''}`}
                    onClick={() => selectSubmission(s)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        {s.studentName}
                      </span>
                      <span className={`badge ${isGraded ? 'badge-green' : isReturned ? 'badge-orange' : isLate ? 'badge-red' : 'badge-blue'}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                        {isGraded ? `${s.grade?.marks} / ${assignment.maxMarks}` : s.status}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(s.submittedAt).toLocaleDateString()} at {new Date(s.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Column: Submission Workarea & Evaluation Form */}
          {selectedSub && (
            <div className={styles.gradingWorkarea}>
              {/* Student Details Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.2)', color: '#c4b5fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                      {selectedSub.studentName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                        {selectedSub.studentName}
                      </h2>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {selectedSub.studentEmail} {selectedSub.studentCollege ? `• ${selectedSub.studentCollege}` : ''}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Submitted Timestamp</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {new Date(selectedSub.submittedAt).toLocaleString()}
                  </div>
                  {selectedSub.status === 'late' && (
                    <span className="badge badge-red" style={{ fontSize: '10px', marginTop: '4px' }}>
                      Submitted Late
                    </span>
                  )}
                </div>
              </div>

              {/* Submitted File Section */}
              {selectedSub.fileName && (
                <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    Submitted File Attachment
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileCheck size={20} color="#a855f7" />
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{selectedSub.fileName}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {(selectedSub.fileSize / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>

                    {selectedSub.signedDownloadUrl ? (
                      <a
                        href={selectedSub.signedDownloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                      >
                        <Download size={13} strokeWidth={2} />
                        <span>Download Submission File</span>
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>File secure URL expired</span>
                    )}
                  </div>
                </div>
              )}

              {/* Text Submission View */}
              {selectedSub.textAnswer && (
                <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    Student Answer / Notes
                  </div>
                  <div style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                    {selectedSub.textAnswer}
                  </div>
                </div>
              )}

              {/* Grading Input Panel */}
              <div style={{ background: 'rgba(139, 92, 246, 0.04)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={18} color="#a855f7" />
                  <span>Evaluation & Feedback</span>
                </h3>

                {gradeErrorMsg && (
                  <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={14} />
                    <span>{gradeErrorMsg}</span>
                  </div>
                )}

                {gradeSuccessMsg && (
                  <div style={{ padding: '8px 12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={14} />
                    <span>{gradeSuccessMsg}</span>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>
                      Marks (Max {assignment.maxMarks}) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max={assignment.maxMarks}
                      value={marksInput}
                      onChange={e => setMarksInput(e.target.value)}
                      placeholder={`0 - ${assignment.maxMarks}`}
                      className="form-input"
                      style={{ fontSize: '1rem', fontWeight: 700 }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>
                      Trainer Feedback & Guidance (Optional)
                    </label>
                    <input
                      type="text"
                      value={feedbackInput}
                      onChange={e => setFeedbackInput(e.target.value)}
                      placeholder="e.g. Excellent architectural boundaries and error handling."
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <button
                    type="button"
                    disabled={savingGrade}
                    onClick={() => handleSaveGrade('returned_for_revision')}
                    className="btn btn-secondary btn-sm"
                    style={{ color: '#f59e0b' }}
                  >
                    <RotateCcw size={13} />
                    <span>Return for Revision</span>
                  </button>

                  <button
                    type="button"
                    disabled={savingGrade}
                    onClick={() => handleSaveGrade('accepted')}
                    className="btn btn-primary btn-sm"
                  >
                    <CheckCircle2 size={14} />
                    <span>{savingGrade ? 'Saving Grade...' : 'Save & Finalize Grade'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
