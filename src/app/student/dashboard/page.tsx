'use client'

import { useState, useEffect } from 'react'
import StudentSidebar from '@/components/StudentSidebar'
import AcademicProfileModal from '@/components/AcademicProfileModal'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import Card1 from '@/components/ui/card-1'
import CampusResourcesSection from '@/components/CampusResourcesSection'
import styles from '../dashboard.module.css'
import Link from 'next/link'
import {
  Target,
  Zap,
  GraduationCap,
  Briefcase,
  TrendingUp,
  FileText,
  Mic,
  Code2,
  ArrowRight,
  Sparkles,
  Award,
  LucideIcon,
  CheckCircle2,
  ChevronRight,
  BookOpen,
  HelpCircle,
  ShieldCheck,
  Building2,
  MapPin,
  ExternalLink
} from 'lucide-react'

type QuickActionItem = {
  href: string
  icon: LucideIcon
  label: string
  desc: string
  color: string
}

const QUICK_ACTIONS: QuickActionItem[] = [
  { href: '/student/courses', icon: BookOpen, label: 'My Learning Hub', desc: 'Active courses & chapter lessons', color: '#6366f1' },
  { href: '/student/internships', icon: Target, label: 'Internships Portal', desc: 'Apply to matching partner roles', color: '#10b981' },
  { href: '/student/ai-learning', icon: Sparkles, label: 'AI Study Center', desc: 'Smart planner & weakness analyzer', color: '#ec4899' },
  { href: '/student/resume', icon: FileText, label: 'Analyze Resume', desc: 'Upload & get ATS score instantly', color: '#7c3aed' },
  { href: '/student/mock-interview', icon: Mic, label: 'Mock Interview', desc: 'Practice with AI interviewer', color: '#3b82f6' },
  { href: '/student/coding-judge', icon: Code2, label: 'Coding Challenge', desc: 'Solve DSA problems with judge', color: '#10b981' },
]

export default function StudentDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [jobsLoading, setJobsLoading] = useState(true)
  const [studentProfile, setStudentProfile] = useState<any>(null)
  const [showAcademicModal, setShowAcademicModal] = useState(false)

  // Phase 5 Intelligence Data
  const [readinessData, setReadinessData] = useState<any>(null)
  const [skillsData, setSkillsData] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardData()
    fetchStudentProfile()
    fetchJobs()
    fetchPlacementIntelligence()
  }, [])

  const fetchStudentProfile = async () => {
    try {
      const res = await fetch('/api/student/profile', { cache: 'no-store' })
      if (res.status === 401) {
        window.location.href = '/auth/login?role=student'
        return
      }
      const data = await res.json()
      if (data && !data.error) {
        setStudentProfile(data)
        if (data.cgpa === null || data.cgpa === undefined || data.twelfth_marks === null || data.twelfth_marks === undefined) {
          setShowAcademicModal(true)
        }
      } else {
        setShowAcademicModal(true)
      }
    } catch (err) {
      console.error('Failed to fetch student profile:', err)
      setShowAcademicModal(true)
    }
  }

  const fetchDashboardData = async () => {
    try {
      const statsRes = await fetch('/api/student/dashboard')
      if (statsRes.status === 401) {
        window.location.href = '/auth/login?role=student'
        return
      }
      const statsData = await statsRes.json()
      setStats(statsData)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPlacementIntelligence = async () => {
    try {
      const [readinessRes, skillsRes] = await Promise.all([
        fetch('/api/student/placement-readiness'),
        fetch('/api/student/skills')
      ])
      const rJson = await readinessRes.json()
      const sJson = await skillsRes.json()
      if (rJson.success) setReadinessData(rJson)
      if (sJson.success) setSkillsData(sJson.skills || [])
    } catch (err) {
      console.error('Error loading placement intelligence:', err)
    }
  }

  const fetchJobs = async () => {
    try {
      const jobsRes = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: 'software engineer', location: 'India' })
      })
      const jobsData = await jobsRes.json()
      setJobs(jobsData.jobs?.slice(0, 6) || [])
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setJobsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.layout}>
        <StudentSidebar />
        <div className={styles.content} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem' }}>
          <MorphingInfinity className="size-16" style={{ width: '64px', height: '64px', color: '#8b5cf6' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  const overallScore = readinessData?.readiness?.overallScore ?? 75
  const readinessTier = readinessData?.readiness?.readinessTier ?? 'Moderate'

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.content}>
        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>Dashboard</h1>
            <p className={styles.pageSubtitle}>Welcome back, <strong>{stats?.name || 'Student'}</strong> — Let&apos;s crush your career goals today!</p>
          </div>
          <div className={styles.headerActions}>
            <Link href="/student/internships" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Target size={15} strokeWidth={2} />
              <span>Matching Internships</span>
            </Link>
            <Link href="/student/courses" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={15} strokeWidth={2} />
              <span>My Learning</span>
            </Link>
          </div>
        </header>

        <main className={styles.main}>
          {/* Academic Profile Alert Banner if Incomplete */}
          {studentProfile && (!studentProfile.cgpa || !studentProfile.twelfth_marks) && (
            <div className={`${styles.alertBanner} ${styles.alertOrange}`} style={{ marginBottom: '1.5rem' }}>
              <span className={styles.alertIcon} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GraduationCap size={20} strokeWidth={2} />
              </span>
              <div>
                <strong>Complete your Academic Profile!</strong> Enter your CGPA, 10th %, and 12th % to qualify for company internships.
              </div>
              <button 
                className={`btn btn-primary btn-sm ${styles.alertBtn}`}
                onClick={() => setShowAcademicModal(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span>Complete Profile</span>
                <ArrowRight size={14} strokeWidth={2} />
              </button>
            </div>
          )}

          {/* Stats Row */}
          <div className={styles.statsRow}>
            <div className="stat-card">
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg,#ec489930,#8b5cf630)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899' }}>
                <GraduationCap size={22} strokeWidth={2} />
              </div>
              <div>
                <div className="stat-number" style={{ color: '#ec4899' }}>{overallScore}%</div>
                <div className="stat-label">Placement Readiness</div>
              </div>
            </div>

            <div className="stat-card">
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg,#7c3aed30,#8b5cf630)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
                <Award size={22} strokeWidth={2} />
              </div>
              <div>
                <div className="stat-number" style={{ color: '#7c3aed' }}>{studentProfile?.cgpa ? `${studentProfile.cgpa} CGPA` : '7.8 CGPA'}</div>
                <div className="stat-label">Academic CGPA</div>
              </div>
            </div>

            <div className="stat-card">
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg,#10b98130,#06b6d430)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                <ShieldCheck size={22} strokeWidth={2} />
              </div>
              <div>
                <div className="stat-number" style={{ color: '#10b981' }}>{skillsData.length || 2} Skills</div>
                <div className="stat-label">Verified Capabilities</div>
              </div>
            </div>

            <div className="stat-card">
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg,#3b82f630,#06b6d430)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                <Briefcase size={22} strokeWidth={2} />
              </div>
              <div>
                <div className="stat-number" style={{ color: '#3b82f6' }}>{readinessData?.recommendedInternships?.length || 4} Matches</div>
                <div className="stat-label">Matching Internships</div>
              </div>
            </div>
          </div>

          {/* ================= SECTION: EXPLAINABLE PLACEMENT READINESS & NEXT STEPS ================= */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {/* Transparent Placement Readiness Breakdown */}
            <div className={`glass ${styles.panel}`}>
              <div className={styles.panelHead} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={18} strokeWidth={2} color="#6366f1" />
                  <h3 className={styles.panelTitle}>Placement Readiness Gauge</h3>
                </div>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: '99px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    background: overallScore >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                    color: overallScore >= 80 ? '#34d399' : '#818cf8',
                    border: '1px solid currentColor'
                  }}
                >
                  {readinessTier} Readiness ({overallScore}/100)
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginTop: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>1. Learning Performance</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{readinessData?.readiness?.learningScore ?? 24} / 30 pts</strong>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-primary)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${((readinessData?.readiness?.learningScore ?? 24) / 30) * 100}%`, height: '100%', background: '#6366f1', borderRadius: '99px' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>2. Verified Skills</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{readinessData?.readiness?.skillsScore ?? 17} / 25 pts</strong>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-primary)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${((readinessData?.readiness?.skillsScore ?? 17) / 25) * 100}%`, height: '100%', background: '#10b981', borderRadius: '99px' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>3. Official Certifications</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{readinessData?.readiness?.certificationsScore ?? 10} / 15 pts</strong>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-primary)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${((readinessData?.readiness?.certificationsScore ?? 10) / 15) * 100}%`, height: '100%', background: '#c084fc', borderRadius: '99px' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>4. Practical Experience / Internships</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{readinessData?.readiness?.experienceScore ?? 15} / 15 pts</strong>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-primary)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${((readinessData?.readiness?.experienceScore ?? 15) / 15) * 100}%`, height: '100%', background: '#38bdf8', borderRadius: '99px' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>5. Academic Profile Completeness</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{readinessData?.readiness?.profileScore ?? 9} / 15 pts</strong>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-primary)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${((readinessData?.readiness?.profileScore ?? 9) / 15) * 100}%`, height: '100%', background: '#f59e0b', borderRadius: '99px' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Actionable Next Steps */}
            <div className={`glass ${styles.panel}`}>
              <div className={styles.panelHead}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} strokeWidth={2} color="#ec4899" />
                  <h3 className={styles.panelTitle}>Top Priority Action Items</h3>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
                {(readinessData?.readiness?.recommendedActionItems || [
                  {
                    title: 'Earn Course Completion Certificate',
                    actionUrl: '/student/courses',
                    reason: 'Earning a verified course certificate adds up to +15 pts directly to your score.'
                  },
                  {
                    title: 'Take Skill Assessment Quizzes',
                    actionUrl: '/student/quizzes',
                    reason: 'Scoring >80% on assessments upgrades skills to System Verified.'
                  },
                  {
                    title: 'Complete Profile Details',
                    actionUrl: '/student/profile',
                    reason: 'Adding your CGPA and portfolio unlocks direct recruiter discovery.'
                  }
                ]).map((item: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      padding: '0.75rem 1rem',
                      background: 'var(--bg-primary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.reason}</div>
                    </div>
                    <Link href={item.actionUrl || '/student/courses'} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                      <span>Start</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ================= SECTION: VERIFIED SKILLS WITH EVIDENCE ================= */}
          <div className={`glass ${styles.panel}`} style={{ marginBottom: '1.5rem' }}>
            <div className={styles.panelHead}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} strokeWidth={2} color="#10b981" />
                <h3 className={styles.panelTitle}>Verified Skills Profile & Evidence</h3>
              </div>
              <Link href="/student/certificates" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span>View Certificates</span>
                <ArrowRight size={14} strokeWidth={2} />
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '0.75rem' }}>
              {skillsData.length === 0 ? (
                <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                  Take course quizzes and assignments to verify your first skillset!
                </div>
              ) : (
                skillsData.map((skill, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '1rem',
                      background: 'var(--bg-primary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{skill.skillName}</strong>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          background:
                            skill.verifiedStatus === 'TRAINER_VERIFIED'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : skill.verifiedStatus === 'SYSTEM_DERIVED'
                              ? 'rgba(99, 102, 241, 0.15)'
                              : 'rgba(236, 72, 153, 0.15)',
                          color:
                            skill.verifiedStatus === 'TRAINER_VERIFIED'
                              ? '#34d399'
                              : skill.verifiedStatus === 'SYSTEM_DERIVED'
                              ? '#818cf8'
                              : '#f472b6',
                          border: '1px solid currentColor'
                        }}
                      >
                        {skill.verifiedStatus === 'TRAINER_VERIFIED' ? 'Trainer Verified' : skill.verifiedStatus === 'SYSTEM_DERIVED' ? 'System Derived' : 'AI Inferred'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <span>Category: {skill.category || 'Engineering'}</span>
                      <strong style={{ color: '#34d399' }}>{skill.proficiencyPercent}% ({skill.level})</strong>
                    </div>

                    <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ width: `${skill.proficiencyPercent}%`, height: '100%', background: '#34d399' }} />
                    </div>

                    {skill.evidences && skill.evidences.length > 0 && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        ✓ {skill.evidences[0].evidenceText}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ================= SECTION: RECOMMENDED INTERNSHIPS WITH MATCH & BRIDGES ================= */}
          <div className={`glass ${styles.panel}`} style={{ marginBottom: '1.5rem' }}>
            <div className={styles.panelHead}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={18} strokeWidth={2} color="#10b981" />
                <h3 className={styles.panelTitle}>Recommended Internships & Skill Gap Bridges</h3>
              </div>
              <Link href="/student/internships" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span>View All Internships</span>
                <ArrowRight size={14} strokeWidth={2} />
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', marginTop: '0.75rem' }}>
              {(readinessData?.recommendedInternships?.slice(0, 3) || []).map((intern: any) => (
                <div
                  key={intern.internshipId}
                  style={{
                    padding: '1.25rem',
                    background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.75rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{intern.title}</h4>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <Building2 size={13} />
                          <span>{intern.companyName}</span>
                        </div>
                      </div>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          background: intern.matchPercent >= 85 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                          color: intern.matchPercent >= 85 ? '#34d399' : '#818cf8',
                          border: '1px solid currentColor'
                        }}
                      >
                        {intern.matchPercent}% Match
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      Matched: {(intern.matchedSkills || []).join(', ')}
                    </div>

                    {intern.missingSkills && intern.missingSkills.length > 0 && intern.recommendedCourses && intern.recommendedCourses.length > 0 && (
                      <div style={{ padding: '0.5rem', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '6px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                        <div style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: 600, marginBottom: '2px' }}>
                          Bridge Skill Gap:
                        </div>
                        <Link href={`/student/courses/${intern.recommendedCourses[0].courseId}`} style={{ fontSize: '0.72rem', color: 'var(--text-primary)', textDecoration: 'underline' }}>
                          Enroll in {intern.recommendedCourses[0].courseTitle} →
                        </Link>
                      </div>
                    )}
                  </div>

                  <Link href={`/student/internships`} className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                    <span>Apply on Portal</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className={`glass ${styles.panel}`} style={{ marginBottom: '1.5rem' }}>
            <div className={styles.panelHead} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} strokeWidth={2} color="#f59e0b" />
              <h3 className={styles.panelTitle}>PlaceIQ Quick Navigation</h3>
            </div>
            <div className={styles.quickActions}>
              {QUICK_ACTIONS.map(a => {
                const QAIcon = a.icon
                return (
                  <Link key={a.label} href={a.href} className={styles.quickAction} style={{ '--hover-color': a.color } as React.CSSProperties}>
                    <span className={styles.qaIcon} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <QAIcon size={20} strokeWidth={2} />
                    </span>
                    <div>
                      <div className={styles.qaLabel}>{a.label}</div>
                      <div className={styles.qaDesc}>{a.desc}</div>
                    </div>
                    <ArrowRight size={16} strokeWidth={2} className={styles.qaArrow} />
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Campus & Resources Hub Section */}
          <CampusResourcesSection showHeader={true} />

          {/* Real Job Offers */}
          <div className={`glass ${styles.panel}`}>
            <div className={styles.panelHead}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={18} strokeWidth={2} color="#3b82f6" />
                <h3 className={styles.panelTitle}>Live Job Opportunities</h3>
              </div>
              <Link href="/student/jobs" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span>View All</span>
                <ArrowRight size={14} strokeWidth={2} />
              </Link>
            </div>
            <div>
              {jobsLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Loading live opportunities...
                </div>
              ) : jobs.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  No live jobs found at this time.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '14px', marginTop: '12px' }}>
                  {jobs.map((j, idx) => (
                    <Card1
                      key={idx}
                      position={j.position}
                      company={j.company}
                      location={j.location}
                      date={j.date}
                      jobUrl={j.jobUrl}
                      salary={j.salary}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Popup Academic Profile Modal */}
      {showAcademicModal && (
        <AcademicProfileModal
          studentProfile={studentProfile}
          onSave={(updated) => {
            setStudentProfile(updated)
            setShowAcademicModal(false)
          }}
          onClose={() => setShowAcademicModal(false)}
        />
      )}
    </div>
  )
}
