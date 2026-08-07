'use client'
import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import styles from '../../institution.module.css'

export default function DriveDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params)
  const driveId = unwrappedParams.id
  
  const [rounds, setRounds] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [roundsRes, appsRes] = await Promise.all([
          fetch(`/api/placements/${driveId}/rounds`),
          fetch(`/api/placements/${driveId}/applications`)
        ])
        const roundsData = await roundsRes.json()
        const appsData = await appsRes.json()
        
        if (roundsData.rounds) setRounds(roundsData.rounds)
        if (appsData.applications) setApplications(appsData.applications)
      } catch (err) {
        console.error('Error fetching drive details:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [driveId])

  return (
    <>
      <header className={styles.header}>
        <div>
          <Link href="/institution/placements" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '8px', display: 'inline-block' }}>
            ← Back to Drives
          </Link>
          <h1 className={styles.pageTitle}>Drive Details (ID: {driveId})</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-sm" style={{background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border)'}}>
            Add Round
          </button>
          <button className="btn btn-sm" style={{background: 'var(--grad-purple)', color: 'white', border: 'none'}}>
            Edit Drive
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          {/* Rounds Sidebar */}
          <div className={styles.card}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Selection Rounds</h3>
            {loading ? (
              <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
            ) : rounds.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No rounds configured yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {rounds.map((round, idx) => (
                  <div key={round.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-violet)', fontWeight: 700, marginBottom: '4px' }}>ROUND {idx + 1}</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{round.round_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Status: {round.status}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Applications Table */}
          <div className={styles.card}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Applicant Funnel</h3>
            {loading ? (
              <div style={{ color: 'var(--text-secondary)' }}>Loading applicants...</div>
            ) : applications.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No applicants have applied yet.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      <th style={{ padding: '12px 8px', fontWeight: 500 }}>Student Name</th>
                      <th style={{ padding: '12px 8px', fontWeight: 500 }}>Email</th>
                      <th style={{ padding: '12px 8px', fontWeight: 500 }}>Current Round</th>
                      <th style={{ padding: '12px 8px', fontWeight: 500 }}>Status</th>
                      <th style={{ padding: '12px 8px', fontWeight: 500 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map(app => (
                      <tr key={app.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 8px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{app.student_name}</td>
                        <td style={{ padding: '12px 8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{app.student_email}</td>
                        <td style={{ padding: '12px 8px', fontSize: '0.875rem', color: 'var(--text-primary)' }}>{app.round_name || 'Applied (Initial)'}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <span className={`badge ${app.status === 'selected' || app.status === 'hired' ? 'badge-green' : app.status === 'rejected' ? 'badge-orange' : 'badge-blue'}`}>
                            {app.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <button className="btn btn-sm" style={{ background: 'transparent', border: '1px solid var(--border)', fontSize: '0.75rem' }}>Update</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
