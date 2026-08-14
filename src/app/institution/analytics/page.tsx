'use client'
import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import styles from '../institution.module.css'

interface AnalyticsData {
  stats: {
    totalStudents: number
    activeDrives: number
    openInternships: number
    totalTrainers: number
  }
  pipelineData: { name: string; applications: number }[]
  activityData: { date: string; count: number }[]
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6']

export default function InstitutionAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d')

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/institution/analytics')
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error('Error fetching institution analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className={styles.main}>
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
          <div>Loading institution analytics & career metrics...</div>
        </div>
      </main>
    )
  }

  const { stats, pipelineData = [], activityData = [] } = data || {}

  // Mock derived metrics for rich institution analytics
  const verificationBreakdown = [
    { name: 'Verified', value: Math.max(Math.round((stats?.totalStudents || 0) * 0.72), 12) },
    { name: 'Pending', value: Math.max(Math.round((stats?.totalStudents || 0) * 0.20), 4) },
    { name: 'Needs Review', value: Math.max(Math.round((stats?.totalStudents || 0) * 0.08), 2) }
  ]

  const topSkillsDemand = [
    { skill: 'React & Next.js', demand: 88 },
    { skill: 'Node.js & Express', demand: 76 },
    { skill: 'Python & Data Science', demand: 64 },
    { skill: 'Cloud & DevOps (AWS)', demand: 59 },
    { skill: 'System Design & SQL', demand: 52 }
  ]

  return (
    <>
      <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className={styles.pageTitle} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              📊 Institution Analytics & Placement Intelligence
            </h1>
            <p className={styles.pageSubtitle}>
              Real-time insights on campus recruitment, student application velocity, and skill readiness.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setTimeRange('7d')}
              className={`btn btn-sm ${timeRange === '7d' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem' }}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`btn btn-sm ${timeRange === '30d' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem' }}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`btn btn-sm ${timeRange === 'all' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem' }}
            >
              All Time
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* KPI Metrics */}
        <div className={styles.statsRow} style={{ marginBottom: '1.5rem' }}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7' }}>👨‍🎓</div>
            <div>
              <div className={styles.statLabel}>Total Enrolled Students</div>
              <div className={styles.statValue}>{stats?.totalStudents || 0}</div>
              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>↑ 14% growth this batch</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>🚀</div>
            <div>
              <div className={styles.statLabel}>Active Placement Drives</div>
              <div className={styles.statValue}>{stats?.activeDrives || 0}</div>
              <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600 }}>Ongoing company evaluations</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>💼</div>
            <div>
              <div className={styles.statLabel}>Open Internships</div>
              <div className={styles.statValue}>{stats?.openInternships || 0}</div>
              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Active industry opportunities</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>👨‍🏫</div>
            <div>
              <div className={styles.statLabel}>Active Trainers & Mentors</div>
              <div className={styles.statValue}>{stats?.totalTrainers || 0}</div>
              <span style={{ fontSize: '0.75rem', color: '#a855f7', fontWeight: 600 }}>Conducting mock sessions</span>
            </div>
          </div>
        </div>

        {/* Analytics Charts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>

          {/* Activity Trend Line Chart */}
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  📈 Student Application Velocity
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Daily placement drive submissions over time</span>
              </div>
            </div>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={activityData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickMargin={10} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#a855f7" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Drive Applications Bar Chart */}
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  📊 Applications by Placement Drive
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Top drives with student response count</span>
              </div>
            </div>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={pipelineData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickMargin={10} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="applications" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Secondary Analytics Grid: Verification Breakdown & Skill Gap Radar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>

          {/* Document Verification Pie Chart */}
          <div className={styles.card}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              📁 Document Verification Distribution
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '1rem' }}>
              Verification status of student degree, marksheets & identity credentials
            </span>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: 260, flexWrap: 'wrap' }}>
              <div style={{ width: 200, height: 200 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={verificationBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {verificationBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {verificationBreakdown.map((item, idx) => (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem' }}>
                    <span style={{ width: 12, height: 12, borderRadius: '50%', background: COLORS[idx % COLORS.length] }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{item.name}:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{item.value} docs</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Campus Skill Demand */}
          <div className={styles.card}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              ⚡ Top In-Demand Technical Skills
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '1.25rem' }}>
              Required skill proficiency across upcoming company recruitment drives
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {topSkillsDemand.map(item => (
                <div key={item.skill}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.skill}</span>
                    <span style={{ color: 'var(--accent-violet)', fontWeight: 600 }}>{item.demand}% match</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${item.demand}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #a855f7 0%, #6366f1 100%)',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </>
  )
}
