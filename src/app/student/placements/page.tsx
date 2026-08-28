'use client'
import { useState, useEffect } from 'react'
import StudentSidebar from '@/components/StudentSidebar'
import BackButton from '@/components/BackButton'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import styles from '../dashboard.module.css'
import {
  GraduationCap,
  Rocket,
  Building2,
  Loader2
} from 'lucide-react'

export default function StudentPlacementsPage() {
  const [drives, setDrives] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState<number | null>(null)

  useEffect(() => {
    async function fetchDrives() {
      try {
        const res = await fetch('/api/placements')
        const data = await res.json()
        if (data.drives) {
          setDrives(data.drives)
        }
      } catch (err) {
        console.error('Error fetching drives:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDrives()
  }, [])

  const handleApply = async (driveId: number) => {
    setApplying(driveId)
    try {
      const res = await fetch(`/api/placements/${driveId}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: 1 }) // Hardcoded for demo purposes
      })
      const data = await res.json()
      if (res.ok) {
        alert('Successfully applied to the placement drive!')
      } else {
        alert(data.error || 'Failed to apply')
      }
    } catch (err) {
      console.error(err)
      alert('An error occurred while applying.')
    } finally {
      setApplying(null)
    }
  }

  if (loading) {
    return (
      <div className={styles.layout}>
        <StudentSidebar />
        <div className={styles.content}>
          <div style={{ padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <MorphingInfinity className="size-16" style={{ width: '64px', height: '64px', color: '#8b5cf6' }} />
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Loading placement drives...</p>
          </div>
        </div>
      </div>
    )
  }

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
                <h1 className={styles.pageTitle}>Campus Placements</h1>
              </div>
              <p className={styles.pageSubtitle}>View and apply to mass recruitment drives hosted by your institution.</p>
            </div>
          </div>
        </header>

        <main className={styles.main}>
          <div className={`glass ${styles.panel}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Rocket size={18} strokeWidth={2} color="#8b5cf6" />
              <h3 className={styles.panelTitle}>Upcoming Drives</h3>
            </div>
            {drives.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)' }}>No placement drives announced yet. Keep checking!</div>
            ) : (
              <div className={styles.jobsList}>
                {drives.map((drive) => (
                  <div key={drive.id} className={styles.jobCard}>
                    <div className={styles.jobLogo} style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}>
                      {drive.company_name ? drive.company_name.charAt(0) : <Building2 size={20} />}
                    </div>
                    <div className={styles.jobInfo}>
                      <div className={styles.jobTitle} style={{ fontSize: '1.125rem', marginBottom: '4px' }}>{drive.title}</div>
                      <div className={styles.jobMeta} style={{ fontSize: '0.875rem' }}>
                        {drive.company_name || 'Multi-Company'} Drive
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                        Eligibility: {drive.eligibility_criteria || 'Open for all'}
                      </div>
                    </div>
                    <div className={styles.jobRight} style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                      <span className={`badge ${drive.status === 'upcoming' ? 'badge-blue' : drive.status === 'active' ? 'badge-green' : 'badge-orange'}`}>
                        {drive.status}
                      </span>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handleApply(drive.id)}
                        disabled={applying === drive.id || drive.status === 'completed'}
                      >
                        {applying === drive.id ? 'Applying...' : drive.status === 'completed' ? 'Closed' : 'Register for Drive'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

