'use client'
import { useState, useEffect } from 'react'
import styles from '../institution.module.css'

export default function InstitutionCertificationsPage() {
  const [certifications, setCertifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCerts() {
      try {
        const res = await fetch('/api/certifications')
        const data = await res.json()
        if (data.certifications) {
          setCertifications(data.certifications)
        }
      } catch (err) {
        console.error('Error fetching certifications:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCerts()
  }, [])

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Certification Verification</h1>
          <p className={styles.pageSubtitle}>Review and verify student uploaded certifications.</p>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
            Verification Inbox
          </h2>
          {loading ? (
            <div style={{ color: 'var(--text-secondary)' }}>Loading certifications...</div>
          ) : certifications.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)' }}>No pending certifications found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {certifications.map((cert) => (
                <div key={cert.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--bg-secondary)' }}>
                  <div>
                    <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {cert.name}
                      <span className={`badge ${cert.verified_status === 'verified' ? 'badge-green' : cert.verified_status === 'rejected' ? 'badge-orange' : 'badge-purple'}`}>
                        {cert.verified_status}
                      </span>
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Student: {cert.student_name} | Provider: {cert.provider} | Issued: {new Date(cert.issue_date).toLocaleDateString()}
                    </p>
                    {cert.credential_url && (
                      <a href={cert.credential_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.875rem', color: 'var(--accent-violet)', textDecoration: 'underline', marginTop: '4px', display: 'inline-block' }}>
                        View Credential Link
                      </a>
                    )}
                  </div>
                  
                  {cert.verified_status === 'pending' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-sm" style={{ background: 'var(--accent-green)', color: 'white', border: 'none' }}>Verify</button>
                      <button className="btn btn-sm" style={{ background: 'var(--accent-orange)', color: 'white', border: 'none' }}>Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
