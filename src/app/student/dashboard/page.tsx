'use client'
import { useState, useEffect } from 'react'
import StudentSidebar from '@/components/StudentSidebar'
import AcademicProfileModal from '@/components/AcademicProfileModal'
import styles from '../dashboard.module.css'
import Link from 'next/link'

export default function StudentDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [studentProfile, setStudentProfile] = useState<any>(null)
  const [showAcademicModal, setShowAcademicModal] = useState(false)

  useEffect(() => {
    fetchDashboardData()
    fetchStudentProfile()
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
      const [statsRes, jobsRes] = await Promise.all([
        fetch('/api/student/dashboard'),
        fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword: 'software engineer', location: 'India' })
        })
      ])
      
      const statsData = await statsRes.json()
      const jobsData = await jobsRes.json()
      
      setStats(statsData)
      setJobs(jobsData.jobs?.slice(0, 6) || [])
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.layout}>
        <StudentSidebar />
        <div className={styles.content}>
          <div style={{ padding: '60px', textAlign: 'center' }}>Loading...</div>
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
            <p className={styles.pageSubtitle}>Welcome back, <strong>{stats?.name || 'Student'}</strong> 👋 Let&apos;s crush it today!</p>
          </div>
          <div className={styles.headerActions}>
            <Link href="/student/internships" className="btn btn-primary btn-sm">🎯 View Internships</Link>
            <Link href="/student/resume" className="btn btn-secondary btn-sm">⚡ Analyze Resume</Link>
          </div>
        </header>

        <main className={styles.main}>
          {/* Academic Profile Alert Banner if Incomplete */}
          {studentProfile && (!studentProfile.cgpa || !studentProfile.twelfth_marks) && (
            <div className={`${styles.alertBanner} ${styles.alertOrange}`} style={{ marginBottom: '1.5rem' }}>
              <span className={styles.alertIcon}>🎓</span>
              <div>
                <strong>Complete your Academic Profile!</strong> Enter your CGPA, 10th %, and 12th % to qualify for company internships.
              </div>
              <button 
                className={`btn btn-primary btn-sm ${styles.alertBtn}`}
                onClick={() => setShowAcademicModal(true)}
              >
                Complete Profile →
              </button>
            </div>
          )}

          {/* Stats */}
          <div className={styles.statsRow}>
            <div className="stat-card">
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg,#f59e0b30,#ef444430)' }}>🎯</div>
              <div>
                <div className="stat-number" style={{ color: '#f59e0b' }}>{stats?.atsScore || 0}%</div>
                <div className="stat-label">ATS Score</div>
              </div>
            </div>
            <div className="stat-card">
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg,#7c3aed30,#8b5cf630)' }}>🔥</div>
              <div>
                <div className="stat-number" style={{ color: '#7c3aed' }}>{studentProfile?.cgpa ? `${studentProfile.cgpa} CGPA` : 'Not Set'}</div>
                <div className="stat-label">Academic CGPA</div>
              </div>
            </div>
            <div className="stat-card">
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg,#3b82f630,#06b6d430)' }}>💼</div>
              <div>
                <div className="stat-number" style={{ color: '#3b82f6' }}>{stats?.jobsMatched || 0}</div>
                <div className="stat-label">Jobs Matched</div>
              </div>
            </div>
            <div className="stat-card">
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg,#10b98130,#06b6d430)' }}>📈</div>
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
              <h3 className={styles.panelTitle}>⚡ Quick Actions</h3>
              <div className={styles.quickActions}>
                {QUICK_ACTIONS.map(a => (
                  <Link key={a.label} href={a.href} className={styles.quickAction} style={{ '--hover-color': a.color } as React.CSSProperties}>
                    <span className={styles.qaIcon}>{a.icon}</span>
                    <div>
                      <div className={styles.qaLabel}>{a.label}</div>
                      <div className={styles.qaDesc}>{a.desc}</div>
                    </div>
                    <span className={styles.qaArrow}>→</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* AI Skill Radar / Match */}
            <div className={`glass ${styles.panel}`}>
              <div className={styles.panelHead}>
                <h3 className={styles.panelTitle}>🎯 Recommended Next Steps</h3>
                <Link href="/student/internships" className="btn btn-ghost btn-sm">Explore Internships →</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                <div style={{ padding: '1rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>🎯 Apply for Partner Internships</div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>Check company internship opportunities matched with your CGPA & academic score.</div>
                  <Link href="/student/internships" className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem', display: 'inline-block' }}>View Internships →</Link>
                </div>
                <div style={{ padding: '1rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>💻 Practice Coding Judge</div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>Solve real-time coding challenges to clear internship coding rounds.</div>
                  <Link href="/student/coding-judge" className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem', display: 'inline-block' }}>Start Coding →</Link>
                </div>
              </div>
            </div>
          </div>

          {/* Real Job Offers */}
          <div className={`glass ${styles.panel}`}>
            <div className={styles.panelHead}>
              <h3 className={styles.panelTitle}>💼 Live Job Opportunities</h3>
              <Link href="/student/jobs" className="btn btn-ghost btn-sm">View All →</Link>
            </div>
            <div className={styles.jobsList}>
              {jobs.map((j, idx) => (
                <div key={idx} className={styles.jobCard}>
                  <div className={styles.jobLogo} style={{ background: `linear-gradient(135deg, ${getRandomColor()}, ${getRandomColor()})` }}>
                    {j.company.charAt(0)}
                  </div>
                  <div className={styles.jobInfo}>
                    <div className={styles.jobTitle}>{j.position}</div>
                    <div className={styles.jobMeta}>{j.company} • {j.location}</div>
                  </div>
                  <div className={styles.jobRight}>
                    <div className={styles.jobDate}>{j.date}</div>
                  </div>
                  <a href={j.jobUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">Apply</a>
                </div>
              ))}
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

const QUICK_ACTIONS = [
  { href: '/student/internships', icon: '🎯', label: 'Internships Portal', desc: 'Apply to matching partner opportunities', color: '#10b981' },
  { href: '/student/resume', icon: '📄', label: 'Analyze Resume', desc: 'Upload & get ATS score instantly', color: '#7c3aed' },
  { href: '/student/mock-interview', icon: '🎤', label: 'Mock Interview', desc: 'Practice with AI interviewer', color: '#3b82f6' },
  { href: '/student/coding-judge', icon: '💻', label: 'Coding Challenge', desc: 'Solve DSA problems with judge', color: '#10b981' },
]

function getRandomColor() {
  const colors = ['#7c3aed','#3b82f6','#10b981','#f59e0b','#ec4899','#06b6d4','#ef4444']
  return colors[Math.floor(Math.random() * colors.length)]
}
