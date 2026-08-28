'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from '../courses.module.css'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Video,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  Clock,
  Layers,
  Award,
  ArrowLeft,
  ArrowRight,
  Zap,
  PlayCircle,
  Sparkles,
  ShieldCheck,
  Check,
  FileCheck,
  HelpCircle,
  Megaphone,
  MessageSquare,
  Download
} from 'lucide-react'

export default function CourseDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params?.id as string

  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({})
  const [enrolling, setEnrolling] = useState(false)
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [completionData, setCompletionData] = useState<any>(null)
  const [claimingCert, setClaimingCert] = useState(false)
  const [certSuccessMsg, setCertSuccessMsg] = useState('')

  useEffect(() => {
    if (courseId) {
      fetchCourseDetails()
      fetchAnnouncements()
      fetchCompletion()
    }
  }, [courseId])

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch(`/api/announcements?courseId=${courseId}`)
      const data = await res.json()
      if (data.announcements) setAnnouncements(data.announcements)
    } catch (err) {
      console.error('Error fetching announcements:', err)
    }
  }

  const fetchCompletion = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/completion`)
      const data = await res.json()
      if (data.completion) setCompletionData(data.completion)
    } catch (err) {
      console.error('Error fetching completion:', err)
    }
  }

  const handleClaimCertificate = async () => {
    setClaimingCert(true)
    setCertSuccessMsg('')
    try {
      const res = await fetch(`/api/courses/${courseId}/completion`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setCertSuccessMsg('🎉 Certificate issued successfully and added to your Document Vault!')
        fetchCompletion()
      } else {
        alert(data.error || 'Failed to issue certificate')
      }
    } catch (err: any) {
      alert(err.message || 'Error claiming certificate')
    } finally {
      setClaimingCert(false)
    }
  }

  const fetchCourseDetails = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/courses/${courseId}`)
      const data = await res.json()
      if (data.course) {
        setCourse(data.course)
        // Expand first module by default
        const initialExpanded: Record<number, boolean> = {}
        data.course.modules?.forEach((m: any, idx: number) => {
          initialExpanded[m.id] = idx === 0
        })
        setExpandedModules(initialExpanded)
      }
    } catch (err) {
      console.error('Error loading course details:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleModule = (modId: number) => {
    setExpandedModules(prev => ({
      ...prev,
      [modId]: !prev[modId]
    }))
  }

  const handleEnroll = async () => {
    setEnrolling(true)
    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST'
      })
      const data = await res.json()
      if (res.ok && data.success) {
        router.push(`/student/courses/${courseId}/learn`)
      } else {
        alert(data.error || 'Enrollment failed')
      }
    } catch (err) {
      console.error(err)
      alert('An error occurred while enrolling.')
    } finally {
      setEnrolling(false)
    }
  }

  const parseJsonArray = (jsonString?: string): string[] => {
    if (!jsonString) return []
    try {
      const parsed = JSON.parse(jsonString)
      return Array.isArray(parsed) ? parsed : [jsonString]
    } catch {
      return jsonString.split('\n').filter(s => s.trim().length > 0)
    }
  }

  if (loading) {
    return (
      <div className={styles.container} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <MorphingInfinity className="size-16" style={{ width: '64px', height: '64px', color: '#8b5cf6' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading course curriculum...</p>
      </div>
    )
  }

  if (!course) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>Course Not Found</h2>
          <p className={styles.emptyDescription}>The requested course is not available or has been archived.</p>
          <Link href="/student/courses/explore" className="btn btn-primary btn-sm">
            <span>Back to Course Catalog</span>
          </Link>
        </div>
      </div>
    )
  }

  const objectives = parseJsonArray(course.learningObjectives)
  const isEnrolled = course.isEnrolled
  const enrollment = course.enrollment

  return (
    <div className={styles.container}>
      {/* Back button */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link href="/student/courses/explore" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}>
          <ArrowLeft size={15} strokeWidth={2} />
          <span>Back to Catalog</span>
        </Link>
      </div>

      {/* Main Banner Header */}
      <div className={styles.detailsHeader}>
        <div className={styles.detailsLeft}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <span className="badge badge-purple">{course.category?.name || 'Computer Science'}</span>
              <span className="badge badge-orange">{course.difficulty}</span>
              {isEnrolled && (
                <span className="badge badge-green">
                  <CheckCircle2 size={12} strokeWidth={2} />
                  <span>Enrolled ({enrollment?.progressPercent || 0}% Completed)</span>
                </span>
              )}
            </div>

            <h1 className={styles.headerTitle} style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>
              {course.title}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              {course.description}
            </p>

            {/* Trainer card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-full)', background: 'rgba(139, 92, 246, 0.2)', color: '#c4b5fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem' }}>
                {course.trainer?.user?.name?.slice(0, 2).toUpperCase() || 'TR'}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                  {course.trainer?.user?.name || 'PlaceIQ Instructor'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  ★ {course.trainer?.rating || 4.9} Instructor Rating • {course.trainer?.expertiseTags || 'Industry Veteran'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action card */}
        <div className={styles.detailsRight}>
          <div>
            <div style={{ width: '100%', height: '160px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1.25rem' }}>
              <img
                src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'}
                alt={course.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Estimated Duration</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{course.estimatedDuration}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Curriculum</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{course.modules?.length || 0} Modules</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Lessons & Labs</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{course.totalLessonsCount} Lessons</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Enrolled Students</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{course.enrolledCount} Students</span>
              </div>
            </div>
          </div>

          <div>
            {isEnrolled ? (
              <Link
                href={`/student/courses/${course.id}/learn`}
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
              >
                <PlayCircle size={17} strokeWidth={2} />
                <span>Continue Learning</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleEnroll}
                disabled={enrolling}
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
              >
                <Zap size={17} strokeWidth={2} />
                <span>{enrolling ? 'Enrolling...' : 'Enroll in Course (Free)'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Announcements Feed Banner */}
      {announcements.length > 0 && (
        <div style={{
          marginBottom: '2rem',
          background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.08) 0%, var(--bg-secondary) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Megaphone size={18} color="#818cf8" />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Course Announcements ({announcements.length})
              </h3>
            </div>
            <Link
              href={`/student/discussions?courseId=${course.id}`}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}
            >
              <MessageSquare size={12} />
              <span>Ask in Forum</span>
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {announcements.slice(0, 2).map((ann: any) => (
              <div key={ann.id} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{ann.title}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(ann.createdAt).toLocaleDateString()}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.825rem', lineHeight: 1.45, color: 'var(--text-secondary)' }}>
                  {ann.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course Completion & Certificate Claim Banner */}
      {completionData && (completionData.isEligibleForCertificate || completionData.issuedCertificate) && (
        <div style={{
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)',
          border: '1px solid #d97706',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <Award size={22} color="#f59e0b" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {completionData.issuedCertificate ? '🎉 Certificate of Completion Issued!' : '🏆 Course Complete! Claim Your Certificate'}
              </h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              {completionData.issuedCertificate
                ? `Certificate ID: ${completionData.issuedCertificate.certificateId} • Verified & Stored in Document Vault`
                : 'You have satisfied 100% of curriculum lessons, assignments, and quizzes for this course.'}
            </p>
            {certSuccessMsg && (
              <p style={{ color: '#34d399', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.4rem', margin: 0 }}>
                {certSuccessMsg}
              </p>
            )}
          </div>

          <div>
            {completionData.issuedCertificate ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <a
                  href={`/api/certificates/${completionData.issuedCertificate.id}/download`}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                  download
                >
                  <Download size={14} />
                  <span>Download PDF</span>
                </a>
                <Link
                  href={`/verify/certificate/${completionData.issuedCertificate.certificateId}`}
                  target="_blank"
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                >
                  <ExternalLink size={14} />
                  <span>Verify</span>
                </Link>
              </div>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleClaimCertificate}
                disabled={claimingCert}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#d97706', borderColor: '#d97706' }}
              >
                <Award size={16} />
                <span>{claimingCert ? 'Generating Certificate...' : 'Claim Certificate Now'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Learning Objectives & Prerequisites Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {objectives.length > 0 && (
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
              <Sparkles size={18} strokeWidth={2} color="#a855f7" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                What You Will Learn
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {objectives.map((obj, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                    <Check size={11} strokeWidth={3} />
                  </div>
                  <span>{obj}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {course.prerequisites && (
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
              <ShieldCheck size={18} strokeWidth={2} color="#3b82f6" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Prerequisites & Requirements
              </h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
              {course.prerequisites}
            </p>
          </div>
        )}
      </div>

      {/* Course Curriculum Accordion */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Course Curriculum & Modules
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              {course.modules?.length || 0} Modules • {course.totalLessonsCount} Interactive Lessons • {course.totalResourcesCount} Resources
            </p>
          </div>
        </div>

        <div className={styles.moduleAccordion}>
          {course.modules?.map((mod: any, index: number) => {
            const isExpanded = !!expandedModules[mod.id]

            return (
              <div key={mod.id} className={styles.moduleItem}>
                <div className={styles.moduleHeader} onClick={() => toggleModule(mod.id)}>
                  <div className={styles.moduleTitleWrap}>
                    <div style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-md)', background: 'rgba(139, 92, 246, 0.15)', color: '#c4b5fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                      {index + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {mod.title}
                      </div>
                      {mod.description && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {mod.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {mod.lessons?.length || 0} Lessons
                    </span>
                    {isExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className={styles.moduleLessonsList}>
                    {mod.lessons?.map((lesson: any) => (
                      <div key={lesson.id} className={styles.lessonRow}>
                        <div className={styles.lessonInfo}>
                          {lesson.isCompleted ? (
                            <CheckCircle2 size={16} strokeWidth={2} color="#10b981" />
                          ) : (
                            <PlayCircle size={16} strokeWidth={2} color="var(--text-muted)" />
                          )}
                          <div>
                            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                              {lesson.title}
                            </span>
                            {lesson.description && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {lesson.description}
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {/* Attached resources indicator */}
                          {lesson.resources?.map((res: any) => (
                            <span key={res.id} className={styles.resourceTag}>
                              {res.type === 'PDF' && <FileText size={10} />}
                              {res.type === 'VIDEO' && <Video size={10} />}
                              {res.type === 'EXTERNAL' && <ExternalLink size={10} />}
                              <span>{res.type}</span>
                            </span>
                          ))}

                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {lesson.duration || '15 mins'}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Module Assignments */}
                    {mod.assignments?.map((assignment: any) => (
                      <div key={`assign-${assignment.id}`} className={styles.lessonRow} style={{ background: 'rgba(139, 92, 246, 0.05)', borderLeft: '3px solid #8b5cf6' }}>
                        <div className={styles.lessonInfo}>
                          <FileCheck size={16} strokeWidth={2} color="#a855f7" />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {assignment.title}
                              </span>
                              <span className="badge badge-purple" style={{ fontSize: '10px', padding: '1px 6px' }}>
                                Assignment
                              </span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Max {assignment.maxMarks} Marks • Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No Deadline'}
                            </div>
                          </div>
                        </div>

                        <Link
                          href={`/student/assignments/${assignment.id}`}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 8px', fontSize: '12px' }}
                        >
                          <span>Open Task</span>
                          <ArrowRight size={11} />
                        </Link>
                      </div>
                    ))}

                    {/* Module Quizzes */}
                    {mod.quizzes?.map((quiz: any) => (
                      <div key={`quiz-${quiz.id}`} className={styles.lessonRow} style={{ background: 'rgba(59, 130, 246, 0.05)', borderLeft: '3px solid #3b82f6' }}>
                        <div className={styles.lessonInfo}>
                          <HelpCircle size={16} strokeWidth={2} color="#60a5fa" />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {quiz.title}
                              </span>
                              <span className="badge badge-blue" style={{ fontSize: '10px', padding: '1px 6px' }}>
                                Quiz ({quiz.timeLimit > 0 ? `${quiz.timeLimit}m` : 'Untimed'})
                              </span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Passing Score: {quiz.passingScore}% • {quiz.questions?.length || 0} Questions
                            </div>
                          </div>
                        </div>

                        <Link
                          href={`/student/quizzes/${quiz.id}`}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '3px 8px', fontSize: '12px' }}
                        >
                          <span>Take Quiz</span>
                          <ArrowRight size={11} />
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
