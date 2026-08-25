'use client'

import { useState, useActionState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { studentLogin } from '@/app/actions/studentAuth'
import { companyLogin } from '@/app/actions/companyAuth'
import { institutionLogin } from '@/app/actions/institutionAuth'
import Logo from '@/components/Logo'
import SpecularButton from '@/components/SpecularButton'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import styles from './login.module.css'
import { GraduationCap, Building2, Landmark, ArrowLeft, ArrowRight } from 'lucide-react'

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

function LoginContent() {
  const searchParams = useSearchParams()
  const initialRole = (searchParams.get('role') as Role) || 'student'
  const [role, setRole] = useState<Role>(initialRole)

  const [studentState, studentAction, studentPending] = useActionState(studentLogin, undefined)
  const [companyState, companyAction, companyPending] = useActionState(companyLogin, undefined)
  const [institutionState, institutionAction, institutionPending] = useActionState(institutionLogin, undefined)

  const currentState = role === 'student' ? studentState : role === 'company' ? companyState : institutionState
  const currentAction = role === 'student' ? studentAction : role === 'company' ? companyAction : institutionAction
  const currentPending = role === 'student' ? studentPending : role === 'company' ? companyPending : institutionPending
  const currentRole = ROLES.find(r => r.id === role)!
  const RoleIcon = currentRole.icon

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

        {/* Role Selector */}
        <div className={styles.roleSelector}>
          {ROLES.map(r => {
            const TabIcon = r.icon
            return (
              <button
                key={r.id}
                className={`${styles.roleTab} ${role === r.id ? styles.roleTabActive : ''}`}
                onClick={() => setRole(r.id)}
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
        </div>

        {/* Form */}
        <form action={currentAction} className={styles.form}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email" name="email" type="email" required
              className="form-input"
              placeholder={role === 'student' ? 'you@college.edu' : role === 'company' ? 'hr@company.com' : 'admin@institution.edu'}
              autoComplete="email"
            />
            {currentState?.errors?.email && (
              <p className={styles.fieldError}>{currentState.errors.email[0]}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password" name="password" type="password" required
              className="form-input" placeholder="••••••••"
              autoComplete="current-password"
            />
            {currentState?.errors?.password && (
              <p className={styles.fieldError}>{currentState.errors.password[0]}</p>
            )}
          </div>

          {currentState?.message && <p className={styles.error}>{currentState.message}</p>}

          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center' }}>
            <SpecularButton
              type="submit"
              disabled={currentPending}
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
              {currentPending ? <MorphingInfinity className="size-4" style={{ width: '16px', height: '16px' }} /> : null}
              <span>{currentPending ? 'Signing in...' : `Sign in as ${currentRole.label}`}</span>
              {!currentPending && <ArrowRight size={16} strokeWidth={2} />}
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

