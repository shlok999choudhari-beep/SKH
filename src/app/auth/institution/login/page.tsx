'use client'
import { useActionState } from 'react'
import Link from 'next/link'
import styles from '../../auth.module.css'
import { institutionLogin } from '@/app/actions/institutionAuth'

export default function InstitutionLogin() {
  const [state, action, pending] = useActionState(institutionLogin, undefined)

  return (
    <div className={`${styles.page} ${styles.institutionPage}`}>
      <div className={styles.orb1purple} />
      <div className={styles.orb2purple} />
      <Link href="/" className={styles.backBtn}>← Back to home</Link>
      
      <div className={`${styles.card} ${styles.institutionCard}`}>
        <div className={styles.cardHeader}>
          <div className={`${styles.roleIcon} ${styles.institutionIcon}`}>🏛️</div>
          <h1 className={styles.title}>Institution Login</h1>
          <p className={styles.subtitle}>Manage your institution's career ecosystem, trainers, and placements.</p>
        </div>

        <form action={action} className={styles.form}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email" name="email" type="email" required
              className="form-input" placeholder="admin@institution.edu"
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

          <button type="submit" disabled={pending} className={`btn btn-institution ${styles.submitBtn}`}>
            {pending ? <span className={styles.spinner} /> : null}
            {pending ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <div className={styles.divider}><span>other portals</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Link href="/auth/student/login" className={`btn btn-secondary ${styles.switchBtn}`} style={{ marginBottom: 0 }}>
            Student Login
          </Link>
          <Link href="/auth/company/login" className={`btn btn-secondary ${styles.switchBtn}`} style={{ marginBottom: 0 }}>
            Company Login
          </Link>
        </div>
      </div>
    </div>
  )
}
