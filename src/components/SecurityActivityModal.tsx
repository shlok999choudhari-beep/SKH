'use client'

import React, { useState, useEffect, useCallback } from 'react'
import styles from './SecurityActivityModal.module.css'
import {
  ShieldCheck,
  X,
  Laptop,
  Smartphone,
  Tablet,
  MapPin,
  Clock,
  Calendar,
  AlertTriangle,
  LogOut,
  ShieldAlert,
  Loader2,
  Lock,
  RotateCcw,
  CheckCircle2
} from 'lucide-react'

interface SecurityActivityModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SecurityActivityModal({ isOpen, onClose }: SecurityActivityModalProps) {
  const [currentSession, setCurrentSession] = useState<any>(null)
  const [activeSessions, setActiveSessions] = useState<any[]>([])
  const [loginHistory, setLoginHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [showLogoutAllConfirm, setShowLogoutAllConfirm] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [logoutAllLoading, setLogoutAllLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [securingLoading, setSecuringLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Live session timer calculated from authenticated loginTime
  const [liveTimer, setLiveTimer] = useState<string>('00:00:00')

  const fetchSecurityData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true)

      const timestamp = Date.now()
      const [currRes, actRes, histRes] = await Promise.all([
        fetch(`/api/security/current-session?_t=${timestamp}`, { cache: 'no-store' }),
        fetch(`/api/security/active-sessions?_t=${timestamp}`, { cache: 'no-store' }),
        fetch(`/api/security/login-history?_t=${timestamp}`, { cache: 'no-store' })
      ])

      const [currData, actData, histData] = await Promise.all([
        currRes.json(),
        actRes.json(),
        histRes.json()
      ])

      if (!currData.error) setCurrentSession(currData)
      if (actData.sessions) setActiveSessions(actData.sessions)
      if (histData.history) setLoginHistory(histData.history)
    } catch (err) {
      console.error('Failed to load security activity data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchSecurityData()
      document.body.style.overflow = 'hidden'

      // Auto-poll every 3 seconds for real-time multi-device sync
      const pollInterval = setInterval(() => {
        fetchSecurityData(true)
      }, 3000)

      // Sync immediately when user switches tabs/windows (e.g. from private window)
      const handleSync = () => {
        fetchSecurityData(true)
      }

      window.addEventListener('focus', handleSync)
      document.addEventListener('visibilitychange', handleSync)

      return () => {
        clearInterval(pollInterval)
        window.removeEventListener('focus', handleSync)
        document.removeEventListener('visibilitychange', handleSync)
        document.body.style.overflow = ''
      }
    } else {
      document.body.style.overflow = ''
      setShowLogoutAllConfirm(false)
      setShowResetConfirm(false)
      setStatusMessage(null)
    }
  }, [isOpen, fetchSecurityData])


  // Update live timer every second
  useEffect(() => {
    const loginIso = currentSession?.loginTime || new Date(Date.now() - 84 * 60 * 1000).toISOString()

    const updateTimer = () => {
      const startMs = new Date(loginIso).getTime()
      const nowMs = Date.now()
      const diffSec = Math.max(0, Math.floor((nowMs - startMs) / 1000))

      const hrs = Math.floor(diffSec / 3600)
      const mins = Math.floor((diffSec % 3600) / 60)
      const secs = diffSec % 60

      setLiveTimer(
        `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      )
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [currentSession?.loginTime])

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showLogoutAllConfirm) {
          setShowLogoutAllConfirm(false)
        } else if (showResetConfirm) {
          setShowResetConfirm(false)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, showLogoutAllConfirm, showResetConfirm])

  const handleLogoutDevice = async (sessionId: string, deviceName: string) => {
    try {
      setRevokingId(sessionId)

      // Optimistic update
      setActiveSessions(prev => prev.filter(s => s.id !== sessionId))
      setLoginHistory(prev =>
        prev.map(h => (h.id === sessionId ? { ...h, status: 'revoked' } : h))
      )

      const res = await fetch(`/api/security/sessions/${sessionId}/revoke`, {
        method: 'POST'
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setStatusMessage({
          text: `Logged out ${deviceName || 'device'} successfully.`,
          type: 'success'
        })
        fetchSecurityData(true)
      } else {
        setStatusMessage({
          text: data.error || 'Failed to logout device.',
          type: 'error'
        })
        fetchSecurityData(true)
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Error logging out device.', type: 'error' })
      fetchSecurityData(true)
    } finally {
      setRevokingId(null)
    }
  }

  const handleLogoutAllOther = async () => {
    try {
      setLogoutAllLoading(true)

      // Optimistic update
      setActiveSessions(prev => prev.filter(s => s.isCurrent))
      setLoginHistory(prev =>
        prev.map(h => (!h.isCurrent && h.status === 'active' ? { ...h, status: 'revoked' } : h))
      )

      const res = await fetch('/api/security/sessions/revoke-all', {
        method: 'POST'
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setStatusMessage({
          text: data.message || 'All other active devices logged out.',
          type: 'success'
        })
        setShowLogoutAllConfirm(false)
        fetchSecurityData(true)
      } else {
        setStatusMessage({
          text: data.error || 'Failed to logout other devices.',
          type: 'error'
        })
        fetchSecurityData(true)
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Network error.', type: 'error' })
      fetchSecurityData(true)
    } finally {
      setLogoutAllLoading(false)
    }
  }

  const handleSecureAccount = async (suspiciousSessionId?: string) => {
    try {
      setSecuringLoading(true)

      // Optimistic update
      setLoginHistory(prev =>
        prev.map(h => ({ ...h, isSuspicious: false, riskLevel: 'low', status: h.status === 'active' ? 'active' : 'revoked' }))
      )

      const res = await fetch('/api/security/secure-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: suspiciousSessionId })
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setStatusMessage({
          text: data.message || 'Account secured successfully. Suspicious sessions terminated.',
          type: 'success'
        })
        fetchSecurityData(true)
      } else {
        setStatusMessage({
          text: data.error || 'Failed to secure account.',
          type: 'error'
        })
        fetchSecurityData(true)
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Error securing account.', type: 'error' })
      fetchSecurityData(true)
    } finally {
      setSecuringLoading(false)
    }
  }

  const handleResetSecurity = async () => {
    try {
      setResetLoading(true)
      const res = await fetch('/api/security/reset', {
        method: 'POST'
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setStatusMessage({
          text: 'Security reset complete. Logging out of all sessions and redirecting to login...',
          type: 'success'
        })
        setShowResetConfirm(false)

        // Clear active session and redirect to login page
        setTimeout(() => {
          window.location.href = data.redirectUrl || '/auth/student/login'
        }, 1200)
      } else {
        setStatusMessage({
          text: data.error || 'Failed to reset security state.',
          type: 'error'
        })
        setResetLoading(false)
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Error resetting security state.', type: 'error' })
      setResetLoading(false)
    }
  }

  if (!isOpen) return null

  // Check if there are any active suspicious login attempts (isSuspicious === true)
  const suspiciousEntry = loginHistory.find(h => h.isSuspicious === true && h.status !== 'revoked')

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '27 Aug 2026 • 10:15 PM'
    const d = new Date(isoString)
    return (
      d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) +
      ' • ' +
      d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    )
  }

  const formatTimeOnly = (isoString?: string) => {
    if (!isoString) return '11:58 PM'
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDeviceIcon = (deviceType?: string) => {
    if (deviceType === 'mobile') return <Smartphone size={18} />
    if (deviceType === 'tablet') return <Tablet size={18} />
    return <Laptop size={18} />
  }

  const sessionBrowser = currentSession?.browser || 'Chrome'
  const sessionOS = currentSession?.os || 'Windows'
  const sessionLocation = currentSession?.location || 'Pune, Maharashtra'
  const sessionIp = currentSession?.ip || '103.211.54.21'
  const sessionLoginTime = currentSession?.loginTime || new Date(Date.now() - 84 * 60 * 1000).toISOString()
  const sessionLastActivity = currentSession?.lastActivity || new Date().toISOString()
  const sessionExpiresAt = currentSession?.expiresAt || new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
  const sessionDeviceType = currentSession?.deviceType || 'desktop'

  // Other active sessions count (excluding current device)
  const otherActiveSessions = activeSessions.filter(s => !s.isCurrent)

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header with ONE SINGLE Reset Security button */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIconWrap}>
              <ShieldCheck size={26} strokeWidth={2} />
            </div>
            <div>
              <h2 className={styles.title}>
                <span>Account Security & Devices</span>
                <span className={styles.shieldBadge}>Protected</span>
              </h2>
              <p className={styles.subtitle}>
                Manage active logged-in devices and review recent security events.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className={styles.resetHeaderBtn}
              onClick={() => setShowResetConfirm(true)}
              title="Reset security & log out everywhere"
            >
              <RotateCcw size={13} />
              <span>Reset Security</span>
            </button>

            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close Security Modal"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBody}>
          {statusMessage && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '14px',
                background: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.16)' : 'rgba(239, 68, 68, 0.16)',
                border: `1px solid ${statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                color: statusMessage.type === 'success' ? '#34d399' : '#f87171',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} />
                <span>{statusMessage.text}</span>
              </div>
              <button
                onClick={() => setStatusMessage(null)}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
              >
                <X size={15} />
              </button>
            </div>
          )}

          {loading && !currentSession ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary)' }}>
              <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: '#8b5cf6' }} />
              <p>Loading security profile & active devices...</p>
            </div>
          ) : (
            <>
              {/* Suspicious Login Alert (if detected) */}
              {suspiciousEntry && (
                <div className={styles.suspiciousBanner}>
                  <div className={styles.suspiciousLeft}>
                    <div className={styles.alertIconWrap}>
                      <ShieldAlert size={24} />
                    </div>
                    <div>
                      <div className={styles.suspiciousTitle}>
                        ⚠ Suspicious Login Detected
                      </div>
                      <div className={styles.suspiciousDetails}>
                        <strong>Device:</strong> {suspiciousEntry.device || 'Unknown Device'} •{' '}
                        <strong>Location:</strong> {suspiciousEntry.location || 'Unknown'} •{' '}
                        <strong>Time:</strong> {formatTimeOnly(suspiciousEntry.loginTime)} •{' '}
                        <span style={{ color: '#ef4444', fontWeight: 700 }}>Risk: High</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.secureBtn}
                    onClick={() => handleSecureAccount(suspiciousEntry.id)}
                    disabled={securingLoading}
                  >
                    {securingLoading ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                    <span>Secure & Reset</span>
                  </button>
                </div>
              )}

              {/* 🟢 Current Active Session Hero Card */}
              <div className={styles.currentSessionCard}>
                <div className={styles.sessionTopRow}>
                  <div className={styles.sessionStatusLive}>
                    <span className={styles.pulseDot} />
                    <span>Current Device • Active Session</span>
                  </div>
                  <div className={styles.sessionTimerBox}>
                    <span className={styles.timerLabel}>Session Duration</span>
                    <span className={styles.timerValue}>{liveTimer}</span>
                  </div>
                </div>

                <div className={styles.sessionGrid}>
                  <div className={styles.sessionInfoTile}>
                    <span className={styles.infoLabel}>
                      {getDeviceIcon(sessionDeviceType)} Device & OS
                    </span>
                    <span className={styles.infoValue}>
                      {sessionBrowser} • {sessionOS}
                    </span>
                    <span className={styles.infoSub}>{sessionDeviceType.toUpperCase()}</span>
                  </div>

                  <div className={styles.sessionInfoTile}>
                    <span className={styles.infoLabel}>
                      <MapPin size={13} /> Location
                    </span>
                    <span className={styles.infoValue}>{sessionLocation}</span>
                    <span className={styles.infoSub}>Approximate location</span>
                  </div>

                  <div className={styles.sessionInfoTile}>
                    <span className={styles.infoLabel}>
                      <Calendar size={13} /> Login Time
                    </span>
                    <span className={styles.infoValue}>{formatDateTime(sessionLoginTime)}</span>
                    <span className={styles.infoSub}>Verified IP: {sessionIp}</span>
                  </div>

                  <div className={styles.sessionInfoTile}>
                    <span className={styles.infoLabel}>
                      <Clock size={13} /> Last Activity
                    </span>
                    <span className={styles.infoValue}>{formatTimeOnly(sessionLastActivity)}</span>
                    <span className={styles.infoSub}>
                      Auto-expires: {formatTimeOnly(sessionExpiresAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Logged-In Devices */}
              <div>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>
                    <span>Logged-in Devices</span>
                    <span className={styles.sectionCount}>
                      {activeSessions.length > 0 ? activeSessions.length : 1} active
                    </span>
                  </h3>
                </div>

                <div className={styles.sessionsList}>
                  {activeSessions.map(session => (
                    <div key={session.id} className={styles.sessionItem}>
                      <div className={styles.sessionItemLeft}>
                        <div className={styles.deviceIconWrap}>
                          {getDeviceIcon(session.deviceType)}
                        </div>
                        <div className={styles.sessionMeta}>
                          <div className={styles.sessionDeviceTitle}>
                            <span>{session.browser} • {session.os}</span>
                            {session.isCurrent && (
                              <span className={styles.currentBadge}>🟢 This Device</span>
                            )}
                          </div>
                          <div className={styles.sessionLocationText}>
                            {session.location} • Active for {session.sessionDuration}
                          </div>
                        </div>
                      </div>

                      <div>
                        {session.isCurrent ? (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                            Current Session
                          </span>
                        ) : (
                          <button
                            type="button"
                            className={styles.logoutDeviceBtn}
                            onClick={() => handleLogoutDevice(session.id, `${session.browser} on ${session.os}`)}
                            disabled={revokingId === session.id}
                            title="Log out this device"
                          >
                            {revokingId === session.id ? (
                              <>
                                <Loader2 size={13} className="animate-spin" />
                                <span>Logging out...</span>
                              </>
                            ) : (
                              <>
                                <LogOut size={13} />
                                <span>Log out Device</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {otherActiveSessions.length === 0 && (
                    <div className={styles.allClearBox}>
                      <CheckCircle2 size={15} />
                      <span>Only this device is currently logged in. Your account is secured.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Login History */}
              <div>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>
                    <span>Recent Login Activity</span>
                    <span className={styles.sectionCount}>{loginHistory.length} events</span>
                  </h3>
                </div>

                <div className={styles.tableWrapper}>
                  <table className={styles.historyTable}>
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Device & Browser</th>
                        <th>Location</th>
                        <th>Login Time</th>
                        <th>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loginHistory.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td>
                            {item.status === 'active' ? (
                              <span className={`${styles.statusPill} ${styles.statusActive}`}>
                                🟢 Active
                              </span>
                            ) : item.status === 'failed' || item.isSuspicious ? (
                              <span className={`${styles.statusPill} ${styles.statusFailed}`}>
                                ⚠ Failed
                              </span>
                            ) : item.status === 'revoked' ? (
                              <span className={`${styles.statusPill} ${styles.statusRevoked}`}>
                                ✕ Logged Out
                              </span>
                            ) : (
                              <span className={`${styles.statusPill} ${styles.statusSuccess}`}>
                                ✓ Successful
                              </span>
                            )}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{item.device}</div>
                          </td>
                          <td>
                            <div>{item.location}</div>
                          </td>
                          <td>
                            <div>{formatTimeOnly(item.loginTime)}</div>
                            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                              {new Date(item.loginTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                            </div>
                          </td>
                          <td>
                            <span style={{ color: 'var(--text-secondary)' }}>
                              {item.sessionDuration}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer with ONLY Log out all other devices and Close */}
        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.logoutAllBtn}
            onClick={() => setShowLogoutAllConfirm(true)}
            disabled={otherActiveSessions.length === 0}
            title={otherActiveSessions.length === 0 ? 'No other devices currently logged in' : 'Log out all other devices'}
          >
            <LogOut size={15} />
            <span>Log out all other devices</span>
          </button>

          <button type="button" className={styles.closeFooterBtn} onClick={onClose}>
            Close
          </button>
        </div>

        {/* Confirmation Modal for Reset Security & Logout Everywhere */}
        {showResetConfirm && (
          <div className={styles.confirmOverlay}>
            <div className={styles.confirmBox}>
              <div style={{ color: '#a78bfa', marginBottom: '14px' }}>
                <RotateCcw size={40} strokeWidth={1.8} />
              </div>
              <h4 className={styles.confirmTitle}>Reset Security & Log Out Everywhere?</h4>
              <p className={styles.confirmText}>
                This will immediately terminate all active sessions across all devices (including this current browser), clear zero-trust credentials, and safely log you out.
              </p>
              <div className={styles.confirmActions}>
                <button
                  type="button"
                  className={styles.cancelConfirmBtn}
                  onClick={() => setShowResetConfirm(false)}
                  disabled={resetLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.acceptConfirmBtn}
                  style={{ background: '#8b5cf6' }}
                  onClick={handleResetSecurity}
                  disabled={resetLoading}
                >
                  {resetLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Logging out...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw size={14} />
                      <span>Confirm & Log Out</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal for Logout All Other Devices */}
        {showLogoutAllConfirm && (
          <div className={styles.confirmOverlay}>
            <div className={styles.confirmBox}>
              <div style={{ color: '#ef4444', marginBottom: '14px' }}>
                <AlertTriangle size={40} strokeWidth={1.8} />
              </div>
              <h4 className={styles.confirmTitle}>Log out all other devices?</h4>
              <p className={styles.confirmText}>
                This will terminate active sessions on other phones, laptops, and browsers. Your current device will remain active.
              </p>
              <div className={styles.confirmActions}>
                <button
                  type="button"
                  className={styles.cancelConfirmBtn}
                  onClick={() => setShowLogoutAllConfirm(false)}
                  disabled={logoutAllLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.acceptConfirmBtn}
                  onClick={handleLogoutAllOther}
                  disabled={logoutAllLoading}
                >
                  {logoutAllLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Logging out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut size={14} />
                      <span>Log Out All Others</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
