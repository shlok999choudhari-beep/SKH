'use client'
import { useState, useEffect } from 'react'
import StudentSidebar from '@/components/StudentSidebar'
import styles from '../dashboard.module.css'

export default function StudentInternshipsPage() {
  const [internships, setInternships] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState<number | null>(null)

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

  const handleApply = async (internshipId: number) => {
    setApplying(internshipId)
    try {
      const res = await fetch(`/api/internships/${internshipId}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: 1 }) // Hardcoded for demo/pilot purposes
      })
      const data = await res.json()
      if (res.ok) {
        alert('Successfully applied to the internship!')
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
          <div style={{ padding: '60px', textAlign: 'center' }}>Loading internships...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>Internship Opportunities</h1>
            <p className={styles.pageSubtitle}>Discover and apply for institutional and partner internships.</p>
          </div>
        </header>

        <main className={styles.main}>
          <div className={`glass ${styles.panel}`}>
            <h3 className={styles.panelTitle}>💼 Available Internships</h3>
            {internships.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)' }}>No internships available at the moment. Please check back later.</div>
            ) : (
              <div className={styles.jobsList}>
                {internships.map((internship) => (
                  <div key={internship.id} className={styles.jobCard}>
                    <div className={styles.jobLogo} style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>
                      {internship.company_name ? internship.company_name.charAt(0) : '🏛'}
                    </div>
                    <div className={styles.jobInfo}>
                      <div className={styles.jobTitle}>{internship.title}</div>
                      <div className={styles.jobMeta}>
                        {internship.company_name || 'Institutional'} • {internship.location || 'Remote'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {internship.duration && <span>⏱️ {internship.duration} </span>}
                        {internship.stipend && <span>💰 {internship.stipend}</span>}
                      </div>
                    </div>
                    <div className={styles.jobRight}>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handleApply(internship.id)}
                        disabled={applying === internship.id}
                      >
                        {applying === internship.id ? 'Applying...' : 'Apply Now'}
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
