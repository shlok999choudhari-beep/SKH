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
  Loader2,
  Search
} from 'lucide-react'

export default function StudentPlacementsPage() {
  const [drives, setDrives] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [blockedNotice, setBlockedNotice] = useState<string | null>(null)

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

  const filteredDrives = drives.filter(d => {
    if (blockedNotice) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      d.title?.toLowerCase().includes(q) ||
      d.company_name?.toLowerCase().includes(q) ||
      d.eligibility_criteria?.toLowerCase().includes(q)
    )
  })

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
          {/* Placement Search Bar */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '16px', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <Search size={18} strokeWidth={2} color="var(--text-muted)" />
              </span>
              <input
                type="text"
                placeholder="Search placement drives, roles, or eligibility..."
                value={search}
                onChange={(e) => {
                  const val = e.target.value
                  setSearch(val)
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
                    Placement Search Notice
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {blockedNotice}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={`glass ${styles.panel}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Rocket size={18} strokeWidth={2} color="#8b5cf6" />
              <h3 className={styles.panelTitle}>Upcoming Drives ({filteredDrives.length})</h3>
            </div>
            {filteredDrives.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)' }}>
                {blockedNotice ? 'No matching opportunities within learning scope.' : 'No placement drives found. Keep checking!'}
              </div>
            ) : (
              <div className={styles.jobsList}>
                {filteredDrives.map((drive) => (
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

