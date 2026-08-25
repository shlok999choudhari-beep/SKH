'use client'
import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import styles from '../institution.module.css'
import {
  Landmark,
  GraduationCap,
  UserCheck,
  Briefcase,
  Rocket,
  Activity,
  BarChart2,
  Loader2
} from 'lucide-react'

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
        <div style={{ color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '60px' }}>
          <MorphingInfinity className="size-16" style={{ width: '64px', height: '64px', color: '#a855f7' }} />
          <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Loading analytics...</p>
        </div>
      </main>
    )
  }

  const { stats, pipelineData, activityData } = data || {}

  return (
    <>
      <header className={styles.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Landmark size={24} strokeWidth={2} color="#a855f7" />
            <h1 className={styles.pageTitle}>Institution Dashboard</h1>
          </div>
          <p className={styles.pageSubtitle}>Overview of your institution's career ecosystem.</p>
        </div>
      </header>
      
      <main className={styles.main}>
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{background: 'rgba(168,85,247,0.1)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <GraduationCap size={20} strokeWidth={2} />
            </div>
            <div>
              <div className={styles.statLabel}>Total Students</div>
              <div className={styles.statValue}>{stats?.totalStudents || 0}</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{background: 'rgba(59,130,246,0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <UserCheck size={20} strokeWidth={2} />
            </div>
            <div>
              <div className={styles.statLabel}>Total Trainers</div>
              <div className={styles.statValue}>{stats?.totalTrainers || 0}</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <Briefcase size={20} strokeWidth={2} />
            </div>
            <div>
              <div className={styles.statLabel}>Open Internships</div>
              <div className={styles.statValue}>{stats?.openInternships || 0}</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{background: 'rgba(245,158,11,0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <Rocket size={20} strokeWidth={2} />
            </div>
            <div>
              <div className={styles.statLabel}>Active Placement Drives</div>
              <div className={styles.statValue}>{stats?.activeDrives || 0}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
          
          <div className={styles.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
              <Activity size={18} strokeWidth={2} color="#a855f7" />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Drive Activity (Applications)</h3>
            </div>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
              <BarChart2 size={18} strokeWidth={2} color="#3b82f6" />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Applications by Drive</h3>
            </div>
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

