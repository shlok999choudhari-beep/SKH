'use client'
import { useState, useEffect } from 'react'
import styles from '../institution.module.css'

export default function InstitutionInternshipsPage() {
  const [internships, setInternships] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInternships() {
      try {
        const res = await fetch('/api/internships')
        const data = await res.json()
        if (data.internships) {
          setInternships(data.internships)
        }
      } catch (err) {
        console.error('Error fetching internships:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchInternships()
  }, [])

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Internships Management</h1>
          <p className={styles.pageSubtitle}>Post institutional opportunities and manage applications.</p>
        </div>
        <button className="btn btn-sm" style={{background: 'var(--grad-purple)', color: 'white', border: 'none'}}>
          + Post Internship
        </button>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
            Active Internships
          </h2>
          {loading ? (
            <div style={{ color: 'var(--text-secondary)' }}>Loading internships...</div>
          ) : internships.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)' }}>No internships found. Click "Post Internship" to create one.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {internships.map((internship) => (
                <div key={internship.id} style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg-secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{internship.title}</h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{internship.company_name || 'Institutional'}</p>
                    </div>
                    <span className={`badge ${internship.status === 'open' ? 'badge-green' : 'badge-orange'}`}>
                      {internship.status}
                    </span>
                  </div>
                  
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '1rem' }}>
                    <span>📍 {internship.location || 'Remote'}</span>
                    <span>💰 {internship.stipend || 'Unpaid'}</span>
                    <span>⏱️ {internship.duration || 'Flexible'}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    <button className="btn btn-ghost btn-sm">View Applications</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
