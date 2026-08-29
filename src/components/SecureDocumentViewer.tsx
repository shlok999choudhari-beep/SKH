'use client'
import React, { useState, useEffect } from 'react'
import {
  Lock,
  Unlock,
  ShieldCheck,
  Eye,
  Download,
  X,
  RefreshCw,
  AlertTriangle,
  FileCheck,
  KeyRound,
  ShieldAlert,
  Sparkles,
  ExternalLink
} from 'lucide-react'
import styles from './SecureDocumentViewer.module.css'

interface SecureDocumentViewerProps {
  documentId: number | null
  documentName?: string
  isOpen: boolean
  onClose: () => void
  onSecurityClick?: () => void
}

export default function SecureDocumentViewer({
  documentId,
  documentName,
  isOpen,
  onClose,
  onSecurityClick
}: SecureDocumentViewerProps) {
  const [loading, setLoading] = useState(true)
  const [securityData, setSecurityData] = useState<any>(null)
  const [needsPassword, setNeedsPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [grantToken, setGrantToken] = useState<string | null>(null)
  const [unlocking, setUnlocking] = useState(false)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [lockMsg, setLockMsg] = useState('')
  const [downloading, setDownloading] = useState(false)

  // Fetch document security status first
  const initViewer = async () => {
    if (!documentId) return
    setLoading(true)
    setPasswordError('')
    setPassword('')
    setGrantToken(null)
    setStreamUrl(null)
    setIsLocked(false)
    setLockMsg('')

    try {
      const res = await fetch(`/api/documents/${documentId}/security`)
      const data = await res.json()

      if (data.success && data.security) {
        const s = data.security
        setSecurityData(s)

        if (s.isLocked) {
          setIsLocked(true)
          setLockMsg('Document is temporarily locked due to excessive failed attempts.')
          setNeedsPassword(true)
          setLoading(false)
          return
        }

        if (s.isPasswordProtected) {
          setNeedsPassword(true)
          setLoading(false)
        } else {
          // Open directly
          setNeedsPassword(false)
          setStreamUrl(`/api/documents/${documentId}/stream?_t=${Date.now()}`)
          setLoading(false)
        }
      } else {
        setStreamUrl(`/api/documents/${documentId}/stream?_t=${Date.now()}`)
        setLoading(false)
      }
    } catch {
      setStreamUrl(`/api/documents/${documentId}/stream?_t=${Date.now()}`)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && documentId) {
      initViewer()
    }
  }, [isOpen, documentId])

  if (!isOpen || !documentId) return null

  // Handle password unlock
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      setPasswordError('Please enter password')
      return
    }

    setUnlocking(true)
    setPasswordError('')

    try {
      const res = await fetch(`/api/documents/${documentId}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() })
      })

      const data = await res.json()

      if (data.success && data.grantToken) {
        setGrantToken(data.grantToken)
        setNeedsPassword(false)
        setStreamUrl(`/api/documents/${documentId}/stream?grant=${data.grantToken}&_t=${Date.now()}`)
      } else if (data.isLocked) {
        setIsLocked(true)
        setLockMsg(data.error || 'Document locked due to 5 consecutive failed attempts.')
      } else {
        setPasswordError(data.error || 'Incorrect password')
      }
    } catch (err: any) {
      setPasswordError('Failed to verify password: ' + err.message)
    } finally {
      setUnlocking(false)
    }
  }

  // Handle Download
  const handleDownload = async () => {
    if (!documentId) return
    setDownloading(true)
    try {
      const url = grantToken
        ? `/api/documents/${documentId}/stream?grant=${grantToken}&download=true`
        : `/api/documents/${documentId}/stream?download=true`

      const link = document.createElement('a')
      link.href = url
      link.download = documentName || `Document_${documentId}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      alert('Download error: ' + err)
    } finally {
      setDownloading(false)
    }
  }

  const isViewOnly = securityData?.isViewOnly || securityData?.downloadPolicy === 'DISABLED'
  const isLimited = securityData?.downloadPolicy === 'LIMITED'
  const downloadExhausted = isLimited && securityData?.downloadCount >= (securityData?.maxDownloads || 3)
  const currentFileName = documentName || securityData?.fileName || `Document #${documentId}`
  const isImage = Boolean(
    securityData?.fileType?.startsWith('image/') ||
    /\.(png|jpe?g|webp|bmp|gif|tiff|svg)$/i.test(currentFileName)
  )

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.viewerContainer} onClick={e => e.stopPropagation()}>
        {/* Top Control Bar */}
        <div className={styles.topBar}>
          <div className={styles.topInfo}>
            <ShieldCheck size={18} color="#8b5cf6" />
            <h3 className={styles.title}>
              <span>{currentFileName}</span>
              <span className={`${styles.badge} ${styles.badgeProtected}`}>
                {securityData?.securityLevel || 'PROTECTED'}
              </span>
              {securityData?.integrityVerified && (
                <span className={`${styles.badge} ${styles.badgeVerified}`}>
                  <FileCheck size={12} style={{ display: 'inline', marginRight: '3px' }} />
                  SHA-256 Verified
                </span>
              )}
            </h3>
          </div>

          <div className={styles.topActions}>
            {onSecurityClick && (
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={onSecurityClick}
                title="Open Security Settings"
              >
                <Lock size={13} color="#c084fc" />
                <span>Security Panel</span>
              </button>
            )}

            {!needsPassword && streamUrl && (
              <a
                href={streamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.btnSecondary}
                title="Open document in a new tab"
                style={{ textDecoration: 'none' }}
              >
                <ExternalLink size={13} />
                <span>Pop out</span>
              </a>
            )}

            {!needsPassword && !isViewOnly && !downloadExhausted && (
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={handleDownload}
                disabled={downloading}
                title="Download verified document copy"
              >
                <Download size={13} />
                <span>{downloading ? 'Downloading...' : 'Download'}</span>
              </button>
            )}

            <button type="button" className={styles.btnSecondary} onClick={onClose} style={{ padding: '8px' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* View-Only Banner */}
        {isViewOnly && !needsPassword && (
          <div className={styles.bannerViewOnly}>
            <Eye size={15} />
            <span>👁 <strong>View-Only Mode Active:</strong> Direct file downloading is disabled for this protected institutional document.</span>
          </div>
        )}

        {/* Download Quota Notice */}
        {isLimited && !isViewOnly && !needsPassword && (
          <div className={styles.bannerViewOnly} style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.2)' }}>
            <Download size={14} />
            <span>Download Allowance: {securityData?.downloadCount || 0} / {securityData?.maxDownloads || 3} copies used.</span>
          </div>
        )}

        {/* Viewport Content */}
        <div className={styles.viewportArea}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#94a3b8' }}>
              <RefreshCw size={22} className="animate-spin" color="#8b5cf6" />
              <span>Decrypting & Loading Vault Stream...</span>
            </div>
          ) : needsPassword ? (
            /* Password Unlock Card */
            <div className={styles.unlockCard}>
              <div className={styles.unlockIcon} style={{ borderColor: isLocked ? '#ef4444' : undefined, color: isLocked ? '#ef4444' : undefined }}>
                {isLocked ? <ShieldAlert size={28} /> : <KeyRound size={28} />}
              </div>

              <div>
                <h4 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 6px 0' }}>
                  {isLocked ? 'Document Locked' : 'Password Protected Document'}
                </h4>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                  {isLocked
                    ? lockMsg
                    : 'This document requires password authentication before decrypting and displaying content.'}
                </p>
              </div>

              {!isLocked ? (
                <form onSubmit={handleUnlock} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    type="password"
                    placeholder="Enter document password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={styles.input}
                    autoFocus
                  />

                  {passwordError && (
                    <span style={{ fontSize: '12px', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <AlertTriangle size={13} /> {passwordError}
                    </span>
                  )}

                  <button type="submit" className={styles.btnPrimary} style={{ width: '100%', justifyContent: 'center' }} disabled={unlocking}>
                    <Unlock size={15} />
                    <span>{unlocking ? 'Verifying Password...' : 'Unlock Document'}</span>
                  </button>
                </form>
              ) : (
                <div style={{ fontSize: '12px', color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', padding: '10px 14px', borderRadius: '8px' }}>
                  Adaptive Security Engine has restricted access to protect against brute-force attacks.
                </div>
              )}
            </div>
          ) : streamUrl ? (
            /* Secure Document Preview */
            <>
              {/* Dynamic Watermark Overlay on Viewer */}
              {securityData?.watermarkEnabled && (
                <div className={styles.watermarkOverlay}>
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className={styles.watermarkCell}>
                      <span>{securityData?.watermarkText || 'PLACEIQ CONFIDENTIAL'}</span>
                      <span style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>
                        DOC #{documentId} • {new Date().toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {isImage ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', padding: '16px' }}>
                  <img
                    src={streamUrl}
                    alt={currentFileName}
                    className={styles.imagePreview}
                  />
                </div>
              ) : (
                <iframe
                  src={streamUrl}
                  className={styles.documentFrame}
                  title={currentFileName}
                />
              )}
            </>
          ) : (
            <div style={{ color: '#ef4444' }}>Failed to stream document.</div>
          )}
        </div>
      </div>
    </div>
  )
}
