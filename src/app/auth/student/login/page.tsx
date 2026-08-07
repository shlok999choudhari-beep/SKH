'use client'
import { useActionState } from 'react'
import Link from 'next/link'
import styles from '../../auth.module.css'
import { studentLogin } from '@/app/actions/studentAuth'

export default function StudentLogin() {
  const [state, action, pending] = useActionState(studentLogin, undefined)

  return (
    <div className={styles.page}>
      <div className={styles.orb1} /><div className={styles.orb2} />
      <Link href="/" className={styles.backBtn}>← Back to home</Link>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={`${styles.roleIcon} ${styles.studentIcon}`}>🎓</div>
          <h1 className={styles.title}>Student Login</h1>
          <p className={styles.subtitle}>Welcome back! Let&apos;s continue your placement journey.</p>
        </div>

        <form action={action} className={styles.form}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email" name="email" type="email" required
              className="form-input" placeholder="you@college.edu"
              autoComplete="email"
            />
            {state?.errors?.email && (
              <p className={styles.fieldError}>{state.errors.email[0]}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password" name="password" type="password" required
              className="form-input" placeholder="••••••••"
              autoComplete="current-password"
            />
            {state?.errors?.password && (
              <p className={styles.fieldError}>{state.errors.password[0]}</p>
            )}
          </div>

          {state?.message && <p className={styles.error}>{state.message}</p>}

          <button type="submit" disabled={pending} className={`btn btn-student ${styles.submitBtn}`}>
            {pending ? <span className={styles.spinner} /> : null}
            {pending ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <div className={styles.divider}><span>don&apos;t have an account?</span></div>
        <Link href="/auth/student/signup" className={`btn btn-secondary ${styles.switchBtn}`}>
          Create Student Account
        </Link>
        <p className={styles.switchText}>
          Are you a company?{' '}
          <Link href="/auth/company/login" className={styles.link}>Company Login →</Link>
        </p>
      </div>
    </div>
  )
}
