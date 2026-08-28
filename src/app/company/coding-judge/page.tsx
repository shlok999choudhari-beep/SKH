'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import CompanySidebar from '@/components/CompanySidebar'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import styles from '../dashboard.module.css'
import Editor from '@monaco-editor/react'
import io from 'socket.io-client'
import {
  Code2,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
  CheckCircle2,
  Rocket,
  Copy,
  Terminal,
  Play,
  Share2,
  Users,
  Award,
  Radio,
  Sparkles,
  RefreshCw
} from 'lucide-react'

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ]
}

const templates: Record<string, string> = {
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

const languageMap: Record<string, string> = {
  cpp: 'cpp',
  python: 'python',
  java: 'java'
}

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
  const [score, setScore] = useState(85)
  const [feedback, setFeedback] = useState('')
  const [submittingScore, setSubmittingScore] = useState(false)
  const [localVideoReady, setLocalVideoReady] = useState(false)
  const [remoteVideoReady, setRemoteVideoReady] = useState(false)
  const [cameraOn, setCameraOn] = useState(false)
  const [micOn, setMicOn] = useState(true)
  const [remoteAudioMuted, setRemoteAudioMuted] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'waiting' | 'connecting' | 'connected' | 'disconnected'>('idle')
  const [mobileTab, setMobileTab] = useState<'code' | 'video' | 'io'>('code')
  const [mounted, setMounted] = useState(false)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [copied, setCopied] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  
  const roomIdRef = useRef('')
  const socketRef = useRef<any>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const previewVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const pendingCandidatesRef = useRef<RTCIceCandidate[]>([])

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }, [])

  const handleCopyRoomId = () => {
    const idToCopy = roomId || roomIdRef.current
    if (!idToCopy) return
    navigator.clipboard.writeText(idToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  // Bind local stream to active video elements
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

  // Bind remote stream to remote video element
  useEffect(() => {
    if (remoteStreamRef.current && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current
      remoteVideoRef.current.play().catch(err => {
        console.warn('Autoplay failed, falling back to muted:', err)
        if (remoteVideoRef.current) {
          remoteVideoRef.current.muted = true
          setRemoteAudioMuted(true)
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

  const startCamera = async () => {
    try {
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }, 
          audio: true 
        })
        setMicOn(true)
      } catch (audioErr) {
        console.warn('Could not get audio+video, falling back to video only:', audioErr)
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }, 
          audio: false 
        })
        setMicOn(false)
      }

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
      setLocalVideoReady(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Camera access denied. Please grant camera permissions in your browser.')
    }
  }

  const toggleCamera = async () => {
    if (cameraOn) {
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach(track => {
          track.enabled = false
          track.stop()
        })
        const audioTracks = localStreamRef.current.getAudioTracks()
        if (audioTracks.length === 0) {
          localStreamRef.current = null
        }
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = null
      if (previewVideoRef.current) previewVideoRef.current.srcObject = null
      setCameraOn(false)
      setLocalVideoReady(false)
    } else {
      await startCamera()
    }
  }

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks()
      if (audioTracks.length > 0) {
        const nextState = !micOn
        audioTracks.forEach(t => { t.enabled = nextState })
        setMicOn(nextState)
      } else {
        showToast('No microphone track available')
      }
    }
  }

  const toggleRemoteAudio = () => {
    if (remoteVideoRef.current) {
      const nextMuted = !remoteAudioMuted
      remoteVideoRef.current.muted = nextMuted
      setRemoteAudioMuted(nextMuted)
    }
  }

  const getSocketUrl = () => {
    if (typeof window === 'undefined') return undefined
    const isHttps = window.location.protocol === 'https:'
    const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL
    if (envUrl) {
      return isHttps && envUrl.startsWith('http://') ? envUrl.replace(/^http:\/\//, 'https://') : envUrl
    }
    // In local HTTP development: Next is on 3000, standalone socket server on 3001
    if (!isHttps && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return `http://${window.location.hostname}:3001`
    }
    return window.location.origin
  }

  const initializeSocket = () => {
    if (socketRef.current) return socketRef.current

    const socketUrl = getSocketUrl()
    const socket = io(socketUrl || undefined, {
      transports: ['websocket', 'polling'],
      secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    })
    
    socket.on('connect', () => {
      console.log('✅ Connected to Socket.IO signaling server')
    })

    socket.on('code-update', (data: any) => {
      if (data && data.code !== undefined) {
        setCode(data.code)
      }
    })

    socket.on('language-change', (data: any) => {
      if (data && data.language) {
        setLanguage(data.language)
        if (data.code) setCode(data.code)
      }
    })

    socket.on('code-output', (data: any) => {
      if (data && data.output !== undefined) {
        setOutput(data.output)
      }
    })

    socket.on('user-joined', async ({ name }: any) => {
      console.log('✅ Student joined the room:', name)
      const sName = name || 'Student Candidate'
      setStudentName(sName)
      setConnectionStatus('connecting')
      showToast(`🎉 ${sName} has joined the coding judge room!`)
      // Trigger WebRTC offer creation with small delay to ensure student peer connection is ready
      setTimeout(() => {
        createOffer()
      }, 600)
    })

    socket.on('user-left', () => {
      console.log('Student left the room')
      showToast('⚠️ Candidate disconnected')
      setStudentName('')
      setRemoteVideoReady(false)
      setRemoteStream(null)
      remoteStreamRef.current = null
      setConnectionStatus('waiting')
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null
      }
    })

    socket.on('webrtc-offer', async ({ offer }: any) => {
      console.log('📥 Received offer from peer')
      await handleOffer(offer)
    })

    socket.on('webrtc-answer', async ({ answer }: any) => {
      console.log('📥 Received WebRTC answer from candidate')
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer))
          console.log('✅ Remote description set on company peer')
          if (pendingCandidatesRef.current.length > 0) {
            console.log(`🧩 Flushing ${pendingCandidatesRef.current.length} queued ICE candidates`)
            for (const candidate of pendingCandidatesRef.current) {
              await peerConnectionRef.current.addIceCandidate(candidate).catch(e => console.warn('Candidate add error:', e))
            }
            pendingCandidatesRef.current = []
          }
          setConnectionStatus('connected')
        } catch (error) {
          console.error('Error setting remote description from answer:', error)
        }
      }
    })

    socket.on('webrtc-ice-candidate', async ({ candidate }: any) => {
      if (!candidate) return
      const pc = peerConnectionRef.current
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (error) {
          console.error('Error adding ICE candidate:', error)
        }
      } else {
        pendingCandidatesRef.current.push(new RTCIceCandidate(candidate))
      }
    })

    socketRef.current = socket
    return socket
  }

  const initializePeerConnection = async (targetRoomId: string) => {
    try {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
      }

      const pc = new RTCPeerConnection(RTC_CONFIG)
      peerConnectionRef.current = pc

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current!)
        })
      }

      pc.ontrack = (event) => {
        console.log('🎥 Company received remote track:', event.track.kind)
        let stream = event.streams && event.streams[0] ? event.streams[0] : null
        if (!stream) {
          if (!remoteStreamRef.current) {
            remoteStreamRef.current = new MediaStream()
          }
          remoteStreamRef.current.addTrack(event.track)
          stream = remoteStreamRef.current
        } else {
          remoteStreamRef.current = stream
        }

        setRemoteStream(stream)
        setRemoteVideoReady(true)
        setConnectionStatus('connected')

        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream
          remoteVideoRef.current.play().catch(err => {
            console.warn('Autoplay failed, falling back to muted:', err)
            if (remoteVideoRef.current) {
              remoteVideoRef.current.muted = true
              setRemoteAudioMuted(true)
              remoteVideoRef.current.play().catch(e => console.error('Muted play error:', e))
            }
          })
        }
      }

      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          const activeRoom = roomIdRef.current || targetRoomId || roomId
          socketRef.current.emit('webrtc-ice-candidate', {
            roomId: activeRoom,
            candidate: event.candidate
          })
        }
      }

      pc.onconnectionstatechange = () => {
        console.log('Peer connection state:', pc.connectionState)
        if (pc.connectionState === 'connected') {
          setConnectionStatus('connected')
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setConnectionStatus('disconnected')
        }
      }

      return pc
    } catch (error) {
      console.error('Error initializing peer connection:', error)
      return null
    }
  }

  const createRoom = async () => {
    if (!cameraOn) {
      alert('Please start your camera first so the candidate can see you.')
      return
    }
    
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase()
    setRoomId(newRoomId)
    roomIdRef.current = newRoomId
    
    const socket = initializeSocket()
    await initializePeerConnection(newRoomId)
    
    socket.emit('create-room', { roomId: newRoomId, role: 'company' })
    setConnected(true)
    setConnectionStatus('waiting')
    showToast(`Room ${newRoomId} created! Share this ID with the candidate.`)
  }

  const createOffer = async () => {
    if (!peerConnectionRef.current) {
      await initializePeerConnection(roomIdRef.current || roomId)
    }
    const pc = peerConnectionRef.current
    if (!pc) return

    try {
      console.log('📤 Company creating WebRTC offer...')
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      })
      await pc.setLocalDescription(offer)
      const targetRoom = roomIdRef.current || roomId
      if (socketRef.current && targetRoom) {
        socketRef.current.emit('webrtc-offer', {
          offer,
          roomId: targetRoom
        })
        console.log('📤 WebRTC offer sent to room:', targetRoom)
      }
    } catch (err) {
      console.error('Error creating offer:', err)
    }
  }

  const handleOffer = async (offer: any) => {
    if (!peerConnectionRef.current) {
      await initializePeerConnection(roomIdRef.current || roomId)
    }
    const pc = peerConnectionRef.current
    if (!pc) return

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      if (pendingCandidatesRef.current.length > 0) {
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(candidate).catch(e => console.warn(e))
        }
        pendingCandidatesRef.current = []
      }
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
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

  const handleCodeChange = (newCode: string | undefined) => {
    const val = newCode || ''
    setCode(val)
    if (socketRef.current && roomIdRef.current) {
      socketRef.current.emit('code-change', {
        code: val,
        roomId: roomIdRef.current
      })
    }
  }

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang)
    const newTemplate = templates[newLang] || ''
    setCode(newTemplate)
    if (socketRef.current && roomIdRef.current) {
      socketRef.current.emit('language-change', {
        language: newLang,
        code: newTemplate,
        roomId: roomIdRef.current
      })
    }
  }

  const runCode = async () => {
    setRunning(true)
    setOutput('Executing code...')
    
    try {
      const res = await fetch('/api/code-execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, input })
      })
      const data = await res.json()
      const result = data.output || data.error || 'Execution completed with no output'
      setOutput(result)
      
      if (socketRef.current && roomIdRef.current) {
        socketRef.current.emit('code-output', {
          output: result,
          roomId: roomIdRef.current
        })
      }
    } catch (error) {
      const err = 'Failed to execute code'
      setOutput(err)
      if (socketRef.current && roomIdRef.current) {
        socketRef.current.emit('code-output', {
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
    setSubmittingScore(true)
    try {
      const activeRoom = roomIdRef.current || roomId
      
      // Notify candidate in real time via socket
      if (socketRef.current && activeRoom) {
        socketRef.current.emit('session-ended', {
          roomId: activeRoom,
          score,
          feedback
        })
      }

      // Persist score in database
      const res = await fetch('/api/coding-session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: activeRoom,
          score,
          feedback,
          codeSnapshot: code,
          language
        })
      })

      if (!res.ok) {
        console.warn('PUT /api/coding-session response not ok, session completed in memory')
      }

      alert(`Assessment submitted successfully! Candidate Score: ${score}/100`)
      window.location.href = '/company/dashboard'
    } catch (error) {
      console.error('Failed to submit score:', error)
      alert('Score recorded! Redirecting to dashboard.')
      window.location.href = '/company/dashboard'
    } finally {
      setSubmittingScore(false)
    }
  }

  return (
    <div className={styles.layout}>
      <CompanySidebar />
      <div className={styles.content}>
        {/* Toast Notification */}
        {toastMessage && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            zIndex: 9999,
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: '600',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <Sparkles size={18} />
            <span>{toastMessage}</span>
          </div>
        )}

        <header className={styles.header}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                <Code2 size={20} strokeWidth={2.2} color="#10b981" />
              </div>
              <div>
                <h1 className={styles.pageTitle} style={{ margin: 0, fontSize: '20px' }}>Coding Judge & Live VC</h1>
                <p className={styles.pageSubtitle} style={{ margin: 0, fontSize: '12px' }}>Real-time collaborative technical assessment</p>
              </div>
            </div>
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
                <Radio size={14} color="#10b981" className="animate-pulse" />
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

              <button 
                onClick={endSession} 
                className="btn btn-secondary" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}
              >
                <Square size={14} strokeWidth={2} fill="currentColor" />
                <span>End & Grade</span>
              </button>
            </div>
          )}
        </header>

        <main className={styles.main}>
          {!mounted ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <MorphingInfinity className="size-8" style={{ margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Loading coding environment...</p>
            </div>
          ) : !connected ? (
            <div className={`glass ${styles.panel}`} style={{ textAlign: 'center', padding: '50px 30px', maxWidth: '640px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 95, 70, 0.2))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(16, 185, 129, 0.4)'
                }}>
                  <Video size={32} strokeWidth={1.75} color="#10b981" />
                </div>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>Launch Coding Interview Room</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px', lineHeight: '1.5' }}>
                Start your camera and generate a secure interview room ID to share with the student candidate for live code pair programming & HD video.
              </p>

              {/* Camera Preview Box */}
              <div style={{
                maxWidth: '380px',
                width: '100%',
                margin: '0 auto 24px',
                borderRadius: '16px',
                overflow: 'hidden',
                border: cameraOn ? '2px solid rgba(16,185,129,0.5)' : '1px dashed var(--border)',
                background: '#090d16',
                position: 'relative',
                minHeight: '220px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <video
                  ref={previewVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '220px',
                    objectFit: 'cover',
                    transform: 'scaleX(-1)',
                    display: cameraOn ? 'block' : 'none'
                  }}
                />
                
                {!cameraOn && (
                  <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <VideoOff size={36} strokeWidth={1.5} style={{ margin: '0 auto 10px', opacity: 0.6 }} />
                    <p style={{ fontSize: '13px', margin: 0 }}>Camera is currently off</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Click "Start Camera" below to test your video feed</p>
                  </div>
                )}

                {cameraOn && (
                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    right: '10px',
                    fontSize: '12px',
                    color: '#10b981',
                    padding: '6px 12px',
                    background: 'rgba(0,0,0,0.75)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={14} color="#10b981" />
                      Camera Live & Ready
                    </span>
                    <span style={{ fontSize: '11px', color: micOn ? '#10b981' : '#f59e0b' }}>
                      {micOn ? 'Mic: On' : 'Mic: Off'}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button 
                  onClick={toggleCamera} 
                  className={`btn ${cameraOn ? 'btn-secondary' : 'btn-primary'} btn-lg`} 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
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

                {cameraOn && (
                  <button 
                    onClick={createRoom} 
                    className="btn btn-primary btn-lg" 
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      boxShadow: '0 4px 20px rgba(16,185,129,0.3)'
                    }}
                  >
                    <Rocket size={18} strokeWidth={2} />
                    <span>Create Interview Room</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.codingJudgeGrid}>
              {/* Top Room Banner */}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: connectionStatus === 'connected' ? '#10b981' : connectionStatus === 'connecting' ? '#f59e0b' : '#3b82f6',
                    boxShadow: `0 0 10px ${connectionStatus === 'connected' ? '#10b981' : '#f59e0b'}`
                  }} />
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>Session Live</span>
                      <span className="badge badge-purple" style={{ fontSize: '11px' }}>
                        {studentName ? `Candidate: ${studentName}` : 'Waiting for candidate to join...'}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Share Judge ID with student. Code edits & WebRTC audio/video sync in real-time.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    color: '#10b981',
                    letterSpacing: '3px',
                    fontFamily: 'monospace',
                    background: 'rgba(0,0,0,0.5)',
                    padding: '5px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(16,185,129,0.3)'
                  }}>
                    {roomId}
                  </span>
                  <button
                    onClick={handleCopyRoomId}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    {copied ? <CheckCircle2 size={13} color="#ffffff" /> : <Copy size={13} />}
                    <span>{copied ? 'Copied' : 'Copy ID'}</span>
                  </button>
                  {studentName && !remoteVideoReady && (
                    <button
                      onClick={createOffer}
                      className="btn btn-secondary btn-sm"
                      title="Retry Video Connection"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <RefreshCw size={13} />
                      <span>Retry VC</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Mobile Tab Switcher */}
              <div className={styles.mobileTabNav} style={{ gridColumn: '1 / -1' }}>
                <button
                  onClick={() => setMobileTab('code')}
                  className={`${styles.mobileTabButton} ${mobileTab === 'code' ? styles.mobileTabButtonActive : ''}`}
                >
                  <Code2 size={14} strokeWidth={2} />
                  <span>Code Editor</span>
                </button>
                <button
                  onClick={() => setMobileTab('video')}
                  className={`${styles.mobileTabButton} ${mobileTab === 'video' ? styles.mobileTabButtonActive : ''}`}
                >
                  <Video size={14} strokeWidth={2} />
                  <span>Video Call ({studentName ? 'Live' : 'Waiting'})</span>
                </button>
                <button
                  onClick={() => setMobileTab('io')}
                  className={`${styles.mobileTabButton} ${mobileTab === 'io' ? styles.mobileTabButtonActive : ''}`}
                >
                  <Terminal size={14} strokeWidth={2} />
                  <span>Terminal / Output</span>
                </button>
              </div>

              {/* Left Column: Monaco Code Editor & I/O */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className={mobileTab === 'video' ? styles.hideOnMobileTab : ''}>
                {(mobileTab === 'code' || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
                  <div className={`glass ${styles.panel}`} style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <select
                          value={language}
                          onChange={(e) => handleLanguageChange(e.target.value)}
                          className="form-select"
                          style={{ width: '130px', minHeight: '38px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)' }}
                        >
                          <option value="cpp">C++ (GCC)</option>
                          <option value="python">Python 3</option>
                          <option value="java">Java 17</option>
                        </select>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Synced with Candidate
                        </span>
                      </div>

                      <button 
                        onClick={runCode} 
                        disabled={running} 
                        className="btn btn-primary btn-sm" 
                        style={{ minHeight: '38px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        {running ? (
                          <>
                            <MorphingInfinity className="size-4" style={{ width: '14px', height: '14px' }} />
                            <span>Compiling & Running...</span>
                          </>
                        ) : (
                          <>
                            <Play size={14} strokeWidth={2} fill="currentColor" />
                            <span>Run Code</span>
                          </>
                        )}
                      </button>
                    </div>
                    
                    <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', height: '420px', width: '100%' }}>
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

                {(mobileTab === 'io' || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
                  <div className={`glass ${styles.panel}`} style={{ padding: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                          <Terminal size={14} strokeWidth={2} color="#10b981" />
                          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Input (stdin)</label>
                        </div>
                        <textarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="Pass custom test inputs here..."
                          style={{
                            width: '100%',
                            height: '110px',
                            background: 'rgba(0,0,0,0.35)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            padding: '10px',
                            color: 'var(--text-primary)',
                            fontFamily: 'monospace',
                            fontSize: '12.5px',
                            resize: 'none'
                          }}
                        />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                          <Terminal size={14} strokeWidth={2} color="#10b981" />
                          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Execution Output</label>
                        </div>
                        <pre style={{
                          height: '110px',
                          background: 'rgba(0,0,0,0.5)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          padding: '10px',
                          color: output.includes('Error') || output.includes('error') ? '#ef4444' : '#10b981',
                          fontFamily: 'monospace',
                          fontSize: '12.5px',
                          overflowY: 'auto',
                          margin: 0
                        }}>
                          {output || 'Output will appear here when you or the candidate runs code...'}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: WebRTC Video Call Streams & Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className={mobileTab === 'code' || mobileTab === 'io' ? styles.hideOnMobileTab : ''}>
                {/* Candidate Video Stream */}
                <div className={`glass ${styles.panel}`} style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Video size={16} strokeWidth={2} color="#10b981" />
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Candidate Video</h4>
                    </div>
                    <div>
                      {studentName ? (
                        <span className="badge badge-green" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                          {studentName} (Connected)
                        </span>
                      ) : (
                        <span className="badge badge-yellow" style={{ fontSize: '11px' }}>
                          Waiting for candidate...
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ width: '100%', height: '220px', background: '#090d16', borderRadius: '10px', overflow: 'hidden', position: 'relative', border: '1px solid var(--border)' }}>
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />

                    {!remoteVideoReady && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(9,13,22,0.85)', color: 'var(--text-secondary)', fontSize: '13px', padding: '16px', textAlign: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                          <VideoOff size={20} strokeWidth={1.5} color="#94a3b8" />
                        </div>
                        {studentName ? 'Connecting candidate video...' : 'Waiting for candidate to connect...'}
                      </div>
                    )}

                    {/* Candidate Audio Status Button */}
                    {remoteVideoReady && (
                      <div style={{ position: 'absolute', bottom: '10px', right: '10px', display: 'flex', gap: '6px' }}>
                        <button
                          onClick={toggleRemoteAudio}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.2)' }}
                          title={remoteAudioMuted ? 'Unmute candidate audio' : 'Mute candidate audio'}
                        >
                          {remoteAudioMuted ? <VolumeX size={14} color="#f59e0b" /> : <Volume2 size={14} color="#10b981" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Interviewer (Your) Camera */}
                <div className={`glass ${styles.panel}`} style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Video size={16} strokeWidth={2} color="#10b981" />
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Your Camera</h4>
                    </div>
                    <span className="badge badge-purple" style={{ fontSize: '11px' }}>Interviewer</span>
                  </div>

                  <div style={{ width: '100%', height: '180px', background: '#090d16', borderRadius: '10px', overflow: 'hidden', position: 'relative', border: '1px solid var(--border)' }}>
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                    />

                    {!localVideoReady && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(9,13,22,0.85)', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        Camera is off
                      </div>
                    )}

                    {/* Local In-Call Controls Overlay */}
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '8px',
                      right: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: 'rgba(0,0,0,0.6)',
                      backdropFilter: 'blur(6px)',
                      padding: '4px',
                      borderRadius: '8px'
                    }}>
                      <button
                        onClick={toggleMic}
                        className={`btn ${micOn ? 'btn-secondary' : 'btn-danger'} btn-sm`}
                        style={{ padding: '4px 10px', height: '28px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title={micOn ? 'Mute Microphone' : 'Unmute Microphone'}
                      >
                        {micOn ? <Mic size={13} color="#10b981" /> : <MicOff size={13} color="#ef4444" />}
                        <span>{micOn ? 'Mute' : 'Unmuted'}</span>
                      </button>

                      <button
                        onClick={toggleCamera}
                        className={`btn ${cameraOn ? 'btn-secondary' : 'btn-danger'} btn-sm`}
                        style={{ padding: '4px 10px', height: '28px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title={cameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
                      >
                        {cameraOn ? <Video size={13} color="#10b981" /> : <VideoOff size={13} color="#ef4444" />}
                        <span>{cameraOn ? 'Cam Off' : 'Cam On'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Session Info Panel */}
                <div className={`glass ${styles.panel}`} style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Status:</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: connectionStatus === 'connected' ? '#10b981' : '#f59e0b' }}>
                      {connectionStatus === 'connected' ? '● Video Call Active' : connectionStatus === 'connecting' ? 'Connecting WebRTC...' : 'Waiting for Peer'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Room ID:</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'monospace', color: '#10b981' }}>{roomId}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* End Session Assessment Scoring Modal */}
      {showScoreModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '16px', maxWidth: '500px', width: '100%', padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                <Award size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
                  Submit Assessment &amp; Grade
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {studentName ? `Grading candidate: ${studentName}` : 'Finalize interview assessment'}
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Score (0 - 100)</label>
                <span style={{ fontSize: '16px', fontWeight: 800, color: score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444' }}>
                  {score} / 100
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#10b981' }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                Detailed Feedback &amp; Performance Remarks
              </label>
              <textarea
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Detail the candidate's code quality, problem solving methodology, optimization abilities, and areas to improve..."
                className="form-input"
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                onClick={() => setShowScoreModal(false)} 
                className="btn btn-secondary"
                disabled={submittingScore}
              >
                Cancel
              </button>
              <button 
                onClick={submitScore} 
                className="btn btn-primary"
                disabled={submittingScore}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {submittingScore ? (
                  <>
                    <MorphingInfinity className="size-4" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Finalize Score</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
