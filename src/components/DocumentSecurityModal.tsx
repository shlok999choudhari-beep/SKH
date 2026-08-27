'use client'
import React, { useState, useEffect } from 'react'
import {
  ShieldCheck,
  Lock,
  Eye,
  Download,
  Share2,
  History,
  Clock,
  Sparkles,
  KeyRound,
  FileCheck,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  X,
  FileText,
  RotateCcw,
  ShieldAlert,
  Calendar,
  Layers,
  Flame,
  Globe
} from 'lucide-react'
import styles from './DocumentSecurityModal.module.css'

interface DocumentSecurityModalProps {
  documentId: number | null
  documentName?: string
  isOpen: boolean
  onClose: () => void
  onUpdated?: () => void
}

type TabType = 'protection' | 'access' | 'watermark' | 'sharing' | 'versions' | 'activity'

export default function DocumentSecurityModal({
  documentId,
  documentName,
  isOpen,
  onClose,
  onUpdated
}: DocumentSecurityModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('protection')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [securityData, setSecurityData] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [versions, setVersions] = useState<any[]>([])
  const [shares, setShares] = useState<any[]>([])

  // Form State
  const [securityLevel, setSecurityLevel] = useState<'STANDARD' | 'PROTECTED' | 'HIGHLY_PROTECTED'>('STANDARD')
  const [isViewOnly, setIsViewOnly] = useState(false)
  const [downloadPolicy, setDownloadPolicy] = useState<'UNLIMITED' | 'LIMITED' | 'DISABLED'>('UNLIMITED')
  const [maxDownloads, setMaxDownloads] = useState<number>(3)
  const [accessExpiry, setAccessExpiry] = useState<string>('NEVER')
  const [watermarkEnabled, setWatermarkEnabled] = useState(false)
  const [watermarkText, setWatermarkText] = useState('PLACEIQ CONFIDENTIAL')

  // Password Setup
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // Share Generator
  const [shareExpiresIn, setShareExpiresIn] = useState<'1_HOUR' | '24_HOURS' | '7_DAYS' | '30_DAYS' | 'NEVER'>('24_HOURS')
  const [shareViewOnly, setShareViewOnly] = useState(true)
  const [shareAllowDownload, setShareAllowDownload] = useState(false)
  const [sharePassword, setSharePassword] = useState('')
  const [shareMaxAccess, setShareMaxAccess] = useState<number | ''>('')
  const [generatedShareUrl, setGeneratedShareUrl] = useState('')
  const [copiedShare, setCopiedShare] = useState(false)
  const [shareCreating, setShareCreating] = useState(false)

  // Integrity Check State
  const [integrityChecking, setIntegrityChecking] = useState(false)
  const [integrityStatus, setIntegrityStatus] = useState<string | null>(null)
  const [copiedHash, setCopiedHash] = useState(false)

  // Fetch all security details
  const fetchSecurityDetails = async () => {
    if (!documentId) return
    setLoading(true)
    try {
      const [secRes, actRes, verRes, shareRes] = await Promise.all([
        fetch(`/api/documents/${documentId}/security`),
        fetch(`/api/documents/${documentId}/activity`),
        fetch(`/api/documents/${documentId}/versions`),
        fetch(`/api/documents/${documentId}/share`)
      ])

      const secData = await secRes.json()
      const actData = await actRes.json()
      const verData = await verRes.json()
      const shareData = await shareRes.json()

      if (secData.success && secData.security) {
        const s = secData.security
        setSecurityData(s)
        setSecurityLevel(s.securityLevel || 'STANDARD')
        setIsViewOnly(Boolean(s.isViewOnly))
        setDownloadPolicy(s.downloadPolicy || 'UNLIMITED')
        setMaxDownloads(s.maxDownloads || 3)
        setAccessExpiry(s.accessExpiry || 'NEVER')
        setWatermarkEnabled(Boolean(s.watermarkEnabled))
        setWatermarkText(s.watermarkText || 'PLACEIQ CONFIDENTIAL')
      }

      if (actData.success) setActivities(actData.activities || [])
      if (verData.success) setVersions(verData.versions || [])
      if (shareData.success) setShares(shareData.shares || [])
    } catch (err) {
      console.error('Failed to load document security:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && documentId) {
      fetchSecurityDetails()
      setGeneratedShareUrl('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordError('')
      setIntegrityStatus(null)
    }
  }, [isOpen, documentId])

  if (!isOpen || !documentId) return null

  // Save Settings
  const handleSaveSecurity = async () => {
    setPasswordError('')
    if (newPassword && newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    setSaving(true)
    try {
      const body: any = {
        securityLevel,
        isViewOnly,
        downloadPolicy,
        maxDownloads: downloadPolicy === 'LIMITED' ? maxDownloads : null,
        accessExpiry,
        watermarkEnabled,
        watermarkText: watermarkText.trim() || null
      }

      if (newPassword.trim()) {
        body.password = newPassword.trim()
      }

      const res = await fetch(`/api/documents/${documentId}/security`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (data.success) {
        setNewPassword('')
        setConfirmPassword('')
        await fetchSecurityDetails()
        if (onUpdated) onUpdated()
      } else {
        alert(data.error || 'Failed to update security')
      }
    } catch (err: any) {
      alert('Error updating security: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // Remove Password
  const handleRemovePassword = async () => {
    if (!confirm('Are you sure you want to remove password protection from this document?')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/documents/${documentId}/security`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ removePassword: true })
      })
      const data = await res.json()
      if (data.success) {
        await fetchSecurityDetails()
        if (onUpdated) onUpdated()
      }
    } finally {
      setSaving(false)
    }
  }

  // Manual Unlock Override
  const handleUnlockOverride = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/documents/${documentId}/security`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unlockDocument: true })
      })
      const data = await res.json()
      if (data.success) {
        await fetchSecurityDetails()
        if (onUpdated) onUpdated()
      }
    } finally {
      setSaving(false)
    }
  }

  // Trigger SHA-256 Integrity Verification
  const handleVerifyIntegrity = async () => {
    setIntegrityChecking(true)
    setIntegrityStatus(null)
    try {
      const res = await fetch(`/api/documents/${documentId}/verify-integrity`, {
        method: 'POST'
      })
      const data = await res.json()
      if (data.success) {
        setIntegrityStatus('VERIFIED')
      } else {
        setIntegrityStatus('TAMPER_ALERT')
      }
      await fetchSecurityDetails()
    } catch {
      setIntegrityStatus('ERROR')
    } finally {
      setIntegrityChecking(false)
    }
  }

  // Generate Share Link
  const handleCreateShare = async (e: React.FormEvent) => {
    e.preventDefault()
    setShareCreating(true)
    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expiresIn: shareExpiresIn,
          isViewOnly: shareViewOnly,
          allowDownload: shareAllowDownload,
          password: sharePassword.trim() || undefined,
          maxAccessCount: shareMaxAccess ? Number(shareMaxAccess) : null
        })
      })
      const data = await res.json()
      if (data.success) {
        setGeneratedShareUrl(`${window.location.origin}/verify/share/${data.share.shareToken}`)
        setSharePassword('')
        await fetchSecurityDetails()
      } else {
        alert(data.error || 'Failed to create share link')
      }
    } catch (err: any) {
      alert('Error creating share link: ' + err.message)
    } finally {
      setShareCreating(false)
    }
  }

  // Revoke Share Link
  const handleRevokeShare = async (shareId: number) => {
    if (!confirm('Are you sure you want to revoke this secure share link? Access will be terminated immediately.')) return
    try {
      const res = await fetch(`/api/documents/${documentId}/share?shareId=${shareId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        await fetchSecurityDetails()
      }
    } catch (err) {
      console.error('Revoke share error:', err)
    }
  }

  // Restore Version
  const handleRestoreVersion = async (targetVersionId: number) => {
    if (!confirm(`Restore this previous version as the active current version?`)) return
    setSaving(true)
    try {
      const res = await fetch(`/api/documents/${documentId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetVersionId })
      })
      const data = await res.json()
      if (data.success) {
        alert(data.message || 'Version restored successfully!')
        await fetchSecurityDetails()
        if (onUpdated) onUpdated()
      } else {
        alert(data.error || 'Failed to restore version')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleRow}>
            <div className={styles.headerIconWrap}>
              <ShieldCheck size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className={styles.title}>
                <span>Document Security Vault</span>
                <span className={styles.docBadge}>{securityData?.securityLevel || 'STANDARD'}</span>
              </h2>
              <p className={styles.subtitle}>{documentName || securityData?.fileName || `Doc #${documentId}`}</p>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabNav}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'protection' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('protection')}
          >
            <Lock size={15} />
            <span>Protection & Cryptography</span>
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'access' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('access')}
          >
            <Eye size={15} />
            <span>Access & Limits</span>
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'watermark' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('watermark')}
          >
            <Sparkles size={15} />
            <span>Dynamic Watermark</span>
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'sharing' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('sharing')}
          >
            <Share2 size={15} />
            <span>Secure Sharing</span>
            {shares.length > 0 && <span className={styles.tabBadge}>{shares.length}</span>}
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'versions' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('versions')}
          >
            <Layers size={15} />
            <span>Version Control</span>
            {versions.length > 0 && <span className={styles.tabBadge}>v{versions[0]?.version || 1}</span>}
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'activity' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            <History size={15} />
            <span>Audit Trail</span>
            {activities.length > 0 && <span className={styles.tabBadge}>{activities.length}</span>}
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.body}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '12px' }}>
              <RefreshCw size={20} className="animate-spin" color="#8b5cf6" />
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>Loading Security Telemetry...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: PROTECTION & CRYPTOGRAPHY */}
              {activeTab === 'protection' && (
                <>
                  {securityData?.isLocked && (
                    <div className={styles.alertBanner}>
                      <ShieldAlert size={20} color="#ef4444" />
                      <div style={{ flex: 1 }}>
                        <strong>Temporary Document Lock Active:</strong> Excessive failed password attempts detected. Access restricted.
                      </div>
                      <button type="button" className={styles.btnSecondary} onClick={handleUnlockOverride} disabled={saving}>
                        Unlock Override
                      </button>
                    </div>
                  )}

                  {/* Security Level Selector */}
                  <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                      <span className={styles.sectionTitle}>
                        <ShieldCheck size={16} color="#8b5cf6" />
                        Security Level Classification
                      </span>
                    </div>

                    <div className={styles.levelGrid}>
                      {/* Standard */}
                      <div
                        className={`${styles.levelCard} ${securityLevel === 'STANDARD' ? styles.levelCardActive : ''}`}
                        onClick={() => setSecurityLevel('STANDARD')}
                      >
                        <div className={styles.levelTitle}>
                          <FileText size={15} color="#94a3b8" />
                          <span>Standard</span>
                        </div>
                        <p className={styles.levelDesc}>
                          Basic authentication, normal access control, and standard audit activity logging.
                        </p>
                      </div>

                      {/* Protected */}
                      <div
                        className={`${styles.levelCard} ${securityLevel === 'PROTECTED' ? styles.levelCardActive : ''}`}
                        onClick={() => {
                          setSecurityLevel('PROTECTED')
                          setWatermarkEnabled(true)
                        }}
                      >
                        <div className={styles.levelTitle}>
                          <Lock size={15} color="#8b5cf6" />
                          <span>Protected</span>
                        </div>
                        <p className={styles.levelDesc}>
                          AES-256-GCM encryption at rest, optional password, dynamic watermark, and download limits.
                        </p>
                      </div>

                      {/* Highly Protected */}
                      <div
                        className={`${styles.levelCard} ${securityLevel === 'HIGHLY_PROTECTED' ? styles.levelCardActiveHighly : ''}`}
                        onClick={() => {
                          setSecurityLevel('HIGHLY_PROTECTED')
                          setIsViewOnly(true)
                          setWatermarkEnabled(true)
                          setDownloadPolicy('DISABLED')
                        }}
                      >
                        <div className={styles.levelTitle}>
                          <Flame size={15} color="#10b981" />
                          <span>Highly Protected</span>
                        </div>
                        <p className={styles.levelDesc}>
                          AES-256 encryption, password enforcement, view-only mode, adaptive attack locks, and SHA-256 verification.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Password Protection Card */}
                  <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                      <span className={styles.sectionTitle}>
                        <KeyRound size={16} color="#c084fc" />
                        Document Password Protection
                      </span>
                      {securityData?.isPasswordProtected && (
                        <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Check size={13} /> Active
                        </span>
                      )}
                    </div>

                    {securityData?.isPasswordProtected ? (
                      <div className={styles.featureRow}>
                        <div className={styles.featureInfo}>
                          <span className={styles.featureName}>Document is Password Protected</span>
                          <span className={styles.featureSub}>Users must supply the secret password before unlocking and viewing file bytes.</span>
                        </div>
                        <button type="button" className={styles.btnDanger} onClick={handleRemovePassword} disabled={saving}>
                          Remove Password
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <input
                            type="password"
                            placeholder="Create Document Password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className={styles.input}
                          />
                          <input
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className={styles.input}
                          />
                        </div>
                        {passwordError && <span style={{ fontSize: '11px', color: '#ef4444' }}>{passwordError}</span>}
                      </div>
                    )}
                  </div>

                  {/* SHA-256 Cryptographic Fingerprint */}
                  <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                      <span className={styles.sectionTitle}>
                        <FileCheck size={16} color="#38bdf8" />
                        Cryptographic Document Fingerprint
                      </span>
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={handleVerifyIntegrity}
                        disabled={integrityChecking}
                      >
                        <RefreshCw size={12} className={integrityChecking ? 'animate-spin' : ''} />
                        <span>{integrityChecking ? 'Re-Computing Hash...' : 'Re-Verify Storage Hash'}</span>
                      </button>
                    </div>

                    <div className={styles.hashBox}>
                      <span>SHA-256: {securityData?.sha256Hash || 'Computing...'}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(securityData?.sha256Hash || '')
                          setCopiedHash(true)
                          setTimeout(() => setCopiedHash(false), 2000)
                        }}
                        style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer' }}
                        title="Copy Hash"
                      >
                        {copiedHash ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                      </button>
                    </div>

                    {integrityStatus === 'VERIFIED' && (
                      <div style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Check size={14} /> Storage file matches the original SHA-256 cryptographic fingerprint.
                      </div>
                    )}
                    {integrityStatus === 'TAMPER_ALERT' && (
                      <div style={{ fontSize: '12px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangle size={14} /> 🚨 Tamper Alert: Stored file does not match original fingerprint!
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* TAB 2: ACCESS & RESTRICTIONS */}
              {activeTab === 'access' && (
                <>
                  {/* View-Only Mode */}
                  <div className={styles.sectionCard}>
                    <div className={styles.featureRow}>
                      <div className={styles.featureInfo}>
                        <span className={styles.featureName}>👁 View-Only Mode</span>
                        <span className={styles.featureSub}>Renders inside secure viewer with dynamic watermarking; disables direct file download.</span>
                      </div>
                      <label className={styles.switch}>
                        <input
                          type="checkbox"
                          checked={isViewOnly}
                          onChange={e => setIsViewOnly(e.target.checked)}
                        />
                        <span className={styles.slider} />
                      </label>
                    </div>
                  </div>

                  {/* Download Permission Control */}
                  <div className={styles.sectionCard}>
                    <span className={styles.sectionTitle}>
                      <Download size={16} color="#34d399" />
                      Download Policy & Limits
                    </span>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="downloadPolicy"
                          checked={downloadPolicy === 'UNLIMITED'}
                          onChange={() => setDownloadPolicy('UNLIMITED')}
                        />
                        <span>Allow Unlimited Downloads</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="downloadPolicy"
                          checked={downloadPolicy === 'LIMITED'}
                          onChange={() => setDownloadPolicy('LIMITED')}
                        />
                        <span>Allow Limited Downloads (Quotas)</span>
                      </label>

                      {downloadPolicy === 'LIMITED' && (
                        <div style={{ paddingLeft: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Max Downloads:</span>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={maxDownloads}
                            onChange={e => setMaxDownloads(parseInt(e.target.value, 10) || 1)}
                            className={styles.input}
                            style={{ width: '80px' }}
                          />
                          <span style={{ fontSize: '12px', color: '#a78bfa' }}>
                            ({securityData?.downloadCount || 0} / {maxDownloads} used)
                          </span>
                        </div>
                      )}

                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="downloadPolicy"
                          checked={downloadPolicy === 'DISABLED'}
                          onChange={() => setDownloadPolicy('DISABLED')}
                        />
                        <span>Disable All Downloads</span>
                      </label>
                    </div>
                  </div>

                  {/* Access Expiration */}
                  <div className={styles.sectionCard}>
                    <span className={styles.sectionTitle}>
                      <Clock size={16} color="#f59e0b" />
                      Access Expiration Schedule
                    </span>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                      {['NEVER', '1_HOUR', '24_HOURS', '7_DAYS'].map(exp => (
                        <button
                          key={exp}
                          type="button"
                          className={`${styles.levelCard} ${accessExpiry === exp ? styles.levelCardActive : ''}`}
                          onClick={() => setAccessExpiry(exp)}
                          style={{ padding: '10px', textAlign: 'center' }}
                        >
                          <span style={{ fontSize: '12px', fontWeight: 600 }}>
                            {exp === 'NEVER' ? 'Never' : exp === '1_HOUR' ? '1 Hour' : exp === '24_HOURS' ? '24 Hours' : '7 Days'}
                          </span>
                        </button>
                      ))}
                    </div>

                    {securityData?.expiryDate && (
                      <span style={{ fontSize: '11px', color: '#f59e0b' }}>
                        ⏱ Current Expiry: {new Date(securityData.expiryDate).toLocaleString()}
                      </span>
                    )}
                  </div>
                </>
              )}

              {/* TAB 3: DYNAMIC WATERMARKING */}
              {activeTab === 'watermark' && (
                <>
                  <div className={styles.sectionCard}>
                    <div className={styles.featureRow}>
                      <div className={styles.featureInfo}>
                        <span className={styles.featureName}>Dynamic Forensic Watermark</span>
                        <span className={styles.featureSub}>
                          Dynamically injects accessor name, document ID, timestamp, and SHA-256 fingerprint onto PDF pages and viewer.
                        </span>
                      </div>
                      <label className={styles.switch}>
                        <input
                          type="checkbox"
                          checked={watermarkEnabled}
                          onChange={e => setWatermarkEnabled(e.target.checked)}
                        />
                        <span className={styles.slider} />
                      </label>
                    </div>

                    {watermarkEnabled && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Custom Watermark Header:</span>
                        <input
                          type="text"
                          value={watermarkText}
                          onChange={e => setWatermarkText(e.target.value)}
                          className={styles.input}
                          placeholder="e.g. PLACEIQ CONFIDENTIAL • FOR OFFICIAL REVIEW ONLY"
                        />
                      </div>
                    )}
                  </div>

                  {/* Watermark Live Preview */}
                  <div className={styles.sectionCard}>
                    <span className={styles.sectionTitle}>
                      <Eye size={15} color="#a78bfa" />
                      Dynamic Watermark Live Preview
                    </span>

                    <div className={styles.watermarkPreview}>
                      <div className={styles.watermarkStamp}>
                        <div>{watermarkText || 'PLACEIQ CONFIDENTIAL'}</div>
                        <div style={{ fontSize: '11px', fontWeight: 500, marginTop: '4px' }}>
                          ACCESSED BY SOHAM • {new Date().toLocaleDateString()} • DOC-{documentId}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* TAB 4: SECURE SHARING */}
              {activeTab === 'sharing' && (
                <>
                  {/* Share Link Generator Form */}
                  <div className={styles.sectionCard}>
                    <span className={styles.sectionTitle}>
                      <Share2 size={16} color="#8b5cf6" />
                      Generate Secure Access Link
                    </span>

                    <form onSubmit={handleCreateShare} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Expiration</label>
                          <select
                            value={shareExpiresIn}
                            onChange={(e: any) => setShareExpiresIn(e.target.value)}
                            className={styles.select}
                            style={{ width: '100%' }}
                          >
                            <option value="1_HOUR">1 Hour</option>
                            <option value="24_HOURS">24 Hours</option>
                            <option value="7_DAYS">7 Days</option>
                            <option value="30_DAYS">30 Days</option>
                            <option value="NEVER">Never Expires</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Max Accesses (Optional)</label>
                          <input
                            type="number"
                            min="1"
                            placeholder="e.g. 1 (One-Time Link)"
                            value={shareMaxAccess}
                            onChange={e => setShareMaxAccess(e.target.value ? parseInt(e.target.value, 10) : '')}
                            className={styles.input}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Require Share Password (Optional)</label>
                          <input
                            type="password"
                            placeholder="Share Password"
                            value={sharePassword}
                            onChange={e => setSharePassword(e.target.value)}
                            className={styles.input}
                          />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={shareViewOnly}
                              onChange={e => setShareViewOnly(e.target.checked)}
                            />
                            <span>View-Only (Disable Downloads)</span>
                          </label>
                        </div>
                      </div>

                      <button type="submit" className={styles.btnPrimary} style={{ alignSelf: 'flex-start' }} disabled={shareCreating}>
                        <Sparkles size={14} />
                        <span>{shareCreating ? 'Generating...' : 'Generate Secure Link'}</span>
                      </button>
                    </form>

                    {generatedShareUrl && (
                      <div style={{ marginTop: '10px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid #8b5cf6', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#c084fc', wordBreak: 'break-all' }}>{generatedShareUrl}</span>
                        <button
                          type="button"
                          className={styles.btnSecondary}
                          onClick={() => {
                            navigator.clipboard.writeText(generatedShareUrl)
                            setCopiedShare(true)
                            setTimeout(() => setCopiedShare(false), 2000)
                          }}
                        >
                          {copiedShare ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                          <span>{copiedShare ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Active Shares List */}
                  <div className={styles.sectionCard}>
                    <span className={styles.sectionTitle}>
                      <Globe size={16} color="#60a5fa" />
                      Active Secure Links ({shares.length})
                    </span>

                    {shares.length === 0 ? (
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>No active share links. Generate one above to share securely.</span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {shares.map(sh => (
                          <div key={sh.id} className={styles.featureRow} style={{ opacity: sh.isRevoked ? 0.5 : 1 }}>
                            <div className={styles.featureInfo}>
                              <span className={styles.featureName} style={{ fontFamily: 'monospace' }}>
                                token: {sh.shareToken.slice(0, 12)}...
                              </span>
                              <span className={styles.featureSub}>
                                Accesses: {sh.accessCount} / {sh.maxAccessCount || '∞'} • {sh.isViewOnly ? 'View Only' : 'Download Allowed'} • Expires: {sh.expiresAt ? new Date(sh.expiresAt).toLocaleDateString() : 'Never'}
                              </span>
                            </div>
                            {!sh.isRevoked ? (
                              <button type="button" className={styles.btnDanger} onClick={() => handleRevokeShare(sh.id)}>
                                Revoke
                              </button>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#f87171' }}>Revoked</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* TAB 5: VERSION CONTROL */}
              {activeTab === 'versions' && (
                <div className={styles.sectionCard}>
                  <span className={styles.sectionTitle}>
                    <Layers size={16} color="#a78bfa" />
                    Document Version Lineage
                  </span>

                  <div className={styles.timeline}>
                    {versions.map((ver, idx) => {
                      const isCurrent = idx === 0
                      return (
                        <div key={ver.id} className={styles.timelineItem}>
                          <div className={styles.timelineDot} style={{ background: isCurrent ? '#10b981' : '#8b5cf6' }} />
                          <div className={styles.timelineContent}>
                            <div className={styles.timelineTop}>
                              <span className={styles.timelineAction}>
                                Version {ver.version} {isCurrent && <span style={{ color: '#10b981', fontSize: '11px', marginLeft: '6px' }}>(Current Active)</span>}
                              </span>
                              <span className={styles.timelineTime}>{new Date(ver.uploadedAt).toLocaleDateString()}</span>
                            </div>
                            <span className={styles.timelineDetails}>{ver.versionNotes || ver.fileName}</span>
                            <div className={styles.timelineMeta}>
                              <span>Hash: {ver.sha256Hash?.slice(0, 16)}...</span>
                              <span>Size: {(ver.fileSize / 1024).toFixed(1)} KB</span>
                              {!isCurrent && (
                                <button
                                  type="button"
                                  onClick={() => handleRestoreVersion(ver.id)}
                                  style={{ color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
                                >
                                  <RotateCcw size={11} /> Restore Version
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* TAB 6: AUDIT ACTIVITY TIMELINE */}
              {activeTab === 'activity' && (
                <div className={styles.sectionCard}>
                  <span className={styles.sectionTitle}>
                    <History size={16} color="#38bdf8" />
                    Chronological Security Audit Timeline
                  </span>

                  {activities.length === 0 ? (
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>No activity records found for this document.</span>
                  ) : (
                    <div className={styles.timeline}>
                      {activities.map(act => (
                        <div key={act.id} className={styles.timelineItem}>
                          <div
                            className={styles.timelineDot}
                            style={{
                              background:
                                act.action.includes('FAILED') || act.action.includes('LOCKED')
                                  ? '#ef4444'
                                  : act.action.includes('DOWNLOADED')
                                  ? '#34d399'
                                  : act.action.includes('SHARED')
                                  ? '#8b5cf6'
                                  : '#38bdf8'
                            }}
                          />
                          <div className={styles.timelineContent}>
                            <div className={styles.timelineTop}>
                              <span className={styles.timelineAction}>{act.action.replace(/_/g, ' ')}</span>
                              <span className={styles.timelineTime}>{new Date(act.timestamp).toLocaleString()}</span>
                            </div>
                            <span className={styles.timelineDetails}>{act.details}</span>
                            <div className={styles.timelineMeta}>
                              <span>Actor: {act.actorName} ({act.actorRole})</span>
                              <span>Device: {act.device || 'Desktop'}</span>
                              <span>Location: {act.location || 'Pune, India'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className={styles.footer}>
          <button type="button" className={styles.btnSecondary} onClick={onClose}>
            Close
          </button>
          <button type="button" className={styles.btnPrimary} onClick={handleSaveSecurity} disabled={saving || loading}>
            {saving ? 'Saving...' : 'Save Security Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
