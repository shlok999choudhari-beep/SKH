'use client'
import { useState, useRef, useEffect } from 'react'
import StudentSidebar from '@/components/StudentSidebar'
import BackButton from '@/components/BackButton'
import styles from './mentor.module.css'
import dashboardStyles from '../dashboard.module.css'
import {
  Bot,
  User,
  Send,
  Briefcase,
  BookOpen,
  Rocket,
  FileText,
  Target,
  Lightbulb
} from 'lucide-react'

type Message = {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const QUICK_PROMPTS = [
  { icon: <Briefcase size={18} strokeWidth={2} color="#8b5cf6" />, text: 'How do I prepare for a software engineer interview?', category: 'jobs' },
  { icon: <BookOpen size={18} strokeWidth={2} color="#3b82f6" />, text: 'What skills should I learn for web development?', category: 'learning' },
  { icon: <Rocket size={18} strokeWidth={2} color="#10b981" />, text: 'Give me project ideas for my portfolio', category: 'projects' },
  { icon: <FileText size={18} strokeWidth={2} color="#f59e0b" />, text: 'How can I improve my resume?', category: 'jobs' },
  { icon: <Target size={18} strokeWidth={2} color="#ef4444" />, text: 'Create a learning roadmap for data science', category: 'learning' },
  { icon: <Lightbulb size={18} strokeWidth={2} color="#eab308" />, text: 'What are trending tech stacks in 2024?', category: 'learning' },
]

export default function AIMentorChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your AI Career Mentor. I can help you with job preparation, learning paths, project ideas, and career guidance. What would you like to discuss today?",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim()
    if (!messageText || loading) return

    const userMessage: Message = {
      role: 'user',
      content: messageText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/mentor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, history: messages })
      })

      const data = await response.json()

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={dashboardStyles.layout}>
      <StudentSidebar />
      <div className={dashboardStyles.content}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <BackButton fallbackHref="/student/dashboard" />
              <div className={styles.headerContent}>
                <div className={styles.headerIcon} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={28} strokeWidth={2} color="#8b5cf6" />
                </div>
                <div>
                  <h1 className={styles.title}>AI Mentor Chat</h1>
                  <p className={styles.subtitle}>Your personal career & learning assistant</p>
                </div>
              </div>
            </div>
            <div className={styles.badge}>
              <span className="badge badge-gradient">AI Powered</span>
            </div>
          </div>

          <div className={styles.chatContainer}>
            <div className={styles.messagesArea}>
              {messages.map((msg, idx) => (
                <div key={idx} className={`${styles.message} ${styles[msg.role]}`}>
                  <div className={styles.messageAvatar} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {msg.role === 'user' ? <User size={16} strokeWidth={2} /> : <Bot size={16} strokeWidth={2} />}
                  </div>
                  <div className={styles.messageContent}>
                    <div className={styles.messageText}>{msg.content}</div>
                    <div className={styles.messageTime}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className={`${styles.message} ${styles.assistant}`}>
                  <div className={styles.messageAvatar} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bot size={16} strokeWidth={2} />
                  </div>
                  <div className={styles.messageContent}>
                    <div className={styles.typing}>
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {messages.length === 1 && (
              <div className={styles.quickPrompts}>
                <p className={styles.promptsTitle}>Quick Start:</p>
                <div className={styles.promptsGrid}>
                  {QUICK_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      className={styles.promptCard}
                      onClick={() => handleSend(prompt.text)}
                      disabled={loading}
                    >
                      <span className={styles.promptIcon} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{prompt.icon}</span>
                      <span className={styles.promptText}>{prompt.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.inputArea}>
              <div className={styles.inputWrapper}>
                <textarea
                  className={styles.input}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about jobs, learning paths, projects, or career advice..."
                  rows={1}
                  disabled={loading}
                />
                <button
                  className={styles.sendButton}
                  onClick={() => handleSend()}
                  disabled={!input.trim() || loading}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Send size={18} strokeWidth={2} />
                </button>
              </div>
              <p className={styles.disclaimer}>
                AI responses are suggestions. Always verify important information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

