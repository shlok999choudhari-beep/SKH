'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './builder.module.css'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  Plus,
  Edit2,
  Trash2,
  FileText,
  Video,
  ExternalLink,
  BookOpen,
  ArrowLeft,
  Eye,
  CheckCircle2,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Link2,
  Check,
  Zap,
  Globe,
  Upload
} from 'lucide-react'

export default function CourseBuilderPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params?.id as string

  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Modals state
  const [showModuleModal, setShowModuleModal] = useState(false)
  const [editingModule, setEditingModule] = useState<any>(null)
  const [moduleForm, setModuleForm] = useState({ title: '', description: '' })

  const [showLessonModal, setShowLessonModal] = useState(false)
  const [selectedModuleIdForLesson, setSelectedModuleIdForLesson] = useState<number | null>(null)
  const [editingLesson, setEditingLesson] = useState<any>(null)
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    duration: '20 mins',
    content: '',
    videoUrl: ''
  })

  const [showResourceModal, setShowResourceModal] = useState(false)
  const [selectedLessonIdForResource, setSelectedLessonIdForResource] = useState<number | null>(null)
  const [selectedModuleIdForResource, setSelectedModuleIdForResource] = useState<number | null>(null)
  const [resourceForm, setResourceForm] = useState({
    title: '',
    type: 'PDF',
    url: ''
  })

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (courseId) fetchCourse()
  }, [courseId])

  const fetchCourse = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/courses/${courseId}`)
      const data = await res.json()
      if (data.course) {
        setCourse(data.course)
      }
    } catch (err) {
      console.error('Error fetching course for builder:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePublish = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/publish`, { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.success) {
        setCourse((prev: any) => ({ ...prev, status: data.status }))
      }
    } catch (err) {
      console.error(err)
    }
  }

  // --- Module Operations ---
  const openAddModule = () => {
    setEditingModule(null)
    setModuleForm({ title: '', description: '' })
    setShowModuleModal(true)
  }

  const openEditModule = (mod: any) => {
    setEditingModule(mod)
    setModuleForm({ title: mod.title, description: mod.description || '' })
    setShowModuleModal(true)
  }

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!moduleForm.title.trim()) return
    setSaving(true)

    try {
      if (editingModule) {
        const res = await fetch(`/api/courses/${courseId}/modules/${editingModule.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(moduleForm)
        })
        if (res.ok) {
          fetchCourse()
          setShowModuleModal(false)
        }
      } else {
        const res = await fetch(`/api/courses/${courseId}/modules`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(moduleForm)
        })
        if (res.ok) {
          fetchCourse()
          setShowModuleModal(false)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteModule = async (modId: number, title: string) => {
    if (!confirm(`Delete module "${title}" and all its lessons?`)) return
    try {
      const res = await fetch(`/api/courses/${courseId}/modules/${modId}`, { method: 'DELETE' })
      if (res.ok) fetchCourse()
    } catch (err) {
      console.error(err)
    }
  }

  // --- Lesson Operations ---
  const openAddLesson = (moduleId: number) => {
    setSelectedModuleIdForLesson(moduleId)
    setEditingLesson(null)
    setLessonForm({
      title: '',
      description: '',
      duration: '20 mins',
      content: '',
      videoUrl: ''
    })
    setShowLessonModal(true)
  }

  const openEditLesson = (lesson: any, moduleId: number) => {
    setSelectedModuleIdForLesson(moduleId)
    setEditingLesson(lesson)
    setLessonForm({
      title: lesson.title,
      description: lesson.description || '',
      duration: lesson.duration || '20 mins',
      content: lesson.content || '',
      videoUrl: lesson.videoUrl || ''
    })
    setShowLessonModal(true)
  }

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lessonForm.title.trim() || !selectedModuleIdForLesson) return
    setSaving(true)

    try {
      if (editingLesson) {
        const res = await fetch(`/api/courses/${courseId}/lessons/${editingLesson.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lessonForm)
        })
        if (res.ok) {
          fetchCourse()
          setShowLessonModal(false)
        }
      } else {
        const res = await fetch(`/api/courses/${courseId}/lessons`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            moduleId: selectedModuleIdForLesson,
            ...lessonForm
          })
        })
        if (res.ok) {
          fetchCourse()
          setShowLessonModal(false)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLesson = async (lessonId: number, title: string) => {
    if (!confirm(`Delete lesson "${title}"?`)) return
    try {
      const res = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`, { method: 'DELETE' })
      if (res.ok) fetchCourse()
    } catch (err) {
      console.error(err)
    }
  }

  // --- Resource Operations ---
  const openAddResource = (moduleId?: number, lessonId?: number) => {
    setSelectedModuleIdForResource(moduleId || null)
    setSelectedLessonIdForResource(lessonId || null)
    setResourceForm({
      title: '',
      type: 'PDF',
      url: ''
    })
    setShowResourceModal(true)
  }

  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resourceForm.title.trim() || !resourceForm.url.trim()) return
    setSaving(true)

    try {
      const res = await fetch(`/api/courses/${courseId}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: selectedModuleIdForResource,
          lessonId: selectedLessonIdForResource,
          ...resourceForm
        })
      })
      if (res.ok) {
        fetchCourse()
        setShowResourceModal(false)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteResource = async (resourceId: number) => {
    if (!confirm('Remove this resource?')) return
    try {
      const res = await fetch(`/api/courses/${courseId}/resources/${resourceId}`, { method: 'DELETE' })
      if (res.ok) fetchCourse()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <MorphingInfinity className="size-16" style={{ width: '56px', height: '56px', color: '#8b5cf6' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading course builder workspace...</p>
      </div>
    )
  }

  if (!course) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
        <h2>Course not found</h2>
        <Link href="/trainer/courses" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
          Back to Manage Courses
        </Link>
      </div>
    )
  }

  const isPublished = course.status === 'published'

  return (
    <div className={styles.builderContainer}>
      {/* Top Header */}
      <div className={styles.topHeader}>
        <div>
          <Link href="/trainer/courses" className={styles.backLink}>
            <ArrowLeft size={14} strokeWidth={2} />
            <span>Manage Courses</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
            <h1 className={styles.courseTitle}>{course.title}</h1>
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

        <div className={styles.headerButtons}>
          <button
            type="button"
            onClick={openAddModule}
            className="btn btn-primary btn-sm"
          >
            <Plus size={14} strokeWidth={2} />
            <span>Add Module</span>
          </button>

          <Link
            href={`/student/courses/${course.id}`}
            target="_blank"
            className="btn btn-secondary btn-sm"
            title="Preview as Student"
          >
            <Eye size={14} strokeWidth={2} />
            <span>Preview Course</span>
          </Link>
        </div>
      </div>

      {/* Main Hierarchy Tree */}
      <div className={styles.treeSection}>
        {course.modules?.length === 0 ? (
          <div className={styles.emptyTree}>
            <Layers size={36} strokeWidth={1.5} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
            <h3>No Modules in this Course</h3>
            <p>Start structuring your course by adding your first module.</p>
            <button
              onClick={openAddModule}
              className="btn btn-primary btn-sm"
              style={{ marginTop: '1rem' }}
            >
              <Plus size={14} strokeWidth={2} />
              <span>Add Module 1</span>
            </button>
          </div>
        ) : (
          course.modules?.map((mod: any, mIdx: number) => (
            <div key={mod.id} className={styles.moduleBox}>
              {/* Module Header Bar */}
              <div className={styles.moduleBoxHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className={styles.moduleBadge}>Module {mIdx + 1}</span>
                  <div>
                    <h3 className={styles.moduleTitle}>{mod.title}</h3>
                    {mod.description && (
                      <p className={styles.moduleDesc}>{mod.description}</p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => openAddLesson(mod.id)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '4px 10px', fontSize: '12px' }}
                  >
                    <Plus size={12} strokeWidth={2} />
                    <span>Add Lesson</span>
                  </button>

                  <button
                    onClick={() => openEditModule(mod)}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '6px' }}
                    title="Edit Module Title"
                  >
                    <Edit2 size={13} strokeWidth={2} />
                  </button>

                  <button
                    onClick={() => handleDeleteModule(mod.id, mod.title)}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '6px', color: '#ef4444' }}
                    title="Delete Module"
                  >
                    <Trash2 size={13} strokeWidth={2} />
                  </button>
                </div>
              </div>

              {/* Module Lessons & Resources List */}
              <div className={styles.moduleContentList}>
                {mod.lessons?.length === 0 ? (
                  <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No lessons yet. Click &quot;Add Lesson&quot; above to create curriculum lessons.
                  </div>
                ) : (
                  mod.lessons?.map((lesson: any, lIdx: number) => (
                    <div key={lesson.id} className={styles.lessonBlock}>
                      <div className={styles.lessonRow}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#c4b5fd' }}>
                            {mIdx + 1}.{lIdx + 1}
                          </span>
                          <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                            {lesson.title}
                          </span>
                          <span className="badge badge-purple" style={{ fontSize: '10px', padding: '1px 6px' }}>
                            {lesson.duration || '20 mins'}
                          </span>
                          {lesson.videoUrl && (
                            <span className="badge badge-blue" style={{ fontSize: '10px', padding: '1px 6px' }}>
                              <Video size={10} /> Video
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => openAddResource(mod.id, lesson.id)}
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize: '11px', padding: '3px 8px', color: '#93c5fd' }}
                            title="Attach PDF, video or document resource"
                          >
                            <Plus size={11} />
                            <span>Resource</span>
                          </button>
                          <button
                            onClick={() => openEditLesson(lesson, mod.id)}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '5px' }}
                            title="Edit Lesson"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '5px', color: '#ef4444' }}
                            title="Delete Lesson"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Attached Lesson Resources */}
                      {lesson.resources && lesson.resources.length > 0 && (
                        <div className={styles.resourceList}>
                          {lesson.resources.map((res: any) => (
                            <div key={res.id} className={styles.resourceRow}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {res.type === 'PDF' && <FileText size={12} color="#ef4444" />}
                                {res.type === 'VIDEO' && <Video size={12} color="#3b82f6" />}
                                {res.type === 'DOCUMENT' && <FileText size={12} color="#10b981" />}
                                {res.type === 'EXTERNAL' && <ExternalLink size={12} color="#f59e0b" />}
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                  {res.title}
                                </span>
                              </div>
                              <button
                                onClick={() => handleDeleteResource(res.id)}
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '2px 5px', color: 'var(--text-muted)' }}
                                title="Remove Resource"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- Modal: Module (Create/Edit) --- */}
      {showModuleModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowModuleModal(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingModule ? 'Edit Module' : 'Add New Module'}</h3>
              <button onClick={() => setShowModuleModal(false)} className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveModule} style={{ padding: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Module Title *</label>
                <input
                  type="text"
                  required
                  value={moduleForm.title}
                  onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })}
                  placeholder="e.g. Module 1: Foundations & Architecture"
                  className="form-input"
                  autoFocus
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={moduleForm.description}
                  onChange={e => setModuleForm({ ...moduleForm, description: e.target.value })}
                  placeholder="Key competencies and focus areas of this module..."
                  className="form-input"
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setShowModuleModal(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
                  {saving ? 'Saving...' : editingModule ? 'Save Changes' : 'Create Module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Modal: Lesson (Create/Edit) --- */}
      {showLessonModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowLessonModal(false)}>
          <div className={styles.modalCard} style={{ maxWidth: '620px' }} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingLesson ? 'Edit Lesson' : 'Add Lesson to Module'}</h3>
              <button onClick={() => setShowLessonModal(false)} className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveLesson} style={{ padding: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Lesson Title *</label>
                <input
                  type="text"
                  required
                  value={lessonForm.title}
                  onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })}
                  placeholder="e.g. Next.js App Router Architecture & Streaming SSR"
                  className="form-input"
                  autoFocus
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Estimated Duration</label>
                  <input
                    type="text"
                    value={lessonForm.duration}
                    onChange={e => setLessonForm({ ...lessonForm, duration: e.target.value })}
                    placeholder="e.g. 25 mins"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Video Lecture URL (Optional)</label>
                  <input
                    type="url"
                    value={lessonForm.videoUrl}
                    onChange={e => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                    placeholder="https://youtube.com/..."
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Lesson Brief Description</label>
                <input
                  type="text"
                  value={lessonForm.description}
                  onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })}
                  placeholder="Key takeaway of this lesson..."
                  className="form-input"
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Detailed Notes / Markdown Content</label>
                <textarea
                  rows={5}
                  value={lessonForm.content}
                  onChange={e => setLessonForm({ ...lessonForm, content: e.target.value })}
                  placeholder="# Lesson Overview&#10;&#10;Key theoretical concepts and step-by-step code guidance..."
                  className="form-input"
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setShowLessonModal(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
                  {saving ? 'Saving...' : editingLesson ? 'Save Changes' : 'Add Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Modal: Resource (Add PDF/Doc/Video) --- */}
      {showResourceModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowResourceModal(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Attach Learning Resource</h3>
              <button onClick={() => setShowResourceModal(false)} className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveResource} style={{ padding: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Resource Title *</label>
                <input
                  type="text"
                  required
                  value={resourceForm.title}
                  onChange={e => setResourceForm({ ...resourceForm, title: e.target.value })}
                  placeholder="e.g. Distributed Systems Architecture Guide (PDF)"
                  className="form-input"
                  autoFocus
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Resource Type</label>
                <select
                  value={resourceForm.type}
                  onChange={e => setResourceForm({ ...resourceForm, type: e.target.value })}
                  className="form-select"
                >
                  <option value="PDF">PDF Document</option>
                  <option value="VIDEO">Video Stream / Link</option>
                  <option value="DOCUMENT">Document / Cheatsheet</option>
                  <option value="EXTERNAL">External Reference / Repo</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Resource URL / Link *</label>
                <input
                  type="url"
                  required
                  value={resourceForm.url}
                  onChange={e => setResourceForm({ ...resourceForm, url: e.target.value })}
                  placeholder="https://..."
                  className="form-input"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setShowResourceModal(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
                  {saving ? 'Attaching...' : 'Attach Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
