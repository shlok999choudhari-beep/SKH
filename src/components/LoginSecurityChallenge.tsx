'use client'

import { useState, useEffect, useRef, KeyboardEvent, ClipboardEvent } from 'react'
import { Shield, ShieldAlert, ShieldCheck, Clock, RefreshCw, ArrowLeft, CheckCircle2, AlertTriangle, Lock } from 'lucide-react'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import SpecularButton from '@/components/SpecularButton'
import styles from './LoginSecurityChallenge.module.css'

interface LoginSecurityChallengeProps {
  challengeToken: string
  maskedEmail: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  riskReasons?: string[]
  deviceInfo: {
    browser: string
    os: string
    location: string
  }
  expiresAt: string
  onSuccess: (redirectUrl: string) => void
  onCancel: () => void
}

export default function LoginSecurityChallenge({
  challengeToken: initialChallengeToken,
  maskedEmail,
  riskLevel,
  deviceInfo,
  expiresAt: initialExpiresAt,
  onSuccess,
  onCancel
}: LoginSecurityChallengeProps) {
  const [challengeToken, setChallengeToken] = useState(initialChallengeToken)
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', ''])
  const [trustDevice, setTrustDevice] = useState(true)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)
  const [isLocked, setIsLocked] = useState(false)

  // Expiry Countdown Timer
  const [expiresAtMs, setExpiresAtMs] = useState(new Date(initialExpiresAt).getTime())
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(
    Math.max(0, Math.floor((new Date(initialExpiresAt).getTime() - Date.now()) / 1000))
  )

  // Resend Cooldown Timer (45s)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  // Live Expiry Timer Tick
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000))
      setTimeLeftSeconds(remaining)
      if (remaining <= 0) {
        setError('Verification code has expired. Please click Resend Code.')
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [expiresAtMs])

  // Resend Cooldown Timer Tick
  useEffect(() => {
    if (cooldownSeconds <= 0) return
    const timer = setInterval(() => {
      setCooldownSeconds(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldownSeconds])

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const s = secs % 60
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Handle single digit input
  const handleInputChange = (index: number, val: string) => {
    setError(null)
    const cleaned = val.replace(/\D/g, '')

    if (!cleaned) {
      const newOtp = [...otp]
      newOtp[index] = ''
      setOtp(newOtp)
      return
    }

    const digit = cleaned.slice(-1)
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)

    // Advance focus to next cell
    if (index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Handle backspace and keyboard navigation
  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    } else if (e.key === 'Enter') {
      handleVerify()
    }
  }

  // Handle Paste
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    setError(null)
    const pasted = e.clipboardData.getData('text').trim().replace(/\D/g, '')
    if (pasted.length > 0) {
      const digits = pasted.slice(0, 6).split('')
      const newOtp = ['', '', '', '', '', '']
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d
      })
      setOtp(newOtp)

      const nextFocus = Math.min(5, digits.length)
      inputRefs.current[nextFocus]?.focus()

      // If full 6 digits pasted, trigger verify
      if (digits.length === 6) {
        submitOtpCode(digits.join(''), trustDevice)
      }
    }
  }

  // Submit OTP Verification
  const submitOtpCode = async (code: string, shouldTrust: boolean) => {
    if (code.length !== 6) {
      setError('Please enter all 6 digits of your verification code.')
      return
    }

    if (timeLeftSeconds <= 0) {
      setError('This code has expired. Please click Resend Code to receive a new one.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeToken,
          otp: code,
          trustDevice: shouldTrust
        })
      })

      const data = await res.json()

      if (!res.ok || data.status !== 'SUCCESS') {
        setError(data.error || 'Invalid verification code.')
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts)
        }
        if (data.isLocked) {
          setIsLocked(true)
        }
        setLoading(false)
        return
      }

      setSuccessMsg('✓ Identity verified. Setting up secure session...')
      setTimeout(() => {
        onSuccess(data.redirectUrl || '/student/dashboard')
      }, 700)
    } catch (err: any) {
      setError('Connection error. Please try again.')
      setLoading(false)
    }
  }

  const handleVerify = () => {
    submitOtpCode(otp.join(''), trustDevice)
  }

  // Resend OTP Code
  const handleResend = async () => {
    if (cooldownSeconds > 0 || resending) return

    setResending(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await fetch('/api/auth/login/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeToken })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to resend verification code.')
        if (data.cooldownSeconds) setCooldownSeconds(data.cooldownSeconds)
        setResending(false)
        return
      }

      if (data.newChallengeToken) {
        setChallengeToken(data.newChallengeToken)
      }
      if (data.expiresAt) {
        setExpiresAtMs(new Date(data.expiresAt).getTime())
        setTimeLeftSeconds(300)
      }
      setCooldownSeconds(data.cooldownSeconds || 45)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
      setSuccessMsg('A new 6-digit code has been sent to your email.')
    } catch (err) {
      setError('Failed to resend code. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className={styles.challengeContainer}>
      
      {/* Risk Alert Banner */}
      {riskLevel === 'HIGH' ? (
        <div className={`${styles.alertBanner} ${styles.highBanner}`}>
          <ShieldAlert size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div className={styles.bannerTitle}>
              <span>⚠ Additional Verification Required</span>
            </div>
            <div>We detected unusual activity or an unfamiliar login velocity. For your protection, verify your identity via email OTP.</div>
          </div>
        </div>
      ) : (
        <div className={`${styles.alertBanner} ${styles.mediumBanner}`}>
          <Shield size={20} color="#a78bfa" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div className={styles.bannerTitle}>
              <span>🔐 New Device Detected</span>
            </div>
            <div>We noticed a sign-in attempt from a device not currently registered as trusted. Verify your identity to continue.</div>
          </div>
        </div>
      )}

      {/* Device & Location Card */}
      <div className={styles.deviceInfoCard}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Detected Device:</span>
          <span className={styles.infoValue}>{deviceInfo.browser} • {deviceInfo.os}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Approx. Location:</span>
          <span className={styles.infoValue}>{deviceInfo.location}</span>
        </div>
      </div>

      <div style={{ textAlign: 'center', margin: '0.25rem 0' }}>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 6px 0' }}>
          We sent a 6-digit verification code to:
        </p>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', letterSpacing: '0.5px' }}>
          {maskedEmail}
        </div>
      </div>

      {/* 6-Digit OTP Split Input */}
      <div>
        <div className={styles.otpBoxContainer}>
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={el => { inputRefs.current[idx] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              disabled={loading || isLocked}
              onChange={e => handleInputChange(idx, e.target.value)}
              onKeyDown={e => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              className={`${styles.otpCell} ${error ? styles.otpCellError : ''}`}
            />
          ))}
        </div>

        {/* Timer & Resend Option */}
        <div className={styles.metaRow}>
          <div className={styles.timer}>
            <Clock size={13} strokeWidth={2} />
            <span>
              {timeLeftSeconds > 0 ? `Code expires in ${formatTime(timeLeftSeconds)}` : 'Code expired'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleResend}
            disabled={cooldownSeconds > 0 || resending || isLocked}
            className={styles.resendBtn}
          >
            {resending ? (
              'Sending...'
            ) : cooldownSeconds > 0 ? (
              `Resend code (${cooldownSeconds}s)`
            ) : (
              'Didn\'t receive? Resend'
            )}
          </button>
        </div>
      </div>

      {/* Trust this device checkbox */}
      <label className={styles.trustDeviceRow}>
        <input
          type="checkbox"
          checked={trustDevice}
          onChange={e => setTrustDevice(e.target.checked)}
          disabled={loading || isLocked}
        />
        <div className={styles.trustDeviceText}>
          <span className={styles.trustDeviceTitle}>☑ Trust this device</span>
          <span className={styles.trustDeviceDesc}>
            Don't ask for verification again on this browser for 7 days unless suspicious activity is detected.
          </span>
        </div>
      </label>

      {/* Feedback Messages */}
      {error && (
        <div className={styles.errorMessage}>
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className={styles.successMessage}>
          <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Verify Button */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
        <SpecularButton
          type="button"
          onClick={handleVerify}
          disabled={loading || isLocked || otp.join('').length !== 6 || timeLeftSeconds <= 0}
          size="md"
          radius={8}
          tint="#7c3aed"
          tintOpacity={0.25}
          blur={0}
          textColor="#ffffff"
          lineColor="#c4b5fd"
          baseColor="#581c87"
          intensity={0.85}
          shineSize={8}
          shineFade={35}
          thickness={1}
          speed={0.3}
          followMouse
          proximity={220}
          style={{ width: '100%', minHeight: '46px' }}
        >
          {loading ? <MorphingInfinity className="size-4" style={{ width: '16px', height: '16px' }} /> : null}
          <span>{loading ? 'Verifying Identity...' : 'Verify & Continue'}</span>
          {!loading && <ShieldCheck size={16} strokeWidth={2} />}
        </SpecularButton>
      </div>

      {/* Back to Login Link */}
      <button type="button" onClick={onCancel} className={styles.backBtn}>
        <ArrowLeft size={14} />
        <span>Cancel & return to sign in</span>
      </button>

    </div>
  )
}
