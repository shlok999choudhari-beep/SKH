'use client'
import { useActionState } from 'react'
import Link from 'next/link'
import styles from '../../auth.module.css'
import { companySignup } from '@/app/actions/companyAuth'

export default function CompanySignup() {
  const [state, action, pending] = useActionState(companySignup, undefined)

  return (
    <div className={`${styles.page} ${styles.companyPage}`}>
      <div className={styles.orb1green} /><div className={styles.orb2green} />
      <Link href="/" className={styles.backBtn}>← Back to home</Link>
      <div className={`${styles.card} ${styles.cardWide} ${styles.companyCard}`}>
        <div className={styles.cardHeader}>
          <div className={`${styles.roleIcon} ${styles.companyIcon}`}>🏢</div>
          <h1 className={styles.title}>Register Your Company</h1>
          <p className={styles.subtitle}>Access AI-matched talent from top colleges across India.</p>
        </div>

        <form action={action} className={styles.form}>
          <div className={styles.row2}>
            <div className="form-group">
              <label className="form-label" htmlFor="company_name">Company Name</label>
              <input id="company_name" name="company_name" type="text" required className="form-input company" placeholder="Acme Technologies Pvt. Ltd." />
              {state?.errors?.company_name && <p className={styles.fieldError}>{state.errors.company_name[0]}</p>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="industry">Industry</label>
              <select id="industry" name="industry" className="form-input company">
                {['Technology','Finance','Healthcare','E-Commerce','Consulting','Manufacturing','Education','Other'].map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.row2}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Company Email</label>
              <input id="email" name="email" type="email" required className="form-input company" placeholder="hr@company.com" autoComplete="email" />
              {state?.errors?.email && <p className={styles.fieldError}>{state.errors.email[0]}</p>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="contact_person">Contact Person</label>
              <input id="contact_person" name="contact_person" type="text" required className="form-input company" placeholder="HR Manager Name" />
              {state?.errors?.contact_person && <p className={styles.fieldError}>{state.errors.contact_person[0]}</p>}
            </div>
          </div>

          <div className={styles.row2}>
            <div className="form-group">
              <label className="form-label" htmlFor="website">Company Website</label>
              <input id="website" name="website" type="url" className="form-input company" placeholder="https://yourcompany.com" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="location">Location</label>
              <input id="location" name="location" type="text" className="form-input company" placeholder="Bangalore, India" />
            </div>
          </div>

          <div className={styles.row2}>
            <div className="form-group">
              <label className="form-label" htmlFor="company_size">Company Size</label>
              <select id="company_size" name="company_size" className="form-input company">
                {['1–50','51–200','201–500','501–1000','1000+'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone Number</label>
              <input id="phone" name="phone" type="tel" className="form-input company" placeholder="+91 98765 43210" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required className="form-input company" placeholder="Min 8 characters" autoComplete="new-password" />
            {state?.errors?.password && <p className={styles.fieldError}>{state.errors.password[0]}</p>}
          </div>

          {state?.message && <p className={styles.error}>{state.message}</p>}

          <button type="submit" disabled={pending} className={`btn btn-company ${styles.submitBtn}`}>
            {pending ? <span className={styles.spinnerGreen} /> : null}
            {pending ? 'Registering...' : '🏢 Start Hiring Now'}
          </button>
        </form>

        <div className={styles.divider}><span>already registered?</span></div>
        <Link href="/auth/company/login" className={`btn btn-secondary ${styles.switchBtn}`}>Sign In Instead</Link>
        <p className={styles.switchText}>
          Are you a student?{' '}
          <Link href="/auth/student/signup" className={`${styles.link} ${styles.linkGreen}`}>Student Signup →</Link>
        </p>
      </div>
    </div>
  )
}
