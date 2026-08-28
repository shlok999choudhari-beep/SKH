'use client'
import { useState, useEffect, useRef } from 'react'
import StudentSidebar from '@/components/StudentSidebar'
import BackButton from '@/components/BackButton'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import styles from '../dashboard.module.css'
import Vapi from '@vapi-ai/web'
import {
  Mic,
  Download,
  ListOrdered,
  TriangleAlert,
  Play,
  Loader2,
  Volume2,
  Square,
  CheckCircle2,
  CircleX,
  RotateCcw,
  MessageSquare,
  Bot,
  User,
  BarChart2,
  FileQuestion,
  Target
} from 'lucide-react'

export default function MockInterviewPage() {
  const [vapi, setVapi] = useState<any>(null)
  const [isCallActive, setIsCallActive] = useState(false)
  const [transcript, setTranscript] = useState<any[]>([])
  const [callStatus, setCallStatus] = useState<string>('idle')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [interviewComplete, setInterviewComplete] = useState(false)
  const [summary, setSummary] = useState<any>(null)
  const [isSpeaking, setIsSpeaking] = useState<'assistant' | 'user' | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || ''
    const vapiInstance = new Vapi(publicKey)
    setVapi(vapiInstance)

    // Event listeners
    vapiInstance.on('call-start', () => {
      setIsCallActive(true)
      setCallStatus('connected')
      console.log('Call started')
    })

    vapiInstance.on('call-end', () => {
      setIsCallActive(false)
      setCallStatus('ended')
      setInterviewComplete(true)
      console.log('Call ended')
      // Delay to ensure transcript is fully updated
      setTimeout(() => {
        generateSummary()
      }, 1000)
    })

    vapiInstance.on('speech-start', () => {
      console.log('Assistant speaking')
      setIsSpeaking('assistant')
    })

    vapiInstance.on('speech-end', () => {
      console.log('Assistant finished speaking')
      setIsSpeaking(null)
    })

    vapiInstance.on('message', (message: any) => {
      console.log('Message:', message)
      
      // Only capture complete transcript messages
      if (message.type === 'transcript' && message.transcriptType === 'final') {
        setTranscript(prev => {
          // Avoid duplicates by checking if last message is the same
          const lastMsg = prev[prev.length - 1]
          if (lastMsg && lastMsg.text === message.transcript && lastMsg.role === message.role) {
            return prev
          }
          return [...prev, {
            role: message.role,
            text: message.transcript,
            timestamp: new Date().toLocaleTimeString()
          }]
        })
      }
      
      // Also capture partial transcripts for debugging
      if (message.type === 'transcript' && message.transcriptType === 'partial') {
        console.log('Partial transcript:', message.transcript)
      }
    })

    vapiInstance.on('error', (error: any) => {
      console.error('VAPI Error:', error)
      setCallStatus('error')
    })

    return () => {
      if (vapiInstance) {
        vapiInstance.stop()
      }
    }
  }, [])

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  const startInterview = async () => {
    if (!vapi) return

    try {
      setCallStatus('connecting')
      setTranscript([])
      setInterviewComplete(false)
      setSummary(null)

      // Start VAPI call directly - VAPI handles microphone permissions
      await vapi.start('3ce271a3-e317-4b85-9973-a8e4b047cad3')
    } catch (error: any) {
      console.error('Failed to start call:', error)
      setCallStatus('error')
      
      if (error.message && error.message.includes('permission')) {
        alert('Microphone access denied. Please allow microphone access in your browser settings and refresh the page.')
      } else {
        alert('Failed to start interview: ' + (error.message || 'Unknown error'))
      }
    }
  }

  const endInterview = () => {
    if (vapi && isCallActive) {
      vapi.stop()
    }
  }

  const generateSummary = () => {
    console.log('Generating summary from transcript:', transcript)
    
    const userMessages = transcript.filter(t => t.role === 'user')
    const assistantMessages = transcript.filter(t => t.role === 'assistant')

    // Extract company and role from conversation
    let extractedCompany = 'Not specified'
    let extractedRole = 'Not specified'
    
    // Find company mention
    const companyMsg = userMessages.find(msg => {
      const prevAssistant = assistantMessages.find(a => 
        transcript.indexOf(a) < transcript.indexOf(msg) &&
        a.text.toLowerCase().includes('company')
      )
      return prevAssistant !== undefined
    })
    if (companyMsg) {
      extractedCompany = companyMsg.text
    }
    
    // Find role mention
    const roleMsg = userMessages.find(msg => {
      const prevAssistant = assistantMessages.find(a => 
        transcript.indexOf(a) < transcript.indexOf(msg) &&
        (a.text.toLowerCase().includes('expertise') || a.text.toLowerCase().includes('role'))
      )
      return prevAssistant !== undefined
    })
    if (roleMsg) {
      extractedRole = roleMsg.text
    }

    // Extract questions and answers - improved logic
    const qaList: any[] = []
    
    for (let i = 0; i < assistantMessages.length; i++) {
      const msg = assistantMessages[i]
      // Check if this is a question
      if (msg.text.includes('?') && !msg.text.toLowerCase().includes('ready to begin')) {
        const msgIndex = transcript.indexOf(msg)
        // Find the next user message after this question
        const nextUserMsg = transcript.find((t, idx) => 
          idx > msgIndex && t.role === 'user'
        )
        
        if (nextUserMsg) {
          qaList.push({
            question: msg.text,
            answer: nextUserMsg.text
          })
        }
      }
    }

    console.log('Extracted Q&A:', qaList)

    // Extract feedback - improved detection
    const feedbackList = assistantMessages
      .filter(msg => {
        const lower = msg.text.toLowerCase()
        return (
          (lower.includes('good') || lower.includes('great') || lower.includes('excellent')) ||
          (lower.includes('improve') || lower.includes('better') || lower.includes('consider')) ||
          (lower.includes('strength') || lower.includes('weakness')) ||
          (lower.includes('well done') || lower.includes('nice'))
        ) && !msg.text.includes('?') // Exclude questions
      })
      .map(msg => msg.text)

    console.log('Extracted feedback:', feedbackList)

    // Extract final summary - look for summary keywords
    let finalSummary = ''
    const summaryMsg = assistantMessages.find(msg => {
      const lower = msg.text.toLowerCase()
      return lower.includes('summary') || 
             lower.includes('overall') || 
             lower.includes('performance') ||
             lower.includes('concludes')
    })
    
    if (summaryMsg) {
      finalSummary = summaryMsg.text
    } else {
      // Fallback: use last 3 assistant messages
      finalSummary = assistantMessages
        .slice(-3)
        .map(msg => msg.text)
        .join(' ')
    }

    console.log('Final summary:', finalSummary)

    const summaryData = {
      company: extractedCompany,
      role: extractedRole,
      totalQuestions: qaList.length,
      qaList,
      feedbackList,
      finalSummary,
      duration: transcript.length > 0 ? 'Completed' : 'N/A',
      date: new Date().toLocaleDateString(),
      fullTranscript: transcript
    }
    
    console.log('Complete summary data:', summaryData)
    setSummary(summaryData)
  }

  const downloadPDF = async () => {
    if (!summary) {
      alert('No summary data available. Please complete the interview first.')
      return
    }

    console.log('Generating PDF with summary:', summary)

    const { default: jsPDF } = await import('jspdf')
    const pdf = new jsPDF()
    let yPos = 20

    // Title
    pdf.setFontSize(20)
    pdf.setTextColor(124, 58, 237)
    pdf.text('Mock Interview Report', 105, yPos, { align: 'center' })
    yPos += 15

    // Interview Details
    pdf.setFontSize(12)
    pdf.setTextColor(0, 0, 0)
    pdf.text(`Date: ${summary.date}`, 20, yPos)
    yPos += 8
    pdf.text(`Company: ${summary.company}`, 20, yPos)
    yPos += 8
    pdf.text(`Role: ${summary.role}`, 20, yPos)
    yPos += 8
    pdf.text(`Total Questions: ${summary.totalQuestions}`, 20, yPos)
    yPos += 15

    // Questions & Answers
    if (summary.qaList && summary.qaList.length > 0) {
      pdf.setFontSize(14)
      pdf.setTextColor(124, 58, 237)
      pdf.text('Questions & Answers', 20, yPos)
      yPos += 10

      pdf.setFontSize(10)
      pdf.setTextColor(0, 0, 0)

      summary.qaList.forEach((qa: any, idx: number) => {
        if (yPos > 270) {
          pdf.addPage()
          yPos = 20
        }

        // Question
        pdf.setFont('helvetica', 'bold')
        const questionLines = pdf.splitTextToSize(`Q${idx + 1}: ${qa.question}`, 170)
        pdf.text(questionLines, 20, yPos)
        yPos += questionLines.length * 5 + 3

        // Answer
        pdf.setFont('helvetica', 'normal')
        const answerLines = pdf.splitTextToSize(`A: ${qa.answer}`, 170)
        pdf.text(answerLines, 20, yPos)
        yPos += answerLines.length * 5 + 8
      })
    } else {
      pdf.setFontSize(10)
      pdf.setTextColor(100, 100, 100)
      pdf.text('No Q&A data captured', 20, yPos)
      yPos += 10
    }

    // Feedback Section
    if (summary.feedbackList && summary.feedbackList.length > 0) {
      if (yPos > 250) {
        pdf.addPage()
        yPos = 20
      }

      pdf.setFontSize(14)
      pdf.setTextColor(124, 58, 237)
      pdf.text('Feedback & Improvements', 20, yPos)
      yPos += 10

      pdf.setFontSize(10)
      pdf.setTextColor(0, 0, 0)
      pdf.setFont('helvetica', 'normal')

      summary.feedbackList.forEach((feedback: string, idx: number) => {
        if (yPos > 270) {
          pdf.addPage()
          yPos = 20
        }
        const feedbackLines = pdf.splitTextToSize(`${idx + 1}. ${feedback}`, 170)
        pdf.text(feedbackLines, 20, yPos)
        yPos += feedbackLines.length * 5 + 5
      })
    }

    // Final Summary
    if (summary.finalSummary && summary.finalSummary.trim()) {
      if (yPos > 230) {
        pdf.addPage()
        yPos = 20
      }

      pdf.setFontSize(14)
      pdf.setTextColor(124, 58, 237)
      pdf.text('Overall Performance Summary', 20, yPos)
      yPos += 10

      pdf.setFontSize(10)
      pdf.setTextColor(0, 0, 0)
      pdf.setFont('helvetica', 'normal')
      const summaryLines = pdf.splitTextToSize(summary.finalSummary, 170)
      pdf.text(summaryLines, 20, yPos)
      yPos += summaryLines.length * 5 + 10
    }

    // Full Transcript Section
    if (summary.fullTranscript && summary.fullTranscript.length > 0) {
      if (yPos > 230) {
        pdf.addPage()
        yPos = 20
      }

      pdf.setFontSize(14)
      pdf.setTextColor(124, 58, 237)
      pdf.text('Complete Transcript', 20, yPos)
      yPos += 10

      pdf.setFontSize(9)
      pdf.setTextColor(0, 0, 0)

      summary.fullTranscript.forEach((msg: any) => {
        if (yPos > 270) {
          pdf.addPage()
          yPos = 20
        }

        pdf.setFont('helvetica', 'bold')
        pdf.text(`${msg.role === 'assistant' ? 'AI' : 'You'} [${msg.timestamp}]:`, 20, yPos)
        yPos += 5

        pdf.setFont('helvetica', 'normal')
        const msgLines = pdf.splitTextToSize(msg.text, 170)
        pdf.text(msgLines, 20, yPos)
        yPos += msgLines.length * 4 + 6
      })
    }

    // Footer
    const pageCount = pdf.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      pdf.setFontSize(8)
      pdf.setTextColor(150, 150, 150)
      pdf.text(`Generated by PLACEIQ - Page ${i} of ${pageCount}`, 105, 290, { align: 'center' })
    }

    pdf.save(`mock-interview-${summary.date.replace(/\//g, '-')}.pdf`)
    console.log('PDF generated successfully')
  }

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.content}>
        <header className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <BackButton fallbackHref="/student/dashboard" />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mic size={24} strokeWidth={2} color="#3b82f6" />
                <h1 className={styles.pageTitle}>AI Mock Interview</h1>
              </div>
              <p className={styles.pageSubtitle}>Practice with AI-powered voice interviewer</p>
            </div>
          </div>
          {interviewComplete && summary && (
            <button onClick={downloadPDF} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Download size={15} strokeWidth={2} />
              <span>Download Report</span>
            </button>
          )}
        </header>

        <main className={styles.main}>
          {/* Description */}
          <div className={`glass ${styles.panel}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <ListOrdered size={18} strokeWidth={2} color="#3b82f6" />
              <h3 className={styles.panelTitle}>How It Works</h3>
            </div>
            <div className={styles.listItems}>
              <div className={styles.listItem}>
                <span className={styles.listIcon} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(59,130,246,0.2)', color: '#3b82f6', fontSize: '12px', fontWeight: 'bold' }}>1</span>
                <span>Click &quot;Start Interview&quot; to begin your AI-powered mock interview</span>
              </div>
              <div className={styles.listItem}>
                <span className={styles.listIcon} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(59,130,246,0.2)', color: '#3b82f6', fontSize: '12px', fontWeight: 'bold' }}>2</span>
                <span>The AI will ask which company you&apos;re preparing for and your expertise area</span>
              </div>
              <div className={styles.listItem}>
                <span className={styles.listIcon} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(59,130,246,0.2)', color: '#3b82f6', fontSize: '12px', fontWeight: 'bold' }}>3</span>
                <span>Answer 5 tailored questions with real-time feedback after each response</span>
              </div>
              <div className={styles.listItem}>
                <span className={styles.listIcon} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(59,130,246,0.2)', color: '#3b82f6', fontSize: '12px', fontWeight: 'bold' }}>4</span>
                <span>Receive a comprehensive performance summary at the end</span>
              </div>
              <div className={styles.listItem}>
                <span className={styles.listIcon} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(59,130,246,0.2)', color: '#3b82f6', fontSize: '12px', fontWeight: 'bold' }}>5</span>
                <span>Download your interview report as PDF with all Q&amp;A and feedback</span>
              </div>
            </div>
          </div>

          {/* Interview Controls */}
          <div className={`glass ${styles.panel}`} style={{ textAlign: 'center', padding: '32px 16px' }}>
            {callStatus === 'idle' && (
              <>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(59,130,246,0.15)', color: '#3b82f6', marginBottom: '16px' }}>
                  <Mic size={40} strokeWidth={1.75} />
                </div>
                <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>Ready to Start?</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '12px', fontSize: '14px' }}>
                  Click Start and allow microphone access when prompted
                </p>
                <p style={{ color: '#f59e0b', fontSize: '13px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <TriangleAlert size={15} strokeWidth={2} />
                  <span>Make sure you&apos;re using HTTPS or localhost</span>
                </p>
                <button onClick={startInterview} className="btn btn-primary btn-lg" style={{ minWidth: '220px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Play size={18} strokeWidth={2} />
                  <span>Start Interview</span>
                </button>
              </>
            )}

            {callStatus === 'connecting' && (
              <>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(124,58,237,0.15)', color: '#7c3aed', marginBottom: '20px' }}>
                  <MorphingInfinity className="size-12" style={{ width: '48px', height: '48px', color: '#7c3aed' }} />
                </div>
                <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>Connecting...</h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Setting up your AI interviewer
                </p>
              </>
            )}

            {callStatus === 'connected' && isCallActive && (
              <>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', color: '#10b981', marginBottom: '20px', animation: 'pulse 2s infinite' }}>
                  <Mic size={40} strokeWidth={2} />
                </div>
                <h3 style={{ fontSize: '20px', marginBottom: '12px', color: '#10b981' }}>Interview in Progress</h3>
                {isSpeaking === 'assistant' && (
                  <p style={{ color: '#7c3aed', marginBottom: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px', animation: 'pulse 1s infinite' }}>
                    <Volume2 size={16} strokeWidth={2} />
                    <span>AI is speaking...</span>
                  </p>
                )}
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  Speak clearly and take your time to answer
                </p>
                <button onClick={endInterview} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <Square size={16} strokeWidth={2} />
                  <span>End Interview</span>
                </button>
              </>
            )}

            {callStatus === 'ended' && interviewComplete && (
              <>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', color: '#10b981', marginBottom: '20px' }}>
                  <CheckCircle2 size={44} strokeWidth={2} />
                </div>
                <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>Interview Complete!</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  Great job! Review your transcript and download your report below
                </p>
                <button onClick={startInterview} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <RotateCcw size={16} strokeWidth={2} />
                  <span>Start New Interview</span>
                </button>
              </>
            )}

            {callStatus === 'error' && (
              <>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239,68,68,0.15)', color: '#ef4444', marginBottom: '20px' }}>
                  <CircleX size={44} strokeWidth={2} />
                </div>
                <h3 style={{ fontSize: '20px', marginBottom: '12px', color: '#ef4444' }}>Connection Error</h3>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '24px', textAlign: 'left', maxWidth: '500px' }}>
                  <p style={{ marginBottom: '12px' }}>Possible solutions:</p>
                  <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                    <li>Allow microphone access in browser settings</li>
                    <li>Make sure you&apos;re using HTTPS or localhost</li>
                    <li>Check if another app is using your microphone</li>
                    <li>Try refreshing the page</li>
                    <li>Try a different browser (Chrome recommended)</li>
                  </ul>
                </div>
                <button onClick={() => { setCallStatus('idle'); window.location.reload() }} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <RotateCcw size={16} strokeWidth={2} />
                  <span>Refresh &amp; Try Again</span>
                </button>
              </>
            )}
          </div>

          {/* Live Transcript */}
          {transcript.length > 0 && (
            <div className={`glass ${styles.panel}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <MessageSquare size={18} strokeWidth={2} color="#3b82f6" />
                <h3 className={styles.panelTitle}>Live Transcript</h3>
              </div>
              <div style={{ 
                maxHeight: '400px', 
                overflowY: 'auto',
                padding: '16px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '8px'
              }}>
                {transcript.map((msg, idx) => (
                  <div key={idx} style={{ 
                    marginBottom: '16px',
                    padding: '12px 16px',
                    background: msg.role === 'assistant' ? 'rgba(124,58,237,0.1)' : 'rgba(16,185,129,0.1)',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${msg.role === 'assistant' ? '#7c3aed' : '#10b981'}`
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      marginBottom: '6px',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      fontWeight: '600',
                      alignItems: 'center'
                    }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        {msg.role === 'assistant' ? <Bot size={14} strokeWidth={2} color="#7c3aed" /> : <User size={14} strokeWidth={2} color="#10b981" />}
                        <span>{msg.role === 'assistant' ? 'AI Interviewer' : 'You'}</span>
                      </span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                      {msg.text}
                    </p>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            </div>
          )}

          {/* Summary Report */}
          {interviewComplete && summary && (
            <>
              <div className={`glass ${styles.panel}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <BarChart2 size={18} strokeWidth={2} color="#7c3aed" />
                  <h3 className={styles.panelTitle}>Interview Summary</h3>
                </div>
                <div className={styles.grid2}>
                  <div style={{ padding: '16px', background: 'rgba(124,58,237,0.1)', borderRadius: '8px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Company</p>
                    <p style={{ fontSize: '18px', fontWeight: '700' }}>{summary.company}</p>
                  </div>
                  <div style={{ padding: '16px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Role</p>
                    <p style={{ fontSize: '18px', fontWeight: '700' }}>{summary.role}</p>
                  </div>
                  <div style={{ padding: '16px', background: 'rgba(59,130,246,0.1)', borderRadius: '8px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Questions Asked</p>
                    <p style={{ fontSize: '18px', fontWeight: '700' }}>{summary.totalQuestions}</p>
                  </div>
                  <div style={{ padding: '16px', background: 'rgba(245,158,11,0.1)', borderRadius: '8px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Date</p>
                    <p style={{ fontSize: '18px', fontWeight: '700' }}>{summary.date}</p>
                  </div>
                </div>
              </div>

              <div className={`glass ${styles.panel}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <FileQuestion size={18} strokeWidth={2} color="#10b981" />
                  <h3 className={styles.panelTitle}>Questions &amp; Answers</h3>
                </div>
                {summary.qaList.map((qa: any, idx: number) => (
                  <div key={idx} style={{ 
                    marginBottom: '20px',
                    padding: '16px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)'
                  }}>
                    <p style={{ 
                      fontSize: '13px', 
                      fontWeight: '700', 
                      color: '#7c3aed',
                      marginBottom: '8px'
                    }}>
                      Question {idx + 1}:
                    </p>
                    <p style={{ fontSize: '14px', marginBottom: '12px', lineHeight: '1.6' }}>
                      {qa.question}
                    </p>
                    <p style={{ 
                      fontSize: '13px', 
                      fontWeight: '700', 
                      color: '#10b981',
                      marginBottom: '8px'
                    }}>
                      Your Answer:
                    </p>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                      {qa.answer}
                    </p>
                  </div>
                ))}
              </div>

              {summary.finalSummary && (
                <div className={`glass ${styles.panel}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Target size={18} strokeWidth={2} color="#f59e0b" />
                    <h3 className={styles.panelTitle}>Performance Summary</h3>
                  </div>
                  <p style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
                    {summary.finalSummary}
                  </p>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}
