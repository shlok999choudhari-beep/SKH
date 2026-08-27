'use client'
import React, { useState, useEffect, use } from 'react'
import Logo from '@/components/Logo'
import {
  ShieldCheck,
  Lock,
  Unlock,
  Eye,
  Download,
  AlertTriangle,
  FileCheck,
  KeyRound,
  RefreshCw,
  Globe,
  Clock,
  Sparkles
} from 'lucide-react'

export default function PublicSharePage({
  params
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(params)
  const [loading, setLoading] = useState(true)
  const [shareData, setShareData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isExpired, setIsExpired] = useState(false)
  const [isRevoked, setIsRevoked] = useState(false)

  // Password Unlock State
  const [needsPassword, setNeedsPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [grantToken, setGrantToken] = useState<string | null>(null)
  const [unlocking, setUnlocking] = useState(false)

  const fetchShareDetails = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/documents/share/${token}`)
      const data = await res.json()

      if (data.success && data.share) {
        setShareData(data.share)
        if (data.share.requiresPassword) {
          setNeedsPassword(true)
        }
      } else {
        setError(data.error || 'Invalid or expired share link.')
        if (data.isExpired) setIsExpired(true)
        if (data.isRevoked) setIsRevoked(true)
      }
    } catch (err: any) {
      setError('Failed to connect to PlaceIQ secure vault: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchShareDetails()
    }
  }, [token])

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      setPasswordError('Please enter password')
      return
    }

    setUnlocking(true)
    setPasswordError('')

    try {
      const res = await fetch(`/api/documents/share/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() })
      })

      const data = await res.json()

      if (data.success && data.grantToken) {
        setGrantToken(data.grantToken)
        setNeedsPassword(false)
      } else {
        setPasswordError(data.error || 'Incorrect password')
      }
    } catch (err: any) {
      setPasswordError('Failed to unlock: ' + err.message)
    } finally {
      setUnlocking(false)
    }
  }

  const streamUrl = grantToken
    ? `/api/documents/share/${token}/stream?grant=${grantToken}`
    : `/api/documents/share/${token}/stream`

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a10', color: '#f8fafc', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top Header */}
      <header style={{ padding: '16px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(18,18,26,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Logo variant="student" size="sm" href="/" />
          <div style={{ height: '18px', width: '1px', background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: '13px', color: '#a78bfa', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={16} /> Secure Document Share
          </span>
        </div>

        {shareData && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', background: 'rgba(139,92,246,0.15)', color: '#c084fc', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(139,92,246,0.3)', fontWeight: 600 }}>
              {shareData.isViewOnly ? '👁 View Only' : '⬇ Download Permitted'}
            </span>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#94a3b8' }}>
            <RefreshCw size={22} className="animate-spin" color="#8b5cf6" />
            <span>Verifying Secure Access Token...</span>
          </div>
        ) : error ? (
          <div style={{ background: '#141420', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px', padding: '36px', maxWidth: '460px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
              <AlertTriangle size={28} />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#fca5a5' }}>
              {isExpired ? 'Access Expired' : isRevoked ? 'Link Revoked' : 'Access Restricted'}
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              {error}
            </p>
          </div>
        ) : needsPassword ? (
          /* Password Unlock Prompt */
          <div style={{ background: '#141420', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '16px', padding: '36px', maxWidth: '440px', width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
              <KeyRound size={28} />
            </div>

            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0' }}>Password Protected Document</h2>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                This file ({shareData.document?.fileName}) requires a password to view.
              </p>
            </div>

            <form onSubmit={handleUnlock} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="password"
                placeholder="Enter share password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none' }}
                autoFocus
              />

              {passwordError && (
                <span style={{ fontSize: '12px', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <AlertTriangle size={13} /> {passwordError}
                </span>
              )}

              <button
                type="submit"
                disabled={unlocking}
                style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', color: '#fff', border: 'none', padding: '11px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Unlock size={15} />
                <span>{unlocking ? 'Verifying Password...' : 'Unlock Document'}</span>
              </button>
            </form>
          </div>
        ) : (
          /* Secure Stream Recipient Viewer */
          <div style={{ width: '100%', maxWidth: '1050px', height: '88vh', background: '#0d0e15', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '18px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 70px rgba(0,0,0,0.8)' }}>
            {/* Sub Bar */}
            <div style={{ padding: '10px 20px', background: 'rgba(18,18,26,0.95)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{shareData.document?.fileName}</span>
                <span style={{ fontSize: '11px', color: '#34d399', background: 'rgba(16,185,129,0.15)', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                  ✓ SHA-256 Verified
                </span>
              </div>

              {shareData.allowDownload && (
                <a
                  href={`${streamUrl}&download=true`}
                  download={shareData.document?.fileName}
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Download size={13} />
                  <span>Download</span>
                </a>
              )}
            </div>

            {/* Document Iframe with Watermark */}
            <div style={{ flex: 1, position: 'relative', background: '#050508' }}>
              <iframe
                src={streamUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Secure Document Stream"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
