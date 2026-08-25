'use client'

import { useState, useActionState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { studentSignup } from '@/app/actions/studentAuth'
import { companySignup } from '@/app/actions/companyAuth'
import Logo from '@/components/Logo'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import styles from './signup.module.css'
import { GraduationCap, Building2, ArrowLeft, ArrowRight, Rocket } from 'lucide-react'

type Role = 'student' | 'company'

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
]

function SignupContent() {
  const searchParams = useSearchParams()
  const initialRole = (searchParams.get('role') as Role) === 'company' ? 'company' : 'student'
  const [role, setRole] = useState<Role>(initialRole)

  const [studentState, studentAction, studentPending] = useActionState(studentSignup, undefined)
  const [companyState, companyAction, companyPending] = useActionState(companySignup, undefined)

  const currentRole = ROLES.find((r) => r.id === role)!
  const RoleIcon = currentRole.icon

  return (
    <div className={styles.page}>
      <Link href="/" className={styles.backBtn} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <ArrowLeft size={16} strokeWidth={2} />
        <span>Back to home</span>
      </Link>

      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
          <Logo
            variant={role === 'company' ? 'company' : 'student'}
            size="lg"
            href="/"
            withBadge
            badgeText={role.toUpperCase()}
          />
        </div>

        {/* Role Selector */}
        <div className={styles.roleSelector}>
          {ROLES.map((r) => {
            const TabIcon = r.icon
            return (
              <button
                key={r.id}
                type="button"
                className={`${styles.roleTab} ${role === r.id ? styles.roleTabActive : ''}`}
                onClick={() => setRole(r.id)}
                style={
                  role === r.id
                    ? { borderColor: r.color, boxShadow: `0 0 18px ${r.color}30` }
                    : {}
                }
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

        {/* Card Header */}
        <div className={styles.cardHeader}>
          <div className={styles.roleIcon} style={{ background: currentRole.gradient, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
            <RoleIcon size={24} strokeWidth={2} />
          </div>
          <h1 className={styles.title}>Create {currentRole.label} Account</h1>
          <p className={styles.subtitle}>
            {role === 'student'
              ? 'Start your AI-powered placement journey today — 100% free for students.'
              : 'Hire top skill-verified candidates and conduct AI technical assessments.'}
          </p>
        </div>

        {/* Student Signup Form */}
        {role === 'student' && (
          <form action={studentAction} className={styles.form}>
            <div className={styles.row2}>
              <div className="form-group">
                <label className="form-label" htmlFor="student-name">
                  Full Name *
                </label>
                <input
                  id="student-name"
                  name="name"
                  type="text"
                  required
                  className="form-input"
                  placeholder="Rahul Sharma"
                  autoComplete="name"
                />
                {studentState?.errors?.name && (
                  <p className={styles.fieldError}>{studentState.errors.name[0]}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="student-email">
                  Email Address *
                </label>
                <input
                  id="student-email"
                  name="email"
                  type="email"
                  required
                  className="form-input"
                  placeholder="rahul@college.edu"
                  autoComplete="email"
                />
                {studentState?.errors?.email && (
                  <p className={styles.fieldError}>{studentState.errors.email[0]}</p>
                )}
              </div>
            </div>

            <div className={styles.row2}>
              <div className="form-group">
                <label className="form-label" htmlFor="student-college">
                  College / University *
                </label>
                <input
                  id="student-college"
                  name="college"
                  type="text"
                  required
                  className="form-input"
                  placeholder="IIT Bombay"
                />
                {studentState?.errors?.college && (
                  <p className={styles.fieldError}>{studentState.errors.college[0]}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="student-degree">
                  Degree &amp; Branch *
                </label>
                <input
                  id="student-degree"
                  name="degree"
                  type="text"
                  required
                  className="form-input"
                  placeholder="B.Tech Computer Science"
                />
                {studentState?.errors?.degree && (
                  <p className={styles.fieldError}>{studentState.errors.degree[0]}</p>
                )}
              </div>
            </div>

            <div className={styles.row2}>
              <div className="form-group">
                <label className="form-label" htmlFor="student-year">
                  Graduation Year
                </label>
                <select id="student-year" name="year" className="form-input">
                  {[2024, 2025, 2026, 2027, 2028, 2029].map((y) => (
                    <option key={y} value={y} selected={y === 2026}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="student-phone">
                  Phone Number
                </label>
                <input
                  id="student-phone"
                  name="phone"
                  type="tel"
                  className="form-input"
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className={styles.row2}>
              <div className="form-group">
                <label className="form-label" htmlFor="student-password">
                  Password *
                </label>
                <input
                  id="student-password"
                  name="password"
                  type="password"
                  required
                  className="form-input"
                  placeholder="Min 8 characters"
                  autoComplete="new-password"
                />
                {studentState?.errors?.password && (
                  <p className={styles.fieldError}>{studentState.errors.password[0]}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="student-confirmPassword">
                  Confirm Password *
                </label>
                <input
                  id="student-confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="form-input"
                  placeholder="Repeat password"
                  autoComplete="new-password"
                />
                {studentState?.errors?.confirmPassword && (
                  <p className={styles.fieldError}>{studentState.errors.confirmPassword[0]}</p>
                )}
              </div>
            </div>

            {studentState?.message && <p className={styles.error}>{studentState.message}</p>}

            <button
              type="submit"
              disabled={studentPending}
              className={styles.submitBtn}
              style={{ background: currentRole.gradient, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {studentPending ? <MorphingInfinity className="size-4" style={{ width: '18px', height: '18px' }} /> : <Rocket size={18} strokeWidth={2} />}
              <span>{studentPending ? 'Creating Account...' : 'Start My Journey'}</span>
              {!studentPending && <ArrowRight size={16} strokeWidth={2} />}
            </button>
          </form>
        )}

        {/* Company Signup Form */}
        {role === 'company' && (
          <form action={companyAction} className={styles.form}>
            <div className={styles.row2}>
              <div className="form-group">
                <label className="form-label" htmlFor="company-name">
                  Company Name *
                </label>
                <input
                  id="company-name"
                  name="company_name"
                  type="text"
                  required
                  className="form-input"
                  placeholder="Acme Technologies"
                />
                {companyState?.errors?.company_name && (
                  <p className={styles.fieldError}>{companyState.errors.company_name[0]}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="company-email">
                  Work Email *
                </label>
                <input
                  id="company-email"
                  name="email"
                  type="email"
                  required
                  className="form-input"
                  placeholder="hr@acme.com"
                  autoComplete="email"
                />
                {companyState?.errors?.email && (
                  <p className={styles.fieldError}>{companyState.errors.email[0]}</p>
                )}
              </div>
            </div>

            <div className={styles.row2}>
              <div className="form-group">
                <label className="form-label" htmlFor="company-contact">
                  Contact Person *
                </label>
                <input
                  id="company-contact"
                  name="contact_person"
                  type="text"
                  required
                  className="form-input"
                  placeholder="Priya Mehta"
                />
                {companyState?.errors?.contact_person && (
                  <p className={styles.fieldError}>{companyState.errors.contact_person[0]}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="company-phone">
                  Phone Number
                </label>
                <input
                  id="company-phone"
                  name="phone"
                  type="tel"
                  className="form-input"
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className={styles.row2}>
              <div className="form-group">
                <label className="form-label" htmlFor="company-industry">
                  Industry / Domain
                </label>
                <input
                  id="company-industry"
                  name="industry"
                  type="text"
                  className="form-input"
                  placeholder="FinTech, SaaS, AI, HealthTech"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="company-size">
                  Company Size
                </label>
                <select id="company-size" name="company_size" className="form-input">
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50" selected>
                    11-50 employees
                  </option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="500+">500+ employees</option>
                </select>
              </div>
            </div>

            <div className={styles.row2}>
              <div className="form-group">
                <label className="form-label" htmlFor="company-website">
                  Website URL
                </label>
                <input
                  id="company-website"
                  name="website"
                  type="url"
                  className="form-input"
                  placeholder="https://acme.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="company-location">
                  Location / HQ
                </label>
                <input
                  id="company-location"
                  name="location"
                  type="text"
                  className="form-input"
                  placeholder="Bengaluru, India"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="company-password">
                Password *
              </label>
              <input
                id="company-password"
                name="password"
                type="password"
                required
                className="form-input"
                placeholder="Min 8 characters"
                autoComplete="new-password"
              />
              {companyState?.errors?.password && (
                <p className={styles.fieldError}>{companyState.errors.password[0]}</p>
              )}
            </div>

            {companyState?.message && <p className={styles.error}>{companyState.message}</p>}

            <button
              type="submit"
              disabled={companyPending}
              className={styles.submitBtn}
              style={{ background: currentRole.gradient, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {companyPending ? <MorphingInfinity className="size-4" style={{ width: '18px', height: '18px' }} /> : <Building2 size={18} strokeWidth={2} />}
              <span>{companyPending ? 'Registering Company...' : 'Register Company'}</span>
              {!companyPending && <ArrowRight size={16} strokeWidth={2} />}
            </button>
          </form>
        )}

        {/* Switch to Login */}
        <div className={styles.divider}>
          <span>already have an account?</span>
        </div>
        <Link href={`/auth/login?role=${role}`} className={styles.signInBtn} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <span>Sign in as {currentRole.label}</span>
          <ArrowRight size={14} strokeWidth={2} />
        </Link>
      </div>
    </div>
  )
}

export default function UnifiedSignupPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f8fafc',
          }}
        >
          Loading...
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  )
}
