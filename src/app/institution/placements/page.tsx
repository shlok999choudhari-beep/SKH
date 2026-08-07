'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from '../institution.module.css'

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
          <p className={styles.pageSubtitle}>Manage mass campus recruitment drives and applicant pipelines.</p>
        </div>
        <button className="btn btn-sm" style={{background: 'var(--grad-purple)', color: 'white', border: 'none'}}>
          + Create Drive
        </button>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
            Active & Upcoming Drives
          </h2>
          {loading ? (
            <div style={{ color: 'var(--text-secondary)' }}>Loading drives...</div>
          ) : drives.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)' }}>No placement drives found. Click "Create Drive" to start one.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {drives.map((drive) => (
                <div key={drive.id} style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{drive.title}</h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{drive.company_name || 'Multi-Company Event'}</p>
                    </div>
                    <span className={`badge ${drive.status === 'active' ? 'badge-green' : drive.status === 'upcoming' ? 'badge-blue' : 'badge-orange'}`}>
                      {drive.status}
                    </span>
                  </div>
                  
                  <div style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '1.5rem' }}>
                    <span>Eligibility: {drive.eligibility_criteria || 'Open for all'}</span>
                    <span>Created: {new Date(drive.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  <Link href={`/institution/placements/${drive.id}`} className="btn btn-sm" style={{ width: '100%', justifyContent: 'center', background: 'rgba(124, 58, 237, 0.1)', color: 'var(--accent-violet)', border: '1px solid rgba(124, 58, 237, 0.3)' }}>
                    Manage Drive →
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
