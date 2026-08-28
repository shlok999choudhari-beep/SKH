'use client'

import { useState, useEffect, Suspense, FormEvent } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import Logo from '@/components/Logo'
import SpecularButton from '@/components/SpecularButton'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import LoginSecurityChallenge from '@/components/LoginSecurityChallenge'
import styles from './login.module.css'
import { GraduationCap, Building2, Landmark, ArrowLeft, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react'

type Role = 'student' | 'company' | 'institution'

const ROLES = [
  {
    id: 'student' as Role,
    icon: GraduationCap,
    label: 'Student',
    desc: 'Analyze resume & get placed',
    color: '#EAB308',
    gradient: 'linear-gradient(135deg, #EAB308, #FDE047)',
  },
  {
    id: 'company' as Role,
    icon: Building2,
    label: 'Company',
    desc: 'Hire skill-verified talent',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #34d399)',
  },
  {
    id: 'institution' as Role,
    icon: Landmark,
    label: 'Institution',
    desc: 'Manage cohorts & placements',
    color: '#f472b6',
    gradient: 'linear-gradient(135deg, #f472b6, #96c8ff)',
  },
]

import { getClientDeviceTelemetry } from '@/lib/clientDevice'

interface ChallengeState {
  challengeToken: string
  maskedEmail: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  riskReasons?: string[]
  deviceInfo: { browser: string; os: string; location: string }
  expiresAt: string
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialRole = (searchParams.get('role') as Role) || 'student'
  const [role, setRole] = useState<Role>(initialRole)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [challengeState, setChallengeState] = useState<ChallengeState | null>(null)

  // Warm-up client device telemetry and live location in background on mount
  useEffect(() => {
    getClientDeviceTelemetry().catch(() => {})
  }, [])

  const currentRole = ROLES.find(r => r.id === role)!
  const RoleIcon = currentRole.icon

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setFieldErrors({})

    if (!email.trim()) {
      setFieldErrors(prev => ({ ...prev, email: 'Email address or username is required' }))
      return
    }
    if (!password) {
      setFieldErrors(prev => ({ ...prev, password: 'Password is required' }))
      return
    }

    setPending(true)

    try {
      const telemetry = await getClientDeviceTelemetry()

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          role,
          deviceId: telemetry.deviceId,
          browser: telemetry.browser,
          os: telemetry.os,
          deviceType: telemetry.deviceType,
          location: telemetry.location
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'Invalid email/username or password.')
        setPending(false)
        return
      }

      if (data.status === 'CHALLENGE_REQUIRED') {
        setChallengeState({
          challengeToken: data.challengeToken,
          maskedEmail: data.maskedEmail,
          riskLevel: data.riskLevel,
          riskReasons: data.riskReasons,
          deviceInfo: data.deviceInfo,
          expiresAt: data.expiresAt
        })
        setPending(false)
        return
      }

      if (data.status === 'SUCCESS') {
        const dest = data.redirectUrl || (role === 'student' ? '/student/dashboard' : role === 'company' ? '/company/dashboard' : '/institution/dashboard')
        router.push(dest)
      }
    } catch (err: any) {
      setErrorMessage('Network connection error. Please try again.')
      setPending(false)
    }
  }

  const handleChallengeSuccess = (redirectUrl: string) => {
    router.push(redirectUrl)
  }

  const handleChallengeCancel = () => {
    setChallengeState(null)
    setPassword('')
    setErrorMessage(null)
  }

  return (
    <div className={styles.page}>
      <Link href="/" className={styles.backBtn} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <ArrowLeft size={16} strokeWidth={2} />
        <span>Back to home</span>
      </Link>

      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
          <Logo variant={role === 'company' ? 'company' : role === 'institution' ? 'institution' : 'student'} size="lg" href="/" withBadge badgeText={role.toUpperCase()} />
        </div>

        {/* Challenge State Active */}
        {challengeState ? (
          <div>
            <div className={styles.cardHeader} style={{ marginBottom: '1rem' }}>
              <h1 className={styles.title}>Identity Verification</h1>
              <p className={styles.subtitle}>
                PlaceIQ Intelligent Login Shield
              </p>
            </div>

            <LoginSecurityChallenge
              challengeToken={challengeState.challengeToken}
              maskedEmail={challengeState.maskedEmail}
              riskLevel={challengeState.riskLevel}
              riskReasons={challengeState.riskReasons}
              deviceInfo={challengeState.deviceInfo}
              expiresAt={challengeState.expiresAt}
              onSuccess={handleChallengeSuccess}
              onCancel={handleChallengeCancel}
            />
          </div>
        ) : (
          <>
            {/* Role Selector */}
            <div className={styles.roleSelector}>
              {ROLES.map(r => {
                const TabIcon = r.icon
                return (
                  <button
                    key={r.id}
                    className={`${styles.roleTab} ${role === r.id ? styles.roleTabActive : ''}`}
                    onClick={() => {
                      setRole(r.id)
                      setErrorMessage(null)
                    }}
                    style={role === r.id ? { borderColor: r.color, boxShadow: `0 0 16px ${r.color}30` } : {}}
                  >
                    <span className={styles.roleTabIcon}>
                      <TabIcon size={20} strokeWidth={2} />
                    </span>
                    <div className={styles.roleTabText}>
                      <span className={styles.roleTabLabel}>{r.label}</span>
                      <span className={styles.roleTabDesc}>{r.desc}</span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Header */}
            <div className={styles.cardHeader}>
              <div className={styles.roleIcon} style={{ background: currentRole.gradient, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                <RoleIcon size={24} strokeWidth={2} />
              </div>
              <h1 className={styles.title}>{currentRole.label} Login</h1>
              <p className={styles.subtitle}>
                {role === 'student' && "Welcome back! Let's continue your placement journey."}
                {role === 'company' && "Find your next great hire today."}
                {role === 'institution' && "Manage your placement drives and cohorts."}
              </p>

              {/* Security Shield Badge */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '6px', padding: '3px 10px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: '20px', fontSize: '11px', color: '#c4b5fd', fontWeight: 600 }}>
                <ShieldCheck size={12} color="#a78bfa" />
                <span>Protected by PlaceIQ Intelligent Login Shield</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleLoginSubmit} className={styles.form}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email address or Username</label>
                <input
                  id="email"
                  name="email"
                  type="text"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="form-input"
                  placeholder={role === 'student' ? 'you@college.edu or username' : role === 'company' ? 'hr@company.com or company name' : 'admin@institution.edu or username'}
                  autoComplete="username"
                />
                {fieldErrors.email && (
                  <p className={styles.fieldError}>{fieldErrors.email}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                {fieldErrors.password && (
                  <p className={styles.fieldError}>{fieldErrors.password}</p>
                )}
              </div>

              {errorMessage && (
                <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center' }}>
                <SpecularButton
                  type="submit"
                  disabled={pending}
                  size="md"
                  radius={8}
                  tint={role === 'student' ? '#7c3aed' : role === 'company' ? '#059669' : '#2563eb'}
                  tintOpacity={0.2}
                  blur={0}
                  textColor="#ffffff"
                  lineColor={role === 'student' ? '#c4b5fd' : role === 'company' ? '#6ee7b7' : '#93c5fd'}
                  baseColor={role === 'student' ? '#581c87' : role === 'company' ? '#065f46' : '#1e3a8a'}
                  intensity={0.85}
                  shineSize={8}
                  shineFade={35}
                  thickness={1}
                  speed={0.3}
                  followMouse
                  proximity={220}
                  style={{ width: '100%', minHeight: '46px' }}
                >
                  {pending ? <MorphingInfinity className="size-4" style={{ width: '16px', height: '16px' }} /> : null}
                  <span>{pending ? 'Evaluating Security...' : `Sign in as ${currentRole.label}`}</span>
                  {!pending && <ArrowRight size={16} strokeWidth={2} />}
                </SpecularButton>
              </div>
            </form>

            {/* Sign up links */}
            {role !== 'institution' && (
              <>
                <div className={styles.divider}><span>don&apos;t have an account?</span></div>
                <Link
                  href={`/auth/signup?role=${role}`}
                  className={styles.signupBtn}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <span>Create {currentRole.label} Account</span>
                  <ArrowRight size={14} strokeWidth={2} />
                </Link>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function UnifiedLoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f8fafc' }}>Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}


