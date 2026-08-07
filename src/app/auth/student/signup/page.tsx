'use client'
import { useActionState } from 'react'
import Link from 'next/link'
import styles from '../../auth.module.css'
import { studentSignup } from '@/app/actions/studentAuth'

export default function StudentSignup() {
  const [state, action, pending] = useActionState(studentSignup, undefined)

  return (
    <div className={styles.page}>
      <div className={styles.orb1} /><div className={styles.orb2} />
      <Link href="/" className={styles.backBtn}>← Back to home</Link>
      <div className={`${styles.card} ${styles.cardWide}`}>
        <div className={styles.cardHeader}>
          <div className={`${styles.roleIcon} ${styles.studentIcon}`}>🎓</div>
          <h1 className={styles.title}>Create Student Account</h1>
          <p className={styles.subtitle}>Start your AI-powered placement journey today — it&apos;s free!</p>
        </div>

        <form action={action} className={styles.form}>
          <div className={styles.row2}>
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <input id="name" name="name" type="text" required className="form-input" placeholder="Rahul Sharma" />
              {state?.errors?.name && <p className={styles.fieldError}>{state.errors.name[0]}</p>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input id="email" name="email" type="email" required className="form-input" placeholder="rahul@college.edu" autoComplete="email" />
              {state?.errors?.email && <p className={styles.fieldError}>{state.errors.email[0]}</p>}
            </div>
          </div>

          <div className={styles.row2}>
            <div className="form-group">
              <label className="form-label" htmlFor="college">College / University</label>
              <input id="college" name="college" type="text" required className="form-input" placeholder="IIT Bombay" />
              {state?.errors?.college && <p className={styles.fieldError}>{state.errors.college[0]}</p>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="degree">Degree &amp; Branch</label>
              <input id="degree" name="degree" type="text" required className="form-input" placeholder="B.Tech Computer Science" />
              {state?.errors?.degree && <p className={styles.fieldError}>{state.errors.degree[0]}</p>}
            </div>
          </div>

          <div className={styles.row2}>
            <div className="form-group">
              <label className="form-label" htmlFor="year">Graduation Year</label>
              <select id="year" name="year" className="form-input">
                {[2025,2026,2027,2028].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone Number</label>
              <input id="phone" name="phone" type="tel" className="form-input" placeholder="+91 98765 43210" />
            </div>
          </div>

          <div className={styles.row2}>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input id="password" name="password" type="password" required className="form-input" placeholder="Min 8 characters" autoComplete="new-password" />
              {state?.errors?.password && <p className={styles.fieldError}>{state.errors.password[0]}</p>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" required className="form-input" placeholder="Repeat your password" autoComplete="new-password" />
              {state?.errors?.confirmPassword && <p className={styles.fieldError}>{state.errors.confirmPassword[0]}</p>}
            </div>
          </div>

          {state?.message && <p className={styles.error}>{state.message}</p>}

          <button type="submit" disabled={pending} className={`btn btn-student ${styles.submitBtn}`}>
            {pending ? <span className={styles.spinner} /> : null}
            {pending ? 'Creating Account...' : '🚀 Start My Journey'}
          </button>
        </form>

        <div className={styles.divider}><span>already have an account?</span></div>
        <Link href="/auth/student/login" className={`btn btn-secondary ${styles.switchBtn}`}>Sign In Instead</Link>
        <p className={styles.switchText}>
          Are you a company?{' '}
          <Link href="/auth/company/signup" className={styles.link}>Register as Company →</Link>
        </p>
      </div>
    </div>
  )
}
