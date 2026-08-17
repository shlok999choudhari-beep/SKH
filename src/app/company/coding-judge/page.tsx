'use client'
import { useState, useEffect, useRef } from 'react'
import CompanySidebar from '@/components/CompanySidebar'
import styles from '../dashboard.module.css'
import Editor from '@monaco-editor/react'
import io from 'socket.io-client'

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
      console.log('Answer SDP:', answer.sdp?.substring(0, 200) + '...')
      console.log('Answer has video:', answer.sdp?.includes('m=video'))
      console.log('Answer has audio:', answer.sdp?.includes('m=audio'))
      
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer))
          console.log('✅ Remote description set from answer')
          console.log('Signaling state:', peerConnectionRef.current.signalingState)
          console.log('Connection state:', peerConnectionRef.current.connectionState)
          
          // Add any pending ICE candidates
          if (pendingCandidatesRef.current.length > 0) {
            console.log('🧩 Adding', pendingCandidatesRef.current.length, 'pending ICE candidates')
            for (const candidate of pendingCandidatesRef.current) {
              await peerConnectionRef.current.addIceCandidate(candidate)
            }
            pendingCandidatesRef.current = []
          }
          
          // Check transceivers
          console.log('📡 Transceivers:', peerConnectionRef.current.getTransceivers().length)
          peerConnectionRef.current.getTransceivers().forEach((transceiver, i) => {
            console.log(`Transceiver ${i}:`, transceiver.direction, transceiver.currentDirection, transceiver.receiver.track?.kind)
          })
        } catch (error) {
          console.error('Error setting remote description:', error)
        }
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
  }

  const createRoom = async () => {
    if (!cameraOn) {
      alert('Please start your camera first')
      return
    }
    
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase()
    console.log('Creating room:', newRoomId)
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

  const createOffer = async () => {
    if (!peerConnectionRef.current) {
      console.error('Peer connection not initialized')
      return
    }
    
    try {
      console.log('📤 Creating offer...')
      console.log('Peer connection state:', peerConnectionRef.current.connectionState)
      console.log('Signaling state:', peerConnectionRef.current.signalingState)
      console.log('Local tracks:', localStreamRef.current?.getTracks().map(t => `${t.kind}: ${t.enabled}`))
      console.log('Senders before offer:', peerConnectionRef.current.getSenders().length)
      
      const offer = await peerConnectionRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      })
      
      await peerConnectionRef.current.setLocalDescription(offer)
      
      const activeRoom = roomIdRef.current || roomId
      console.log('📤 Sending offer to room:', activeRoom)
      socketRef.current.emit('webrtc-offer', {
        roomId: activeRoom,
        offer
      })
    } catch (error) {
      console.error('Error creating offer:', error)
    }
  }

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) {
      console.error('Peer connection not initialized')
      return
    }
    
    try {
      console.log('Setting remote description from offer')
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer))
      
      if (pendingCandidatesRef.current.length > 0) {
        console.log('Adding', pendingCandidatesRef.current.length, 'pending ICE candidates')
        for (const candidate of pendingCandidatesRef.current) {
          await peerConnectionRef.current.addIceCandidate(candidate)
        }
        pendingCandidatesRef.current = []
      }
      
      console.log('Creating answer')
      const answer = await peerConnectionRef.current.createAnswer()
      await peerConnectionRef.current.setLocalDescription(answer)
      
      const activeRoom = roomIdRef.current || roomId
      console.log('Sending answer to room:', activeRoom)
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

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang)
    setCode(templates[lang])
    if (connected && socketRef.current) {
      socketRef.current.emit('language-change', { roomId, language: lang })
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

  const endSession = () => {
    setShowScoreModal(true)
  }

  const submitScore = async () => {
    try {
      // Emit score to student via socket
      if (socketRef.current) {
        socketRef.current.emit('session-ended', {
          roomId,
          score,
          feedback
        })
      }

      await fetch('/api/coding-session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          score,
          feedback,
          codeSnapshot: code,
          language
        })
      })
      
      setShowScoreModal(false)
      alert('Score submitted successfully!')
      
      // Disconnect and cleanup
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
      }
      
      window.location.reload()
    } catch (error) {
      alert('Failed to submit score')
    }
  }

  return (
    <div className={styles.layout}>
      <CompanySidebar />
      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>💻 Coding Judge</h1>
            <p className={styles.pageSubtitle}>Real-time collaborative coding interview</p>
          </div>
          {connected && (
            <button onClick={endSession} className="btn btn-secondary">
              ⏹️ End Session
            </button>
          )}
        </header>

        <main className={styles.main}>
          {!mounted ? <div style={{ padding: '60px', textAlign: 'center' }}>Loading...</div> : !connected ? (
            <div className={`glass ${styles.panel}`} style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎯</div>
              <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>Start Coding Session</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Create a room and share the Room ID with the candidate
              </p>
              <div style={{ marginBottom: '20px' }}>
                <button onClick={toggleCamera} className={`btn ${cameraOn ? 'btn-secondary' : 'btn-primary'} btn-lg`}>
                  {cameraOn ? '📹 Stop Camera' : '📷 Start Camera'}
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
                  <p style={{ fontSize: '12px', color: '#10b981', padding: '6px', background: 'rgba(0,0,0,0.6)' }}>
                    🟢 Camera Live & Ready
                  </p>
                </div>
              )}
              {cameraOn && (
                <button onClick={createRoom} className="btn btn-primary btn-lg">
                  🚀 Create Room
                </button>
              )}
              {roomId && (
                <div style={{ marginTop: '24px', padding: '20px', background: 'rgba(16,185,129,0.15)', borderRadius: '12px', border: '2px solid rgba(16,185,129,0.3)' }}>
                  <p style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Share this Room ID with the candidate:</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
                    <p style={{ fontSize: '32px', fontWeight: '800', color: '#10b981', letterSpacing: '4px' }}>{roomId}</p>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(roomId); alert('Room ID copied!') }}
                      className="btn btn-secondary btn-sm"
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.codingJudgeGrid}>
              {/* Mobile Tab Switcher */}
              <div className={styles.mobileTabNav} style={{ gridColumn: '1 / -1' }}>
                <button
                  onClick={() => setMobileTab('code')}
                  className={`${styles.mobileTabButton} ${mobileTab === 'code' ? styles.mobileTabButtonActive : ''}`}
                >
                  💻 Code
                </button>
                <button
                  onClick={() => setMobileTab('video')}
                  className={`${styles.mobileTabButton} ${mobileTab === 'video' ? styles.mobileTabButtonActive : ''}`}
                >
                  🎥 Candidate Video
                </button>
                <button
                  onClick={() => setMobileTab('io')}
                  className={`${styles.mobileTabButton} ${mobileTab === 'io' ? styles.mobileTabButtonActive : ''}`}
                >
                  📋 Output
                </button>
              </div>

              {/* Left: Code Editor (shown always on desktop, on mobile only when active tab is 'code' or 'io') */}
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
                      <button onClick={runCode} disabled={running} className="btn btn-primary btn-sm" style={{ minHeight: '38px' }}>
                        {running ? '⏳ Running...' : '▶️ Run Code'}
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

              {/* Right: Video Call (shown always on desktop, on mobile only when active tab is 'video') */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className={mobileTab !== 'video' ? styles.hideOnMobileTab : ''}>
                <div className={`glass ${styles.panel}`} style={{ padding: '16px' }}>
                  <h4 style={{ fontSize: '14px', marginBottom: '12px' }}>{studentName || 'Candidate'} {!remoteVideoReady && '(Connecting...)'}</h4>
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
                    <button onClick={toggleCamera} className="btn btn-secondary btn-sm">
                      {cameraOn ? '📹 Stop' : '📷 Start'}
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
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Room ID:</p>
                  <p style={{ fontSize: '18px', fontWeight: '700', color: '#10b981', letterSpacing: '2px' }}>{roomId}</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {showScoreModal && (
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
          <div className="glass" style={{ padding: '32px', maxWidth: '500px', width: '90%' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '24px' }}>Rate Candidate Performance</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>
                Score (0-100):
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(parseInt(e.target.value))}
                className="form-input"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>
                Feedback:
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide detailed feedback..."
                className="form-input"
                style={{ minHeight: '120px', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={submitScore} className="btn btn-primary" style={{ flex: 1 }}>
                Submit Score
              </button>
              <button onClick={() => setShowScoreModal(false)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
