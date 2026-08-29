'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import CourseWorkspace from '@/components/CourseWorkspace'
import StudentSidebar from '@/components/StudentSidebar'
import BackButton from '@/components/BackButton'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  BookOpen,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Layers,
  Clock,
  Users
} from 'lucide-react'

export default function StudentCourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params?.id ? parseInt(params.id as string, 10) : 0

  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [joinCodeInput, setJoinCodeInput] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')

  useEffect(() => {
    if (courseId) {
      fetchCourseCheck()
    }
  }, [courseId])

  const fetchCourseCheck = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/courses/${courseId}`, { cache: 'no-store' })
      const data = await res.json()
      if (data.course) {
        setCourse(data.course)
      }
    } catch (err) {
      console.error('Error checking course enrollment:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCodeInput.trim()) return

    setJoining(true)
    setJoinError('')

    try {
      const res = await fetch('/api/courses/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: joinCodeInput.trim().toUpperCase() })
      })
      const data = await res.json()

      if (res.ok && data.success) {
        fetchCourseCheck()
      } else {
        setJoinError(data.error || 'Invalid course code. Please contact your instructor.')
      }
    } catch {
      setJoinError('Network error during course enrollment.')
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <StudentSidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.25rem' }}>
          <MorphingInfinity className="size-16" style={{ width: '60px', height: '60px', color: '#3b82f6' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '4px' }}>
              Opening Course Workspace
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              Verifying student enrollment and syllabus access permissions...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <StudentSidebar />
        <div style={{ flex: 1, padding: '4rem 2rem', textAlign: 'center' }}>
          <h2>Course Not Found</h2>
          <p style={{ color: 'var(--text-secondary)' }}>The requested course could not be located.</p>
          <Link href="/student/courses" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
            Back to My Courses
          </Link>
        </div>
      </div>
    )
  }

  // If student is enrolled (or instructor), render full CourseWorkspace
  if (course.isEnrolled || course.isTeacher) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <StudentSidebar />
        <div style={{ flex: 1, paddingTop: '68px' }}>
          <CourseWorkspace courseId={courseId} role="student" />
        </div>
      </div>
    )
  }

  // If not enrolled, show course preview and Course Code prompt
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <StudentSidebar />
      <div style={{ flex: 1, paddingTop: '68px', paddingBottom: '4rem' }}>
        <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1.5rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <BackButton fallbackHref="/student/courses" />
          </div>

          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
            <div style={{ width: '100%', height: '220px', position: 'relative', overflow: 'hidden' }}>
              <img
                src={course.thumbnail}
                alt={course.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg-secondary) 0%, transparent 80%)' }} />
              <div style={{ position: 'absolute', bottom: '16px', left: '24px' }}>
                <span className="badge badge-purple" style={{ marginBottom: '6px', display: 'inline-block' }}>
                  {course.academicYear || 'AY 2026-27'} • {course.semester || 'Semester I'}
                </span>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {course.title}
                </h1>
              </div>
            </div>

            <div style={{ padding: '24px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                {course.description}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Instructor</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{course.trainer?.user?.name || 'Prof. Rajesh Sharma'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Department</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{course.department || 'Computer Engineering'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Curriculum</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{course.modules?.length || 0} Sections</div>
                </div>
              </div>

              {/* Join Code Prompt */}
              <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: 'var(--radius-lg)', padding: '24px', textAlign: 'center' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.2)', color: '#c4b5fd', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Lock size={20} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                  Enrollment Required
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '460px', margin: '0 auto 1.5rem' }}>
                  This college course is restricted to enrolled students. Enter the course code provided by your instructor to join.
                </p>

                {joinError && (
                  <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', borderRadius: '8px', fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto 1.25rem' }}>
                    {joinError}
                  </div>
                )}

                <form onSubmit={handleJoinWithCode} style={{ display: 'flex', gap: '10px', maxWidth: '400px', margin: '0 auto', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CGL-7F42K9"
                    value={joinCodeInput}
                    onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
                    className="form-input"
                    style={{ flex: 1, minWidth: '180px', textAlign: 'center', fontFamily: 'Geist Mono, monospace', letterSpacing: '1px', textTransform: 'uppercase' }}
                  />
                  <button
                    type="submit"
                    disabled={joining || !joinCodeInput.trim()}
                    className="btn btn-primary"
                    style={{ padding: '8px 20px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>{joining ? 'Enrolling...' : 'Join Course'}</span>
                    <ArrowRight size={14} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
