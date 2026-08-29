'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from '../../trainer.module.css'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  Plus,
  ArrowLeft,
  BookOpen,
  Sparkles,
  Layers,
  Clock,
  Zap,
  Image,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react'

export default function CreateCoursePage() {
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [loadingCats, setLoadingCats] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [createdCourse, setCreatedCourse] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    shortName: '',
    academicYear: 'AY 2026-27',
    semester: 'Semester I',
    department: 'Department of Computer Engineering',
    description: '',
    categoryId: '',
    difficulty: 'Beginner',
    estimatedDuration: '14 Weeks (42 Hours)',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    learningObjectives: '',
    prerequisites: '',
    status: 'draft'
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/courses/categories')
      const data = await res.json()
      if (data.categories) {
        setCategories(data.categories)
        if (data.categories.length > 0) {
          setFormData(prev => ({ ...prev, categoryId: String(data.categories[0].id) }))
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingCats(false)
    }
  }

  const handleTitleChange = (val: string) => {
    const acronym = val.split(/\s+/).filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 4)
    setFormData(prev => ({
      ...prev,
      title: val,
      shortName: prev.shortName ? prev.shortName : acronym
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!formData.title.trim()) {
      setErrorMsg('Course title is required.')
      return
    }

    setSubmitting(true)
    try {
      const objectivesArray = formData.learningObjectives
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean)

      const payload = {
        title: formData.title.trim(),
        shortName: formData.shortName.trim() || formData.title.slice(0, 4).toUpperCase(),
        academicYear: formData.academicYear.trim(),
        semester: formData.semester.trim(),
        department: formData.department.trim(),
        description: formData.description.trim(),
        categoryId: formData.categoryId ? parseInt(formData.categoryId, 10) : null,
        difficulty: formData.difficulty,
        estimatedDuration: formData.estimatedDuration.trim(),
        thumbnail: formData.thumbnail.trim(),
        learningObjectives: JSON.stringify(objectivesArray),
        prerequisites: formData.prerequisites.trim(),
        status: formData.status
      }

      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (res.ok && data.course) {
        setCreatedCourse(data.course)
      } else {
        setErrorMsg(data.error || 'Failed to create course')
      }
    } catch (err) {
      console.error(err)
      setErrorMsg('An unexpected network error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopyCode = () => {
    if (createdCourse?.joinCode) {
      navigator.clipboard.writeText(createdCourse.joinCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Course Created Success Card
  if (createdCourse) {
    return (
      <div className={styles.container} style={{ maxWidth: '640px', margin: '3rem auto' }}>
        <div className={styles.card} style={{ textAlign: 'center', padding: '3rem 2rem', background: 'var(--bg-card)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <CheckCircle2 size={32} />
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
            Course Created Successfully!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            {createdCourse.title} is now initialized. Share the course code below with your students.
          </p>

          <div style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '2rem', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Course Join Code</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#c4b5fd', fontFamily: 'Geist Mono, monospace', letterSpacing: '2px' }}>
              {createdCourse.joinCode}
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Course Code'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link href={`/trainer/courses/${createdCourse.id}`} className="btn btn-primary">
              <span>Open Course Workspace</span>
              <Zap size={14} />
            </Link>
            <Link href="/trainer/courses" className="btn btn-secondary">
              Back to My Courses
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container} style={{ maxWidth: '880px', margin: '0 auto' }}>
      {/* Breadcrumb & Navigation */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <Link
          href="/trainer/courses"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '0.875rem',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            transition: 'all 0.2s ease'
          }}
        >
          <ArrowLeft size={14} strokeWidth={2} />
          <span>Back to My Courses</span>
        </Link>
        <span style={{ fontSize: '0.8rem', color: '#c084fc', background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '3px 10px', borderRadius: '12px', fontWeight: 600 }}>
          Create College LMS Course
        </span>
      </div>

      <div className={styles.card} style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}>
        {/* Header Title */}
        <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={20} strokeWidth={2} color="#c084fc" />
            </div>
            <div>
              <h1 className={styles.title} style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)' }}>
                Create New Course
              </h1>
              <p className={styles.subtitle} style={{ marginTop: '3px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Define academic year, semester, department, and syllabus structure. A unique course join code will be auto-generated.
              </p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#f87171',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={17} strokeWidth={2} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg('')}
              style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '14px', padding: '2px 6px' }}
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Title & Short Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Course Name *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="e.g. Computer Graphics Lab"
                className="form-input"
                style={{ width: '100%', fontSize: '0.95rem' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Short Name</label>
              <input
                type="text"
                value={formData.shortName}
                onChange={e => setFormData({ ...formData, shortName: e.target.value.toUpperCase() })}
                placeholder="CGL"
                className="form-input"
                style={{ width: '100%', textAlign: 'center', textTransform: 'uppercase' }}
              />
            </div>
          </div>

          {/* Academic Year, Semester, Department */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Academic Year</label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={e => setFormData({ ...formData, academicYear: e.target.value })}
                placeholder="AY 2026-27"
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Semester</label>
              <input
                type="text"
                value={formData.semester}
                onChange={e => setFormData({ ...formData, semester: e.target.value })}
                placeholder="Semester I"
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
                placeholder="Department of Computer Engineering"
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Description */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Course Overview & Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Hands-on laboratory curriculum exploring 2D/3D rendering algorithms, OpenGL graphics pipeline, and shader programming..."
              className="form-input"
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          {/* Category & Difficulty */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Category</label>
              <select
                value={formData.categoryId}
                onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                className="form-select"
                style={{ width: '100%' }}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Difficulty Level</label>
              <select
                value={formData.difficulty}
                onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                className="form-select"
                style={{ width: '100%' }}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="All Levels">All Levels</option>
              </select>
            </div>
          </div>

          {/* Duration & Thumbnail */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Estimated Duration</label>
              <input
                type="text"
                value={formData.estimatedDuration}
                onChange={e => setFormData({ ...formData, estimatedDuration: e.target.value })}
                placeholder="e.g. 14 Weeks (42 Hours)"
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Course Image URL</label>
              <input
                type="url"
                value={formData.thumbnail}
                onChange={e => setFormData({ ...formData, thumbnail: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Learning Objectives */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Learning Outcomes / Competencies (One per line)</label>
            <textarea
              rows={3}
              value={formData.learningObjectives}
              onChange={e => setFormData({ ...formData, learningObjectives: e.target.value })}
              placeholder="Master OpenGL graphics rendering pipeline&#10;Implement 2D line and circle drawing algorithms&#10;Apply 2D and 3D geometric matrix transformations"
              className="form-input"
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          {/* Prerequisites */}
          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Prerequisites</label>
            <input
              type="text"
              value={formData.prerequisites}
              onChange={e => setFormData({ ...formData, prerequisites: e.target.value })}
              placeholder="e.g. Fundamental knowledge of C/C++ or Python and Linear Algebra"
              className="form-input"
              style={{ width: '100%' }}
            />
          </div>

          {/* Submit & Cancel Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
            <Link
              href="/trainer/courses"
              className="btn btn-secondary btn-sm"
              style={{ padding: '8px 18px' }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary btn-sm"
              style={{ padding: '8px 20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <span>{submitting ? 'Creating Course...' : 'Create Course & Generate Code'}</span>
              <Zap size={14} strokeWidth={2} />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
