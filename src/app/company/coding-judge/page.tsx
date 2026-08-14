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
  const [mounted, setMounted] = useState(false)
  
  const socketRef = useRef<any>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
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

  const initializeSocket = () => {
    if (socketRef.current) return
    
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || (typeof window !== 'undefined' ? `http://${window.location.hostname}:3001` : 'http://localhost:3001')
    socketRef.current = io(socketUrl)
    
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
        console.log('🎥🎥🎥 ontrack event fired!')
        console.log('Event:', event)
        console.log('Streams count:', event.streams?.length)
        console.log('Track:', event.track?.kind, event.track?.enabled, event.track?.readyState)
        console.log('Track ID:', event.track?.id)
        
        if (event.streams && event.streams[0]) {
          console.log('✅ Stream received, tracks:', event.streams[0].getTracks().length)
          event.streams[0].getTracks().forEach(t => {
            console.log('  - Track:', t.kind, t.enabled, t.readyState)
          })
          
          const stream = event.streams[0]
          
          if (remoteVideoRef.current) {
            console.log('Setting srcObject on remote video')
            remoteVideoRef.current.srcObject = stream
            remoteVideoRef.current.play().then(() => {
              console.log('✅✅✅ Remote video playing!')
              setRemoteVideoReady(true)
            }).catch(err => {
              console.error('❌ Remote video play error:', err)
            })
          } else {
            console.error('❌ remoteVideoRef.current is null!')
          }
        } else {
          console.error('❌ No streams in ontrack event!')
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
          console.log('Sending ICE candidate')
          socketRef.current.emit('webrtc-ice-candidate', {
            roomId: currentRoomId,
            candidate: event.candidate
          })
        }
      }
      
      console.log('Video initialized for room:', currentRoomId)
      console.log('✅ Peer connection setup complete')
      console.log('remoteVideoRef exists:', !!remoteVideoRef.current)
      console.log('localVideoRef exists:', !!localVideoRef.current)
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
      
      console.log('Offer SDP:', offer.sdp?.substring(0, 200) + '...')
      console.log('Offer has video:', offer.sdp?.includes('m=video'))
      console.log('Offer has audio:', offer.sdp?.includes('m=audio'))
      
      await peerConnectionRef.current.setLocalDescription(offer)
      
      console.log('📤 Sending offer to room:', roomId)
      socketRef.current.emit('webrtc-offer', {
        roomId,
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
      
      // Add any pending ICE candidates
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
      
      console.log('Sending answer')
      socketRef.current.emit('webrtc-answer', {
        roomId,
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', height: 'calc(100vh - 200px)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className={`glass ${styles.panel}`} style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                    <select
                      value={language}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="form-select"
                      style={{ width: '150px' }}
                    >
                      <option value="cpp">C++</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                    </select>
                    <button onClick={runCode} disabled={running} className="btn btn-primary btn-sm">
                      {running ? '⏳ Running...' : '▶️ Run Code'}
                    </button>
                  </div>
                  
                  <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', height: '400px' }}>
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
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
