'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TrainerSidebar from '@/components/TrainerSidebar'
import BackButton from '@/components/BackButton'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  FileCheck,
  ArrowLeft,
  Sparkles,
  Zap,
  Calendar,
  AlertCircle,
  Upload,
  BookOpen,
  Clock,
  FileText,
  Hash,
  CheckCircle2
} from 'lucide-react'
import styles from './create.module.css'

export default function CreateAssignmentPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    courseId: '',
    moduleId: '',
    title: '',
    description: '',
    dueDate: '',
    maxMarks: '100',
    allowedFileTypes: 'pdf,zip,docx,png',
    maxFileSizeMb: '25',
    submissionType: 'file_upload',
    status: 'published'
  })

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses')
      const data = await res.json()
      if (data.courses) {
        setCourses(data.courses)
        if (data.courses.length > 0) {
          setFormData(prev => ({ ...prev, courseId: String(data.courses[0].id) }))
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const selectedCourseObj = courses.find(c => String(c.id) === formData.courseId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!formData.courseId || !formData.title.trim()) {
      setErrorMsg('Course and Assignment Title are required.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          maxMarks: parseFloat(formData.maxMarks),
          maxFileSizeMb: parseInt(formData.maxFileSizeMb, 10),
          moduleId: formData.moduleId ? parseInt(formData.moduleId, 10) : null
        })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setSuccess(true)
        setTimeout(() => router.push('/trainer/assignments'), 1500)
      } else {
        setErrorMsg(data.error || 'Failed to create assignment.')
      }
    } catch (err) {
      console.error(err)
      setErrorMsg('A network error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.layout}>
        <TrainerSidebar />
        <div className={styles.content} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.25rem' }}>
          <MorphingInfinity className="size-14" style={{ width: '56px', height: '56px', color: '#8b5cf6', filter: 'drop-shadow(0 0 16px rgba(139, 92, 246, 0.4))' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '4px' }}>Loading Courses</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Fetching your active course list...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.layout}>
      <TrainerSidebar />
      <div className={styles.content}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <BackButton fallbackHref="/trainer/assignments" />
            <div>
              <h1 className={styles.pageTitle}>
                <FileCheck size={22} color="#8b5cf6" strokeWidth={2} />
                <span>Post New Assignment</span>
              </h1>
              <p className={styles.pageSubtitle}>
                Create a course task for your enrolled students. They can upload files or submit text answers.
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Link href="/trainer/assignments" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={14} />
              <span>All Assignments</span>
            </Link>
          </div>
        </header>

        <main className={styles.main}>
          {success ? (
            <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '3rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 1rem' }} />
              <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Assignment Published!</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Students enrolled in <strong>{selectedCourseObj?.title}</strong> can now view and submit this assignment.
              </p>
            </div>
          ) : (
            <div className={styles.formLayout}>
              {/* Left: Form */}
              <div className={styles.formCard}>
                {errorMsg && (
                  <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={15} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Course & Module */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">
                        <BookOpen size={13} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle', color: '#a78bfa' }} />
                        Course *
                      </label>
                      <select
                        required
                        value={formData.courseId}
                        onChange={e => setFormData({ ...formData, courseId: e.target.value, moduleId: '' })}
                        className="form-select"
                      >
                        <option value="">Select a course...</option>
                        {courses.map(c => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        <Hash size={13} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle', color: '#a78bfa' }} />
                        Module (Optional)
                      </label>
                      <select
                        value={formData.moduleId}
                        onChange={e => setFormData({ ...formData, moduleId: e.target.value })}
                        className="form-select"
                      >
                        <option value="">No specific module</option>
                        {selectedCourseObj?.modules?.map((m: any) => (
                          <option key={m.id} value={m.id}>{m.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="form-group">
                    <label className="form-label">
                      <FileCheck size={13} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle', color: '#a78bfa' }} />
                      Assignment Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Hands-on Project: Build a REST API with Authentication"
                      className="form-input"
                    />
                  </div>

                  {/* Instructions */}
                  <div className="form-group">
                    <label className="form-label">
                      <FileText size={13} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle', color: '#a78bfa' }} />
                      Instructions & Guidelines
                      <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '6px', fontSize: '0.78rem' }}>Markdown supported</span>
                    </label>
                    <textarea
                      rows={7}
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder={'# Project Tasks\n1. Implement the core feature\n2. Write unit tests\n\n## Deliverables\nSubmit project zip or PDF report.'}
                      className="form-input"
                      style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem' }}
                    />
                  </div>

                  {/* Marks, Due Date, Submission Type */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Max Marks</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.maxMarks}
                        onChange={e => setFormData({ ...formData, maxMarks: e.target.value })}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        <Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                        Due Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.dueDate}
                        onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Submission Mode</label>
                      <select
                        value={formData.submissionType}
                        onChange={e => setFormData({ ...formData, submissionType: e.target.value })}
                        className="form-select"
                      >
                        <option value="file_upload">File Upload Only</option>
                        <option value="text_submission">Text Answer Only</option>
                        <option value="both">Both File & Text</option>
                      </select>
                    </div>
                  </div>

                  {/* File Types & Max Size */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">
                        <Upload size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                        Allowed File Types
                      </label>
                      <input
                        type="text"
                        value={formData.allowedFileTypes}
                        onChange={e => setFormData({ ...formData, allowedFileTypes: e.target.value })}
                        placeholder="pdf,zip,docx,png"
                        className="form-input"
                      />
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Comma-separated extensions without dots</div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Max File Size (MB)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.maxFileSizeMb}
                        onChange={e => setFormData({ ...formData, maxFileSizeMb: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </div>

                  {/* Visibility */}
                  <div className="form-group">
                    <label className="form-label">Visibility</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      className="form-select"
                    >
                      <option value="published">Published — visible to all enrolled students immediately</option>
                      <option value="draft">Draft — save without publishing</option>
                    </select>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)', marginTop: '0.5rem' }}>
                    <Link href="/trainer/assignments" className="btn btn-secondary btn-sm">
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn btn-primary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Zap size={14} />
                      <span>{submitting ? 'Publishing...' : formData.status === 'published' ? 'Publish Assignment' : 'Save as Draft'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Right: Preview Panel */}
              <div className={styles.previewCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                  <Sparkles size={16} color="#a78bfa" />
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Assignment Preview</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                  <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#a78bfa', fontWeight: 600, marginBottom: '4px' }}>Course</div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{selectedCourseObj?.title || '—'}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Title</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>{formData.title || 'Untitled Assignment'}</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', padding: '8px 12px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>MAX MARKS</div>
                      <div style={{ fontWeight: 700, color: '#c4b5fd', fontSize: '1.1rem' }}>{formData.maxMarks}</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', padding: '8px 12px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>DUE DATE</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                        {formData.dueDate ? new Date(formData.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No deadline'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Allowed formats:</span>
                    {(formData.allowedFileTypes || '').split(',').map(t => t.trim()).filter(Boolean).map(t => (
                      <span key={t} className="badge badge-purple" style={{ fontSize: '10px' }}>.{t}</span>
                    ))}
                  </div>

                  <div style={{ background: formData.status === 'published' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)', border: `1px solid ${formData.status === 'published' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`, borderRadius: 'var(--radius-md)', padding: '8px 12px', fontSize: '0.8rem', color: formData.status === 'published' ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {formData.status === 'published'
                      ? <><CheckCircle2 size={13} /> Will be visible to all enrolled students immediately</>
                      : <><Clock size={13} /> Will be saved as draft and not visible to students</>
                    }
                  </div>

                  {formData.description && (
                    <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px' }}>INSTRUCTIONS PREVIEW</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxHeight: '120px', overflow: 'hidden', position: 'relative' }}>
                        {formData.description.substring(0, 280)}{formData.description.length > 280 && '...'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
