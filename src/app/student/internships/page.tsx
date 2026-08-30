'use client'
import { useState, useEffect } from 'react'
import StudentSidebar from '@/components/StudentSidebar'
import BackButton from '@/components/BackButton'
import AcademicProfileModal from '@/components/AcademicProfileModal'
import styles from '../dashboard.module.css'
import {
  GraduationCap,
  CheckCircle2,
  TriangleAlert,
  CircleX,
  ArrowRight,
  Briefcase,
  TrendingUp,
  Building2,
  MapPin,
  DollarSign,
  Clock,
  Bell,
  Sparkles,
  Award,
  Search
} from 'lucide-react'

export default function StudentInternshipsPage() {
  const [studentProfile, setStudentProfile] = useState<any>(null)
  const [internships, setInternships] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [showAcademicModal, setShowAcademicModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'available' | 'active'>('available')
  const [searchQuery, setSearchQuery] = useState('')
  const [blockedNotice, setBlockedNotice] = useState<string | null>(null)

  useEffect(() => {
    fetchStudentProfile()
  }, [])

  const fetchStudentProfile = async () => {
    try {
      const res = await fetch('/api/student/profile', { cache: 'no-store' })
      const data = await res.json()
      if (data && !data.error) {
        setStudentProfile(data)
        const isVerified = Boolean(
          (data.academicVerificationStatus === 'VERIFIED' || data.academic_verification_status === 'VERIFIED') &&
          data.isAcademicLocked
        )
        if (!isVerified) {
          setShowAcademicModal(true)
        } else {
          setShowAcademicModal(false)
        }
        fetchInternships(data.id || 1)
      } else {
        fetchInternships(1)
      }
    } catch (err) {
      console.error('Error fetching student profile:', err)
      fetchInternships(1)
    }
  }

  const fetchInternships = async (studentId?: number) => {
    try {
      const sId = studentId || studentProfile?.id || 1
      const res = await fetch(`/api/internships?studentId=${sId}`, { cache: 'no-store' })
      const data = await res.json()
      if (data.internships) {
        setInternships(data.internships)
      }
    } catch (err) {
      console.error('Error fetching internships:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (internshipId: number) => {
    setUpdatingId(internshipId)
    try {
      const sId = studentProfile?.id || 1
      const res = await fetch(`/api/internships/${internshipId}/applications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: sId, status: 'offered' })
      })
      if (res.ok) {
        alert('Opportunity accepted! You are now in the active hiring pipeline.')
        setActiveTab('active')
        fetchInternships(sId)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to accept internship')
      }
    } catch (err) {
      console.error(err)
      alert('An error occurred while accepting.')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleReject = async (internshipId: number) => {
    if (!confirm('Are you sure you want to reject this internship opportunity? It will be removed from your dashboard.')) {
      return
    }

    setUpdatingId(internshipId)
    try {
      const sId = studentProfile?.id || 1
      const res = await fetch(`/api/internships/${internshipId}/applications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: sId, status: 'rejected' })
      })
      if (res.ok) {
        fetchInternships(sId)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to reject opportunity')
      }
    } catch (err) {
      console.error(err)
      alert('An error occurred while rejecting.')
    } finally {
      setUpdatingId(null)
    }
  }

  // Check student eligibility against internship requirements
  const checkEligibility = (internship: any) => {
    if (!studentProfile || studentProfile.cgpa === null || studentProfile.cgpa === undefined) {
      return { eligible: false, reason: 'Please complete your academic profile to check eligibility.', incomplete: true }
    }

    const studentCgpa = Number(studentProfile.cgpa || 0)
    const studentTenth = Number(studentProfile.tenth_marks || studentProfile.tenthMarks || 0)
    const studentTwelfth = Number(studentProfile.twelfth_marks || studentProfile.twelfthMarks || 0)

    const minCgpa = Number(internship.min_cgpa || 0)
    const minTenth = Number(internship.min_tenth_marks || 0)
    const minTwelfth = Number(internship.min_twelfth_marks || 0)

    const failedCriteria = []
    if (minCgpa > 0 && studentCgpa < minCgpa) {
      failedCriteria.push(`Min ${minCgpa} CGPA (Yours: ${studentCgpa})`)
    }
    if (minTwelfth > 0 && studentTwelfth < minTwelfth) {
      failedCriteria.push(`Min ${minTwelfth}% 12th Marks (Yours: ${studentTwelfth}%)`)
    }
    if (minTenth > 0 && studentTenth < minTenth) {
      failedCriteria.push(`Min ${minTenth}% 10th Marks (Yours: ${studentTenth}%)`)
    }

    if (failedCriteria.length > 0) {
      return {
        eligible: false,
        reason: `Criteria not met: ${failedCriteria.join(', ')}`,
        incomplete: false
      }
    }

    return {
      eligible: true,
      reason: `Eligible! Your CGPA (${studentCgpa}) & Marks meet all criteria.`,
      incomplete: false
    }
  }

  // Map status string to pipeline step number (1 to 4)
  const getStageStep = (status: string) => {
    switch (status) {
      case 'offered':
      case 'pending':
      case 'applied':
      case 'accepted':
        return 1
      case 'coding_round':
        return 2
      case 'interview':
        return 3
      case 'placed':
        return 4
      default:
        return 1
    }
  }

  const getStageDetails = (status: string) => {
    switch (status) {
      case 'offered':
      case 'pending':
      case 'applied':
      case 'accepted':
        return {
          badge: 'Stage 1: Offered',
          badgeClass: 'badge-purple',
          msg: 'Status: Opportunity Accepted. You are currently in Stage 1 (Offered). Waiting for company assessment instructions.',
          color: '#8b5cf6'
        }
      case 'coding_round':
        return {
          badge: 'Stage 2: Coding Round',
          badgeClass: 'badge-blue',
          msg: 'Status: Coding Round Active! The company has moved you to Stage 2 (Technical Test). Prepare for your assessment.',
          color: '#3b82f6'
        }
      case 'interview':
        return {
          badge: 'Stage 3: Interview Round',
          badgeClass: 'badge-orange',
          msg: 'Status: Interview Round Scheduled! The company has moved you to Stage 3 (Technical & HR Interview).',
          color: '#f59e0b'
        }
      case 'placed':
        return {
          badge: 'Stage 4: Placed',
          badgeClass: 'badge-green',
          msg: 'Status: CONGRATULATIONS! You have successfully cleared all hiring rounds and are officially PLACED at this company!',
          color: '#10b981'
        }
      default:
        return {
          badge: 'Stage 1: Offered',
          badgeClass: 'badge-purple',
          msg: 'Status: In hiring pipeline.',
          color: '#8b5cf6'
        }
    }
  }

  // Filter available vs active accepted internships with search support
  const matchesSearch = (i: any) => {
    if (blockedNotice) return false
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      i.title?.toLowerCase().includes(q) ||
      i.company_name?.toLowerCase().includes(q) ||
      i.description?.toLowerCase().includes(q) ||
      i.location?.toLowerCase().includes(q)
    )
  }

  const availableInternships = internships
    .filter(i => !i.user_application_status || i.user_application_status === 'none')
    .filter(matchesSearch)

  const activeInternships = internships
    .filter(i => i.user_application_status && i.user_application_status !== 'rejected' && i.user_application_status !== 'none')
    .filter(matchesSearch)

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.content}>
        <header className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <BackButton fallbackHref="/student/dashboard" />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GraduationCap size={24} strokeWidth={2} color="#8b5cf6" />
                <h1 className={styles.pageTitle}>Internship Opportunities</h1>
              </div>
              <p className={styles.pageSubtitle}>
                Discover partner company internships, accept opportunities, and track your live hiring pipeline progress.
              </p>
            </div>
          </div>
          <button 
            className="btn btn-ghost btn-sm"
            onClick={() => setShowAcademicModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <GraduationCap size={15} strokeWidth={2} />
            <span>Academic Scores: {studentProfile?.cgpa ? `${studentProfile.cgpa} CGPA` : 'Not Set'}</span>
          </button>
        </header>

        <main className={styles.main}>
          {/* Academic Profile Alert Banner */}
          {studentProfile && (
            <div 
              style={{
                padding: '1rem 1.25rem',
                borderRadius: '16px',
                background: studentProfile.cgpa ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                border: `1px solid ${studentProfile.cgpa ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '1.5rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {studentProfile.cgpa ? <CheckCircle2 size={16} strokeWidth={2} color="#10b981" /> : <TriangleAlert size={16} strokeWidth={2} color="#f59e0b" />}
                  <strong style={{ color: studentProfile.cgpa ? '#10b981' : '#f59e0b', fontSize: '0.95rem' }}>
                    {studentProfile.cgpa ? 'Academic Profile Active' : 'Academic Profile Incomplete'}
                  </strong>
                </div>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {studentProfile.cgpa 
                    ? `CGPA: ${studentProfile.cgpa} | 12th: ${studentProfile.twelfth_marks || 'N/A'}% | 10th: ${studentProfile.tenth_marks || 'N/A'}%`
                    : 'Complete your CGPA, 10th %, and 12th % to receive matching internship notifications.'
                  }
                </p>
              </div>
              <button 
                className="btn btn-sm"
                style={{
                  background: studentProfile.cgpa ? 'var(--bg-secondary)' : 'linear-gradient(135deg, #7c3aed, #ec4899)',
                  color: studentProfile.cgpa ? 'var(--text-primary)' : 'white',
                  border: '1px solid var(--border)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={() => setShowAcademicModal(true)}
              >
                <span>{studentProfile.cgpa ? 'Edit Academic Profile' : 'Complete Profile Now'}</span>
                {!studentProfile.cgpa && <ArrowRight size={14} strokeWidth={2} />}
              </button>
            </div>
          )}

          {/* Career & Internship Search Bar */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '16px', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <Search size={18} strokeWidth={2} color="var(--text-muted)" />
              </span>
              <input
                type="text"
                placeholder="Search internships, roles, or skills (e.g. Python, Web Dev, React)..."
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value
                  setSearchQuery(val)
                  // Check if query contains off-scope patterns
                  const offScopePatterns = /\b(latest movies?|celebrity news|gaming|cricket score|best phone|dating|casino|betting|random entertainment)\b/i
                  if (offScopePatterns.test(val)) {
                    setBlockedNotice("This search is outside PlaceIQ's career and learning scope. Try searching for jobs, internships, placements, skills, or career preparation.")
                  } else {
                    setBlockedNotice(null)
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 46px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '0.92rem'
                }}
              />
            </div>

            {blockedNotice && (
              <div style={{ padding: '14px 18px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.4rem' }}>🎓</span>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fca5a5' }}>
                    Career Search Notice
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {blockedNotice}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sub-Tabs Navigation */}
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '4px' }}>
            <button 
              onClick={() => setActiveTab('available')}
              style={{
                padding: '0.75rem 1.25rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                border: 'none',
                background: 'none',
                color: activeTab === 'available' ? '#10b981' : 'var(--text-secondary)',
                borderBottom: activeTab === 'available' ? '3px solid #10b981' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap'
              }}
            >
              <Briefcase size={16} strokeWidth={2} />
              <span>Available Opportunities ({availableInternships.length})</span>
            </button>

            <button 
              onClick={() => setActiveTab('active')}
              style={{
                padding: '0.75rem 1.25rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                border: 'none',
                background: 'none',
                color: activeTab === 'active' ? '#8b5cf6' : 'var(--text-secondary)',
                borderBottom: activeTab === 'active' ? '3px solid #8b5cf6' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap'
              }}
            >
              <TrendingUp size={16} strokeWidth={2} />
              <span>Active Hiring Pipelines ({activeInternships.length})</span>
            </button>
          </div>


          {/* Tab 1: Available Opportunities */}
          {activeTab === 'available' && (
            <div className={`glass ${styles.panel}`}>
              <div className={styles.panelHead}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Briefcase size={18} strokeWidth={2} color="#8b5cf6" />
                  <h3 className={styles.panelTitle}>Matching Company Opportunities</h3>
                </div>
                <span className="badge badge-purple">{availableInternships.length} Available</span>
              </div>

              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading internships...</div>
              ) : availableInternships.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No new available opportunities. Active hiring pipelines are under the <strong>&quot;Active Hiring Pipelines&quot;</strong> tab.
                </div>
              ) : (
                <div className={styles.jobsList}>
                  {availableInternships.map((internship) => {
                    const statusInfo = checkEligibility(internship)
                    return (
                      <div 
                        key={internship.id} 
                        className={styles.jobCard}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1rem',
                          borderLeft: statusInfo.eligible ? '4px solid #10b981' : '4px solid #f59e0b'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <div className={styles.jobLogo} style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                              {internship.company_name ? internship.company_name.charAt(0) : <Building2 size={20} />}
                            </div>
                            <div>
                              <div className={styles.jobTitle}>{internship.title}</div>
                              <div className={styles.jobMeta} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Building2 size={13} strokeWidth={2} />
                                <strong>{internship.company_name}</strong> • <MapPin size={13} strokeWidth={2} /> {internship.location || 'Remote'}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '12px' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <DollarSign size={12} strokeWidth={2} />
                                  <span>{internship.stipend || 'Stipend Provided'}</span>
                                </span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <Clock size={12} strokeWidth={2} />
                                  <span>{internship.duration || '3 Months'}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div>
                            {statusInfo.eligible ? (
                              <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle2 size={12} strokeWidth={2} />
                                <span>Eligible</span>
                              </span>
                            ) : statusInfo.incomplete ? (
                              <span className="badge badge-orange" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <TriangleAlert size={12} strokeWidth={2} />
                                <span>Action Required</span>
                              </span>
                            ) : (
                              <span className="badge badge-orange" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <CircleX size={12} strokeWidth={2} />
                                <span>Ineligible</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Criteria & Notice Banner */}
                        <div 
                          style={{
                            padding: '10px 14px',
                            borderRadius: '12px',
                            background: statusInfo.eligible ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                            border: `1px solid ${statusInfo.eligible ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div style={{ fontSize: '0.825rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                              <Bell size={13} strokeWidth={2} color={statusInfo.eligible ? '#10b981' : '#f59e0b'} />
                              <strong style={{ color: statusInfo.eligible ? '#10b981' : '#f59e0b' }}>
                                {statusInfo.eligible ? 'Eligibility Notice: Qualified' : 'Eligibility Notice: Requirements Not Met'}
                              </strong>
                            </div>
                            <span style={{ color: 'var(--text-secondary)' }}>{statusInfo.reason}</span>
                          </div>

                          {statusInfo.incomplete ? (
                            <button className="btn btn-sm btn-primary" onClick={() => setShowAcademicModal(true)}>
                              Complete Profile
                            </button>
                          ) : statusInfo.eligible ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                className="btn btn-sm"
                                style={{ background: '#ef444415', color: '#ef4444', border: '1px solid #ef444430' }}
                                onClick={() => handleReject(internship.id)}
                                disabled={updatingId === internship.id}
                              >
                                Reject
                              </button>
                              <button 
                                className="btn btn-sm btn-primary"
                                onClick={() => handleAccept(internship.id)}
                                disabled={updatingId === internship.id}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              >
                                <span>{updatingId === internship.id ? 'Saving...' : 'Accept Opportunity'}</span>
                                <ArrowRight size={14} strokeWidth={2} />
                              </button>
                            </div>
                          ) : (
                            <button className="btn btn-sm btn-ghost" disabled>Not Eligible</button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Active Hiring Pipelines with Live 4-Stage Progress Tracker */}
          {activeTab === 'active' && (
            <div className={`glass ${styles.panel}`}>
              <div className={styles.panelHead}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={18} strokeWidth={2} color="#8b5cf6" />
                  <h3 className={styles.panelTitle}>Active Hiring Pipelines & Live Progress</h3>
                </div>
                <span className="badge badge-purple">{activeInternships.length} Active Pipelines</span>
              </div>

              {activeInternships.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  You do not have any active hiring pipelines yet. Accept an eligible opportunity from the <strong>&quot;Available Opportunities&quot;</strong> tab to enter its pipeline!
                </div>
              ) : (
                <div className={styles.jobsList}>
                  {activeInternships.map(internship => {
                    const currentStatus = internship.user_application_status || 'offered'
                    const currentStep = getStageStep(currentStatus)
                    const stageMeta = getStageDetails(currentStatus)

                    return (
                      <div 
                        key={internship.id} 
                        className={styles.jobCard}
                        style={{
                          padding: '1.5rem',
                          borderRadius: '16px',
                          background: 'var(--bg-secondary)',
                          border: `1px solid ${stageMeta.color}40`,
                          borderLeft: `5px solid ${stageMeta.color}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1.25rem'
                        }}
                      >
                        {/* Header Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div className={styles.jobLogo} style={{ background: `linear-gradient(135deg, ${stageMeta.color}, #7c3aed)` }}>
                              <Briefcase size={20} strokeWidth={2} color="white" />
                            </div>
                            <div>
                              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>{internship.title}</h3>
                              <div style={{ fontSize: '0.875rem', color: stageMeta.color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Building2 size={13} strokeWidth={2} />
                                <span>{internship.company_name}</span> • <MapPin size={13} strokeWidth={2} /> <span>{internship.location || 'Remote'}</span>
                              </div>
                            </div>
                          </div>

                          <span className={`badge ${stageMeta.badgeClass}`} style={{ fontSize: '12px', padding: '6px 12px' }}>
                            {stageMeta.badge}
                          </span>
                        </div>

                        {/* Meta info */}
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '16px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <DollarSign size={13} strokeWidth={2} />
                            <span>Stipend: <strong>{internship.stipend || 'Stipend Provided'}</strong></span>
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={13} strokeWidth={2} />
                            <span>Duration: <strong>{internship.duration || '3 Months'}</strong></span>
                          </span>
                        </div>

                        {/* Visual 4-Stage Hiring Progress Tracker Stepper */}
                        <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <TrendingUp size={14} strokeWidth={2} />
                            <span>Live 4-Stage Hiring Pipeline Progress Tracker:</span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center' }}>
                            {/* Step 1 */}
                            <div 
                              style={{
                                padding: '10px 6px',
                                borderRadius: '10px',
                                background: currentStep >= 1 ? '#8b5cf618' : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${currentStep >= 1 ? '#8b5cf650' : 'var(--border)'}`,
                                transition: 'all 0.3s ease'
                              }}
                            >
                              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: currentStep >= 1 ? '#8b5cf6' : 'var(--text-muted)' }}>
                                {currentStep >= 1 ? '✓ Stage 1' : 'Stage 1'}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: currentStep >= 1 ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: '2px' }}>
                                Offered / Accepted
                              </div>
                            </div>

                            {/* Step 2 */}
                            <div 
                              style={{
                                padding: '10px 6px',
                                borderRadius: '10px',
                                background: currentStep >= 2 ? '#3b82f618' : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${currentStep >= 2 ? '#3b82f650' : 'var(--border)'}`,
                                transition: 'all 0.3s ease'
                              }}
                            >
                              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: currentStep >= 2 ? '#3b82f6' : 'var(--text-muted)' }}>
                                {currentStep >= 2 ? '✓ Stage 2' : 'Stage 2'}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: currentStep >= 2 ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: '2px' }}>
                                Coding Round
                              </div>
                            </div>

                            {/* Step 3 */}
                            <div 
                              style={{
                                padding: '10px 6px',
                                borderRadius: '10px',
                                background: currentStep >= 3 ? '#f59e0b18' : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${currentStep >= 3 ? '#f59e0b50' : 'var(--border)'}`,
                                transition: 'all 0.3s ease'
                              }}
                            >
                              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: currentStep >= 3 ? '#f59e0b' : 'var(--text-muted)' }}>
                                {currentStep >= 3 ? '✓ Stage 3' : 'Stage 3'}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: currentStep >= 3 ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: '2px' }}>
                                Interview Round
                              </div>
                            </div>

                            {/* Step 4 */}
                            <div 
                              style={{
                                padding: '10px 6px',
                                borderRadius: '10px',
                                background: currentStep >= 4 ? '#10b98118' : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${currentStep >= 4 ? '#10b98150' : 'var(--border)'}`,
                                transition: 'all 0.3s ease'
                              }}
                            >
                              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: currentStep >= 4 ? '#10b981' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                                {currentStep >= 4 && <Sparkles size={11} strokeWidth={2} color="#10b981" />}
                                <span>Stage 4</span>
                              </div>
                              <div style={{ fontSize: '0.7rem', color: currentStep >= 4 ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: '2px' }}>
                                Placed
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Status Message Box */}
                        <div 
                          style={{
                            padding: '12px 16px',
                            borderRadius: '10px',
                            background: `${stageMeta.color}10`,
                            border: `1px solid ${stageMeta.color}30`,
                            fontSize: '0.85rem',
                            color: 'var(--text-primary)',
                            fontWeight: 500
                          }}
                        >
                          {stageMeta.msg}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Academic Profile Completion Modal */}
      {showAcademicModal && (
        <AcademicProfileModal
          studentProfile={studentProfile}
          onSave={(updated) => {
            setStudentProfile(updated)
            setShowAcademicModal(false)
            fetchInternships(updated.id)
          }}
          onClose={() => setShowAcademicModal(false)}
        />
      )}
    </div>
  )
}
