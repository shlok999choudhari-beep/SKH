'use client'
import { useState, useEffect, useRef } from 'react'
import StudentSidebar from '@/components/StudentSidebar'
import styles from '../dashboard.module.css'
import Vapi from '@vapi-ai/web'

export default function BehavioralAnalysis() {
  const [isInterviewActive, setIsInterviewActive] = useState(false)
  const [transcript, setTranscript] = useState<any[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisReport, setAnalysisReport] = useState<any>(null)
  const [videoPermission, setVideoPermission] = useState(false)
  const [interviewDuration, setInterviewDuration] = useState(0)
  
  const vapiRef = useRef<any>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<any>(null)
  const videoSnapshotsRef = useRef<string[]>([])

  const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || ''
  const ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || ''

  useEffect(() => {
    vapiRef.current = new Vapi(VAPI_PUBLIC_KEY)

    vapiRef.current.on('call-start', () => {
      console.log('Interview started')
      setIsInterviewActive(true)
      startTimer()
    })

    vapiRef.current.on('call-end', () => {
      console.log('Interview ended')
      setIsInterviewActive(false)
      stopTimer()
      stopRecording()
    })

    vapiRef.current.on('message', (message: any) => {
      console.log('VAPI Message:', message)
      if (message.type === 'transcript') {
        console.log('Transcript received:', message.transcriptType, message.role, message.transcript)
        if (message.transcriptType === 'final') {
          setTranscript(prev => [...prev, {
            role: message.role,
            text: message.transcript,
            timestamp: new Date().toISOString()
          }])
        }
      }
    })

    vapiRef.current.on('speech-start', () => {
      console.log('User started speaking')
    })

    vapiRef.current.on('speech-end', () => {
      console.log('User stopped speaking')
    })

    vapiRef.current.on('error', (error: any) => {
      console.error('VAPI Error:', error)
    })

    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop()
      }
      stopRecording()
      stopTimer()
    }
  }, [])

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setInterviewDuration(prev => prev + 1)
    }, 1000)
  }

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startInterview = async () => {
    try {
      console.log('Requesting camera and microphone access...')
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 }, 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      
      console.log('Media stream obtained:', stream.getTracks())
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setVideoPermission(true)

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      })
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(1000)

      const snapshotInterval = setInterval(() => {
        captureSnapshot()
      }, 5000)

      console.log('Starting VAPI call with assistant:', ASSISTANT_ID)
      await vapiRef.current.start(ASSISTANT_ID)
      console.log('VAPI call started successfully')
      
      return () => clearInterval(snapshotInterval)
    } catch (error) {
      console.error('Error starting interview:', error)
      alert('Please allow camera and microphone access')
    }
  }

  const captureSnapshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0)
        const snapshot = canvas.toDataURL('image/jpeg', 0.7)
        videoSnapshotsRef.current.push(snapshot)
      }
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
  }

  const endInterview = async () => {
    if (vapiRef.current) {
      vapiRef.current.stop()
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    await generateAnalysis()
  }

  const generateAnalysis = async () => {
    setIsAnalyzing(true)
    
    try {
      const response = await fetch('/api/behavioral-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcript,
          duration: interviewDuration,
          videoSnapshots: videoSnapshotsRef.current.slice(0, 10)
        })
      })
      
      const data = await response.json()
      setAnalysisReport(data.analysis)
    } catch (error) {
      console.error('Error generating analysis:', error)
      alert('Failed to generate analysis')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const downloadPDF = async () => {
    try {
      const response = await fetch('/api/behavioral-analysis/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis: analysisReport })
      })
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `behavioral-analysis-${Date.now()}.pdf`
      a.click()
    } catch (error) {
      console.error('Error downloading PDF:', error)
    }
  }

  const downloadHTML = () => {
    const htmlContent = generateHTMLReport()
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `behavioral-analysis-${Date.now()}.html`
    a.click()
  }

  const generateHTMLReport = () => {
    if (!analysisReport) return ''
    
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Behavioral Analysis Report</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #f9fafb; }
    h1 { color: #10b981; }
    .score-card { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .metric { display: inline-block; margin: 10px 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #10b981; color: white; }
  </style>
</head>
<body>
  <h1>🎯 Behavioral Analysis Report</h1>
  <div class="score-card">
    <h2>Overall Score: ${analysisReport.overallScore}/100</h2>
    ${Object.entries(analysisReport.scores || {}).map(([key, value]: any) => `
      <div class="metric">
        <strong>${key}:</strong> ${value}/10
      </div>
    `).join('')}
  </div>
  
  <h2>📊 Detailed Analysis</h2>
  <p>${analysisReport.summary}</p>
  
  <h2>💪 Strengths</h2>
  <ul>
    ${(analysisReport.strengths || []).map((s: string) => `<li>${s}</li>`).join('')}
  </ul>
  
  <h2>🎯 Areas for Improvement</h2>
  <ul>
    ${(analysisReport.improvements || []).map((i: string) => `<li>${i}</li>`).join('')}
  </ul>
  
  <h2>📝 Recommendations</h2>
  <p>${analysisReport.recommendations}</p>
</body>
</html>
    `
  }

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>🎭 Behavioral Analysis</h1>
            <p className={styles.pageSubtitle}>AI-powered interview assessment with video analysis</p>
          </div>
        </header>

        <main className={styles.main}>
          {!analysisReport ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '20px' }}>
              <div className={`glass ${styles.panel}`} style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>
                  {isInterviewActive ? '🔴 Interview in Progress' : '📹 Video Preview'}
                </h3>
                
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: 'auto',
                    aspectRatio: '16/9',
                    maxHeight: '450px',
                    minHeight: '200px',
                    background: '#000',
                    borderRadius: '12px',
                    objectFit: 'cover',
                    transform: 'scaleX(-1)'
                  }}
                />

                {isInterviewActive && (
                  <div style={{ 
                    marginTop: '20px', 
                    padding: '16px', 
                    background: 'rgba(239,68,68,0.1)', 
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Interview Duration
                    </p>
                    <p style={{ fontSize: '32px', fontWeight: '700', color: '#ef4444' }}>
                      {formatTime(interviewDuration)}
                    </p>
                  </div>
                )}

                <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {!isInterviewActive ? (
                    <button onClick={startInterview} className="btn btn-primary btn-lg" style={{ minWidth: '200px' }}>
                      🎤 Start Interview
                    </button>
                  ) : (
                    <button onClick={endInterview} className="btn btn-secondary btn-lg" style={{ minWidth: '200px' }}>
                      ⏹️ End Interview
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className={`glass ${styles.panel}`} style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>📋 Instructions</h3>
                  <ul style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
                    <li>Click "Start Interview" to begin</li>
                    <li>Answer behavioral questions naturally</li>
                    <li>Maintain eye contact with camera</li>
                    <li>Use the STAR method</li>
                    <li>Interview duration: 15-20 minutes</li>
                    <li>Video and audio will be analyzed</li>
                  </ul>
                </div>

                <div className={`glass ${styles.panel}`} style={{ padding: '20px', flex: 1, maxHeight: '400px', overflow: 'auto' }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>💬 Live Transcript</h3>
                  {transcript.length === 0 ? (
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
                      Transcript will appear here
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {transcript.map((item, index) => (
                        <div 
                          key={index}
                          style={{
                            padding: '12px',
                            background: item.role === 'assistant' ? 'rgba(124,58,237,0.1)' : 'rgba(16,185,129,0.1)',
                            borderRadius: '8px',
                            borderLeft: `3px solid ${item.role === 'assistant' ? '#7c3aed' : '#10b981'}`
                          }}
                        >
                          <p style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                            {item.role === 'assistant' ? '🤖 Interviewer' : '👤 You'}
                          </p>
                          <p style={{ fontSize: '13px' }}>{item.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className={`glass ${styles.panel}`} style={{ padding: '24px 16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                  <h2 style={{ fontSize: '20px' }}>📊 Analysis Report</h2>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={downloadPDF} className="btn btn-primary btn-sm">
                      📄 Download PDF
                    </button>
                    <button onClick={downloadHTML} className="btn btn-secondary btn-sm">
                      🌐 Download HTML
                    </button>
                  </div>
                </div>

                <div style={{ 
                  padding: '24px 16px', 
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(124,58,237,0.2))',
                  borderRadius: '16px',
                  textAlign: 'center',
                  marginBottom: '24px'
                }}>
                  <p style={{ fontSize: '14px', marginBottom: '6px' }}>Overall Score</p>
                  <p style={{ fontSize: 'clamp(40px, 10vw, 64px)', fontWeight: '800' }}>
                    {analysisReport.overallScore}/100
                  </p>
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>📈 Score Breakdown</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    {Object.entries(analysisReport.scores || {}).map(([key, value]: any) => (
                      <div key={key} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                        <p style={{ fontSize: '12px', marginBottom: '8px' }}>
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p style={{ fontSize: '18px', fontWeight: '700' }}>{value}/10</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>📝 Summary</h3>
                  <p style={{ fontSize: '14px', lineHeight: '1.8' }}>{analysisReport.summary}</p>
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>💪 Strengths</h3>
                  {(analysisReport.strengths || []).map((s: string, i: number) => (
                    <div key={i} style={{ padding: '12px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px', marginBottom: '8px' }}>
                      ✅ {s}
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>🎯 Improvements</h3>
                  {(analysisReport.improvements || []).map((i: string, idx: number) => (
                    <div key={idx} style={{ padding: '12px', background: 'rgba(245,158,11,0.1)', borderRadius: '8px', marginBottom: '8px' }}>
                      💡 {i}
                    </div>
                  ))}
                </div>

                <div>
                  <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>🚀 Recommendations</h3>
                  <p style={{ fontSize: '14px', lineHeight: '1.8' }}>{analysisReport.recommendations}</p>
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <button 
                  onClick={() => {
                    setAnalysisReport(null)
                    setTranscript([])
                    setInterviewDuration(0)
                  }} 
                  className="btn btn-primary btn-lg"
                >
                  🔄 Start New Interview
                </button>
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>🤖</div>
                <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>Analyzing Your Interview...</h3>
                <p>AI is processing your responses and body language</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
