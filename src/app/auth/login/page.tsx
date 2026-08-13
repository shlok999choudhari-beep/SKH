'use client'

import { useState, useActionState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { studentLogin } from '@/app/actions/studentAuth'
import { companyLogin } from '@/app/actions/companyAuth'
import { institutionLogin } from '@/app/actions/institutionAuth'
import styles from './login.module.css'

type Role = 'student' | 'company' | 'institution'

const ROLES = [
  {
    id: 'student' as Role,
    icon: '🎓',
    label: 'Student',
    desc: 'Analyze resume & get placed',
    color: '#EAB308',
    gradient: 'linear-gradient(135deg, #EAB308, #FDE047)',
  },
  {
    id: 'company' as Role,
    icon: '🏢',
    label: 'Company',
    desc: 'Hire skill-verified talent',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #34d399)',
  },
  {
    id: 'institution' as Role,
    icon: '🏛️',
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

  return (
    <div className={styles.page}>
      <Link href="/" className={styles.backBtn}>← Back to home</Link>

      <div className={styles.card}>
        {/* Role Selector */}
        <div className={styles.roleSelector}>
          {ROLES.map(r => (
            <button
              key={r.id}
              className={`${styles.roleTab} ${role === r.id ? styles.roleTabActive : ''}`}
              onClick={() => setRole(r.id)}
              style={role === r.id ? { borderColor: r.color, boxShadow: `0 0 16px ${r.color}30` } : {}}
            >
              <span className={styles.roleTabIcon}>{r.icon}</span>
              <div className={styles.roleTabText}>
                <span className={styles.roleTabLabel}>{r.label}</span>
                <span className={styles.roleTabDesc}>{r.desc}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Header */}
        <div className={styles.cardHeader}>
          <div className={styles.roleIcon} style={{ background: currentRole.gradient }}>
            {currentRole.icon}
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

          <button
            type="submit"
            disabled={currentPending}
            className={styles.submitBtn}
            style={{ background: currentRole.gradient }}
          >
            {currentPending ? <span className={styles.spinner} /> : null}
            {currentPending ? 'Signing in...' : `Sign in as ${currentRole.label} →`}
          </button>
        </form>

        {/* Sign up links */}
        {role !== 'institution' && (
          <>
            <div className={styles.divider}><span>don&apos;t have an account?</span></div>
            <Link
              href={role === 'student' ? '/auth/student/signup' : '/auth/company/signup'}
              className={styles.signupBtn}
            >
              Create {currentRole.label} Account
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
