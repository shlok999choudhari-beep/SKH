'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import styles from './ai-learning.module.css'
import StudentSidebar from '@/components/StudentSidebar'
import BackButton from '@/components/BackButton'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  Bot,
  Sparkles,
  Send,
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Clock,
  Layers,
  HelpCircle,
  TrendingUp,
  BrainCircuit,
  FileCheck,
  Zap,
  Target,
  X,
  ChevronRight,
  Lightbulb,
  Check
} from 'lucide-react'

function formatInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|\`.*?\`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.85em', fontFamily: 'monospace', color: '#c4b5fd' }}>{part.slice(1, -1)}</code>
    }
    return part
  })
}

function renderFormattedContent(text: string) {
  if (!text) return null

  const lines = text.split('\n')
  return (
    <div className={styles.formattedText}>
      {lines.map((line, idx) => {
        // Table row
        if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
          const cells = line.trim().split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1)
          const isSeparator = cells.every(c => c.trim().match(/^-+$/))
          if (isSeparator) return null
          return (
            <div key={idx} className={styles.tableRow}>
              {cells.map((c, cIdx) => (
                <span key={cIdx} className={styles.tableCell}>{formatInlineMarkdown(c.trim())}</span>
              ))}
            </div>
          )
        }

        // Heading
        if (line.startsWith('### ')) {
          return <h4 key={idx} className={styles.contentH4}>{line.replace('### ', '')}</h4>
        }
        if (line.startsWith('## ')) {
          return <h3 key={idx} className={styles.contentH3}>{line.replace('## ', '')}</h3>
        }
        if (line.startsWith('# ')) {
          return <h2 key={idx} className={styles.contentH2}>{line.replace('# ', '')}</h2>
        }

        // Bullet point
        if (line.trim().startsWith('- ') || line.trim().startsWith('• ') || line.trim().startsWith('* ')) {
          const cleanLine = line.trim().replace(/^[-•*]\s+/, '')
          return (
            <div key={idx} className={styles.bulletItem}>
              <span className={styles.bulletDot}>•</span>
              <span>{formatInlineMarkdown(cleanLine)}</span>
            </div>
          )
        }

        if (!line.trim()) {
          return <div key={idx} style={{ height: '6px' }} />
        }

        return <p key={idx} className={styles.contentP}>{formatInlineMarkdown(line)}</p>
      })}
    </div>
  )
}

export default function StudentAILearningPage() {
  const [activeTab, setActiveTab] = useState<'assistant' | 'planner' | 'insights' | 'practice'>('assistant')
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // AI Assistant State
  const [messages, setMessages] = useState<any[]>([])
  const [query, setQuery] = useState('')
  const [asking, setAsking] = useState(false)
  const [conversationId, setConversationId] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Study Plan State
  const [studyPlan, setStudyPlan] = useState<any>(null)
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [dailyHours, setDailyHours] = useState('1.5')
  const [targetExamDate, setTargetExamDate] = useState('')
  const [generatingPlan, setGeneratingPlan] = useState(false)

  // Learning Insights State
  const [insights, setInsights] = useState<any>(null)

  // Practice Generator State
  const [practiceTopic, setPracticeTopic] = useState('Computer Graphics & OpenGL Rendering')
  const [practiceDifficulty, setPracticeDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate')
  const [practiceCount, setPracticeCount] = useState('3')
  const [practiceQuestions, setPracticeQuestions] = useState<any[]>([])
  const [generatingPractice, setGeneratingPractice] = useState(false)
  const [revealedSolutions, setRevealedSolutions] = useState<Record<number, boolean>>({})

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      // 1. Fetch courses
      const cRes = await fetch('/api/courses')
      const cData = await cRes.json()
      if (cData.courses && cData.courses.length > 0) {
        setCourses(cData.courses)
        setSelectedCourseId(cData.courses[0].id.toString())
      }

      // 2. Fetch Study Plan
      const pRes = await fetch('/api/ai/study-planner')
      const pData = await pRes.json()
      if (pData.plan) setStudyPlan(pData.plan)

      // 3. Fetch Insights
      const iRes = await fetch('/api/ai/insights')
      const iData = await iRes.json()
      if (iData.insights) setInsights(iData.insights)

      // Seed initial greeting assistant message
      setMessages([
        {
          id: 'init-msg',
          sender: 'assistant',
          content: 'Hello! I am your AI Course Assistant. Ask me anything about your enrolled curriculum, practical lab exercises, OpenGL shaders, syllabus topics, or assignment guidelines. All answers are grounded in your official course materials.',
          sources: []
        }
      ])
    } catch (err) {
      console.error('Error loading AI learning hub data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAskAssistant = async (customQuery?: string) => {
    const textToAsk = (customQuery || query).trim()
    if (!textToAsk || !selectedCourseId || asking) return

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: textToAsk
    }
    setMessages(prev => [...prev, userMsg])
    setQuery('')
    setAsking(true)

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: parseInt(selectedCourseId, 10),
          query: textToAsk,
          conversationId
        })
      })
      const data = await res.json()
      if (data.success) {
        if (data.conversationId) setConversationId(data.conversationId)
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'assistant',
            content: data.answer,
            sources: data.sources || [],
            provider: data.provider
          }
        ])
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: 'assistant',
            content: data.error || 'Sorry, I was unable to process your request at this moment.',
            sources: []
          }
        ])
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          content: 'Network connection issue while communicating with AI assistant.',
          sources: []
        }
      ])
    } finally {
      setAsking(false)
    }
  }

  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    if (!studyPlan) return
    const newCompleted = !currentCompleted

    setStudyPlan((prev: any) => {
      const updatedSchedule = prev.schedule.map((day: any) => ({
        ...day,
        tasks: day.tasks.map((t: any) => t.id === taskId ? { ...t, completed: newCompleted } : t)
      }))
      return { ...prev, schedule: updatedSchedule }
    })

    try {
      await fetch('/api/ai/study-planner', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: studyPlan.id,
          taskId,
          completed: newCompleted
        })
      })
    } catch (err) {
      console.error(err)
    }
  }

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneratingPlan(true)
    try {
      const res = await fetch('/api/ai/study-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourseId ? parseInt(selectedCourseId, 10) : null,
          targetExamDate: targetExamDate || null,
          dailyHours: parseFloat(dailyHours) || 1.5
        })
      })
      const data = await res.json()
      if (data.success && data.plan) {
        setStudyPlan(data.plan)
        setShowPlanModal(false)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setGeneratingPlan(false)
    }
  }

  const [practiceScopeError, setPracticeScopeError] = useState('')

  const handleGeneratePractice = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneratingPractice(true)
    setRevealedSolutions({})
    setPracticeScopeError('')
    try {
      const res = await fetch('/api/ai/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: parseInt(selectedCourseId || '1', 10),
          topic: practiceTopic,
          difficulty: practiceDifficulty,
          questionCount: parseInt(practiceCount, 10) || 3
        })
      })
      const data = await res.json()
      if (data.blocked) {
        setPracticeScopeError(data.message || data.error || "This search is outside PlaceIQ's learning scope. Try searching for academic topics, skills, languages, career preparation, or personal development.")
        setPracticeQuestions([])
      } else if (data.success && data.questions) {
        setPracticeScopeError('')
        setPracticeQuestions(data.questions)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setGeneratingPractice(false)
    }
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
                <Sparkles size={22} color="#8b5cf6" strokeWidth={2} />
                <span>AI Learning Center</span>
              </h1>
              <p className={styles.pageSubtitle}>
                Grounded Course Assistance, Personalized Study Schedules, and Weakness Diagnostics
              </p>
            </div>
          </div>

          <div className={styles.headerActions}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border)', padding: '5px 12px', borderRadius: 'var(--radius-md)' }}>
              <BookOpen size={15} color="var(--text-muted)" />
              <select
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', cursor: 'pointer', maxWidth: '240px' }}
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id.toString()} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        <main className={styles.main}>
          {/* Navigation Tabs Bar */}
          <nav className={styles.tabsBar}>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'assistant' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('assistant')}
            >
              <Bot size={16} />
              <span>AI Course Assistant</span>
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'planner' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('planner')}
            >
              <Calendar size={16} />
              <span>AI Study Planner</span>
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'insights' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('insights')}
            >
              <TrendingUp size={16} />
              <span>Weakness Analysis &amp; Diagnostics</span>
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'practice' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('practice')}
            >
              <Zap size={16} />
              <span>Self-Paced Practice Generator</span>
            </button>
          </nav>

          {/* Body Content */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '45vh', gap: '1.25rem' }}>
              <MorphingInfinity className="size-12" style={{ width: '48px', height: '48px', color: '#8b5cf6' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Connecting to AI Learning Center &amp; course knowledge chunks...
              </p>
            </div>
          ) : activeTab === 'assistant' ? (
            /* ================= TAB 1: AI ASSISTANT ================= */
            <div className={styles.chatContainer}>
              <div className={styles.chatHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className={styles.chatStatusBadge}>
                    <CheckCircle2 size={12} /> Grounded Knowledge Base
                  </span>
                  <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                    Context: <strong>{courses.find(c => c.id.toString() === selectedCourseId)?.title || 'Course'}</strong>
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Sources verified from syllabus, practicals &amp; reference manuals
                </span>
              </div>

              {/* Messages View */}
              <div className={styles.chatMessages}>
                {messages.map((m) => {
                  const isUser = m.sender === 'user'
                  return (
                    <div
                      key={m.id}
                      className={`${styles.messageBubble} ${isUser ? styles.userMessage : styles.assistantMessage}`}
                    >
                      {renderFormattedContent(m.content)}

                      {!isUser && m.sources && m.sources.length > 0 && (
                        <div className={styles.sourcesList}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Verified Course Sources:
                          </span>
                          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            {m.sources.map((src: any, sIdx: number) => (
                              <span key={sIdx} className={styles.sourceBadge}>
                                <BookOpen size={11} />
                                <span>{src.sourceName || src.title}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {asking && (
                  <div className={`${styles.messageBubble} ${styles.assistantMessage}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', width: 'fit-content' }}>
                    <MorphingInfinity style={{ width: '24px', height: '24px', color: '#8b5cf6' }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Searching course materials &amp; generating grounded explanation...
                    </span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts Chips */}
              <div className={styles.quickPrompts}>
                <button
                  type="button"
                  className={styles.promptChip}
                  onClick={() => handleAskAssistant('Summarize the core syllabus and practicals of this course.')}
                >
                  💡 Summarize Course Curriculum
                </button>
                <button
                  type="button"
                  className={styles.promptChip}
                  onClick={() => handleAskAssistant('Explain how Practical No. 1 triangle drawing works in OpenGL with code snippet.')}
                >
                  📐 Practical No. 1 OpenGL Walkthrough
                </button>
                <button
                  type="button"
                  className={styles.promptChip}
                  onClick={() => handleAskAssistant('Derive Bresenham line algorithm decision parameter step by step.')}
                >
                  📝 Bresenham Decision Parameter
                </button>
                <button
                  type="button"
                  className={styles.promptChip}
                  onClick={() => handleAskAssistant('Generate 3 practical lab viva questions with model answers.')}
                >
                  ✍️ Lab Viva Questions
                </button>
              </div>

              {/* Chat Input Bar */}
              <div className={styles.chatInputRow}>
                <input
                  type="text"
                  className={styles.chatInput}
                  placeholder="Ask any educational question about syllabus, algorithms, code, languages, or concepts..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAskAssistant()
                  }}
                  disabled={asking}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleAskAssistant()}
                  disabled={asking || !query.trim()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '10px 18px' }}
                >
                  <Send size={15} />
                  <span>Send</span>
                </button>
              </div>
            </div>
          ) : activeTab === 'planner' ? (
            /* ================= TAB 2: AI STUDY PLANNER ================= */
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {studyPlan?.title || 'Personalized Study Plan'}
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                    Targeting {studyPlan?.dailyHours || 1.5} hours/day based on incomplete practicals &amp; upcoming milestones.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowPlanModal(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <RefreshCw size={14} />
                  <span>Regenerate Study Schedule</span>
                </button>
              </div>

              {/* Days Selector */}
              <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', marginBottom: '1.5rem', paddingBottom: '0.5rem' }}>
                {(studyPlan?.schedule || []).map((day: any, idx: number) => {
                  const isSelected = selectedDayIndex === idx
                  const completedCount = (day.tasks || []).filter((t: any) => t.completed).length
                  const totalTasks = day.tasks?.length || 0
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedDayIndex(idx)}
                      style={{
                        background: isSelected ? 'rgba(139, 92, 246, 0.15)' : 'var(--bg-secondary)',
                        border: isSelected ? '1px solid #8b5cf6' : '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.75rem 1rem',
                        textAlign: 'left',
                        minWidth: '140px',
                        cursor: 'pointer',
                        color: isSelected ? '#c4b5fd' : 'var(--text-primary)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{day.dayName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {completedCount}/{totalTasks} Done
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Selected Day Task List */}
              {studyPlan?.schedule?.[selectedDayIndex] && (
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {studyPlan.schedule[selectedDayIndex].dayName} Focus: {studyPlan.schedule[selectedDayIndex].focusArea}
                      </h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Target: {studyPlan.schedule[selectedDayIndex].targetDurationMinutes} mins
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(studyPlan.schedule[selectedDayIndex].tasks || []).map((task: any) => (
                      <div key={task.id} className={`${styles.taskRow} ${task.completed ? styles.taskCompleted : ''}`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <input
                            type="checkbox"
                            checked={!!task.completed}
                            onChange={() => handleToggleTask(task.id, task.completed)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#8b5cf6' }}
                          />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{task.title}</div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {task.type} • {task.durationMinutes} mins
                            </span>
                          </div>
                        </div>

                        {task.actionUrl && (
                          <Link href={task.actionUrl} className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '11px', textDecoration: 'none' }}>
                            Start Task
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'insights' ? (
            /* ================= TAB 3: WEAKNESS ANALYSIS ================= */
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                  Continuous Weakness Diagnostics &amp; Recommendations
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                  Real-time analytics synthesized from practical submissions, quiz scores, and course milestones.
                </p>
              </div>

              <div className={styles.dashboardGrid}>
                {/* Strong Topics */}
                <div className={styles.widgetCard}>
                  <div className={styles.widgetHeader}>
                    <div className={styles.widgetTitle}>
                      <CheckCircle2 size={18} color="#34d399" />
                      <span>Strong Mastery Topics</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {(insights?.strongTopics || ['Computer Graphics Fundamentals', 'OpenGL Primitive Drawing']).map((t: string, idx: number) => (
                      <span key={idx} className={`${styles.topicBadge} ${styles.badgeStrong}`}>
                        <Check size={12} strokeWidth={3} /> {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Topics Needing Practice */}
                <div className={styles.widgetCard}>
                  <div className={styles.widgetHeader}>
                    <div className={styles.widgetTitle}>
                      <AlertTriangle size={18} color="#f87171" />
                      <span>Areas for Improvement</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(insights?.weakTopics || [
                      { topic: 'Bresenham Decision Parameter Derivations', status: 'Needs Practice', reason: 'Requires mathematical derivation practice for octant cases.', accuracy: 68 },
                      { topic: '2D Composite Matrix Multiplications', status: 'Developing', reason: 'Upcoming practical requires transformation order mastery.', accuracy: 74 }
                    ]).map((wt: any, idx: number) => (
                      <div key={idx} style={{ padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{wt.topic}</span>
                          <span className={`${styles.topicBadge} ${wt.status === 'Needs Practice' ? styles.badgeNeedsPractice : styles.badgeDeveloping}`}>
                            {wt.status} ({wt.accuracy}%)
                          </span>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>{wt.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommended Actions */}
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>
                Personalized Remedial Actions
              </h3>
              <div className={styles.recGrid}>
                {(insights?.recommendations || [
                  { id: 'r1', title: 'Review Bresenham Line Generation Tutorial', type: 'LESSON', reason: 'Strengthens slope derivations before lab practical submission.', actionUrl: '/student/courses', priority: 'HIGH' },
                  { id: 'r2', title: 'Take 2D Transformations Practice Quiz', type: 'PRACTICE_QUIZ', reason: 'Tests composite matrix multiplications and rotation logic.', actionUrl: '/student/quizzes', priority: 'MEDIUM' }
                ]).map((rec: any) => (
                  <div key={rec.id} className={styles.recCard}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span className="badge badge-purple" style={{ fontSize: '10px' }}>{rec.type}</span>
                        <span className={`badge ${rec.priority === 'HIGH' ? 'badge-orange' : 'badge-blue'}`} style={{ fontSize: '10px' }}>
                          {rec.priority} Priority
                        </span>
                      </div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{rec.title}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{rec.reason}</p>
                    </div>

                    <Link href={rec.actionUrl || '/student/courses'} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none' }}>
                      <span>Start Remedial Task</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ================= TAB 4: PRACTICE GENERATOR ================= */
            <div>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '2rem' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Generate Grounded Practice Exercises
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  Create self-paced technical assessment questions derived strictly from your course knowledge base.
                </p>

                <form onSubmit={handleGeneratePractice}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>Topic / Concept</label>
                      <input
                        type="text"
                        required
                        value={practiceTopic}
                        onChange={e => {
                          setPracticeTopic(e.target.value)
                          if (practiceScopeError) setPracticeScopeError('')
                        }}
                        placeholder="Enter educational topic (e.g. Recursion, Data Structures, English Grammar, Calculus)..."
                        className="form-input"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>Difficulty</label>
                      <select
                        value={practiceDifficulty}
                        onChange={e => setPracticeDifficulty(e.target.value as any)}
                        className="form-select"
                        style={{ width: '100%' }}
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>Questions Count</label>
                      <select
                        value={practiceCount}
                        onChange={e => setPracticeCount(e.target.value)}
                        className="form-select"
                        style={{ width: '100%' }}
                      >
                        <option value="3">3 Questions</option>
                        <option value="5">5 Questions</option>
                      </select>
                    </div>
                  </div>

                  {practiceScopeError && (
                    <div style={{ marginBottom: '1.25rem', padding: '12px 16px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.2rem' }}>🎓</span>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fca5a5' }}>
                          Learning Scope Notice
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {practiceScopeError}
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={generatingPractice}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px' }}
                  >
                    {generatingPractice ? (
                      <>
                        <MorphingInfinity style={{ width: '16px', height: '16px', color: '#ffffff' }} />
                        <span>Generating Questions...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={14} />
                        <span>Generate Practice Test</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Questions List */}
              {practiceQuestions.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {practiceQuestions.map((q: any, qIdx: number) => {
                    const isRevealed = !!revealedSolutions[qIdx]

                    return (
                      <div key={qIdx} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                            Question {qIdx + 1}: {q.question}
                          </span>
                          <span className="badge badge-purple" style={{ fontSize: '10px' }}>{q.type?.toUpperCase()}</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                          {q.options?.map((opt: any, oIdx: number) => (
                            <div
                              key={oIdx}
                              style={{
                                padding: '8px 12px',
                                background: isRevealed && opt.isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-primary)',
                                border: isRevealed && opt.isCorrect ? '1px solid #10b981' : '1px solid var(--border)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.85rem',
                                color: isRevealed && opt.isCorrect ? '#34d399' : 'var(--text-primary)'
                              }}
                            >
                              {opt.optionText} {isRevealed && opt.isCorrect && '✓ (Correct)'}
                            </div>
                          ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setRevealedSolutions(prev => ({ ...prev, [qIdx]: !prev[qIdx] }))}
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize: '12px' }}
                          >
                            {isRevealed ? 'Hide Explanation' : 'Reveal Solution & Explanation'}
                          </button>
                        </div>

                        {isRevealed && q.explanation && (
                          <div style={{ marginTop: '0.75rem', padding: '10px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: '#93c5fd' }}>
                            <strong>Pedagogical Explanation:</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Regenerate Plan Modal */}
      {showPlanModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowPlanModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Configure AI Study Schedule</h3>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowPlanModal(false)}>✕</button>
            </div>
            <form onSubmit={handleGeneratePlan}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Daily Study Commitment</label>
                <select
                  value={dailyHours}
                  onChange={e => setDailyHours(e.target.value)}
                  className="form-select"
                  style={{ width: '100%' }}
                >
                  <option value="1.0">1.0 Hour / day</option>
                  <option value="1.5">1.5 Hours / day (Recommended)</option>
                  <option value="2.0">2.0 Hours / day</option>
                  <option value="3.0">3.0 Hours / day</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Target Lab / Exam Date (Optional)</label>
                <input
                  type="date"
                  value={targetExamDate}
                  onChange={e => setTargetExamDate(e.target.value)}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowPlanModal(false)}>Cancel</button>
                <button type="submit" disabled={generatingPlan} className="btn btn-primary btn-sm">
                  {generatingPlan ? 'Synthesizing Plan...' : 'Generate Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
