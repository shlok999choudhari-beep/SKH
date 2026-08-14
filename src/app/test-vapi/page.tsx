'use client'
import { useEffect, useRef, useState } from 'react'
import Vapi from '@vapi-ai/web'

export default function TestVAPI() {
  const [status, setStatus] = useState('Not started')
  const [messages, setMessages] = useState<any[]>([])
  const vapiRef = useRef<any>(null)

  const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || ''
  const ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || ''

  useEffect(() => {
    vapiRef.current = new Vapi(VAPI_PUBLIC_KEY)

    vapiRef.current.on('call-start', () => {
      console.log('✅ Call started')
      setStatus('Call active')
    })

    vapiRef.current.on('call-end', () => {
      console.log('❌ Call ended')
      setStatus('Call ended')
    })

    vapiRef.current.on('speech-start', () => {
      console.log('🎤 User started speaking')
      setMessages(prev => [...prev, { type: 'event', text: 'User started speaking' }])
    })

    vapiRef.current.on('speech-end', () => {
      console.log('🔇 User stopped speaking')
      setMessages(prev => [...prev, { type: 'event', text: 'User stopped speaking' }])
    })

    vapiRef.current.on('message', (message: any) => {
      console.log('📨 Message:', message)
      setMessages(prev => [...prev, message])
    })

    vapiRef.current.on('error', (error: any) => {
      console.error('❌ Error:', error)
      setStatus('Error: ' + error.message)
    })

    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop()
      }
    }
  }, [])

  const startCall = async () => {
    try {
      setStatus('Starting...')
      await vapiRef.current.start(ASSISTANT_ID)
    } catch (error: any) {
      console.error('Failed to start:', error)
      setStatus('Failed: ' + error.message)
    }
  }

  const stopCall = () => {
    vapiRef.current.stop()
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🧪 VAPI Test Page</h1>
      
      <div style={{ marginBottom: '20px', padding: '20px', background: '#f3f4f6', borderRadius: '8px' }}>
        <p><strong>Status:</strong> {status}</p>
        <p><strong>Public Key:</strong> {VAPI_PUBLIC_KEY}</p>
        <p><strong>Assistant ID:</strong> {ASSISTANT_ID}</p>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
        <button 
          onClick={startCall}
          style={{ padding: '12px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          🎤 Start Call
        </button>
        <button 
          onClick={stopCall}
          style={{ padding: '12px 24px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          ⏹️ Stop Call
        </button>
      </div>

      <div style={{ padding: '20px', background: '#1f2937', color: 'white', borderRadius: '8px', maxHeight: '600px', overflow: 'auto' }}>
        <h3>📋 Messages Log</h3>
        {messages.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>No messages yet...</p>
        ) : (
          messages.map((msg, i) => (
            <div key={i} style={{ marginBottom: '12px', padding: '12px', background: '#374151', borderRadius: '4px' }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                {JSON.stringify(msg, null, 2)}
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
