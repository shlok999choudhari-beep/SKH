'use client'
import { useState, useEffect } from 'react'
import StudentSidebar from '@/components/StudentSidebar'
import AcademicProfileModal from '@/components/AcademicProfileModal'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import Card1 from '@/components/ui/card-1'
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
  LucideIcon
} from 'lucide-react'

type QuickActionItem = {
  href: string
  icon: LucideIcon
  label: string
  desc: string
  color: string
}

const QUICK_ACTIONS: QuickActionItem[] = [
  { href: '/student/internships', icon: Target, label: 'Internships Portal', desc: 'Apply to matching partner opportunities', color: '#10b981' },
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

  useEffect(() => {
    fetchDashboardData()
    fetchStudentProfile()
    fetchJobs()
  }, [])

  const fetchStudentProfile = async () => {
    try {
      const res = await fetch('/api/student/profile', { cache: 'no-store' })
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
      const statsData = await statsRes.json()
      setStats(statsData)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
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

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.content}>
        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>Dashboard</h1>
            <p className={styles.pageSubtitle}>Welcome back, <strong>{stats?.name || 'Student'}</strong> — Let&apos;s crush it today!</p>
          </div>
          <div className={styles.headerActions}>
            <Link href="/student/internships" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Target size={15} strokeWidth={2} />
              <span>View Internships</span>
            </Link>
            <Link href="/student/resume" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={15} strokeWidth={2} />
              <span>Analyze Resume</span>
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

          {/* Stats */}
          <div className={styles.statsRow}>
            <div className="stat-card">
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg,#f59e0b30,#ef444430)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                <Target size={22} strokeWidth={2} />
              </div>
              <div>
                <div className="stat-number" style={{ color: '#f59e0b' }}>{stats?.atsScore || 0}%</div>
                <div className="stat-label">ATS Score</div>
              </div>
            </div>
            <div className="stat-card">
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg,#7c3aed30,#8b5cf630)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
                <Award size={22} strokeWidth={2} />
              </div>
              <div>
                <div className="stat-number" style={{ color: '#7c3aed' }}>{studentProfile?.cgpa ? `${studentProfile.cgpa} CGPA` : 'Not Set'}</div>
                <div className="stat-label">Academic CGPA</div>
              </div>
            </div>
            <div className="stat-card">
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg,#3b82f630,#06b6d430)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                <Briefcase size={22} strokeWidth={2} />
              </div>
              <div>
                <div className="stat-number" style={{ color: '#3b82f6' }}>{stats?.jobsMatched || 0}</div>
                <div className="stat-label">Jobs Matched</div>
              </div>
            </div>
            <div className="stat-card">
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg,#10b98130,#06b6d430)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                <TrendingUp size={22} strokeWidth={2} />
              </div>
              <div>
                <div className="stat-number" style={{ color: '#10b981' }}>{stats?.profileScore || 0}%</div>
                <div className="stat-label">Profile Score</div>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className={styles.grid2}>
            {/* Quick Actions */}
            <div className={`glass ${styles.panel}`}>
              <div className={styles.panelHead} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={18} strokeWidth={2} color="#f59e0b" />
                <h3 className={styles.panelTitle}>Quick Actions</h3>
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

            {/* AI Skill Radar / Match */}
            <div className={`glass ${styles.panel}`}>
              <div className={styles.panelHead}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Target size={18} strokeWidth={2} color="#3b82f6" />
                  <h3 className={styles.panelTitle}>Recommended Next Steps</h3>
                </div>
                <Link href="/student/internships" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span>Explore Internships</span>
                  <ArrowRight size={14} strokeWidth={2} />
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                <div style={{ padding: '1rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    <Target size={16} strokeWidth={2} color="#10b981" />
                    <span>Apply for Partner Internships</span>
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>Check company internship opportunities matched with your CGPA & academic score.</div>
                  <Link href="/student/internships" className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span>View Internships</span>
                    <ArrowRight size={14} strokeWidth={2} />
                  </Link>
                </div>
                <div style={{ padding: '1rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    <Code2 size={16} strokeWidth={2} color="#3b82f6" />
                    <span>Practice Coding Judge</span>
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>Solve real-time coding challenges to clear internship coding rounds.</div>
                  <Link href="/student/coding-judge" className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span>Start Coding</span>
                    <ArrowRight size={14} strokeWidth={2} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

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

function getRandomColor() {
  const colors = ['#7c3aed','#3b82f6','#10b981','#f59e0b','#ec4899','#06b6d4','#ef4444']
  return colors[Math.floor(Math.random() * colors.length)]
}

