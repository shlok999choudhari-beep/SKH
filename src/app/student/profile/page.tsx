'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import StudentSidebar from '@/components/StudentSidebar'
import BackButton from '@/components/BackButton'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import layoutStyles from '../dashboard.module.css'
import styles from './profile.module.css'
import {
  User,
  Mail,
  Phone,
  School,
  GraduationCap,
  Calendar,
  Award,
  Link as LinkIcon,
  Code2,
  Share2,
  Globe,
  Lock,
  Save,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Zap,
  FileText,
  Mic,
  FolderLock,
  ArrowRight,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Clock
} from 'lucide-react'

export default function StudentProfile() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState('')
  const [saveError, setSaveError] = useState('')
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [lockedTooltip, setLockedTooltip] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    college: '',
    degree: '',
    graduation_year: '',
    phone: '',
    cgpa: '',
    tenth_marks: '',
    twelfth_marks: '',
    github_url: '',
    linkedin_url: '',
    portfolio_url: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/student/profile', { cache: 'no-store' })
      const data = await res.json()
      if (data && !data.error) {
        setProfile(data)
        setFormData({
          name: data.name || '',
          email: data.email || '',
          college: data.college || '',
          degree: data.degree || '',
          graduation_year: data.graduation_year ? String(data.graduation_year) : '',
          phone: data.phone || '',
          cgpa: data.cgpa ? String(data.cgpa) : '',
          tenth_marks: (data.tenth_marks ?? data.tenthMarks) ? String(data.tenth_marks ?? data.tenthMarks) : '',
          twelfth_marks: (data.twelfth_marks ?? data.twelfthMarks) ? String(data.twelfth_marks ?? data.twelfthMarks) : '',
          github_url: data.github_url || '',
          linkedin_url: data.linkedin_url || '',
          portfolio_url: data.portfolio_url || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const isAcademicVerified = Boolean(
    profile?.isAcademicLocked ||
    profile?.is_academic_locked ||
    profile?.academicVerificationStatus === 'VERIFIED' ||
    profile?.academic_verification_status === 'VERIFIED'
  )

  // Calculate profile completion percentage
  const completionPercentage = useMemo(() => {
    const fields = [
      formData.name,
      formData.email,
      formData.college,
      formData.degree,
      formData.phone,
      formData.tenth_marks,
      formData.twelfth_marks,
      formData.github_url || formData.linkedin_url
    ]
    const filled = fields.filter(f => Boolean(f && String(f).trim().length > 0)).length
    return Math.round((filled / fields.length) * 100)
  }, [formData])

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'ST'
  }

  const handleLockedFieldClick = (fieldName: string) => {
    setLockedTooltip(`This ${fieldName} was extracted from your verified academic document and cannot be edited.`)
    setTimeout(() => setLockedTooltip(null), 5000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveSuccess('')
    setSaveError('')

    if (showPasswordSection) {
      if (formData.newPassword !== formData.confirmPassword) {
        setSaveError('New passwords do not match.')
        return
      }
      if (!formData.currentPassword) {
        setSaveError('Please enter your current password to confirm changes.')
        return
      }
    }

    setSaving(true)
    try {
      const res = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (res.ok) {
        setSaveSuccess('Profile saved successfully!')
        setShowPasswordSection(false)
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }))
        setTimeout(() => setSaveSuccess(''), 4000)
        fetchProfile()
      } else {
        setSaveError(data.error || 'Failed to update profile.')
      }
    } catch (error) {
      setSaveError('Network error. Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className={layoutStyles.layout}>
        <StudentSidebar />
        <div className={layoutStyles.content}>
          <div style={{ padding: '80px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <MorphingInfinity className="size-16" style={{ width: '64px', height: '64px', color: '#8b5cf6' }} />
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Loading student profile...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={layoutStyles.layout}>
      <StudentSidebar />

      <div className={layoutStyles.content}>
        {/* ── STICKY PAGE HEADER ── */}
        <header className={layoutStyles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <BackButton fallbackHref="/student/dashboard" />
            <div>
              <h1 className={layoutStyles.pageTitle}>Student Profile & Settings</h1>
              <p className={layoutStyles.pageSubtitle}>Manage your verified academic records, developer portfolio, and account credentials.</p>
            </div>
          </div>

          <div className={layoutStyles.headerActions}>
            <Link
              href="/student/verify-academics"
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ShieldCheck size={14} color="#34d399" />
              <span>Document Verification</span>
            </Link>
            <Link
              href="/student/documents"
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <FolderLock size={14} />
              <span>Document Vault</span>
            </Link>
          </div>
        </header>

        {/* ── MAIN CONTENT ── */}
        <main className={layoutStyles.main}>
          <form onSubmit={handleSubmit} className={styles.container}>

            {/* ── UNVERIFIED STATUS PROMPT BANNER ── */}
            {!isAcademicVerified && (
              <div className={styles.unverifiedBanner}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <AlertCircle size={22} color="#fbbf24" style={{ flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: '#fef08a', fontSize: '13.5px' }}>Academic Verification Required</strong>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#cbd5e1' }}>
                      To unlock campus drive eligibility and verify your official marks, please upload your 10th and 12th marksheets.
                    </p>
                  </div>
                </div>
                <Link
                  href="/student/verify-academics"
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                >
                  <span>Verify Marksheets</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}

            {/* ── HERO PROFILE CARD ── */}
            <div className={styles.heroCard}>
              <div className={styles.heroLeft}>
                <div className={styles.avatarRing}>
                  <span>{getInitials(formData.name || profile?.name)}</span>
                  {isAcademicVerified && (
                    <span className={styles.verifiedBadge} title="Verified Candidate via Official Marksheet">
                      <CheckCircle2 size={14} strokeWidth={3} />
                    </span>
                  )}
                </div>

                <div className={styles.heroInfo}>
                  <div className={styles.heroNameRow}>
                    <h2 className={styles.heroName}>{formData.name || 'Student Profile'}</h2>
                    {isAcademicVerified ? (
                      <span className={styles.roleBadge} style={{ background: 'rgba(16, 185, 129, 0.18)', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399' }}>
                        <ShieldCheck size={13} />
                        <span>✓ Document Verified</span>
                      </span>
                    ) : (
                      <span className={styles.roleBadge}>
                        <Clock size={12} />
                        <span>Verification Pending</span>
                      </span>
                    )}
                  </div>

                  <div className={styles.heroMeta}>
                    <span className={styles.heroMetaItem}>
                      <Mail size={13} color="#94a3b8" />
                      <span>{formData.email}</span>
                    </span>
                    {formData.college && (
                      <span className={styles.heroMetaItem}>
                        <School size={13} color="#94a3b8" />
                        <span>{formData.college}</span>
                      </span>
                    )}
                    {formData.degree && (
                      <span className={styles.heroMetaItem}>
                        <GraduationCap size={13} color="#94a3b8" />
                        <span>{formData.degree}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Completion Meter */}
              <div className={styles.heroRight}>
                <div className={styles.completionBox}>
                  <div className={styles.completionTop}>
                    <span>Profile Trust Score</span>
                    <strong>{isAcademicVerified ? '100% Verified' : `${completionPercentage}%`}</strong>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${isAcademicVerified ? 100 : completionPercentage}%`, background: isAcademicVerified ? 'linear-gradient(90deg, #10b981, #34d399)' : undefined }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Locked Field Feedback Tooltip */}
            {lockedTooltip && (
              <div className={`${styles.alertToast} ${styles.alertSuccess}`} style={{ background: 'rgba(124, 58, 237, 0.2)', borderColor: 'rgba(139, 92, 246, 0.4)', color: '#e9d5ff' }}>
                <Lock size={16} />
                <span>{lockedTooltip}</span>
              </div>
            )}

            {/* Feedback Alerts */}
            {saveSuccess && (
              <div className={`${styles.alertToast} ${styles.alertSuccess}`}>
                <CheckCircle2 size={16} />
                <span>{saveSuccess}</span>
              </div>
            )}

            {saveError && (
              <div className={`${styles.alertToast} ${styles.alertError}`}>
                <AlertCircle size={16} />
                <span>{saveError}</span>
              </div>
            )}

            {/* ── 2-COLUMN FORM GRID ── */}
            <div className={styles.profileGrid}>

              {/* ── LEFT COLUMN ── */}
              <div className={styles.gridColumn}>

                {/* CARD 1: PERSONAL INFORMATION */}
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardHeaderLeft}>
                      <div className={styles.cardIconWrap} style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.1))', color: '#c084fc' }}>
                        <User size={18} />
                      </div>
                      <div>
                        <h3 className={styles.cardTitle}>Personal Information</h3>
                        <span className={styles.cardSubtitle}>Your core contact and identity details</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.formRow2}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        <span>Full Name *</span>
                        {isAcademicVerified ? (
                          <span className={styles.verifiedFieldBadge}>
                            <Lock size={10} />
                            <span>[Verified]</span>
                          </span>
                        ) : null}
                      </label>
                      <div className={styles.inputWrapper}>
                        <User size={15} className={styles.inputIcon} />
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => {
                            if (!isAcademicVerified) {
                              setFormData({ ...formData, name: e.target.value })
                            }
                          }}
                          onClick={() => {
                            if (isAcademicVerified) {
                              handleLockedFieldClick('Candidate Name')
                            }
                          }}
                          className={`${styles.input} ${isAcademicVerified ? styles.inputLocked : ''}`}
                          placeholder="Your legal name"
                          readOnly={isAcademicVerified}
                          required
                        />
                      </div>
                      {isAcademicVerified && (
                        <div className={styles.lockedFieldNotice}>
                          <Lock size={11} />
                          <span>Verified from official marksheet (Read-only)</span>
                        </div>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        <span>Email Address</span>
                        <span className={styles.labelHint}>(Read-only)</span>
                      </label>
                      <div className={styles.inputWrapper}>
                        <Mail size={15} className={styles.inputIcon} />
                        <input
                          type="email"
                          value={formData.email}
                          className={`${styles.input} ${styles.inputDisabled}`}
                          disabled
                        />
                      </div>
                    </div>
                  </div>

                  <div className={styles.formRow2}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        <span>Phone Number</span>
                      </label>
                      <div className={styles.inputWrapper}>
                        <Phone size={15} className={styles.inputIcon} />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className={styles.input}
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        <span>Candidate ID</span>
                        <span className={styles.labelHint}>(Institutional)</span>
                      </label>
                      <div className={styles.inputWrapper}>
                        <ShieldCheck size={15} className={styles.inputIcon} />
                        <input
                          type="text"
                          value={profile?.id ? `PIQ-STU-${String(profile.id).padStart(5, '0')}` : 'PIQ-STU-00001'}
                          className={`${styles.input} ${styles.inputDisabled}`}
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* CARD 2: ACADEMIC CREDENTIALS & SCORES */}
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardHeaderLeft}>
                      <div className={styles.cardIconWrap} style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.1))', color: '#34d399' }}>
                        <GraduationCap size={18} />
                      </div>
                      <div>
                        <h3 className={styles.cardTitle}>Academic Records</h3>
                        <span className={styles.cardSubtitle}>Verified marks for campus drive eligibility</span>
                      </div>
                    </div>
                    {isAcademicVerified && (
                      <span className={styles.verifiedFieldBadge}>
                        <Lock size={11} />
                        <span>🔒 Verified &amp; Locked</span>
                      </span>
                    )}
                  </div>

                  <div className={styles.formRow2}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>College / University</label>
                      <div className={styles.inputWrapper}>
                        <School size={15} className={styles.inputIcon} />
                        <input
                          type="text"
                          value={formData.college}
                          onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                          className={styles.input}
                          placeholder="e.g. IIT Bombay / BITS Pilani"
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Degree & Specialization</label>
                      <div className={styles.inputWrapper}>
                        <GraduationCap size={15} className={styles.inputIcon} />
                        <input
                          type="text"
                          value={formData.degree}
                          onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                          className={styles.input}
                          placeholder="e.g. B.Tech Computer Science"
                        />
                      </div>
                    </div>
                  </div>

                  <div className={styles.formRow3}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        <span>10th Percentage</span>
                        {isAcademicVerified && (
                          <span className={styles.verifiedFieldBadge}>
                            <Lock size={10} />
                            <span>[Verified]</span>
                          </span>
                        )}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.tenth_marks}
                        onChange={(e) => {
                          if (!isAcademicVerified) {
                            setFormData({ ...formData, tenth_marks: e.target.value })
                          }
                        }}
                        onClick={() => {
                          if (isAcademicVerified) {
                            handleLockedFieldClick('10th Percentage')
                          }
                        }}
                        className={`${styles.input} ${styles.inputNoIcon} ${isAcademicVerified ? styles.inputLocked : ''}`}
                        placeholder="e.g. 94.00"
                        readOnly={isAcademicVerified}
                      />
                      {isAcademicVerified && (
                        <div className={styles.lockedFieldNotice} style={{ fontSize: '10.5px' }}>
                          ✓ Verified from Marksheet
                        </div>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        <span>12th Percentage</span>
                        {isAcademicVerified && (
                          <span className={styles.verifiedFieldBadge}>
                            <Lock size={10} />
                            <span>[Verified]</span>
                          </span>
                        )}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.twelfth_marks}
                        onChange={(e) => {
                          if (!isAcademicVerified) {
                            setFormData({ ...formData, twelfth_marks: e.target.value })
                          }
                        }}
                        onClick={() => {
                          if (isAcademicVerified) {
                            handleLockedFieldClick('12th Percentage')
                          }
                        }}
                        className={`${styles.input} ${styles.inputNoIcon} ${isAcademicVerified ? styles.inputLocked : ''}`}
                        placeholder="e.g. 80.00"
                        readOnly={isAcademicVerified}
                      />
                      {isAcademicVerified && (
                        <div className={styles.lockedFieldNotice} style={{ fontSize: '10.5px' }}>
                          ✓ Verified from Marksheet
                        </div>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        <span>CGPA (Optional)</span>
                      </label>
                      <div className={styles.inputWrapper}>
                        <Award size={15} className={styles.inputIcon} />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          value={formData.cgpa}
                          onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                          className={styles.input}
                          placeholder="e.g. 8.75"
                        />
                      </div>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Expected Graduation Year</label>
                    <div className={styles.inputWrapper}>
                      <Calendar size={15} className={styles.inputIcon} />
                      <input
                        type="number"
                        min="2020"
                        max="2035"
                        value={formData.graduation_year}
                        onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })}
                        className={styles.input}
                        placeholder="e.g. 2026"
                      />
                    </div>
                  </div>

                  {/* Academic Documents Status Block */}
                  {isAcademicVerified ? (
                    <div className={styles.academicDocsStatusCard}>
                      <div className={styles.academicDocsStatusHeader}>
                        <span className={styles.academicDocsStatusTitle}>
                          <ShieldCheck size={15} color="#34d399" />
                          <span>Academic Documents Status</span>
                        </span>
                        <span className={styles.verifiedFieldBadge}>
                          <Lock size={10} />
                          <span>✓ Verified from Official Marksheet</span>
                        </span>
                      </div>

                      <div className={styles.academicDocRow}>
                        <span>10th Marksheet</span>
                        <span className={styles.academicDocRowVerified}>
                          <CheckCircle2 size={14} color="#34d399" />
                          <span>✓ Verified ({profile?.tenthBoard || 'Official Board'}, {profile?.tenthPassingYear || 'Passed'})</span>
                        </span>
                      </div>

                      <div className={styles.academicDocRow}>
                        <span>12th Marksheet</span>
                        <span className={styles.academicDocRowVerified}>
                          <CheckCircle2 size={14} color="#34d399" />
                          <span>✓ Verified ({profile?.twelfthBoard || 'Official Board'}, {profile?.twelfthPassingYear || 'Passed'})</span>
                        </span>
                      </div>

                      {profile?.academicVerifiedAt && (
                        <div className={styles.academicDocRowTimestamp}>
                          Verified on: {new Date(profile.academicVerifiedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

              </div>

              {/* ── RIGHT COLUMN ── */}
              <div className={styles.gridColumn}>

                {/* CARD 3: DEVELOPER & SOCIAL LINKS */}
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardHeaderLeft}>
                      <div className={styles.cardIconWrap} style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(6,182,212,0.1))', color: '#60a5fa' }}>
                        <LinkIcon size={18} />
                      </div>
                      <div>
                        <h3 className={styles.cardTitle}>Online & Social Profiles</h3>
                        <span className={styles.cardSubtitle}>Connected profiles shown to recruiters</span>
                      </div>
                    </div>
                  </div>

                  {/* GitHub */}
                  <div className={styles.formGroup} style={{ marginBottom: '14px' }}>
                    <label className={styles.label}>GitHub Profile</label>
                    <div className={styles.socialRow}>
                      <div className={styles.socialInputWrap}>
                        <Code2 size={15} className={styles.inputIcon} />
                        <input
                          type="url"
                          value={formData.github_url}
                          onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                          className={styles.input}
                          placeholder="https://github.com/your-handle"
                        />
                      </div>
                      {formData.github_url && (
                        <a
                          href={formData.github_url}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.linkVisitBtn}
                          title="Open GitHub"
                        >
                          <ExternalLink size={15} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* LinkedIn */}
                  <div className={styles.formGroup} style={{ marginBottom: '14px' }}>
                    <label className={styles.label}>LinkedIn Profile</label>
                    <div className={styles.socialRow}>
                      <div className={styles.socialInputWrap}>
                        <Share2 size={15} className={styles.inputIcon} />
                        <input
                          type="url"
                          value={formData.linkedin_url}
                          onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                          className={styles.input}
                          placeholder="https://linkedin.com/in/your-profile"
                        />
                      </div>
                      {formData.linkedin_url && (
                        <a
                          href={formData.linkedin_url}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.linkVisitBtn}
                          title="Open LinkedIn"
                        >
                          <ExternalLink size={15} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Portfolio */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Portfolio / Personal Website</label>
                    <div className={styles.socialRow}>
                      <div className={styles.socialInputWrap}>
                        <Globe size={15} className={styles.inputIcon} />
                        <input
                          type="url"
                          value={formData.portfolio_url}
                          onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                          className={styles.input}
                          placeholder="https://yourportfolio.dev"
                        />
                      </div>
                      {formData.portfolio_url && (
                        <a
                          href={formData.portfolio_url}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.linkVisitBtn}
                          title="Open Portfolio"
                        >
                          <ExternalLink size={15} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* CARD 4: ACCOUNT SECURITY */}
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardHeaderLeft}>
                      <div className={styles.cardIconWrap} style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(236,72,153,0.1))', color: '#fbbf24' }}>
                        <Lock size={18} />
                      </div>
                      <div>
                        <h3 className={styles.cardTitle}>Account Security</h3>
                        <span className={styles.cardSubtitle}>Password and authentication management</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowPasswordSection(!showPasswordSection)}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '11.5px' }}
                    >
                      {showPasswordSection ? 'Hide Form' : 'Update Password'}
                    </button>
                  </div>

                  {showPasswordSection ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Current Password *</label>
                        <div className={styles.inputWrapper}>
                          <Lock size={15} className={styles.inputIcon} />
                          <input
                            type="password"
                            value={formData.currentPassword}
                            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                            className={styles.input}
                            placeholder="Enter existing password"
                          />
                        </div>
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.label}>New Password *</label>
                        <div className={styles.inputWrapper}>
                          <Lock size={15} className={styles.inputIcon} />
                          <input
                            type="password"
                            value={formData.newPassword}
                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                            className={styles.input}
                            placeholder="Minimum 8 characters"
                          />
                        </div>
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.label}>Confirm New Password *</label>
                        <div className={styles.inputWrapper}>
                          <Lock size={15} className={styles.inputIcon} />
                          <input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className={styles.input}
                            placeholder="Repeat new password"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <ShieldCheck size={16} color="#34d399" />
                        <span>Password encryption: <strong>Bcrypt Active</strong></span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#c084fc', fontWeight: 600 }}>Secured</span>
                    </div>
                  )}
                </div>

                {/* CARD 5: FAST-TRACK TOOLS */}
                <div className={styles.card} style={{ background: 'linear-gradient(135deg, rgba(20, 15, 42, 0.7), rgba(12, 10, 26, 0.8))' }}>
                  <div className={styles.cardHeader} style={{ borderBottom: 'none', marginBottom: '8px', paddingBottom: 0 }}>
                    <div className={styles.cardHeaderLeft}>
                      <Sparkles size={16} color="#c084fc" />
                      <h4 className={styles.cardTitle} style={{ fontSize: '14px' }}>Fast-Track Placement Tools</h4>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                    <Link
                      href="/student/resume"
                      style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}
                    >
                      <FileText size={15} color="#8b5cf6" />
                      <span>ATS Resume</span>
                    </Link>

                    <Link
                      href="/student/mock-interview"
                      style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}
                    >
                      <Mic size={15} color="#3b82f6" />
                      <span>AI Interview</span>
                    </Link>
                  </div>
                </div>

              </div>

            </div>

            {/* ── STICKY BOTTOM ACTION FOOTER ── */}
            <div className={styles.actionFooter}>
              <span className={styles.actionFooterText}>
                {isAcademicVerified ? 'Academic credentials are locked from verified official documents.' : 'Remember to verify your academic marksheets to unlock all placement features.'}
              </span>

              <div className={styles.actionButtons}>
                <button
                  type="button"
                  onClick={fetchProfile}
                  className="btn btn-secondary btn-md"
                  disabled={saving}
                >
                  Reset Changes
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary btn-md"
                  style={{ minWidth: '150px' }}
                >
                  {saving ? (
                    <>
                      <MorphingInfinity className="size-4" style={{ width: '16px', height: '16px' }} />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </form>
        </main>
      </div>
    </div>
  )
}
