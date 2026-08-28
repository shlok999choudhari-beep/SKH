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
  AlertCircle
} from 'lucide-react'

export default function CreateCoursePage() {
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [loadingCats, setLoadingCats] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    difficulty: 'Beginner',
    estimatedDuration: '6 Weeks (24 Hours)',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
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
        router.push(`/trainer/courses/${data.course.id}/builder`)
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
          Step 1 of 2: Curriculum Blueprint
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
                Enter course title and syllabus metadata. You will add structured modules, lessons, and resources in Step 2.
              </p>
            </div>
          </div>
        </div>

        {/* Prominent Error Banner */}
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
          {/* Title */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Course Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Distributed Systems & High-Throughput Microservices"
              className="form-input"
              style={{ width: '100%', fontSize: '0.95rem' }}
            />
          </div>

          {/* Description */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Course Overview & Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Comprehensive curriculum covering architectural design patterns, fault tolerance, and production practices..."
              className="form-input"
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          {/* Category & Difficulty */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Curriculum Category</label>
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
                placeholder="e.g. 8 Weeks (32 Hours)"
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Thumbnail Image URL</label>
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
            <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Key Learning Objectives (One per line)</label>
            <textarea
              rows={3}
              value={formData.learningObjectives}
              onChange={e => setFormData({ ...formData, learningObjectives: e.target.value })}
              placeholder="Design fault-tolerant event streams&#10;Implement resilient caching patterns&#10;Ace architectural interviews"
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
              placeholder="e.g. Fundamental knowledge of backend APIs, Git, and SQL"
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
              <span>{submitting ? 'Creating Course...' : 'Continue to Course Builder'}</span>
              <Zap size={14} strokeWidth={2} />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
