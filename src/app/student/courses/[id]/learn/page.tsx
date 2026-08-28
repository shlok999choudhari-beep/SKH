'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './learn.module.css'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  CheckCircle2,
  Circle,
  PlayCircle,
  FileText,
  Video,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Layers,
  Sparkles,
  Download,
  Share2,
  Award,
  Check,
  FileCheck,
  HelpCircle,
  Bot,
  Zap,
  X,
  Send
} from 'lucide-react'

export default function CourseLearnPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params?.id as string

  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeLesson, setActiveLesson] = useState<any>(null)
  const [updatingProgress, setUpdatingProgress] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // AI Feature States
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [summaryData, setSummaryData] = useState<any>(null)
  const [summarizing, setSummarizing] = useState(false)

  const [showAiDrawer, setShowAiDrawer] = useState(false)
  const [aiMessages, setAiMessages] = useState<any[]>([])
  const [aiQuery, setAiQuery] = useState('')
  const [askingAi, setAskingAi] = useState(false)

  const [showPracticeModal, setShowPracticeModal] = useState(false)
  const [practiceQuestions, setPracticeQuestions] = useState<any[]>([])
  const [generatingPractice, setGeneratingPractice] = useState(false)
  const [practiceRevealed, setPracticeRevealed] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (courseId) {
      fetchCourse()
    }
  }, [courseId])

  const fetchCourse = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/courses/${courseId}`)
      const data = await res.json()
      if (data.course) {
        setCourse(data.course)

        // Flatten all lessons
        const allLessons = data.course.modules?.flatMap((m: any) => m.lessons) || []

        // Set active lesson to last accessed or first incomplete or first lesson
        let targetLesson = null
        if (data.course.enrollment?.lastLessonId) {
          targetLesson = allLessons.find((l: any) => l.id === data.course.enrollment.lastLessonId)
        }
        if (!targetLesson) {
          targetLesson = allLessons.find((l: any) => !l.isCompleted) || allLessons[0]
        }
        setActiveLesson(targetLesson || null)
      }
    } catch (err) {
      console.error('Error fetching course in player:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleLessonComplete = async (lesson: any) => {
    if (!lesson) return
    const nextState = !lesson.isCompleted
    setUpdatingProgress(true)

    try {
      const res = await fetch(`/api/courses/${courseId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: lesson.id,
          isCompleted: nextState
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        // Update local state
        setCourse((prev: any) => {
          if (!prev) return prev
          const updatedModules = prev.modules.map((m: any) => ({
            ...m,
            lessons: m.lessons.map((l: any) =>
              l.id === lesson.id ? { ...l, isCompleted: nextState } : l
            )
          }))
          return {
            ...prev,
            modules: updatedModules,
            enrollment: {
              ...prev.enrollment,
              progressPercent: data.progressPercent,
              status: data.status
            }
          }
        })

        if (activeLesson?.id === lesson.id) {
          setActiveLesson((prev: any) => ({ ...prev, isCompleted: nextState }))
        }
      }
    } catch (err) {
      console.error('Error updating progress:', err)
    } finally {
      setUpdatingProgress(false)
    }
  }

  const handleSummarizeLesson = async () => {
    if (!activeLesson) return
    setShowSummaryModal(true)
    setSummarizing(true)
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: activeLesson.id,
          lessonTitle: activeLesson.title,
          customContent: [activeLesson.description, activeLesson.content].filter(Boolean).join('\n\n')
        })
      })
      const data = await res.json()
      if (data.success && data.summary) {
        setSummaryData(data.summary)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSummarizing(false)
    }
  }

  const handleAskAiLesson = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!aiQuery.trim() || askingAi || !activeLesson) return

    const userText = aiQuery.trim()
    setAiMessages(prev => [...prev, { id: Date.now(), sender: 'user', content: userText }])
    setAiQuery('')
    setAskingAi(true)

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: parseInt(courseId, 10),
          lessonId: activeLesson.id,
          query: `[Context: Lesson "${activeLesson.title}"] ${userText}`
        })
      })
      const data = await res.json()
      if (data.success) {
        setAiMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'assistant',
          content: data.answer,
          sources: data.sources || []
        }])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setAskingAi(false)
    }
  }

  const handleGenerateLessonPractice = async () => {
    if (!activeLesson) return
    setShowPracticeModal(true)
    setGeneratingPractice(true)
    setPracticeRevealed({})
    try {
      const res = await fetch('/api/ai/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: parseInt(courseId, 10),
          topic: activeLesson.title,
          difficulty: 'Intermediate',
          questionCount: 3
        })
      })
      const data = await res.json()
      if (data.success && data.questions) {
        setPracticeQuestions(data.questions)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setGeneratingPractice(false)
    }
  }

  // Navigation helpers
  const allLessons = course?.modules?.flatMap((m: any) => m.lessons) || []
  const currentIndex = allLessons.findIndex((l: any) => l.id === activeLesson?.id)
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: '16px' }}>
        <MorphingInfinity className="size-16" style={{ width: '64px', height: '64px', color: '#8b5cf6' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading interactive learning workspace...</p>
      </div>
    )
  }

  if (!course) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
        <h2>Course not found</h2>
        <Link href="/student/courses" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
          Back to My Courses
        </Link>
      </div>
    )
  }

  return (
    <div className={styles.learnLayout}>
      {/* Left Sidebar / Curriculum Tree */}
      <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <div className={styles.sidebarHeader}>
          <div>
            <Link href={`/student/courses/${course.id}`} className={styles.backLink}>
              <ArrowLeft size={13} strokeWidth={2} />
              <span>Course Syllabus</span>
            </Link>
            <h2 className={styles.courseTitle}>{course.title}</h2>
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={styles.collapseToggle}
            title={sidebarCollapsed ? 'Expand Curriculum' : 'Collapse Curriculum'}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {!sidebarCollapsed && (
          <>
            {/* Progress Gauge */}
            <div className={styles.progressBox}>
              <div className={styles.progressTextRow}>
                <span>Course Mastery</span>
                <span className={styles.progressPercentText}>
                  {course.enrollment?.progressPercent || 0}%
                </span>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressBar}
                  style={{ width: `${course.enrollment?.progressPercent || 0}%` }}
                />
              </div>
            </div>

            {/* Modules & Lessons List */}
            <div className={styles.modulesScrollArea}>
              {course.modules?.map((mod: any, mIdx: number) => (
                <div key={mod.id} className={styles.moduleBlock}>
                  <div className={styles.moduleBlockHeader}>
                    <span className={styles.moduleNumber}>M{mIdx + 1}</span>
                    <span className={styles.moduleBlockTitle}>{mod.title}</span>
                  </div>

                  <div className={styles.lessonsList}>
                    {mod.lessons?.map((lesson: any) => {
                      const isActive = activeLesson?.id === lesson.id
                      const isDone = lesson.isCompleted

                      return (
                        <div
                          key={lesson.id}
                          className={`${styles.lessonItem} ${isActive ? styles.lessonItemActive : ''}`}
                          onClick={() => setActiveLesson(lesson)}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleLessonComplete(lesson)
                            }}
                            className={styles.lessonCheckbox}
                            title={isDone ? 'Mark as incomplete' : 'Mark as completed'}
                          >
                            {isDone ? (
                              <CheckCircle2 size={16} strokeWidth={2.5} color="#10b981" />
                            ) : (
                              <Circle size={16} strokeWidth={2} color="var(--text-muted)" />
                            )}
                          </button>

                          <div className={styles.lessonItemText}>
                            <span className={`${styles.lessonTitle} ${isDone ? styles.lessonTitleDone : ''}`}>
                              {lesson.title}
                            </span>
                            <span className={styles.lessonDuration}>
                              {lesson.duration || '15 mins'}
                            </span>
                          </div>
                        </div>
                      )
                    })}

                    {/* Module Assignments */}
                    {mod.assignments?.map((assignment: any) => (
                      <Link
                        key={`assign-${assignment.id}`}
                        href={`/student/assignments/${assignment.id}`}
                        className={styles.lessonItem}
                        style={{ background: 'rgba(139, 92, 246, 0.06)', borderLeft: '2px solid #8b5cf6' }}
                      >
                        <FileCheck size={16} strokeWidth={2} color="#a855f7" />
                        <div className={styles.lessonItemText}>
                          <span className={styles.lessonTitle} style={{ color: '#c4b5fd' }}>
                            [Task] {assignment.title}
                          </span>
                          <span className={styles.lessonDuration}>
                            {assignment.maxMarks} Pts
                          </span>
                        </div>
                      </Link>
                    ))}

                    {/* Module Quizzes */}
                    {mod.quizzes?.map((quiz: any) => (
                      <Link
                        key={`quiz-${quiz.id}`}
                        href={`/student/quizzes/${quiz.id}`}
                        className={styles.lessonItem}
                        style={{ background: 'rgba(59, 130, 246, 0.06)', borderLeft: '2px solid #3b82f6' }}
                      >
                        <HelpCircle size={16} strokeWidth={2} color="#60a5fa" />
                        <div className={styles.lessonItemText}>
                          <span className={styles.lessonTitle} style={{ color: '#93c5fd' }}>
                            [Quiz] {quiz.title}
                          </span>
                          <span className={styles.lessonDuration}>
                            {quiz.timeLimit > 0 ? `${quiz.timeLimit}m` : 'Untimed'}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </aside>

      {/* Main Learning & Content Area */}
      <main className={styles.mainContent}>
        {activeLesson ? (
          <div>
            {/* Top Lesson Header */}
            <div className={styles.contentHeader}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="badge badge-purple">
                    {activeLesson.duration || '20 mins'}
                  </span>
                  {activeLesson.isCompleted && (
                    <span className="badge badge-green">
                      <Check size={11} strokeWidth={3} />
                      <span>Completed</span>
                    </span>
                  )}
                </div>
                <h1 className={styles.activeLessonTitle}>{activeLesson.title}</h1>
                {activeLesson.description && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
                    {activeLesson.description}
                  </p>
                )}

                {/* AI Study Tools Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    onClick={handleSummarizeLesson}
                  >
                    <Sparkles size={12} color="#a855f7" />
                    <span>Summarize Lesson</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => setShowAiDrawer(true)}
                  >
                    <Bot size={12} color="#818cf8" />
                    <span>Ask AI Assistant</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    onClick={handleGenerateLessonPractice}
                  >
                    <Zap size={12} color="#f59e0b" />
                    <span>Practice with AI</span>
                  </button>
                </div>
              </div>

              {/* Mark Completed Button */}
              <button
                type="button"
                onClick={() => toggleLessonComplete(activeLesson)}
                disabled={updatingProgress}
                className={`btn btn-sm ${activeLesson.isCompleted ? 'btn-secondary' : 'btn-primary'}`}
              >
                {activeLesson.isCompleted ? (
                  <>
                    <CheckCircle2 size={15} strokeWidth={2} color="#10b981" />
                    <span>Completed ✓</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} strokeWidth={2} />
                    <span>{updatingProgress ? 'Saving...' : 'Mark as Completed'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Video Player if videoUrl exists */}
            {activeLesson.videoUrl && (
              <div className={styles.videoContainer}>
                <div className={styles.videoMock}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <PlayCircle size={48} strokeWidth={1.5} color="#c4b5fd" />
                    <span style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 500 }}>
                      Video Lecture Ready
                    </span>
                    <a
                      href={activeLesson.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ background: 'rgba(255,255,255,0.1)' }}
                    >
                      <ExternalLink size={13} strokeWidth={2} />
                      <span>Watch Stream Reference</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Lesson Body Content */}
            <div className={styles.bodyContent}>
              {activeLesson.content ? (
                <div className={styles.markdownView}>
                  {activeLesson.content.split('\n\n').map((para: string, pIdx: number) => {
                    if (para.startsWith('# ')) {
                      return <h2 key={pIdx} className={styles.docH1}>{para.replace('# ', '')}</h2>
                    }
                    if (para.startsWith('### ')) {
                      return <h3 key={pIdx} className={styles.docH2}>{para.replace('### ', '')}</h3>
                    }
                    if (para.startsWith('- ')) {
                      return (
                        <ul key={pIdx} className={styles.docUl}>
                          {para.split('\n').map((item, iIdx) => (
                            <li key={iIdx}>{item.replace('- ', '')}</li>
                          ))}
                        </ul>
                      )
                    }
                    return <p key={pIdx} className={styles.docP}>{para}</p>
                  })}
                </div>
              ) : (
                <div style={{ padding: '2rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <BookOpen size={32} strokeWidth={1.5} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
                  <p>Study the attached learning materials below and complete this module lesson.</p>
                </div>
              )}
            </div>

            {/* Attached Resources Section */}
            {activeLesson.resources && activeLesson.resources.length > 0 && (
              <div className={styles.resourcesSection}>
                <h3 className={styles.resourcesTitle}>
                  <FileText size={16} strokeWidth={2} color="#a855f7" />
                  <span>Lesson Learning Resources & Documents</span>
                </h3>

                <div className={styles.resourcesGrid}>
                  {activeLesson.resources.map((res: any) => (
                    <a
                      key={res.id}
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.resourceCard}
                    >
                      <div className={styles.resourceIconWrap}>
                        {res.type === 'PDF' && <FileText size={18} color="#ef4444" />}
                        {res.type === 'VIDEO' && <Video size={18} color="#3b82f6" />}
                        {res.type === 'DOCUMENT' && <FileText size={18} color="#10b981" />}
                        {res.type === 'EXTERNAL' && <ExternalLink size={18} color="#f59e0b" />}
                      </div>

                      <div className={styles.resourceInfo}>
                        <span className={styles.resourceName}>{res.title}</span>
                        <div className={styles.resourceMeta}>
                          <span className="badge badge-purple" style={{ fontSize: '10px', padding: '1px 6px' }}>
                            {res.type}
                          </span>
                          {res.fileSize && (
                            <span>{(res.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                          )}
                        </div>
                      </div>

                      <ExternalLink size={14} color="var(--text-muted)" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Lesson Navigation */}
            <div className={styles.bottomNav}>
              {prevLesson ? (
                <button
                  type="button"
                  onClick={() => setActiveLesson(prevLesson)}
                  className="btn btn-secondary btn-sm"
                >
                  <ArrowLeft size={14} strokeWidth={2} />
                  <span>Previous: {prevLesson.title}</span>
                </button>
              ) : <div />}

              {nextLesson ? (
                <button
                  type="button"
                  onClick={() => {
                    toggleLessonComplete(activeLesson)
                    setActiveLesson(nextLesson)
                  }}
                  className="btn btn-primary btn-sm"
                >
                  <span>Next Lesson: {nextLesson.title}</span>
                  <ArrowRight size={14} strokeWidth={2} />
                </button>
              ) : (
                <Link
                  href="/student/courses"
                  className="btn btn-primary btn-sm"
                >
                  <Award size={15} strokeWidth={2} />
                  <span>Finish & View Hub</span>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
            <p>Select a lesson from the curriculum outline on the left to begin learning.</p>
          </div>
        )}
      </main>

      {/* AI Lesson Summary Modal */}
      {showSummaryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', maxWidth: '600px', width: '100%', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}>
            <div style={{ padding: '1.25rem 1.5rem', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="#a855f7" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Lesson Summary — {activeLesson?.title}
                </h3>
              </div>
              <button onClick={() => setShowSummaryModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
              {summarizing ? (
                <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                  <MorphingInfinity size={40} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1rem' }}>Extracting core takeaways & definitions...</p>
                </div>
              ) : summaryData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      Key Bullet Points
                    </h4>
                    <ul style={{ paddingLeft: '1.25rem', margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                      {(summaryData.summary || []).map((pt: string, i: number) => (
                        <li key={i} style={{ marginBottom: '0.35rem' }}>{pt}</li>
                      ))}
                    </ul>
                  </div>

                  {summaryData.keyTerms && summaryData.keyTerms.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        Important Terms
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {summaryData.keyTerms.map((kt: any, i: number) => (
                          <div key={i} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.825rem' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>{kt.term}:</strong> <span style={{ color: 'var(--text-secondary)' }}>{kt.definition}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {summaryData.keyTakeaways && summaryData.keyTakeaways.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        Core Takeaways
                      </h4>
                      <ul style={{ paddingLeft: '1.25rem', margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                        {summaryData.keyTakeaways.map((tk: string, i: number) => (
                          <li key={i} style={{ marginBottom: '0.35rem' }}>{tk}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)' }}>No summary generated.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Practice Modal */}
      {showPracticeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', maxWidth: '650px', width: '100%', overflow: 'hidden', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.25rem 1.5rem', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap size={18} color="#f59e0b" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Practice Test — {activeLesson?.title}
                </h3>
              </div>
              <button onClick={() => setShowPracticeModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              {generatingPractice ? (
                <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                  <MorphingInfinity size={40} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1rem' }}>Synthesizing personalized practice questions...</p>
                </div>
              ) : practiceQuestions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {practiceQuestions.map((q: any, idx: number) => {
                    const isRevealed = Boolean(practiceRevealed[idx])
                    return (
                      <div key={idx} style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase' }}>
                            Q{idx + 1} ({q.type})
                          </span>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '2px 6px', fontSize: '10px' }}
                            onClick={() => setPracticeRevealed(prev => ({ ...prev, [idx]: !prev[idx] }))}
                          >
                            {isRevealed ? 'Hide Solution' : 'Reveal Solution'}
                          </button>
                        </div>

                        <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                          {q.question}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          {(q.options || []).map((opt: any, optIdx: number) => {
                            const showCorrect = isRevealed && opt.isCorrect
                            return (
                              <div
                                key={optIdx}
                                style={{
                                  padding: '0.5rem 0.75rem',
                                  borderRadius: 'var(--radius-md)',
                                  background: showCorrect ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-secondary)',
                                  border: showCorrect ? '1px solid #10b981' : '1px solid var(--border)',
                                  color: showCorrect ? '#34d399' : 'var(--text-primary)',
                                  fontSize: '0.825rem'
                                }}
                              >
                                {opt.optionText}
                              </div>
                            )
                          })}
                        </div>

                        {isRevealed && q.explanation && (
                          <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(99, 102, 241, 0.08)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: '#c4b5fd' }}>
                            <strong>Why:</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Floating Drawer */}
      {showAiDrawer && (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', width: '380px', height: '520px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: '0 20px 40px rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', zIndex: 1200, overflow: 'hidden' }}>
          <div style={{ padding: '0.875rem 1.25rem', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bot size={18} color="#818cf8" />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Lesson Assistant
              </span>
            </div>
            <button onClick={() => setShowAiDrawer(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              Ask me any question about <strong>{activeLesson?.title}</strong>. I answer using verified course notes.
            </div>

            {aiMessages.map((m, i) => (
              <div
                key={i}
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.825rem',
                  lineHeight: 1.5,
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  background: m.sender === 'user' ? 'linear-gradient(135deg, #4f46e5, #6366f1)' : 'var(--bg-primary)',
                  color: m.sender === 'user' ? '#fff' : 'var(--text-primary)',
                  maxWidth: '85%'
                }}
              >
                {m.content}
              </div>
            ))}
            {askingAi && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <RefreshCw size={12} className="spin" />
                <span>Searching lesson materials...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleAskAiLesson} style={{ padding: '0.75rem', background: 'var(--bg-primary)', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Ask about this lesson..."
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              disabled={askingAi}
              style={{ flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.75rem', fontSize: '0.825rem', color: 'var(--text-primary)', outline: 'none' }}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={askingAi || !aiQuery.trim()}>
              <Send size={13} />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
