'use client'
import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import styles from '../institution.module.css'

export default function InstitutionDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch('/api/institution/analytics')
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error('Error fetching analytics:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <main className={styles.main}>
        <div style={{ color: 'var(--text-secondary)' }}>Loading analytics...</div>
      </main>
    )
  }

  const { stats, pipelineData, activityData } = data || {}

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Institution Dashboard</h1>
          <p className={styles.pageSubtitle}>Overview of your institution's career ecosystem.</p>
        </div>
      </header>
      
      <main className={styles.main}>
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{background: 'rgba(168,85,247,0.1)', color: '#a855f7'}}>👨‍🎓</div>
            <div>
              <div className={styles.statLabel}>Total Students</div>
              <div className={styles.statValue}>{stats?.totalStudents || 0}</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{background: 'rgba(59,130,246,0.1)', color: '#3b82f6'}}>👨‍🏫</div>
            <div>
              <div className={styles.statLabel}>Total Trainers</div>
              <div className={styles.statValue}>{stats?.totalTrainers || 0}</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{background: 'rgba(16,185,129,0.1)', color: '#10b981'}}>💼</div>
            <div>
              <div className={styles.statLabel}>Open Internships</div>
              <div className={styles.statValue}>{stats?.openInternships || 0}</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{background: 'rgba(245,158,11,0.1)', color: '#f59e0b'}}>🚀</div>
            <div>
              <div className={styles.statLabel}>Active Placement Drives</div>
              <div className={styles.statValue}>{stats?.activeDrives || 0}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
          
          <div className={styles.card}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Drive Activity (Applications)</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={activityData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickMargin={10} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#a855f7" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={styles.card}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Applications by Drive</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={pipelineData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickMargin={10} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="applications" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </main>
    </>
  )
}
