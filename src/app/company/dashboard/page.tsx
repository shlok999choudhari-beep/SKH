'use client'
import { useState, useEffect } from 'react'
import CompanySidebar from '@/components/CompanySidebar'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import styles from '../dashboard.module.css'
import Link from 'next/link'
import {
  Building2,
  Zap,
  ArrowRight,
  Users,
  Target,
  Briefcase,
  BarChart2,
  Sparkles,
  Search,
  Code2,
  TrendingUp,
  Flame,
  Plus,
  Loader2
} from 'lucide-react'

export default function CompanyDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [jobsLoading, setJobsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    fetchJobs()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const statsRes = await fetch('/api/company/dashboard')
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
        body: JSON.stringify({ keyword: 'developer', location: 'India' })
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
        <CompanySidebar />
        <div className={styles.content}>
          <div style={{ padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <MorphingInfinity className="size-16" style={{ width: '64px', height: '64px', color: '#10b981' }} />
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className={styles.layout}>
      <CompanySidebar />
      <div className={styles.content}>
        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>Company Dashboard</h1>
            <p className={styles.pageSubtitle} style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span>Welcome, <strong>{stats?.companyName || 'Company'}</strong></span>
              <Building2 size={16} strokeWidth={2} color="#10b981" />
              <span>Your AI-powered hiring suite</span>
            </p>
          </div>
          <div className={styles.headerActions}>
            <Link href="/company/coding-judge" className="btn btn-company btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={14} strokeWidth={2} />
              <span>Start Interview</span>
            </Link>
          </div>
        </header>

        <main className={styles.main}>
          {/* Alert */}
          <div className={`${styles.alertBanner} ${styles.alertGreen}`}>
            <span className={styles.alertIcon} style={{ display: 'flex', alignItems: 'center' }}>
              <Zap size={18} strokeWidth={2} color="#10b981" />
            </span>
            <div>
              <strong>12 new AI-matched candidates</strong> have applied to your SDE-1 role. Review them now!
            </div>
            <Link href="/company/applications" className={`btn btn-company btn-sm ${styles.alertBtn}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span>View Candidates</span>
              <ArrowRight size={14} strokeWidth={2} />
            </Link>
          </div>

          {/* Stats */}
          <div className={styles.statsRow}>
            <div className="stat-card">
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg,#10b98130,#06b6d430)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={20} strokeWidth={2} color="#10b981" />
              </div>
              <div>
                <div className="stat-number" style={{ color: '#10b981' }}>{stats?.totalApplicants || 0}</div>
                <div className="stat-label">Total Applicants</div>
              </div>
            </div>
            <div className="stat-card">
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg,#3b82f630,#8b5cf630)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Target size={20} strokeWidth={2} color="#3b82f6" />
              </div>
              <div>
                <div className="stat-number" style={{ color: '#3b82f6' }}>{stats?.aiMatched || 0}</div>
                <div className="stat-label">AI Matched</div>
              </div>
            </div>
            <div className="stat-card">
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg,#f59e0b30,#ef444430)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Briefcase size={20} strokeWidth={2} color="#f59e0b" />
              </div>
              <div>
                <div className="stat-number" style={{ color: '#f59e0b' }}>{stats?.activeJobs || 0}</div>
                <div className="stat-label">Active Sessions</div>
              </div>
            </div>
            <div className="stat-card">
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg,#ec489930,#8b5cf630)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={20} strokeWidth={2} color="#ec4899" />
              </div>
              <div>
                <div className="stat-number" style={{ color: '#ec4899' }}>{stats?.hiredThisMonth || 0}</div>
                <div className="stat-label">Interviews Done</div>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className={styles.grid2}>
            {/* Hiring Pipeline */}
            <div className={`glass ${styles.panel}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <BarChart2 size={18} strokeWidth={2} color="#3b82f6" />
                <h3 className={styles.panelTitle} style={{ margin: 0 }}>Hiring Pipeline</h3>
              </div>
              <div className={styles.pipelineList}>
                {PIPELINE.map(p => (
                  <div key={p.stage} className={styles.pipelineItem}>
                    <div className={styles.pipelineDot} style={{ background: p.color }} />
                    <div className={styles.pipelineInfo}>
                      <span className={styles.pipelineStage}>{p.stage}</span>
                      <div className={styles.pipelineBar}>
                        <div className={styles.pipelineBarFill} style={{ width: p.pct + '%', background: p.color }} />
                      </div>
                    </div>
                    <span className={styles.pipelineCount}>{p.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className={`glass ${styles.panel}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <Sparkles size={18} strokeWidth={2} color="#10b981" />
                <h3 className={styles.panelTitle} style={{ margin: 0 }}>Quick Actions</h3>
              </div>
              <div className={styles.quickActions}>
                {COMPANY_QUICK_ACTIONS.map(a => {
                  const Icon = a.icon
                  return (
                    <Link key={a.label} href={a.href} className={`${styles.quickAction} ${styles.quickActionGreen}`} style={{ '--hover-color': a.color } as React.CSSProperties}>
                      <span className={styles.qaIcon} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={18} strokeWidth={2} />
                      </span>
                      <div>
                        <div className={styles.qaLabel}>{a.label}</div>
                        <div className={styles.qaDesc}>{a.desc}</div>
                      </div>
                      <ArrowRight size={14} strokeWidth={2} className={styles.qaArrow} />
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Bottom Grid */}
          <div className={styles.grid3}>
            {/* Top Candidates */}
            <div className={`glass ${styles.panel} ${styles.span2}`}>
              <div className={styles.panelHead}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Target size={18} strokeWidth={2} color="#10b981" />
                  <h3 className={styles.panelTitle} style={{ margin: 0 }}>Top AI-Matched Candidates</h3>
                </div>
                <Link href="/company/match-candidates" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span>View All</span>
                  <ArrowRight size={13} strokeWidth={2} />
                </Link>
              </div>
              <div className={styles.candidatesList}>
                {TOP_CANDIDATES.map(c => (
                  <div key={c.name} className={styles.candidateCard}>
                    <div className={styles.candidateAvatar} style={{ background: c.gradient }}>{c.initials}</div>
                    <div className={styles.candidateInfo}>
                      <div className={styles.candidateName}>{c.name}</div>
                      <div className={styles.candidateMeta}>{c.college} • {c.role}</div>
                      <div className={styles.candidateSkills}>
                        {c.skills.map(s => (
                          <span key={s} className="badge badge-green" style={{fontSize:'10px'}}>{s}</span>
                        ))}
                      </div>
                    </div>
                    <div className={styles.candidateRight}>
                      <div className={styles.matchScore} style={{ color: '#10b981' }}>{c.match}%</div>
                      <div className={styles.candidateScore}>Match Score</div>
                    </div>
                    <Link href="/company/applications" className="btn btn-company btn-sm">View Profile</Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Jobs */}
            <div className={`glass ${styles.panel}`}>
              <div className={styles.panelHead}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Briefcase size={18} strokeWidth={2} color="#f59e0b" />
                  <h3 className={styles.panelTitle} style={{ margin: 0 }}>Active Jobs</h3>
                </div>
                <Link href="/company/jobs" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span>Manage</span>
                  <ArrowRight size={13} strokeWidth={2} />
                </Link>
              </div>
              <div className={styles.activeJobsList}>
                {ACTIVE_JOBS.map(j => (
                  <div key={j.title} className={styles.activeJobItem}>
                    <div>
                      <div className={styles.activeJobTitle}>{j.title}</div>
                      <div className={styles.activeJobMeta}>{j.applications} applications • {j.days} days left</div>
                    </div>
                    <span className={`badge ${j.urgent ? 'badge-orange' : 'badge-green'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {j.urgent ? (
                        <>
                          <Flame size={12} strokeWidth={2} />
                          <span>Hot</span>
                        </>
                      ) : (
                        <span>Active</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
              <Link href="/company/jobs/create" className={`btn btn-company btn-sm ${styles.fullWidthBtn}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Plus size={14} strokeWidth={2} />
                <span>Post New Role</span>
              </Link>
            </div>
          </div>

          {/* Real Job Offers from LinkedIn API */}
          <div className={`glass ${styles.panel}`}>
            <div className={styles.panelHead}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} strokeWidth={2} color="#3b82f6" />
                <h3 className={styles.panelTitle} style={{ margin: 0 }}>Trending Job Market</h3>
              </div>
              <Link href="/company/talent-search" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span>Search Talent</span>
                <ArrowRight size={13} strokeWidth={2} />
              </Link>
            </div>
            <div className={styles.jobsList}>
              {jobsLoading ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <MorphingInfinity className="size-10" style={{ width: '40px', height: '40px', color: '#10b981' }} />
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading trending market jobs...</p>
                </div>
              ) : jobs.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  No trending jobs available right now.
                </div>
              ) : (
                jobs.map((j, idx) => (
                  <div key={idx} className={styles.jobCard}>
                    <div className={styles.jobLogo} style={{ background: `linear-gradient(135deg, ${getRandomColor()}, ${getRandomColor()})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {j.company ? j.company.charAt(0) : <Building2 size={16} strokeWidth={2} color="white" />}
                    </div>
                    <div className={styles.jobInfo}>
                      <div className={styles.jobTitle}>{j.position}</div>
                      <div className={styles.jobMeta}>{j.company} • {j.location}</div>
                    </div>
                    <div className={styles.jobRight}>
                      <div className={styles.jobDate}>{j.date}</div>
                    </div>
                    <a href={j.jobUrl} target="_blank" rel="noopener noreferrer" className="btn btn-company btn-sm">View</a>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

const PIPELINE = [
  { stage: 'Applied', count: 147, pct: 100, color: '#3b82f6' },
  { stage: 'Screened', count: 89, pct: 61, color: '#8b5cf6' },
  { stage: 'Interview', count: 32, pct: 22, color: '#f59e0b' },
  { stage: 'Shortlisted', count: 12, pct: 8, color: '#10b981' },
  { stage: 'Offered', count: 3, pct: 2, color: '#ec4899' },
]

const COMPANY_QUICK_ACTIONS = [
  { href: '/company/talent-search', icon: Search, label: 'Search Talent', desc: 'AI-powered candidate search', color: '#10b981' },
  { href: '/company/match-candidates', icon: Target, label: 'Match Candidates', desc: 'Auto-match for your open roles', color: '#3b82f6' },
  { href: '/company/coding-judge', icon: Code2, label: 'Coding Interview', desc: 'Real-time coding assessment', color: '#8b5cf6' },
  { href: '/company/dashboard', icon: TrendingUp, label: 'View Analytics', desc: 'Hiring funnel & insights', color: '#f59e0b' },
]

const TOP_CANDIDATES = [
  { initials: 'RS', name: 'Rahul Sharma', college: 'IIT Bombay', role: 'SDE-1 Applicant', match: 92, skills: ['React', 'Node.js', 'DSA'], gradient: 'linear-gradient(135deg,#7c3aed,#3b82f6)' },
  { initials: 'PK', name: 'Priya Kumari', college: 'NIT Trichy', role: 'Backend Engineer', match: 87, skills: ['Python', 'ML', 'SQL'], gradient: 'linear-gradient(135deg,#ec4899,#8b5cf6)' },
  { initials: 'AM', name: 'Arjun Mehta', college: 'BITS Pilani', role: 'Full Stack Dev', match: 81, skills: ['Java', 'Spring', 'AWS'], gradient: 'linear-gradient(135deg,#10b981,#3b82f6)' },
]

const ACTIVE_JOBS = [
  { title: 'SDE-1 Backend Engineer', applications: 52, days: 8, urgent: true },
  { title: 'Data Analyst', applications: 31, days: 14, urgent: false },
  { title: 'Frontend Developer', applications: 28, days: 21, urgent: false },
  { title: 'ML Engineer', applications: 18, days: 5, urgent: true },
  { title: 'DevOps Engineer', applications: 18, days: 12, urgent: false },
]

function getRandomColor() {
  const colors = ['#7c3aed','#3b82f6','#10b981','#f59e0b','#ec4899','#06b6d4','#ef4444']
  return colors[Math.floor(Math.random() * colors.length)]
}

