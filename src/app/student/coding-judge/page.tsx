'use client'
import { useState, useEffect, useRef } from 'react'
import StudentSidebar from '@/components/StudentSidebar'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import styles from '../dashboard.module.css'
import Editor from '@monaco-editor/react'
import io from 'socket.io-client'
import {
  Code2,
  Video,
  VideoOff,
  Search,
  LogIn,
  Clock,
  Terminal,
  Play,
  Loader2,
  CheckCircle2,
  Award,
  Target
} from 'lucide-react'

export default function StudentCodingJudge() {
  const [code, setCode] = useState('// Write your code here')
  const [language, setLanguage] = useState('cpp')
  const [output, setOutput] = useState('')
  const [input, setInput] = useState('')
  const [running, setRunning] = useState(false)
  const [roomId, setRoomId] = useState('')
  const [searchRoomId, setSearchRoomId] = useState('')
  const [candidateName, setCandidateName] = useState('')
  const [connected, setConnected] = useState(false)
  const [sessions, setSessions] = useState<any[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [availableRooms, setAvailableRooms] = useState<any[]>([])
  const [loadingRooms, setLoadingRooms] = useState(false)
  const [localVideoReady, setLocalVideoReady] = useState(false)
  const [remoteVideoReady, setRemoteVideoReady] = useState(false)
  const [cameraOn, setCameraOn] = useState(false)
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [receivedScore, setReceivedScore] = useState<any>(null)
  const [mobileTab, setMobileTab] = useState<'code' | 'video' | 'io'>('code')
  const [mounted, setMounted] = useState(false)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  
  const roomIdRef = useRef('')
  const socketRef = useRef<any>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const previewVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const pendingCandidatesRef = useRef<RTCIceCandidate[]>([])

  const languageMap: any = {
    cpp: 'cpp',
    python: 'python',
    java: 'java'
  }

  // Sync local camera stream to local video and preview element
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
        console.warn('Autoplay failed, trying muted:', err)
        if (remoteVideoRef.current) {
          remoteVideoRef.current.muted = true
          remoteVideoRef.current.play().catch(e => console.error('Muted play error:', e))
        }
      })
    }
  }, [remoteStream, connected, mounted])

  useEffect(() => {
    setMounted(true)
    fetchSessions()
    
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

  const initializeSocket = () => {
    if (socketRef.current) return // Already initialized
    
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
        // If no explicit env URL is set:
        // In local HTTP dev (port 3000), default to port 3001
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

    socketRef.current.on('webrtc-offer', async ({ offer }: any) => {
      console.log('📥 Received offer')
      await handleOffer(offer)
    })

    socketRef.current.on('webrtc-answer', async ({ answer }: any) => {
      console.log('Received answer')
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer))
      }
    })

    socketRef.current.on('webrtc-ice-candidate', async ({ candidate }: any) => {
      console.log('Received ICE candidate')
      if (peerConnectionRef.current && candidate) {
        try {
          if (peerConnectionRef.current.remoteDescription) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
            console.log('ICE candidate added')
          } else {
            console.log('Queuing ICE candidate')
            pendingCandidatesRef.current.push(new RTCIceCandidate(candidate))
          }
        } catch (error) {
          console.error('Error adding ICE candidate:', error)
        }
      }
    })

    socketRef.current.on('active-rooms', ({ rooms }: any) => {
      console.log('Received active rooms:', rooms)
      setAvailableRooms(rooms)
      setLoadingRooms(false)
    })

    socketRef.current.on('rooms-updated', () => {
      if (showSearch && !connected) {
        socketRef.current.emit('get-active-rooms')
      }
    })

    socketRef.current.on('session-score', ({ score, feedback }: any) => {
      console.log('Received score:', score, feedback)
      setReceivedScore({ score, feedback })
      setShowScoreModal(true)
      
      // Disconnect after receiving score
      setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.disconnect()
        }
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => track.stop())
        }
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close()
        }
      }, 5000)
    })
  }

  const toggleCamera = async () => {
    if (cameraOn) {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null
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
        await localVideoRef.current.play()
        localVideoRef.current.onloadedmetadata = () => {
          setLocalVideoReady(true)
        }
      }
      setCameraOn(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Please allow camera and microphone access')
    }
  }

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/coding-session')
      const data = await res.json()
      setSessions(data.sessions || [])
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    }
  }

  const searchAndJoinRoom = async () => {
    if (!searchRoomId.trim()) {
      alert('Please enter a Room ID')
      return
    }
    if (!candidateName.trim()) {
      alert('Please enter your name')
      return
    }
    if (!cameraOn) {
      alert('Please start your camera first')
      return
    }
    
    console.log('Joining room:', searchRoomId, 'as', candidateName)
    setRoomId(searchRoomId)
    roomIdRef.current = searchRoomId
    
    initializeSocket()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    console.log('Initializing peer connection BEFORE joining...')
    await initializeVideo(searchRoomId)
    
    console.log('Joining room via socket...')
    socketRef.current.emit('join-room', { roomId: searchRoomId, role: 'student', name: candidateName })
    
    setConnected(true)
    setShowSearch(false)
  }

  const loadAvailableRooms = () => {
    setLoadingRooms(true)
    setShowSearch(true)
    initializeSocket()
    setTimeout(() => {
      if (socketRef.current) {
        console.log('Requesting active rooms...')
        socketRef.current.emit('get-active-rooms')
      }
    }, 1000)
  }

  const joinRoomFromList = async (roomIdToJoin: string) => {
    if (!candidateName.trim()) {
      alert('Please enter your name first')
      return
    }
    if (!cameraOn) {
      alert('Please start your camera first')
      return
    }
    
    console.log('Joining room:', roomIdToJoin, 'as', candidateName)
    setRoomId(roomIdToJoin)
    roomIdRef.current = roomIdToJoin
    
    console.log('Initializing peer connection BEFORE joining...')
    await initializeVideo(roomIdToJoin)
    
    console.log('Joining room via socket...')
    socketRef.current.emit('join-room', { roomId: roomIdToJoin, role: 'student', name: candidateName })
    
    setConnected(true)
    setShowSearch(false)
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
      
      console.log('🎬 Adding local tracks to peer connection...')
      localStreamRef.current.getTracks().forEach(track => {
        console.log('➕ Adding track:', track.kind, 'enabled:', track.enabled, 'readyState:', track.readyState)
        const sender = peerConnectionRef.current?.addTrack(track, localStreamRef.current!)
        console.log('✅ Track added, sender:', sender?.track?.kind)
      })
      
      console.log('📊 Total senders:', peerConnectionRef.current.getSenders().length)
      peerConnectionRef.current.getSenders().forEach((sender, i) => {
        console.log(`Sender ${i}:`, sender.track?.kind, sender.track?.enabled)
      })
      
      // Handle remote stream
      peerConnectionRef.current.ontrack = (event) => {
        console.log('🎥🎥🎥 ontrack event fired!', event)
        let stream = event.streams && event.streams[0] ? event.streams[0] : null
        if (!stream && event.track) {
          stream = new MediaStream([event.track])
        }
        
        if (stream) {
          console.log('✅ Stream received, tracks:', stream.getTracks().length)
          remoteStreamRef.current = stream
          setRemoteStream(stream)
          setRemoteVideoReady(true)
          
          if (remoteVideoRef.current) {
            console.log('Setting srcObject on remote video')
            remoteVideoRef.current.srcObject = stream
            remoteVideoRef.current.play().then(() => {
              console.log('✅ Remote video playing!')
            }).catch(err => {
              console.warn('Remote video unmuted play error, trying muted:', err)
              if (remoteVideoRef.current) {
                remoteVideoRef.current.muted = true
                remoteVideoRef.current.play().catch(e => console.error('Muted play failed:', e))
              }
            })
          }
        }
      }
      
      peerConnectionRef.current.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnectionRef.current?.connectionState)
      }
      
      peerConnectionRef.current.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', peerConnectionRef.current?.iceConnectionState)
      }
      
      // Handle ICE candidates
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          const activeRoom = roomIdRef.current || currentRoomId || roomId
          console.log('Sending ICE candidate to room:', activeRoom)
          socketRef.current.emit('webrtc-ice-candidate', {
            roomId: activeRoom,
            candidate: event.candidate
          })
        }
      }
      
      console.log('Video initialized for room:', currentRoomId)
      console.log('✅ Peer connection setup complete')
    } catch (error) {
      console.error('Error initializing video:', error)
    }
  }

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) {
      console.error('Peer connection not initialized')
      return
    }
    
    try {
      console.log('📥 Received offer')
      console.log('Peer connection state:', peerConnectionRef.current.connectionState)
      console.log('Signaling state:', peerConnectionRef.current.signalingState)
      
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer))
      console.log('✅ Remote description set')
      
      if (pendingCandidatesRef.current.length > 0) {
        console.log('🧩 Adding', pendingCandidatesRef.current.length, 'pending ICE candidates')
        for (const candidate of pendingCandidatesRef.current) {
          await peerConnectionRef.current.addIceCandidate(candidate)
        }
        pendingCandidatesRef.current = []
      }
      
      console.log('📤 Creating answer...')
      const answer = await peerConnectionRef.current.createAnswer()
      await peerConnectionRef.current.setLocalDescription(answer)
      
      const activeRoom = roomIdRef.current || roomId
      console.log('📤 Sending answer to room:', activeRoom)
      socketRef.current.emit('webrtc-answer', {
        roomId: activeRoom,
        answer
      })
    } catch (error) {
      console.error('Error handling offer:', error)
    }
  }

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value)
      if (connected && socketRef.current) {
        socketRef.current.emit('code-change', { roomId, code: value })
      }
    }
  }

  const runCode = async () => {
    setRunning(true)
    setOutput('Running...')
    
    try {
      const res = await fetch('/api/code-execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, input })
      })
      
      const data = await res.json()
      setOutput(data.error || data.output || 'No output')
    } catch (error) {
      setOutput('Error executing code')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Code2 size={24} strokeWidth={2} color="#10b981" />
              <h1 className={styles.pageTitle}>Coding Judge</h1>
            </div>
            <p className={styles.pageSubtitle}>Join coding interview sessions</p>
          </div>
        </header>

        <main className={styles.main}>
          {!mounted ? <div style={{ padding: '60px', textAlign: 'center' }}>Loading...</div> : !connected ? (
            <>
              <div className={`glass ${styles.panel}`} style={{ textAlign: 'center', padding: '60px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', color: '#10b981', marginBottom: '20px' }}>
                  <Target size={40} strokeWidth={1.75} />
                </div>
                <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>Join Coding Session</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  Search for the Room ID provided by the interviewer
                </p>
                
                {!showSearch ? (
                  <>
                    <input
                      type="text"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      placeholder="Enter Your Name"
                      className="form-input"
                      style={{ maxWidth: '400px', margin: '0 auto 20px', fontSize: '16px' }}
                    />
                    <div style={{ marginBottom: '20px' }}>
                      <button onClick={toggleCamera} className={`btn ${cameraOn ? 'btn-secondary' : 'btn-primary'} btn-lg`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        {cameraOn ? <VideoOff size={18} strokeWidth={2} /> : <Video size={18} strokeWidth={2} />}
                        <span>{cameraOn ? 'Stop Camera' : 'Start Camera'}</span>
                      </button>
                    </div>
                    {cameraOn && (
                      <div style={{ maxWidth: '320px', margin: '0 auto 20px', borderRadius: '12px', overflow: 'hidden', border: '2px solid rgba(16,185,129,0.4)', background: '#000' }}>
                        <video
                          ref={previewVideoRef}
                          autoPlay
                          playsInline
                          muted
                          style={{ width: '100%', height: '180px', objectFit: 'cover', transform: 'scaleX(-1)' }}
                        />
                        <p style={{ fontSize: '12px', color: '#10b981', padding: '6px', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <CheckCircle2 size={13} strokeWidth={2} />
                          <span>Camera Live &amp; Ready</span>
                        </p>
                      </div>
                    )}
                    {cameraOn && (
                      <button 
                        onClick={loadAvailableRooms} 
                        className="btn btn-primary btn-lg" 
                        disabled={loadingRooms || !candidateName.trim()}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                      >
                        {loadingRooms ? <MorphingInfinity className="size-4" style={{ width: '18px', height: '18px' }} /> : <Search size={18} strokeWidth={2} />}
                        <span>{loadingRooms ? 'Loading...' : 'Search Available Rooms'}</span>
                      </button>
                    )}
                  </>
                ) : (
                  <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    {loadingRooms ? (
                      <p style={{ color: 'var(--text-secondary)' }}>Loading rooms...</p>
                    ) : availableRooms.length > 0 ? (
                      <>
                        <h4 style={{ fontSize: '16px', marginBottom: '16px' }}>Available Rooms:</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                          {availableRooms.map((room: any) => (
                            <div key={room.roomId} style={{
                              padding: '16px',
                              background: 'rgba(16,185,129,0.1)',
                              border: '1px solid rgba(16,185,129,0.3)',
                              borderRadius: '8px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <div>
                                <p style={{ fontSize: '20px', fontWeight: '700', color: '#10b981', letterSpacing: '2px' }}>
                                  {room.roomId}
                                </p>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                  Created {new Date(room.info?.createdAt).toLocaleTimeString()}
                                </p>
                              </div>
                              <button onClick={() => joinRoomFromList(room.roomId)} className="btn btn-primary btn-sm">
                                Join
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>No active rooms found</p>
                    )}
                    
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
                      <p style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-secondary)' }}>Enter your details:</p>
                      <input
                        type="text"
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                        placeholder="Your Name"
                        className="form-input"
                        style={{ marginBottom: '12px' }}
                      />
                      <input
                        type="text"
                        value={searchRoomId}
                        onChange={(e) => setSearchRoomId(e.target.value)}
                        placeholder="Enter Room ID"
                        className="form-input"
                        style={{ textAlign: 'center', fontSize: '18px', marginBottom: '12px' }}
                      />
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <button onClick={searchAndJoinRoom} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <LogIn size={16} strokeWidth={2} />
                          <span>Join Room</span>
                        </button>
                        <button onClick={() => { setShowSearch(false); setSearchRoomId(''); setAvailableRooms([]); setCandidateName('') }} className="btn btn-secondary">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Past Sessions */}
              {sessions.length > 0 && (
                <div className={`glass ${styles.panel}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Clock size={18} strokeWidth={2} color="#10b981" />
                    <h3 className={styles.panelTitle}>Past Sessions</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {sessions.map((session: any) => (
                      <div key={session.id} style={{
                        padding: '16px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '8px',
                        border: '1px solid var(--border)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: '600' }}>{session.company_name}</p>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {new Date(session.started_at).toLocaleDateString()}
                            </p>
                          </div>
                          {session.score !== null && (
                            <div style={{
                              padding: '8px 16px',
                              background: session.score >= 70 ? 'rgba(16,185,129,0.2)' : session.score >= 40 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
                              borderRadius: '20px',
                              fontSize: '18px',
                              fontWeight: '700',
                              color: session.score >= 70 ? '#10b981' : session.score >= 40 ? '#f59e0b' : '#ef4444'
                            }}>
                              {session.score}/100
                            </div>
                          )}
                        </div>
                        {session.feedback && (
                          <div style={{
                            padding: '12px',
                            background: 'rgba(124,58,237,0.1)',
                            borderRadius: '6px',
                            marginTop: '8px'
                          }}>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Feedback:</p>
                            <p style={{ fontSize: '13px', lineHeight: '1.6' }}>{session.feedback}</p>
                          </div>
                        )}
                        <div style={{ marginTop: '8px', display: 'flex', gap: '8px', fontSize: '12px' }}>
                          <span className={styles.skillTag} style={{ background: 'rgba(59,130,246,0.15)', borderColor: 'rgba(59,130,246,0.3)' }}>
                            {session.language?.toUpperCase()}
                          </span>
                          <span className={styles.skillTag} style={{ background: 'rgba(124,58,237,0.15)', borderColor: 'rgba(124,58,237,0.3)' }}>
                            {session.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className={styles.codingJudgeGrid}>
              {/* Mobile Tab Switcher */}
              <div className={styles.mobileTabNav} style={{ gridColumn: '1 / -1' }}>
                <button
                  onClick={() => setMobileTab('code')}
                  className={`${styles.mobileTabButton} ${mobileTab === 'code' ? styles.mobileTabButtonActive : ''}`}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Code2 size={15} strokeWidth={2} />
                  <span>Code</span>
                </button>
                <button
                  onClick={() => setMobileTab('video')}
                  className={`${styles.mobileTabButton} ${mobileTab === 'video' ? styles.mobileTabButtonActive : ''}`}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Video size={15} strokeWidth={2} />
                  <span>Video Call</span>
                </button>
                <button
                  onClick={() => setMobileTab('io')}
                  className={`${styles.mobileTabButton} ${mobileTab === 'io' ? styles.mobileTabButtonActive : ''}`}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Terminal size={15} strokeWidth={2} />
                  <span>Output</span>
                </button>
              </div>

              {/* Left: Code Editor */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className={mobileTab === 'video' ? styles.hideOnMobileTab : ''}>
                {(mobileTab === 'code' || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
                  <div className={`glass ${styles.panel}`} style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <select
                        value={language}
                        className="form-select"
                        style={{ width: '130px', minHeight: '38px' }}
                        disabled
                      >
                        <option value="cpp">C++</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                      </select>
                      <button onClick={runCode} disabled={running} className="btn btn-primary btn-sm" style={{ minHeight: '38px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {running ? <MorphingInfinity className="size-4" style={{ width: '14px', height: '14px' }} /> : <Play size={14} strokeWidth={2} />}
                        <span>{running ? 'Running...' : 'Run Code'}</span>
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
                          automaticLayout: true
                        }}
                      />
                    </div>
                  </div>
                )}

                {(mobileTab === 'io' || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
                  <>
                    <div className={`glass ${styles.panel}`} style={{ padding: '16px' }}>
                      <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Input:</h4>
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Enter input here..."
                        style={{
                          width: '100%',
                          height: '80px',
                          padding: '8px',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          color: 'var(--text-primary)',
                          fontSize: '13px',
                          fontFamily: 'monospace',
                          resize: 'vertical'
                        }}
                      />
                    </div>

                    <div className={`glass ${styles.panel}`} style={{ padding: '16px', flex: 1 }}>
                      <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Output:</h4>
                      <pre style={{
                        padding: '12px',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        color: '#10b981',
                        overflow: 'auto',
                        maxHeight: '200px'
                      }}>
                        {output || 'No output yet'}
                      </pre>
                    </div>
                  </>
                )}
              </div>

              {/* Right: Video Call */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className={mobileTab !== 'video' ? styles.hideOnMobileTab : ''}>
                <div className={`glass ${styles.panel}`} style={{ padding: '16px' }}>
                  <h4 style={{ fontSize: '14px', marginBottom: '12px' }}>Interviewer {!remoteVideoReady && '(Connecting...)'}</h4>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    style={{
                      width: '100%',
                      height: '200px',
                      background: '#000',
                      borderRadius: '8px',
                      objectFit: 'cover'
                    }}
                  />
                </div>

                <div className={`glass ${styles.panel}`} style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '14px' }}>You {!localVideoReady && '(Connecting...)'}</h4>
                    <button onClick={toggleCamera} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      {cameraOn ? <VideoOff size={14} strokeWidth={2} /> : <Video size={14} strokeWidth={2} />}
                      <span>{cameraOn ? 'Stop' : 'Start'}</span>
                    </button>
                  </div>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '200px',
                      background: '#000',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      transform: 'scaleX(-1)'
                    }}
                  />
                </div>

                <div className={`glass ${styles.panel}`} style={{ padding: '16px' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Connected to Room:</p>
                  <p style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>{roomId}</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {showScoreModal && receivedScore && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass" style={{ padding: '40px', maxWidth: '500px', width: '90%', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', color: '#10b981', marginBottom: '20px' }}>
              <Award size={44} strokeWidth={1.75} />
            </div>
            <h3 style={{ fontSize: '24px', marginBottom: '16px' }}>Interview Complete!</h3>
            
            <div style={{
              padding: '24px',
              background: receivedScore.score >= 70 ? 'rgba(16,185,129,0.2)' : receivedScore.score >= 40 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
              borderRadius: '12px',
              marginBottom: '24px'
            }}>
              <p style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Your Score</p>
              <p style={{ 
                fontSize: '48px', 
                fontWeight: '800',
                color: receivedScore.score >= 70 ? '#10b981' : receivedScore.score >= 40 ? '#f59e0b' : '#ef4444'
              }}>
                {receivedScore.score}/100
              </p>
            </div>

            {receivedScore.feedback && (
              <div style={{
                padding: '16px',
                background: 'rgba(124,58,237,0.1)',
                borderRadius: '8px',
                marginBottom: '24px',
                textAlign: 'left'
              }}>
                <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Feedback:</p>
                <p style={{ fontSize: '14px', lineHeight: '1.6' }}>{receivedScore.feedback}</p>
              </div>
            )}

            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-primary btn-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

