'use client'
import { useActionState } from 'react'
import Link from 'next/link'
import styles from '../../auth.module.css'
import { companyLogin } from '@/app/actions/companyAuth'

export default function CompanyLogin() {
  const [state, action, pending] = useActionState(companyLogin, undefined)

  return (
    <div className={`${styles.page} ${styles.companyPage}`}>
      <div className={styles.orb1green} /><div className={styles.orb2green} />
      <Link href="/" className={styles.backBtn}>← Back to home</Link>
      <div className={`${styles.card} ${styles.companyCard}`}>
        <div className={styles.cardHeader}>
          <div className={`${styles.roleIcon} ${styles.companyIcon}`}>🏢</div>
          <h1 className={styles.title}>Company Portal</h1>
          <p className={styles.subtitle}>Access your hiring dashboard and manage your talent pipeline.</p>
        </div>

        <form action={action} className={styles.form}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Company Email</label>
            <input
              id="email" name="email" type="email" required
              className="form-input company" placeholder="hr@yourcompany.com"
              autoComplete="email"
            />
            {state?.errors?.email && <p className={styles.fieldError}>{state.errors.email[0]}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password" name="password" type="password" required
              className="form-input company" placeholder="••••••••"
              autoComplete="current-password"
            />
            {state?.errors?.password && <p className={styles.fieldError}>{state.errors.password[0]}</p>}
          </div>

          {state?.message && <p className={styles.error}>{state.message}</p>}

          <button type="submit" disabled={pending} className={`btn btn-company ${styles.submitBtn}`}>
            {pending ? <span className={styles.spinnerGreen} /> : null}
            {pending ? 'Signing in...' : 'Access Dashboard →'}
          </button>
        </form>

        <div className={styles.divider}><span>not registered yet?</span></div>
        <Link href="/auth/company/signup" className={`btn btn-secondary ${styles.switchBtn}`}>
          Register Your Company
        </Link>
        <p className={styles.switchText}>
          Are you a student?{' '}
          <Link href="/auth/student/login" className={`${styles.link} ${styles.linkGreen}`}>Student Login →</Link>
        </p>
      </div>
    </div>
  )
}
