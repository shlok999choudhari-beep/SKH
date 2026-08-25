'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from '../institution.module.css'
import { Building2, Calendar, Plus, ArrowRight, Users } from 'lucide-react'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'

export default function InstitutionPlacementsPage() {
  const [drives, setDrives] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDrives() {
      try {
        const res = await fetch('/api/placements')
        const data = await res.json()
        if (data.drives) {
          setDrives(data.drives)
        }
      } catch (err) {
        console.error('Error fetching placement drives:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDrives()
  }, [])

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Placement Drives</h1>
          <p className={styles.pageSubtitle}>Manage campus recruitment drives and applicant pipelines.</p>
        </div>
        <button className="btn btn-primary btn-sm">
          <Plus size={15} strokeWidth={2} />
          <span>Create Drive</span>
        </button>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Active & Upcoming Drives
            </h2>
            <span className="badge badge-purple">{drives.length} Total Drives</span>
          </div>

          {loading ? (
            <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <MorphingInfinity className="size-16" style={{ width: '64px', height: '64px', color: '#8b5cf6' }} />
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Loading placement drives...</p>
            </div>
          ) : drives.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No placement drives found. Click "Create Drive" to start one.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {drives.map((drive) => (
                <div key={drive.id} style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                    <div>
                      <h3 style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{drive.title}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                        <Building2 size={13} strokeWidth={2} color="var(--text-muted)" />
                        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>{drive.company_name || 'Multi-Company Event'}</p>
                      </div>
                    </div>
                    <span className={`badge ${drive.status === 'active' ? 'badge-green' : drive.status === 'upcoming' ? 'badge-blue' : 'badge-orange'}`}>
                      {drive.status}
                    </span>
                  </div>
                  
                  <div style={{ flex: 1, fontSize: '0.825rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={13} strokeWidth={2} color="var(--text-muted)" />
                      <span>Eligibility: {drive.eligibility_criteria || 'Open for all'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={13} strokeWidth={2} color="var(--text-muted)" />
                      <span>Created: {new Date(drive.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <Link href={`/institution/placements/${drive.id}`} className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                    <span>Manage Drive</span>
                    <ArrowRight size={13} strokeWidth={2} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}

