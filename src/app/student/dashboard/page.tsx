'use client'
import { useState, useEffect } from 'react'
import StudentSidebar from '@/components/StudentSidebar'
import styles from '../dashboard.module.css'
import Link from 'next/link'

export default function StudentDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

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
            <Link href="/student/resume" className="btn btn-primary btn-sm">⚡ Analyze Resume</Link>
          </div>
        </header>

        <main className={styles.main}>
          {/* Alert Banner */}
          <div className={styles.alertBanner}>
            <span className={styles.alertIcon}>🎯</span>
            <div>
              <strong>Your ATS Score is 62%</strong> — Upload a new resume to boost your match score for top companies.
            </div>
            <Link href="/student/resume" className={`btn btn-primary btn-sm ${styles.alertBtn}`}>Improve Now →</Link>
          </div>

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
                <div className="stat-number" style={{ color: '#7c3aed' }}>{stats?.skillMatch || 0}/10</div>
                <div className="stat-label">Skill Match</div>
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
              <h3 className={styles.panelTitle}>🚀 Quick Actions</h3>
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

            {/* Skill Radar Preview */}
            <div className={`glass ${styles.panel}`}>
              <h3 className={styles.panelTitle}>📊 Skill Radar</h3>
              <div className={styles.radarContainer}>
                <svg viewBox="0 0 200 200" className={styles.radar}>
                  {/* Background hexagon shapes */}
                  {[0.2,0.4,0.6,0.8,1.0].map(r => (
                    <polygon
                      key={r}
                      points={getHexPoints(100, 100, r * 70)}
                      fill="none" stroke="var(--text-muted)" strokeWidth="1" opacity="0.2"
                    />
                  ))}
                  {/* Skills area */}
                  <polygon
                    points={getSkillPoints(100, 100, 70, [0.85,0.6,0.7,0.4,0.9,0.55])}
                    fill="rgba(124,58,237,0.25)" stroke="rgba(124,58,237,0.8)" strokeWidth="2"
                  />
                  {/* Axis lines */}
                  {getAxisLines(100,100,70).map((l,i) => (
                    <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="var(--text-muted)" strokeWidth="1" opacity="0.3"/>
                  ))}
                  {/* Labels */}
                  {SKILL_LABELS.map((s,i) => {
                    const a = (i * 360/6 - 90) * Math.PI/180
                    const x = 100 + Math.cos(a) * 88
                    const y = 100 + Math.sin(a) * 88
                    return <text key={s} x={x} y={y} fill="var(--text-secondary)" fontSize="9" fontWeight="600" textAnchor="middle" dominantBaseline="middle">{s}</text>
                  })}
                </svg>
              </div>
              <div className={styles.radarLegend}>
                {SKILL_LABELS.map((s,i) => (
                  <div key={s} className={styles.legendItem}>
                    <div className={styles.legendDot} style={{ background: SKILL_COLORS[i] }} />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Grid */}
          <div className={styles.grid3}>
            {/* Matched Jobs */}
            <div className={`glass ${styles.panel} ${styles.span2}`}>
              <div className={styles.panelHead}>
                <h3 className={styles.panelTitle}>💼 AI-Matched Jobs</h3>
                <Link href="/student/jobs" className="btn btn-ghost btn-sm">View All →</Link>
              </div>
              <div className={styles.jobsList}>
                {MATCHED_JOBS.map(j => (
                  <div key={j.title} className={styles.jobCard}>
                    <div className={styles.jobLogo} style={{ background: j.gradient }}>{j.logo}</div>
                    <div className={styles.jobInfo}>
                      <div className={styles.jobTitle}>{j.title}</div>
                      <div className={styles.jobMeta}>{j.company} • {j.location}</div>
                    </div>
                    <div className={styles.jobRight}>
                      <div className={styles.matchScore} style={{ color: j.matchColor }}>
                        {j.match}% match
                      </div>
                      <div className={styles.jobSalary}>{j.salary}</div>
                    </div>
                    <Link href="/student/jobs" className="btn btn-secondary btn-sm">Apply</Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Roadmap */}
            <div className={`glass ${styles.panel}`}>
              <h3 className={styles.panelTitle}>🗺️ My Roadmap</h3>
              <div className={styles.roadmapList}>
                {ROADMAP.map((r, i) => (
                  <div key={r.title} className={`${styles.roadmapItem} ${r.done ? styles.done : ''}`}>
                    <div className={`${styles.roadmapCheck} ${r.done ? styles.checkDone : ''}`}>
                      {r.done ? '✓' : i + 1}
                    </div>
                    <div>
                      <div className={styles.roadmapTitle}>{r.title}</div>
                      <div className={styles.roadmapDesc}>{r.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/student/roadmap" className={`btn btn-primary btn-sm ${styles.fullWidthBtn}`}>View Full Roadmap →</Link>
            </div>
          </div>

          {/* Real Job Offers from LinkedIn API */}
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
    </div>
  )
}

const STUDENT_STATS = [
  { icon: '🎯', label: 'ATS Score', value: '62%', color: '#f59e0b', gradient: 'linear-gradient(135deg,#f59e0b30,#ef444430)' },
  { icon: '🔥', label: 'Skill Match', value: '4/10', color: '#7c3aed', gradient: 'linear-gradient(135deg,#7c3aed30,#8b5cf630)' },
  { icon: '💼', label: 'Jobs Matched', value: '24', color: '#3b82f6', gradient: 'linear-gradient(135deg,#3b82f630,#06b6d430)' },
  { icon: '📈', label: 'Profile Score', value: '71%', color: '#10b981', gradient: 'linear-gradient(135deg,#10b98130,#06b6d430)' },
]

const QUICK_ACTIONS = [
  { href: '/student/resume', icon: '📄', label: 'Analyze Resume', desc: 'Upload & get ATS score instantly', color: '#7c3aed' },
  { href: '/student/mock-interview', icon: '🎤', label: 'Mock Interview', desc: 'Practice with AI interviewer', color: '#3b82f6' },
  { href: '/student/coding-judge', icon: '💻', label: 'Coding Challenge', desc: 'Solve DSA problems with judge', color: '#10b981' },
  { href: '/student/behavioral-analysis', icon: '🎭', label: 'Behavioral Analysis', desc: 'AI-powered interview assessment', color: '#ec4899' },
]

const MATCHED_JOBS = [
  { logo: '🏔', title: 'SDE-1 Backend Engineer', company: 'Google', location: 'Bangalore', match: 87, matchColor: '#10b981', salary: '₹28-35 LPA', gradient: 'linear-gradient(135deg,#4285f4,#34a853)' },
  { logo: '⚡', title: 'Full Stack Developer', company: 'Amazon', location: 'Hyderabad', match: 74, matchColor: '#f59e0b', salary: '₹22-28 LPA', gradient: 'linear-gradient(135deg,#ff9900,#232f3e)' },
  { logo: '🔷', title: 'Data Engineer', company: 'Microsoft', location: 'Pune', match: 68, matchColor: '#f59e0b', salary: '₹18-24 LPA', gradient: 'linear-gradient(135deg,#00bcf2,#0078d4)' },
]

const ROADMAP = [
  { title: 'Week 1: Data Structures', desc: 'Arrays, Linked Lists, Trees', done: true },
  { title: 'Week 2: Algorithms', desc: 'Sorting, Searching, DP', done: true },
  { title: 'Week 3: System Design', desc: 'HLD, LLD, Distributed Systems', done: false },
  { title: 'Week 4: Mock Interviews', desc: '5 full rounds with AI feedback', done: false },
]

const SKILL_LABELS = ['DSA', 'System Design', 'Frontend', 'Backend', 'ML/AI', 'Soft Skills']
const SKILL_COLORS = ['#7c3aed','#3b82f6','#10b981','#f59e0b','#ec4899','#06b6d4']

function getRandomColor() {
  const colors = ['#7c3aed','#3b82f6','#10b981','#f59e0b','#ec4899','#06b6d4','#ef4444']
  return colors[Math.floor(Math.random() * colors.length)]
}

function getHexPoints(cx: number, cy: number, r: number): string {
  return Array.from({length:6}).map((_,i) => {
    const a = (i*60-30)*Math.PI/180
    return `${cx+Math.cos(a)*r},${cy+Math.sin(a)*r}`
  }).join(' ')
}

function getSkillPoints(cx: number, cy: number, r: number, vals: number[]): string {
  return vals.map((v,i) => {
    const a = (i*60-90)*Math.PI/180
    return `${cx+Math.cos(a)*r*v},${cy+Math.sin(a)*r*v}`
  }).join(' ')
}

function getAxisLines(cx: number, cy: number, r: number) {
  return Array.from({length:6}).map((_,i) => {
    const a = (i*60-90)*Math.PI/180
    return { x1:cx, y1:cy, x2:cx+Math.cos(a)*r, y2:cy+Math.sin(a)*r }
  })
}
