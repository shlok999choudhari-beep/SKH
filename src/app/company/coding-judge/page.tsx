'use client'
import { useState, useEffect, useRef } from 'react'
import CompanySidebar from '@/components/CompanySidebar'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import styles from '../dashboard.module.css'
import Editor from '@monaco-editor/react'
import io from 'socket.io-client'
import {
  Code2,
  Video,
  VideoOff,
  Square,
  CheckCircle2,
  Rocket,
  Copy,
  Terminal,
  Play,
  Share2,
  Users,
  Award
} from 'lucide-react'

export default function CompanyCodingJudge() {
  const [code, setCode] = useState('// Write your code here')
  const [language, setLanguage] = useState('cpp')
  const [output, setOutput] = useState('')
  const [input, setInput] = useState('')
  const [running, setRunning] = useState(false)
  const [roomId, setRoomId] = useState('')
  const [studentName, setStudentName] = useState('')
  const [connected, setConnected] = useState(false)
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [localVideoReady, setLocalVideoReady] = useState(false)
  const [remoteVideoReady, setRemoteVideoReady] = useState(false)
  const [cameraOn, setCameraOn] = useState(false)
  const [mobileTab, setMobileTab] = useState<'code' | 'video' | 'io'>('code')
  const [mounted, setMounted] = useState(false)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [copied, setCopied] = useState(false)
  
  const roomIdRef = useRef('')
  const socketRef = useRef<any>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const previewVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const pendingCandidatesRef = useRef<RTCIceCandidate[]>([])

  const handleCopyRoomId = () => {
    const idToCopy = roomId || roomIdRef.current
    if (!idToCopy) return
    navigator.clipboard.writeText(idToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const languageMap: any = {
    cpp: 'cpp',
    python: 'python',
    java: 'java'
  }

  const templates: any = {
    cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello World!" << endl;
    return 0;
}`,
    python: `def main():
    print("Hello World!")

if __name__ == "__main__":
    main()`,
    java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World!");
    }
}`
  }

  // Sync local camera stream to local video element and preview element
  useEffect(() => {
    if (localStreamRef.current) {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current
        localVideoRef.current.play().catch(e => console.log('Local video play error:', e))
      }
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = localStreamRef.current
        previewVideoRef.current.play().catch(e => console.log('Preview video play error:', e))
      }
    }
  }, [cameraOn, connected, mounted])

  // Sync remote camera stream to remote video element
  useEffect(() => {
    if (remoteStreamRef.current && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current
      remoteVideoRef.current.play().catch(err => {
        console.warn('Autoplay failed, falling back to muted:', err)
        if (remoteVideoRef.current) {
          remoteVideoRef.current.muted = true
          remoteVideoRef.current.play().catch(e => console.error('Muted play error:', e))
        }
      })
    }
  }, [remoteStream, connected, mounted])

  useEffect(() => {
    setMounted(true)
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
      }
    }
  }, [])

  const toggleCamera = async () => {
    if (cameraOn) {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null
        }
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = null
        }
      }
      setCameraOn(false)
      setLocalVideoReady(false)
    } else {
      await startCamera()
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 }, 
        audio: true 
      })
      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
        await localVideoRef.current.play().catch(e => console.log(e))
        setLocalVideoReady(true)
      }
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream
        await previewVideoRef.current.play().catch(e => console.log(e))
      }
      setCameraOn(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Please allow camera and microphone access')
    }
  }

  const initializeSocket = () => {
    if (socketRef.current) return
    
    let socketUrl: string | undefined = undefined
    if (typeof window !== 'undefined') {
      const isHttps = window.location.protocol === 'https:'
      const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL
      if (envUrl) {
        if (isHttps && envUrl.startsWith('http://')) {
          socketUrl = envUrl.replace(/^http:\/\//, 'https://')
        } else {
          socketUrl = envUrl
        }
      } else {
        if (!isHttps && window.location.hostname === 'localhost' && window.location.port === '3000') {
          socketUrl = 'http://localhost:3001'
        } else {
          socketUrl = window.location.origin
        }
      }
    }

    socketRef.current = io(socketUrl || undefined, {
      transports: ['websocket', 'polling'],
      secure: typeof window !== 'undefined' && window.location.protocol === 'https:'
    })
    
    socketRef.current.on('connect', () => {
      console.log('Connected to socket server')
    })

    socketRef.current.on('code-update', (data: any) => {
      setCode(data.code)
    })

    socketRef.current.on('language-change', (data: any) => {
      setLanguage(data.language)
    })

    socketRef.current.on('user-joined', ({ name }: any) => {
      console.log('✅ Student joined the room:', name)
      setStudentName(name || 'Student')
      alert(`${name || 'Student'} has joined the room!`)
      setTimeout(() => createOffer(), 1000)
    })

    socketRef.current.on('webrtc-offer', async ({ offer }: any) => {
      console.log('Received offer')
      await handleOffer(offer)
    })

    socketRef.current.on('webrtc-answer', async ({ answer }: any) => {
      console.log('📥 Received answer')
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer))
          if (pendingCandidatesRef.current.length > 0) {
            for (const candidate of pendingCandidatesRef.current) {
              await peerConnectionRef.current.addIceCandidate(candidate)
            }
            pendingCandidatesRef.current = []
          }
        } catch (error) {
          console.error('Error setting remote description:', error)
        }
      }
    })

    socketRef.current.on('webrtc-ice-candidate', async ({ candidate }: any) => {
      if (peerConnectionRef.current && candidate) {
        try {
          if (peerConnectionRef.current.remoteDescription) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
          } else {
            pendingCandidatesRef.current.push(new RTCIceCandidate(candidate))
          }
        } catch (error) {
          console.error('Error adding ICE candidate:', error)
        }
      }
    })
  }

  const createRoom = async () => {
    if (!cameraOn) {
      alert('Please start your camera first')
      return
    }
    
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase()
    setRoomId(newRoomId)
    roomIdRef.current = newRoomId
    
    initializeSocket()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    socketRef.current.emit('create-room', { roomId: newRoomId, role: 'company' })
    await initializeVideo(newRoomId)
    
    setConnected(true)
  }

  const initializeVideo = async (currentRoomId: string) => {
    try {
      if (!localStreamRef.current) {
        console.error('No local stream available')
        return
      }
      
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
      
      peerConnectionRef.current = new RTCPeerConnection(configuration)
      
      localStreamRef.current.getTracks().forEach(track => {
        peerConnectionRef.current?.addTrack(track, localStreamRef.current!)
      })
      
      peerConnectionRef.current.ontrack = (event) => {
        let stream = event.streams && event.streams[0] ? event.streams[0] : null
        if (!stream && event.track) {
          stream = new MediaStream([event.track])
        }
        
        if (stream) {
          remoteStreamRef.current = stream
          setRemoteStream(stream)
          setRemoteVideoReady(true)
          
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream
            remoteVideoRef.current.play().catch(err => {
              if (remoteVideoRef.current) {
                remoteVideoRef.current.muted = true
                remoteVideoRef.current.play().catch(e => console.error('Muted play failed:', e))
              }
            })
          }
        }
      }
      
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          const activeRoom = roomIdRef.current || currentRoomId || roomId
          socketRef.current.emit('webrtc-ice-candidate', {
            roomId: activeRoom,
            candidate: event.candidate
          })
        }
      }
    } catch (error) {
      console.error('Error initializing video:', error)
    }
  }

  const handleOffer = async (offer: any) => {
    if (!peerConnectionRef.current) return
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await peerConnectionRef.current.createAnswer()
      await peerConnectionRef.current.setLocalDescription(answer)
      if (socketRef.current) {
        socketRef.current.emit('webrtc-answer', {
          roomId: roomIdRef.current || roomId,
          answer
        })
      }
    } catch (err) {
      console.error('Error handling offer:', err)
    }
  }

  const createOffer = async () => {
    if (!peerConnectionRef.current) return
    try {
      const offer = await peerConnectionRef.current.createOffer()
      await peerConnectionRef.current.setLocalDescription(offer)
      const targetRoom = roomIdRef.current || roomId
      if (socketRef.current && targetRoom) {
        socketRef.current.emit('webrtc-offer', {
          offer,
          roomId: targetRoom
        })
      }
    } catch (err) {
      console.error('Error creating offer:', err)
    }
  }

  const handleCodeChange = (newCode: any) => {
    setCode(newCode)
    if (socketRef.current && roomIdRef.current) {
      socketRef.current.emit('code_change', {
        code: newCode,
        roomId: roomIdRef.current
      })
    }
  }

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang)
    setCode(templates[newLang])
    if (socketRef.current && roomIdRef.current) {
      socketRef.current.emit('language_change', {
        language: newLang,
        code: templates[newLang],
        roomId: roomIdRef.current
      })
    }
  }

  const runCode = async () => {
    setRunning(true)
    setOutput('Running code...')
    
    try {
      const res = await fetch('/api/code/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, input })
      })
      const data = await res.json()
      const result = data.output || data.error || 'Execution finished'
      setOutput(result)
      
      if (socketRef.current && roomIdRef.current) {
        socketRef.current.emit('code_output', {
          output: result,
          roomId: roomIdRef.current
        })
      }
    } catch (error) {
      const err = 'Failed to execute code'
      setOutput(err)
      if (socketRef.current && roomIdRef.current) {
        socketRef.current.emit('code_output', {
          output: err,
          roomId: roomIdRef.current
        })
      }
    } finally {
      setRunning(false)
    }
  }

  const endSession = () => {
    setShowScoreModal(true)
  }

  const submitScore = async () => {
    try {
      await fetch('/api/company/interviews/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: roomIdRef.current,
          score,
          feedback,
          studentName
        })
      })
      alert('Score submitted successfully!')
      window.location.href = '/company/dashboard'
    } catch (error) {
      console.error('Failed to submit score:', error)
      alert('Score submission failed')
    }
  }

  return (
    <div className={styles.layout}>
      <CompanySidebar />
      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Code2 size={24} strokeWidth={2} color="#10b981" />
              <h1 className={styles.pageTitle}>Coding Judge</h1>
            </div>
            <p className={styles.pageSubtitle}>Real-time collaborative coding interview</p>
          </div>
          {connected && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '30px',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.15)'
              }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Judge ID:
                </span>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#10b981', letterSpacing: '2px', fontFamily: 'monospace' }}>
                  {roomId}
                </span>
                <button
                  onClick={handleCopyRoomId}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '3px 10px', fontSize: '11px', height: '26px', display: 'inline-flex', alignItems: 'center', gap: '4px', borderRadius: '14px' }}
                  title="Copy Judge Room ID"
                >
                  {copied ? <CheckCircle2 size={12} color="#10b981" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <button onClick={endSession} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Square size={14} strokeWidth={2} fill="currentColor" />
                <span>End Session</span>
              </button>
            </div>
          )}
        </header>

        <main className={styles.main}>
          {!mounted ? <div style={{ padding: '60px', textAlign: 'center' }}>Loading...</div> : !connected ? (
            <div className={`glass ${styles.panel}`} style={{ textAlign: 'center', padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <Code2 size={56} strokeWidth={1.5} color="#10b981" />
              </div>
              <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>Start Coding Session</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Create a room and share the Room ID with the candidate
              </p>
              <div style={{ marginBottom: '20px' }}>
                <button onClick={toggleCamera} className={`btn ${cameraOn ? 'btn-secondary' : 'btn-primary'} btn-lg`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  {cameraOn ? (
                    <>
                      <VideoOff size={18} strokeWidth={2} />
                      <span>Stop Camera</span>
                    </>
                  ) : (
                    <>
                      <Video size={18} strokeWidth={2} />
                      <span>Start Camera</span>
                    </>
                  )}
                </button>
              </div>
              {cameraOn && (
                <div style={{ maxWidth: '320px', width: '100%', margin: '0 auto 20px', borderRadius: '12px', overflow: 'hidden', border: '2px solid rgba(16,185,129,0.4)', background: '#000' }}>
                  <video
                    ref={previewVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '180px', objectFit: 'cover', transform: 'scaleX(-1)' }}
                  />
                  <div style={{ fontSize: '12px', color: '#10b981', padding: '6px', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <CheckCircle2 size={12} strokeWidth={2} />
                    <span>Camera Live & Ready</span>
                  </div>
                </div>
              )}
              {cameraOn && (
                <button onClick={createRoom} className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <Rocket size={16} strokeWidth={2} />
                  <span>Create Room</span>
                </button>
              )}
              {roomId && (
                <div style={{ marginTop: '24px', padding: '20px', background: 'rgba(16,185,129,0.15)', borderRadius: '12px', border: '2px solid rgba(16,185,129,0.3)', maxWidth: '400px', width: '100%' }}>
                  <p style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Share this Room ID with the candidate:</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
                    <p style={{ fontSize: '32px', fontWeight: '800', color: '#10b981', letterSpacing: '4px', margin: 0 }}>{roomId}</p>
                    <button 
                      onClick={handleCopyRoomId}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      {copied ? <CheckCircle2 size={13} color="#10b981" /> : <Copy size={13} strokeWidth={2} />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.codingJudgeGrid}>
              {!studentName && (
                <div style={{
                  gridColumn: '1 / -1',
                  padding: '12px 18px',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 95, 70, 0.12) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                        Coding Judge Session is Live
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Share this Judge ID with the student so they can join the video and live coding room
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: '#10b981', letterSpacing: '3px', fontFamily: 'monospace', background: 'rgba(0,0,0,0.45)', padding: '4px 12px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.3)' }}>
                      {roomId}
                    </span>
                    <button
                      onClick={handleCopyRoomId}
                      className="btn btn-primary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      {copied ? <CheckCircle2 size={13} color="#ffffff" /> : <Copy size={13} />}
                      <span>{copied ? 'Copied ID' : 'Copy Judge ID'}</span>
                    </button>
                  </div>
                </div>
              )}

              <div className={styles.mobileTabNav} style={{ gridColumn: '1 / -1' }}>
                <button
                  onClick={() => setMobileTab('code')}
                  className={`${styles.mobileTabButton} ${mobileTab === 'code' ? styles.mobileTabButtonActive : ''}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
                >
                  <Code2 size={14} strokeWidth={2} />
                  <span>Code</span>
                </button>
                <button
                  onClick={() => setMobileTab('video')}
                  className={`${styles.mobileTabButton} ${mobileTab === 'video' ? styles.mobileTabButtonActive : ''}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
                >
                  <Video size={14} strokeWidth={2} />
                  <span>Candidate Video</span>
                </button>
                <button
                  onClick={() => setMobileTab('io')}
                  className={`${styles.mobileTabButton} ${mobileTab === 'io' ? styles.mobileTabButtonActive : ''}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
                >
                  <Terminal size={14} strokeWidth={2} />
                  <span>Output</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className={mobileTab === 'video' ? styles.hideOnMobileTab : ''}>
                {(mobileTab === 'code' || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
                  <div className={`glass ${styles.panel}`} style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <select
                        value={language}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        className="form-select"
                        style={{ width: '130px', minHeight: '38px' }}
                      >
                        <option value="cpp">C++</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                      </select>
                      <button onClick={runCode} disabled={running} className="btn btn-primary btn-sm" style={{ minHeight: '38px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {running ? (
                          <>
                            <MorphingInfinity className="size-4" style={{ width: '14px', height: '14px' }} />
                            <span>Running...</span>
                          </>
                        ) : (
                          <>
                            <Play size={14} strokeWidth={2} fill="currentColor" />
                            <span>Run Code</span>
                          </>
                        )}
                      </button>
                    </div>
                    
                    <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', height: '400px', width: '100%' }}>
                      <Editor
                        height="100%"
                        language={languageMap[language]}
                        value={code}
                        onChange={handleCodeChange}
                        theme="vs-dark"
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          lineNumbers: 'on',
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          tabSize: 4
                        }}
                      />
                    </div>
                  </div>
                )}

                {(mobileTab === 'io' || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
                  <div className={`glass ${styles.panel}`} style={{ padding: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                          <Terminal size={14} strokeWidth={2} color="#10b981" />
                          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Input (stdin)</label>
                        </div>
                        <textarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="Custom input..."
                          style={{ width: '100%', height: '100px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '12px', resize: 'none' }}
                        />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                          <Terminal size={14} strokeWidth={2} color="#10b981" />
                          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Output</label>
                        </div>
                        <pre style={{ height: '100px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '12px', overflowY: 'auto', margin: 0 }}>
                          {output || 'Output will appear here...'}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className={mobileTab === 'code' || mobileTab === 'io' ? styles.hideOnMobileTab : ''}>
                <div className={`glass ${styles.panel}`} style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Video size={16} strokeWidth={2} color="#10b981" />
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Candidate Video</h4>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                        Judge ID: <strong style={{ color: '#10b981', fontFamily: 'monospace' }}>{roomId}</strong>
                      </span>
                      {studentName ? (
                        <span className="badge badge-green" style={{ fontSize: '11px' }}>
                          {studentName} (Connected)
                        </span>
                      ) : (
                        <span className="badge badge-yellow" style={{ fontSize: '11px' }}>
                          Waiting for candidate...
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ width: '100%', height: '240px', background: '#000', borderRadius: '8px', overflow: 'hidden', position: 'relative', border: '1px solid var(--border)' }}>
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {!remoteVideoReady && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        Waiting for candidate video...
                      </div>
                    )}
                  </div>
                </div>

                <div className={`glass ${styles.panel}`} style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Video size={16} strokeWidth={2} color="#10b981" />
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Your Camera</h4>
                    </div>
                    <span className="badge badge-purple" style={{ fontSize: '11px' }}>Interviewer</span>
                  </div>
                  <div style={{ width: '100%', height: '180px', background: '#000', borderRadius: '8px', overflow: 'hidden', position: 'relative', border: '1px solid var(--border)' }}>
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                    />
                    {!localVideoReady && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        Camera is off
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {showScoreModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Submit Candidate Assessment
            </h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Score (out of 100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Feedback</label>
              <textarea
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Candidate's strengths, areas of improvement..."
                className="form-input"
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowScoreModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={submitScore} className="btn btn-primary">Submit Score</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
