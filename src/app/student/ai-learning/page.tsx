'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import styles from './ai-learning.module.css'
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
  X
} from 'lucide-react'

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
  const [practiceTopic, setPracticeTopic] = useState('Server Components & State Hydration')
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

      // Seed greeting assistant message
      setMessages([
        {
          id: 'init-msg',
          sender: 'assistant',
          content: 'Hello! I am your AI Course Assistant. Ask me anything about your enrolled curriculum, code concepts, module summaries, or practice exercises. All my answers are grounded in your official course materials.',
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
            content: data.error || 'Sorry, I was unable to process your request.',
            sources: []
          }
        ])
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          content: 'Connection error while communicating with AI assistant.',
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

    // Optimistic UI update
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

  const handleGeneratePractice = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneratingPractice(true)
    setRevealedSolutions({})
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
      if (data.success && data.questions) {
        setPracticeQuestions(data.questions)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setGeneratingPractice(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <Sparkles size={24} color="#818cf8" />
            <h1 className={styles.title}>AI Learning Center</h1>
          </div>
          <p className={styles.subtitle}>
            Grounded Course Assistance, Personalized Study Schedules, and Continuous Weakness Diagnostics.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <BookOpen size={16} color="var(--text-muted)" />
          <select
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.5rem 0.875rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', outline: 'none' }}
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
          >
            {courses.map(c => (
              <option key={c.id} value={c.id.toString()}>{c.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsBar}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'assistant' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('assistant')}
        >
          <Bot size={16} />
          <span>AI Course Assistant</span>
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === 'planner' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('planner')}
        >
          <Calendar size={16} />
          <span>AI Study Planner</span>
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === 'insights' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          <TrendingUp size={16} />
          <span>Weakness Analysis & Recommendations</span>
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === 'practice' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('practice')}
        >
          <Zap size={16} />
          <span>Self-Paced Practice</span>
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem' }}>
          <MorphingInfinity size={48} />
        </div>
      ) : activeTab === 'assistant' ? (
        /* ================= TAB 1: AI ASSISTANT ================= */
        <div className={styles.chatContainer}>
          <div className={styles.chatHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Active Grounded Knowledge Base
              </span>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Sources automatically cited from verified syllabus & lesson notes
            </span>
          </div>

          <div className={styles.chatMessages}>
            {messages.map((m) => {
              const isUser = m.sender === 'user'
              return (
                <div
                  key={m.id}
                  className={`${styles.messageBubble} ${isUser ? styles.userMessage : styles.assistantMessage}`}
                >
                  <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>

                  {!isUser && m.sources && m.sources.length > 0 && (
                    <div className={styles.sourcesList}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Sources Used:
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
              <div className={`${styles.messageBubble} ${styles.assistantMessage}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RefreshCw size={14} className="spin" />
                <span>Searching course materials & synthesizing answer...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className={styles.quickPrompts}>
            <button className={styles.promptChip} onClick={() => handleAskAssistant('Summarize the core concepts of this course.')}>
              💡 Summarize Core Concepts
            </button>
            <button className={styles.promptChip} onClick={() => handleAskAssistant('What are the most important topics in this course?')}>
              📌 Important Topics
            </button>
            <button className={styles.promptChip} onClick={() => handleAskAssistant('Explain key implementation best practices with an example.')}>
              🛠 Best Practices Example
            </button>
            <button className={styles.promptChip} onClick={() => handleAskAssistant('Create 3 practical review questions on recent lessons.')}>
              ✍️ Practice Questions
            </button>
          </div>

          <div className={styles.chatInputRow}>
            <input
              type="text"
              className={styles.chatInput}
              placeholder="Ask any question about this course's curriculum, code examples, or notes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAskAssistant()
              }}
              disabled={asking}
            />
            <button
              className="btn btn-primary"
              onClick={() => handleAskAssistant()}
              disabled={asking || !query.trim()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
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
                Targeting {studyPlan?.dailyHours || 1.5} hours/day based on incomplete lessons & upcoming assignments.
              </p>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setShowPlanModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <RefreshCw size={14} />
              <span>Regenerate Study Schedule</span>
            </button>
          </div>

          {/* Days Selector */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', marginBottom: '1.5rem', paddingBottom: '0.5rem' }}>
            {(studyPlan?.schedule || []).map((day: any, idx: number) => {
              const isSelected = selectedDayIndex === idx
              const completedCount = (day.tasks || []).filter((t: any) => t.completed).length
              const totalTasks = day.tasks?.length || 0
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDayIndex(idx)}
                  style={{
                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-secondary)',
                    border: isSelected ? '1px solid #6366f1' : '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem',
                    textAlign: 'left',
                    minWidth: '140px',
                    cursor: 'pointer',
                    color: isSelected ? '#818cf8' : 'var(--text-primary)'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{day.dayName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {completedCount}/{totalTasks} Tasks Done
                  </div>
                </button>
              )
            })}
          </div>

          {/* Active Day Details */}
          {studyPlan?.schedule?.[selectedDayIndex] && (
            <div className={styles.widgetCard}>
              <div className={styles.widgetHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} color="#818cf8" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {studyPlan.schedule[selectedDayIndex].dayName} — Focus: {studyPlan.schedule[selectedDayIndex].focusArea}
                  </h3>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={13} /> {studyPlan.schedule[selectedDayIndex].targetDurationMinutes} min target
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {studyPlan.schedule[selectedDayIndex].tasks.map((task: any) => (
                  <div key={task.id} className={styles.taskRow}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleTask(task.id, task.completed)}
                        style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                      />
                      <div className={task.completed ? styles.taskCompleted : ''}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                          {task.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {task.type} • {task.durationMinutes} mins
                        </div>
                      </div>
                    </div>

                    <Link
                      href={task.actionUrl}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '3px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <span>Start Task</span>
                      <ArrowRight size={11} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regenerate Plan Modal */}
          {showPlanModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', maxWidth: '480px', width: '100%', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Customize AI Study Schedule
                  </h3>
                  <button onClick={() => setShowPlanModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleGeneratePlan}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                        Daily Study Time (Hours)
                      </label>
                      <select
                        style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }}
                        value={dailyHours}
                        onChange={(e) => setDailyHours(e.target.value)}
                      >
                        <option value="1.0">1.0 Hour / day</option>
                        <option value="1.5">1.5 Hours / day (Recommended)</option>
                        <option value="2.0">2.0 Hours / day</option>
                        <option value="3.0">3.0 Hours / day (Intensive)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                        Target Milestone / Exam Date (Optional)
                      </label>
                      <input
                        type="date"
                        style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }}
                        value={targetExamDate}
                        onChange={(e) => setTargetExamDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowPlanModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={generatingPlan}>
                      {generatingPlan ? 'Generating...' : 'Generate New Plan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'insights' ? (
        /* ================= TAB 3: WEAKNESS DIAGNOSTICS & RECOMMENDATIONS ================= */
        <div>
          <div className={styles.dashboardGrid}>
            {/* Strong Topics */}
            <div className={styles.widgetCard}>
              <div className={styles.widgetHeader}>
                <div className={styles.widgetTitle}>
                  <CheckCircle2 size={18} color="#34d399" />
                  <span>Strong & Mastered Topics</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {(insights?.strongTopics || []).map((t: string, idx: number) => (
                  <span key={idx} className={`${styles.topicBadge} ${styles.badgeStrong}`}>
                    ✓ {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Topics Needing Practice */}
            <div className={styles.widgetCard}>
              <div className={styles.widgetHeader}>
                <div className={styles.widgetTitle}>
                  <AlertTriangle size={18} color="#fbbf24" />
                  <span>Topics Needing Practice</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(insights?.weakTopics || []).map((item: any, idx: number) => {
                  const isNeedsPractice = item.status === 'Needs Practice'
                  return (
                    <div key={idx} style={{ padding: '0.75rem 1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <span className={`${styles.topicBadge} ${isNeedsPractice ? styles.badgeNeedsPractice : styles.badgeDeveloping}`}>
                          {item.topic}
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isNeedsPractice ? '#f87171' : '#fbbf24' }}>
                          {item.status} ({item.accuracy}%)
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                        {item.reason}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Recommended Next Actions */}
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={18} color="#818cf8" />
            <span>Recommended for You</span>
          </h3>

          <div className={styles.recGrid}>
            {(insights?.recommendations || []).map((rec: any, idx: number) => (
              <div key={idx} className={styles.recCard}>
                <div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8', padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                    {rec.type}
                  </span>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0.5rem 0 0.25rem' }}>
                    {rec.title}
                  </h4>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {rec.reason}
                  </p>
                </div>

                <Link
                  href={rec.actionUrl}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', width: '100%' }}
                >
                  <span>Start Learning</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ================= TAB 4: SELF-PACED PRACTICE GENERATOR ================= */
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div className={styles.widgetCard} style={{ marginBottom: '2rem' }}>
            <div className={styles.widgetHeader}>
              <div className={styles.widgetTitle}>
                <Zap size={18} color="#818cf8" />
                <span>Instant AI Self-Paced Practice Generator</span>
              </div>
            </div>

            <form onSubmit={handleGeneratePractice}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    Topic *
                  </label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }}
                    value={practiceTopic}
                    onChange={(e) => setPracticeTopic(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    Difficulty
                  </label>
                  <select
                    style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }}
                    value={practiceDifficulty}
                    onChange={(e: any) => setPracticeDifficulty(e.target.value)}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    Question Count
                  </label>
                  <select
                    style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }}
                    value={practiceCount}
                    onChange={(e) => setPracticeCount(e.target.value)}
                  >
                    <option value="3">3 Questions</option>
                    <option value="5">5 Questions</option>
                    <option value="10">10 Questions</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={generatingPractice}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Sparkles size={15} />
                  <span>{generatingPractice ? 'Generating Questions...' : 'Generate Practice Set'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Generated Practice Question List */}
          {practiceQuestions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {practiceQuestions.map((q: any, idx: number) => {
                const isRevealed = Boolean(revealedSolutions[idx])
                return (
                  <div key={idx} className={styles.widgetCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase' }}>
                        Question {idx + 1} ({q.type})
                      </span>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '3px 8px', fontSize: '11px' }}
                        onClick={() => setRevealedSolutions(prev => ({ ...prev, [idx]: !prev[idx] }))}
                      >
                        {isRevealed ? 'Hide Solution' : 'Reveal Solution'}
                      </button>
                    </div>

                    <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0.25rem 0' }}>
                      {q.question}
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {(q.options || []).map((opt: any, optIdx: number) => {
                        const showCorrect = isRevealed && opt.isCorrect
                        return (
                          <div
                            key={optIdx}
                            style={{
                              padding: '0.65rem 0.85rem',
                              borderRadius: 'var(--radius-md)',
                              background: showCorrect ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-primary)',
                              border: showCorrect ? '1px solid #10b981' : '1px solid var(--border)',
                              color: showCorrect ? '#34d399' : 'var(--text-primary)',
                              fontSize: '0.875rem'
                            }}
                          >
                            {opt.optionText}
                          </div>
                        )
                      })}
                    </div>

                    {isRevealed && q.explanation && (
                      <div style={{ padding: '0.75rem', background: 'rgba(99, 102, 241, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.2)', fontSize: '0.825rem', color: '#c4b5fd' }}>
                        <strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
