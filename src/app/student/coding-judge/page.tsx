'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import StudentSidebar from '@/components/StudentSidebar'
import BackButton from '@/components/BackButton'
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
  Search,
  LogIn,
  Clock,
  Terminal,
  Play,
  CheckCircle2,
  Award,
  Target,
  Sparkles,
  Radio,
  RefreshCw,
  User,
  Trash2,
  RotateCcw,
  Cpu,
  Check,
  Copy
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
    cout << "Hello from C++ (GCC)!" << endl;
    return 0;
}`,
  python: `def main():
    print("Hello from Python 3!")

if __name__ == "__main__":
    main()`,
  java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java 17!");
    }
}`,
  javascript: `// JavaScript (Node.js Environment)
function main() {
    console.log("Hello from JavaScript!");
}

main();`,
  typescript: `// TypeScript Environment
function greet(name: string): string {
    return \`Hello from TypeScript, \${name}!\`;
}

console.log(greet("PlaceIQ Developer"));`,
  c: `#include <stdio.h>

int main() {
    printf("Hello from C (GCC)!\\n");
    return 0;
}`,
  go: `package main

import "fmt"

func main() {
    fmt.Println("Hello from Go!")
}`,
  rust: `fn main() {
    println!("Hello from Rust!");
}`
}

const languageMap: Record<string, string> = {
  cpp: 'cpp',
  c: 'c',
  python: 'python',
  java: 'java',
  javascript: 'javascript',
  typescript: 'typescript',
  go: 'go',
  rust: 'rust'
}

const languageLabels: Record<string, string> = {
  cpp: 'C++ (GCC)',
  python: 'Python 3',
  java: 'Java 17',
  javascript: 'JavaScript (Node.js)',
  typescript: 'TypeScript',
  c: 'C (GCC)',
  go: 'Go 1.20',
  rust: 'Rust'
}

export default function StudentCodingJudge() {
  const [code, setCode] = useState(templates.cpp)
  const [language, setLanguage] = useState('cpp')
  const [output, setOutput] = useState('')
  const [input, setInput] = useState('')
  const [running, setRunning] = useState(false)
  const [execStatus, setExecStatus] = useState<string | null>(null)
  const [execTime, setExecTime] = useState<string | null>(null)
  const [execMemory, setExecMemory] = useState<string | null>(null)
  const [outputCopied, setOutputCopied] = useState(false)
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
  const [micOn, setMicOn] = useState(true)
  const [remoteAudioMuted, setRemoteAudioMuted] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'waiting' | 'connecting' | 'connected' | 'disconnected'>('idle')
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [receivedScore, setReceivedScore] = useState<any>(null)
  const [mobileTab, setMobileTab] = useState<'code' | 'video' | 'io'>('code')
  const [mounted, setMounted] = useState(false)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
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
  }, [cameraOn, connected, mounted, showSearch])

  // Sync remote camera stream to remote video element
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

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/coding-session')
      if (!res.ok) {
        setSessions([])
        return
      }
      const contentType = res.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json()
        setSessions(data.sessions || [])
      } else {
        setSessions([])
      }
    } catch (error) {
      console.warn('Failed to fetch sessions:', error)
      setSessions([])
    }
  }

  const handleCopyOutput = () => {
    if (!output) return
    navigator.clipboard.writeText(output)
    setOutputCopied(true)
    setTimeout(() => setOutputCopied(false), 2000)
  }

  const handleClearOutput = () => {
    setOutput('')
    setExecStatus(null)
    setExecTime(null)
    setExecMemory(null)
  }

  const handleResetTemplate = () => {
    const defaultTpl = templates[language] || ''
    setCode(defaultTpl)
    if (connected && socketRef.current && roomIdRef.current) {
      socketRef.current.emit('code-change', {
        code: defaultTpl,
        roomId: roomIdRef.current
      })
    }
    showToast(`Template reset to ${languageLabels[language] || language}`)
  }

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
      }
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream
        await previewVideoRef.current.play().catch(e => console.log(e))
      }
      setCameraOn(true)
      setLocalVideoReady(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Camera access denied. Please allow camera permissions in your browser.')
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
      console.log('✅ Student connected to Socket.IO signaling server')
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
        showToast(`Interviewer set language to ${languageLabels[data.language] || data.language}`)
      }
    })

    socket.on('code-output', (data: any) => {
      if (data && data.output !== undefined) {
        setOutput(data.output)
        if (data.status) setExecStatus(data.status)
        if (data.time) setExecTime(data.time)
        if (data.memory) setExecMemory(data.memory)
      }
    })

    socket.on('webrtc-offer', async ({ offer }: any) => {
      console.log('📥 Student received WebRTC offer from interviewer')
      setConnectionStatus('connecting')
      await handleOffer(offer)
    })

    socket.on('webrtc-answer', async ({ answer }: any) => {
      console.log('📥 Received WebRTC answer')
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer))
          setConnectionStatus('connected')
        } catch (err) {
          console.error('Error setting answer on student:', err)
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

    socket.on('active-rooms', ({ rooms }: any) => {
      console.log('Received active rooms:', rooms)
      setAvailableRooms(rooms || [])
      setLoadingRooms(false)
    })

    socket.on('rooms-updated', () => {
      if (showSearch && !connected && socketRef.current) {
        socketRef.current.emit('get-active-rooms')
      }
    })

    socket.on('user-left', () => {
      console.log('Interviewer disconnected')
      showToast('⚠️ Interviewer disconnected or session ended')
      setRemoteVideoReady(false)
      setRemoteStream(null)
      remoteStreamRef.current = null
      setConnectionStatus('disconnected')
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null
      }
    })

    socket.on('session-score', ({ score, feedback }: any) => {
      console.log('🎉 Received assessment score:', score, feedback)
      setReceivedScore({ score, feedback })
      setShowScoreModal(true)
      showToast(`Interview evaluated! Score: ${score}/100`)
      fetchSessions()
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
        console.log('🎬 Adding local student tracks to peer connection...')
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current!)
        })
      }

      pc.ontrack = (event) => {
        console.log('🎥 Student received interviewer track:', event.track.kind)
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
              remoteVideoRef.current.play().catch(e => console.error('Muted play failed:', e))
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
        console.log('Student PC connection state:', pc.connectionState)
        if (pc.connectionState === 'connected') {
          setConnectionStatus('connected')
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setConnectionStatus('disconnected')
        }
      }

      return pc
    } catch (error) {
      console.error('Error initializing student peer connection:', error)
      return null
    }
  }

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) {
      await initializePeerConnection(roomIdRef.current || roomId)
    }
    const pc = peerConnectionRef.current
    if (!pc) return
    
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      console.log('✅ Student set remote description from offer')
      
      if (pendingCandidatesRef.current.length > 0) {
        console.log(`🧩 Student flushing ${pendingCandidatesRef.current.length} queued ICE candidates`)
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(candidate).catch(e => console.warn(e))
        }
        pendingCandidatesRef.current = []
      }
      
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      
      const activeRoom = roomIdRef.current || roomId
      if (socketRef.current && activeRoom) {
        socketRef.current.emit('webrtc-answer', {
          roomId: activeRoom,
          answer
        })
        console.log('📤 Student sent WebRTC answer to room:', activeRoom)
      }
    } catch (error) {
      console.error('Error in student handleOffer:', error)
    }
  }

  const joinRoom = async (targetRoomId: string) => {
    const cleanId = targetRoomId.trim().toUpperCase()
    if (!cleanId) {
      alert('Please enter a valid Room ID')
      return
    }
    if (!candidateName.trim()) {
      alert('Please enter your candidate name')
      return
    }
    if (!cameraOn) {
      alert('Please start your camera first so the interviewer can see you.')
      return
    }

    setRoomId(cleanId)
    roomIdRef.current = cleanId

    const socket = initializeSocket()
    await initializePeerConnection(cleanId)

    socket.emit('join-room', { roomId: cleanId, role: 'student', name: candidateName.trim() })
    setConnected(true)
    setShowSearch(false)
    setConnectionStatus('connecting')
    showToast(`Joined room ${cleanId}! Establishing live session...`)
  }

  const loadAvailableRooms = () => {
    if (!candidateName.trim()) {
      alert('Please enter your name first')
      return
    }
    setLoadingRooms(true)
    setShowSearch(true)
    const socket = initializeSocket()
    setTimeout(() => {
      if (socket) {
        socket.emit('get-active-rooms')
      }
    }, 500)
  }

  const handleCodeChange = (value: string | undefined) => {
    const val = value || ''
    setCode(val)
    if (connected && socketRef.current && roomIdRef.current) {
      socketRef.current.emit('code-change', { roomId: roomIdRef.current, code: val })
    }
  }

  const runCode = async () => {
    setRunning(true)
    setExecStatus('Compiling & Executing...')
    setOutput('Compiling and running code...\n')
    
    try {
      const startTime = performance.now()
      const res = await fetch('/api/code-execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, input })
      })
      
      let data: any = {}
      const contentType = res.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        data = await res.json()
      } else {
        const rawText = await res.text()
        data = { output: rawText || 'Execution completed with no output.', error: res.ok ? undefined : `Server returned status ${res.status}` }
      }
      
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(2) + 's'

      const resultText = data.output || data.error || 'Execution finished with no output.'
      const statusText = data.status || (data.error ? 'Error' : 'Success')
      const timeVal = data.executionTime || elapsed
      const memVal = data.memory || undefined

      setOutput(resultText)
      setExecStatus(statusText)
      setExecTime(timeVal)
      setExecMemory(memVal)

      if (socketRef.current && roomIdRef.current) {
        socketRef.current.emit('code-output', {
          output: resultText,
          status: statusText,
          time: timeVal,
          memory: memVal,
          roomId: roomIdRef.current
        })
      }
    } catch (error: any) {
      const err = `Execution failed: ${error.message || 'Network error'}`
      setOutput(err)
      setExecStatus('Error')
      if (socketRef.current && roomIdRef.current) {
        socketRef.current.emit('code-output', {
          output: err,
          status: 'Error',
          roomId: roomIdRef.current
        })
      }
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className={styles.layout}>
      <StudentSidebar />
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <BackButton fallbackHref="/student/dashboard" />
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
                <h1 className={styles.pageTitle} style={{ margin: 0, fontSize: '20px' }}>Coding Judge &amp; Live VC</h1>
                <p className={styles.pageSubtitle} style={{ margin: 0, fontSize: '12px' }}>Multi-language compiler &amp; real-time technical assessment</p>
              </div>
            </div>
          </div>

          {connected && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '30px'
              }}>
                <Radio size={14} color="#10b981" className="animate-pulse" />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Room:</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#10b981', letterSpacing: '2px', fontFamily: 'monospace' }}>
                  {roomId}
                </span>
              </div>
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
            <>
              <div className={`glass ${styles.panel}`} style={{ textAlign: 'center', padding: '40px 24px', maxWidth: '640px', margin: '0 auto 30px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(16,185,129,0.15)', color: '#10b981', marginBottom: '16px', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <Target size={32} strokeWidth={1.75} />
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Join Coding Interview Session</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
                  Enter your name and test your camera to connect with the interviewer
                </p>
                
                {!showSearch ? (
                  <div style={{ maxWidth: '420px', margin: '0 auto' }}>
                    <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>Candidate Name</label>
                      <div style={{ position: 'relative' }}>
                        <User size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                          type="text"
                          value={candidateName}
                          onChange={(e) => setCandidateName(e.target.value)}
                          placeholder="e.g. Alex Johnson"
                          className="form-input"
                          style={{ width: '100%', paddingLeft: '38px', fontSize: '14px', height: '42px' }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>Judge Room ID</label>
                      <input
                        type="text"
                        value={searchRoomId}
                        onChange={(e) => setSearchRoomId(e.target.value.toUpperCase())}
                        placeholder="e.g. 8AB3CF"
                        className="form-input"
                        style={{ width: '100%', textAlign: 'center', fontSize: '18px', fontWeight: 700, letterSpacing: '3px', fontFamily: 'monospace', height: '44px' }}
                      />
                    </div>

                    {/* Camera Preview Box */}
                    <div style={{
                      width: '100%',
                      margin: '0 auto 20px',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      border: cameraOn ? '2px solid rgba(16,185,129,0.5)' : '1px dashed var(--border)',
                      background: '#090d16',
                      position: 'relative',
                      minHeight: '190px',
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
                          height: '190px',
                          objectFit: 'cover',
                          transform: 'scaleX(-1)',
                          display: cameraOn ? 'block' : 'none'
                        }}
                      />

                      {!cameraOn && (
                        <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                          <VideoOff size={32} strokeWidth={1.5} style={{ margin: '0 auto 8px', opacity: 0.6 }} />
                          <p style={{ fontSize: '13px', margin: 0 }}>Camera is off</p>
                        </div>
                      )}

                      {cameraOn && (
                        <div style={{
                          position: 'absolute',
                          bottom: '8px',
                          left: '8px',
                          right: '8px',
                          fontSize: '11.5px',
                          color: '#10b981',
                          padding: '4px 10px',
                          background: 'rgba(0,0,0,0.75)',
                          backdropFilter: 'blur(6px)',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={12} />
                            Ready
                          </span>
                          <span style={{ color: micOn ? '#10b981' : '#f59e0b' }}>
                            {micOn ? 'Mic: On' : 'Mic: Off'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '14px' }}>
                      <button 
                        onClick={toggleCamera} 
                        className={`btn ${cameraOn ? 'btn-secondary' : 'btn-primary'}`} 
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'center' }}
                      >
                        {cameraOn ? <VideoOff size={16} /> : <Video size={16} />}
                        <span>{cameraOn ? 'Stop Camera' : 'Start Camera'}</span>
                      </button>

                      <button 
                        onClick={() => joinRoom(searchRoomId)} 
                        disabled={!candidateName.trim() || !searchRoomId.trim() || !cameraOn}
                        className="btn btn-primary" 
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          flex: 1.2,
                          justifyContent: 'center',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        }}
                      >
                        <LogIn size={16} />
                        <span>Join Room</span>
                      </button>
                    </div>

                    <button 
                      onClick={loadAvailableRooms} 
                      className="btn btn-secondary btn-sm"
                      style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Search size={14} />
                      <span>Browse Active Interview Rooms</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ maxWidth: '520px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Active Interview Rooms</h4>
                      <button 
                        onClick={() => socketRef.current?.emit('get-active-rooms')}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <RefreshCw size={12} />
                        <span>Refresh</span>
                      </button>
                    </div>

                    {loadingRooms ? (
                      <div style={{ padding: '30px', textAlign: 'center' }}>
                        <MorphingInfinity className="size-6" style={{ margin: '0 auto 8px' }} />
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Scanning for open sessions...</p>
                      </div>
                    ) : availableRooms.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                        {availableRooms.map((room: any) => (
                          <div key={room.roomId} style={{
                            padding: '14px 16px',
                            background: 'rgba(16,185,129,0.08)',
                            border: '1px solid rgba(16,185,129,0.25)',
                            borderRadius: '10px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div style={{ textAlign: 'left' }}>
                              <p style={{ fontSize: '18px', fontWeight: '800', color: '#10b981', letterSpacing: '2px', fontFamily: 'monospace', margin: 0 }}>
                                {room.roomId}
                              </p>
                              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', margin: 0 }}>
                                Live since {new Date(room.info?.createdAt || Date.now()).toLocaleTimeString()}
                              </p>
                            </div>
                            <button 
                              onClick={() => joinRoom(room.roomId)} 
                              className="btn btn-primary btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <LogIn size={13} />
                              <span>Join Live</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '30px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '16px' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>No public active rooms detected.</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '11.5px', marginTop: '4px' }}>Ask the interviewer for their 6-digit Judge Room ID.</p>
                      </div>
                    )}
                    
                    <button 
                      onClick={() => setShowSearch(false)} 
                      className="btn btn-secondary"
                      style={{ width: '100%' }}
                    >
                      Back to Direct Join
                    </button>
                  </div>
                )}
              </div>

              {/* Past Sessions List */}
              {sessions.length > 0 && (
                <div className={`glass ${styles.panel}`} style={{ maxWidth: '800px', margin: '0 auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Clock size={18} strokeWidth={2} color="#10b981" />
                    <h3 className={styles.panelTitle} style={{ margin: 0, fontSize: '16px' }}>Past Interview Assessments</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {sessions.map((session: any) => (
                      <div key={session.id} style={{
                        padding: '16px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '10px',
                        border: '1px solid var(--border)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>{session.company_name || 'Interview Session'}</p>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                              {new Date(session.started_at).toLocaleDateString()} at {new Date(session.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          {session.score !== null && (
                            <div style={{
                              padding: '6px 14px',
                              background: session.score >= 70 ? 'rgba(16,185,129,0.2)' : session.score >= 40 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
                              border: `1px solid ${session.score >= 70 ? 'rgba(16,185,129,0.4)' : session.score >= 40 ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.4)'}`,
                              borderRadius: '20px',
                              fontSize: '16px',
                              fontWeight: '800',
                              color: session.score >= 70 ? '#10b981' : session.score >= 40 ? '#f59e0b' : '#ef4444'
                            }}>
                              {session.score}/100
                            </div>
                          )}
                        </div>
                        {session.feedback && (
                          <div style={{
                            padding: '10px 14px',
                            background: 'rgba(124,58,237,0.08)',
                            border: '1px solid rgba(124,58,237,0.2)',
                            borderRadius: '8px',
                            marginTop: '8px'
                          }}>
                            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '0 0 4px 0', fontWeight: 600 }}>Feedback:</p>
                            <p style={{ fontSize: '13px', lineHeight: '1.5', margin: 0, color: 'var(--text-primary)' }}>{session.feedback}</p>
                          </div>
                        )}
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
                >
                  <Code2 size={15} strokeWidth={2} />
                  <span>Code Editor</span>
                </button>
                <button
                  onClick={() => setMobileTab('video')}
                  className={`${styles.mobileTabButton} ${mobileTab === 'video' ? styles.mobileTabButtonActive : ''}`}
                >
                  <Video size={15} strokeWidth={2} />
                  <span>Video Call ({connectionStatus === 'connected' ? 'Live' : 'Connecting'})</span>
                </button>
                <button
                  onClick={() => setMobileTab('io')}
                  className={`${styles.mobileTabButton} ${mobileTab === 'io' ? styles.mobileTabButtonActive : ''}`}
                >
                  <Terminal size={15} strokeWidth={2} />
                  <span>Terminal Output</span>
                </button>
              </div>

              {/* Left Column: Monaco Code Editor & Terminal */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className={mobileTab === 'video' ? styles.hideOnMobileTab : ''}>
                {(mobileTab === 'code' || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
                  <div className={`glass ${styles.panel}`} style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Language:</span>
                        <span className="badge badge-purple" style={{ fontSize: '12px', fontWeight: 600 }}>
                          {languageLabels[language] || language.toUpperCase()}
                        </span>
                        <button
                          onClick={handleResetTemplate}
                          className="btn btn-secondary btn-sm"
                          title="Reset editor to starter boilerplate"
                          style={{ height: '28px', padding: '0 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                        >
                          <RotateCcw size={11} />
                          <span>Reset</span>
                        </button>
                      </div>

                      <button 
                        onClick={runCode} 
                        disabled={running} 
                        className="btn btn-primary btn-sm" 
                        style={{ minHeight: '38px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                      >
                        {running ? (
                          <>
                            <MorphingInfinity className="size-4" style={{ width: '14px', height: '14px' }} />
                            <span>Compiling &amp; Running...</span>
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
                        language={languageMap[language] || 'cpp'}
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '14px' }}>
                      {/* Standard Input (stdin) */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Terminal size={14} strokeWidth={2} color="#10b981" />
                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Standard Input (stdin)</label>
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Optional</span>
                        </div>
                        <textarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="Provide test inputs (e.g. 5 10)..."
                          style={{
                            width: '100%',
                            height: '140px',
                            padding: '10px',
                            background: 'rgba(0,0,0,0.35)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            color: 'var(--text-primary)',
                            fontSize: '12.5px',
                            fontFamily: 'monospace',
                            resize: 'none'
                          }}
                        />
                      </div>

                      {/* Execution Output Console Screen */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Terminal size={14} strokeWidth={2} color="#10b981" />
                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Execution Output</label>
                            {execStatus && (
                              <span style={{
                                fontSize: '10.5px',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: execStatus === 'Accepted' || execStatus === 'Success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                color: execStatus === 'Accepted' || execStatus === 'Success' ? '#10b981' : '#ef4444',
                                border: `1px solid ${execStatus === 'Accepted' || execStatus === 'Success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
                              }}>
                                {execStatus}
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {execTime && (
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <Clock size={11} /> {execTime}
                              </span>
                            )}
                            {execMemory && (
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <Cpu size={11} /> {execMemory}
                              </span>
                            )}
                            {output && (
                              <>
                                <button
                                  onClick={handleCopyOutput}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '2px 6px', height: '22px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                  title="Copy Output"
                                >
                                  {outputCopied ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                                  <span>{outputCopied ? 'Copied' : 'Copy'}</span>
                                </button>
                                <button
                                  onClick={handleClearOutput}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '2px 6px', height: '22px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                  title="Clear Console Output"
                                >
                                  <Trash2 size={11} />
                                  <span>Clear</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <pre style={{
                          height: '140px',
                          padding: '10px',
                          background: 'rgba(0,0,0,0.55)',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          fontSize: '12.5px',
                          fontFamily: 'monospace',
                          color: output.includes('Error') || output.includes('error') || output.includes('Exception') ? '#f43f5e' : '#10b981',
                          overflow: 'auto',
                          margin: 0,
                          lineHeight: '1.5'
                        }}>
                          {output || 'Output will appear here when you or the interviewer runs code...'}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: WebRTC Video Streams & Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className={mobileTab !== 'video' ? styles.hideOnMobileTab : ''}>
                {/* Interviewer Video Stream */}
                <div className={`glass ${styles.panel}`} style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Video size={16} strokeWidth={2} color="#10b981" />
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Interviewer</h4>
                    </div>
                    <span className="badge badge-purple" style={{ fontSize: '11px' }}>
                      {remoteVideoReady ? 'Connected' : 'Connecting...'}
                    </span>
                  </div>

                  <div style={{ width: '100%', height: '220px', background: '#090d16', borderRadius: '10px', overflow: 'hidden', position: 'relative', border: '1px solid var(--border)' }}>
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />

                    {!remoteVideoReady && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(9,13,22,0.85)', color: 'var(--text-secondary)', fontSize: '13px', padding: '16px', textAlign: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                          <VideoOff size={20} strokeWidth={1.5} color="#94a3b8" />
                        </div>
                        Waiting for interviewer video feed...
                      </div>
                    )}

                    {remoteVideoReady && (
                      <div style={{ position: 'absolute', bottom: '10px', right: '10px', display: 'flex', gap: '6px' }}>
                        <button
                          onClick={toggleRemoteAudio}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.2)' }}
                          title={remoteAudioMuted ? 'Unmute interviewer audio' : 'Mute interviewer audio'}
                        >
                          {remoteAudioMuted ? <VolumeX size={14} color="#f59e0b" /> : <Volume2 size={14} color="#10b981" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Candidate (Your) Camera Stream */}
                <div className={`glass ${styles.panel}`} style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Video size={16} strokeWidth={2} color="#10b981" />
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>You ({candidateName})</h4>
                    </div>
                    <span className="badge badge-green" style={{ fontSize: '11px' }}>Candidate</span>
                  </div>

                  <div style={{ width: '100%', height: '180px', background: '#090d16', borderRadius: '10px', overflow: 'hidden', position: 'relative', border: '1px solid var(--border)' }}>
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: 'scaleX(-1)'
                      }}
                    />

                    {!localVideoReady && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(9,13,22,0.85)', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        Camera is off
                      </div>
                    )}

                    {/* Local Media Controls */}
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

                {/* Connection Status Box */}
                <div className={`glass ${styles.panel}`} style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Connection Status:</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: connectionStatus === 'connected' ? '#10b981' : '#f59e0b' }}>
                      {connectionStatus === 'connected' ? '● Video Stream Active' : connectionStatus === 'connecting' ? 'Negotiating WebRTC...' : 'Connecting...'}
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

      {/* Completion Assessment Score Modal */}
      {showScoreModal && receivedScore && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem'
        }}>
          <div className="glass" style={{ padding: '36px 30px', maxWidth: '480px', width: '100%', textAlign: 'center', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(16,185,129,0.15)', color: '#10b981', marginBottom: '16px', border: '1px solid rgba(16,185,129,0.3)' }}>
              <Award size={36} strokeWidth={1.75} />
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>Interview Assessment Complete!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>Your technical coding performance has been evaluated.</p>
            
            <div style={{
              padding: '20px',
              background: receivedScore.score >= 70 ? 'rgba(16,185,129,0.15)' : receivedScore.score >= 40 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${receivedScore.score >= 70 ? 'rgba(16,185,129,0.35)' : receivedScore.score >= 40 ? 'rgba(245,158,11,0.35)' : 'rgba(239,68,68,0.35)'}`,
              borderRadius: '12px',
              marginBottom: '20px'
            }}>
              <p style={{ fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Your Score</p>
              <p style={{ 
                fontSize: '44px', 
                fontWeight: '900', 
                margin: 0,
                color: receivedScore.score >= 70 ? '#10b981' : receivedScore.score >= 40 ? '#f59e0b' : '#ef4444'
              }}>
                {receivedScore.score}<span style={{ fontSize: '20px', fontWeight: 500, color: 'var(--text-secondary)' }}>/100</span>
              </p>
            </div>

            {receivedScore.feedback && (
              <div style={{
                padding: '14px 16px',
                background: 'rgba(124,58,237,0.08)',
                border: '1px solid rgba(124,58,237,0.2)',
                borderRadius: '10px',
                marginBottom: '24px',
                textAlign: 'left'
              }}>
                <p style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>Interviewer Feedback:</p>
                <p style={{ fontSize: '13px', lineHeight: '1.5', margin: 0, color: 'var(--text-primary)' }}>{receivedScore.feedback}</p>
              </div>
            )}

            <button 
              onClick={() => {
                setShowScoreModal(false)
                window.location.reload()
              }} 
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
            >
              Finish &amp; Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
