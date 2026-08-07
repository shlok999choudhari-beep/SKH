'use client'
import { useState, useEffect, useRef } from 'react'
import StudentSidebar from '@/components/StudentSidebar'
import styles from '../dashboard.module.css'

export default function RoadmapPage() {
  const [analyses, setAnalyses] = useState<any[]>([])
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null)
  const [roadmap, setRoadmap] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [chatQuery, setChatQuery] = useState('')
  const [chatHistory, setChatHistory] = useState<any[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchAnalyses()
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  const fetchAnalyses = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/skill-gap/list')
      const data = await res.json()
      if (data.analyses) {
        setAnalyses(data.analyses.map((a: any) => ({
          ...a,
          analysis_data: JSON.parse(a.analysis_data)
        })))
      }
    } catch (error) {
      console.error('Failed to fetch analyses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnalysisSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value)
    const analysis = analyses.find(a => a.id === id)
    setSelectedAnalysis(analysis)
    setRoadmap(null)
    setChatHistory([])
    
    if (analysis) {
      await generateRoadmap(analysis.analysis_data)
    }
  }

  const generateRoadmap = async (analysisData: any, query?: string) => {
    setGenerating(true)
    try {
      const res = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis: analysisData, userQuery: query })
      })

      const data = await res.json()
      if (data.success) {
        setRoadmap(data.roadmap)
        if (query) {
          setChatHistory(prev => [...prev, 
            { type: 'user', message: query },
            { type: 'assistant', message: 'Roadmap updated based on your query!' }
          ])
        }
      }
    } catch (error) {
      console.error('Failed to generate roadmap:', error)
    } finally {
      setGenerating(false)
    }
  }

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatQuery.trim() || !selectedAnalysis) return

    const query = chatQuery
    setChatQuery('')
    setChatHistory(prev => [...prev, { type: 'user', message: query }])
    
    await generateRoadmap(selectedAnalysis.analysis_data, query)
  }

  const getYouTubeSearchUrl = (query: string) => {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
  }

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>🗺️ Learning Roadmap</h1>
            <p className={styles.pageSubtitle}>Personalized 4-6 week learning path</p>
          </div>
        </header>

        <main className={styles.main}>
          <div className={`glass ${styles.panel}`}>
            <h3 className={styles.panelTitle}>📋 Select Your Analysis</h3>
            {loading ? (
              <p style={{ color: 'var(--text-secondary)' }}>Loading analyses...</p>
            ) : analyses.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No skill gap analyses found. Please upload a resume and job description first.</p>
            ) : (
              <select 
                onChange={handleAnalysisSelect}
                className="form-select"
                style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              >
                <option value="">Choose a resume and job description pair...</option>
                {analyses.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.resume_name} → {a.job_desc_name} ({new Date(a.created_at).toLocaleDateString()})
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedAnalysis && (
            <>
              <div className={`glass ${styles.panel}`} style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(245,158,11,0.1))' }}>
                <h3 className={styles.panelTitle} style={{ color: '#ef4444', marginBottom: '16px' }}>🚨 Critical Skills to Learn First</h3>
                <div className={styles.skillTags}>
                  {roadmap?.critical_skills?.map((skill: string, i: number) => (
                    <span key={i} className={styles.skillTag} style={{ 
                      background: 'rgba(239,68,68,0.2)', 
                      borderColor: 'rgba(239,68,68,0.4)', 
                      color: '#ef4444',
                      fontSize: '14px',
                      padding: '10px 16px',
                      fontWeight: '700'
                    }}>
                      🔥 {skill}
                    </span>
                  ))}
                </div>
              </div>

              {generating && (
                <div className={`glass ${styles.panel}`} style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                  <p style={{ color: 'var(--text-secondary)' }}>Generating your personalized roadmap...</p>
                </div>
              )}

              {roadmap && !generating && (
                <>
                  <div className={`glass ${styles.panel}`}>
                    <h3 className={styles.panelTitle} style={{ marginBottom: '12px' }}>⏰ Daily Schedule</h3>
                    <p style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: '600', marginBottom: '8px' }}>
                      {roadmap.daily_schedule?.hours_per_day}
                    </p>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                      {roadmap.daily_schedule?.breakdown}
                    </p>
                  </div>

                  {roadmap.roadmap?.map((week: any, i: number) => (
                    <div key={i} className={`glass ${styles.panel}`}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ 
                          width: '48px', 
                          height: '48px', 
                          borderRadius: '12px', 
                          background: 'linear-gradient(135deg, #7c3aed, #10b981)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          fontWeight: '800',
                          color: 'white'
                        }}>
                          {week.week}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>{week.title}</h3>
                          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Focus: {week.focus}</p>
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Skills covered:</p>
                        <div className={styles.skillTags}>
                          {week.skills?.map((skill: string, j: number) => (
                            <span key={j} className={styles.skillTag} style={{ 
                              background: 'rgba(124,58,237,0.15)', 
                              borderColor: 'rgba(124,58,237,0.3)',
                              fontSize: '12px'
                            }}>
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>📝 Tasks:</h4>
                        {week.tasks?.map((task: any, j: number) => (
                          <div key={j} style={{ 
                            marginBottom: '16px', 
                            padding: '16px', 
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '8px',
                            border: '1px solid var(--border)'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <p style={{ fontSize: '14px', fontWeight: '600' }}>{task.task}</p>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>⏱️ {task.duration}</span>
                            </div>
                            {task.resources && task.resources.length > 0 && (
                              <div style={{ marginTop: '12px' }}>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Resources:</p>
                                {task.resources.map((resource: any, k: number) => (
                                  <a
                                    key={k}
                                    href={getYouTubeSearchUrl(resource.search_query)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      padding: '8px 12px',
                                      background: 'rgba(255,0,0,0.1)',
                                      border: '1px solid rgba(255,0,0,0.3)',
                                      borderRadius: '6px',
                                      color: '#ff0000',
                                      fontSize: '13px',
                                      fontWeight: '600',
                                      textDecoration: 'none',
                                      marginRight: '8px',
                                      marginBottom: '8px',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = 'rgba(255,0,0,0.2)'
                                      e.currentTarget.style.transform = 'translateY(-2px)'
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = 'rgba(255,0,0,0.1)'
                                      e.currentTarget.style.transform = 'translateY(0)'
                                    }}
                                  >
                                    ▶️ {resource.title}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div style={{ 
                        padding: '12px 16px', 
                        background: 'rgba(16,185,129,0.1)',
                        borderRadius: '8px',
                        borderLeft: '4px solid #10b981'
                      }}>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          <strong style={{ color: '#10b981' }}>🎯 Milestone:</strong> {week.milestone}
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className={`glass ${styles.panel}`}>
                    <h3 className={styles.panelTitle} style={{ marginBottom: '16px' }}>💡 Pro Tips</h3>
                    <div className={styles.listItems}>
                      {roadmap.tips?.map((tip: string, i: number) => (
                        <div key={i} className={styles.listItem} style={{ 
                          padding: '12px', 
                          background: 'rgba(124,58,237,0.05)', 
                          borderRadius: '8px',
                          border: '1px solid rgba(124,58,237,0.15)'
                        }}>
                          <span style={{ fontSize: '16px' }}>💡</span>
                          <span style={{ fontSize: '14px', lineHeight: '1.6' }}>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {roadmap && (
                <div className={`glass ${styles.panel}`}>
                  <h3 className={styles.panelTitle} style={{ marginBottom: '16px' }}>💬 Optimize Your Roadmap</h3>
                  
                  {chatHistory.length > 0 && (
                    <div style={{ 
                      maxHeight: '300px', 
                      overflowY: 'auto', 
                      marginBottom: '16px',
                      padding: '12px',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: '8px'
                    }}>
                      {chatHistory.map((msg, i) => (
                        <div key={i} style={{ 
                          marginBottom: '12px',
                          padding: '10px 14px',
                          background: msg.type === 'user' ? 'rgba(124,58,237,0.1)' : 'rgba(16,185,129,0.1)',
                          borderRadius: '8px',
                          borderLeft: `3px solid ${msg.type === 'user' ? '#7c3aed' : '#10b981'}`
                        }}>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '600' }}>
                            {msg.type === 'user' ? '👤 You' : '🤖 Assistant'}
                          </p>
                          <p style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{msg.message}</p>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                  )}

                  <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '12px' }}>
                    <input
                      type="text"
                      value={chatQuery}
                      onChange={(e) => setChatQuery(e.target.value)}
                      placeholder="E.g., Focus more on React, reduce time on CSS..."
                      disabled={generating}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '14px'
                      }}
                    />
                    <button
                      type="submit"
                      disabled={generating || !chatQuery.trim()}
                      className="btn btn-primary"
                      style={{ padding: '12px 24px' }}
                    >
                      {generating ? '⏳' : '🚀'} {generating ? 'Updating...' : 'Optimize'}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
