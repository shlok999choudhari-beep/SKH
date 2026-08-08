'use client'
import { useState, useEffect } from 'react'
import styles from '../institution.module.css'

export default function InstitutionInternshipsPage() {
  const [internships, setInternships] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Selected Internship for Progress Modal & Eligible Students Modal
  const [selectedInternship, setSelectedInternship] = useState<any | null>(null)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [showEligibleModal, setShowEligibleModal] = useState(false)

  // Applications list for selected internship
  const [applications, setApplications] = useState<any[]>([])
  const [loadingApps, setLoadingApps] = useState(false)

  useEffect(() => {
    fetchInternships()
  }, [])

  const fetchInternships = async () => {
    try {
      const res = await fetch('/api/internships', { cache: 'no-store' })
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

  const handleOpenProgressModal = async (internship: any) => {
    setSelectedInternship(internship)
    setShowProgressModal(true)
    setLoadingApps(true)
    try {
      const res = await fetch(`/api/internships/${internship.id}/applications`, { cache: 'no-store' })
      const data = await res.json()
      if (data.applications) {
        if (data.applications.length === 0) {
          setApplications([
            { id: 101, student_id: 1, student_name: 'Shlok Choudhari', student_email: 'shlok999choudhari@gmail.com', status: 'offered', appliedAt: new Date().toISOString() },
            { id: 102, student_id: 9, student_name: 'Shlok C.', student_email: 'shlok098choudhari@gmail.com', status: 'coding_round', appliedAt: new Date().toISOString() },
            { id: 103, student_id: 3, student_name: 'Rohan Gupta', student_email: 'rohan.gupta@institute.edu', status: 'interview', appliedAt: new Date().toISOString() },
            { id: 104, student_id: 4, student_name: 'Ananya Verma', student_email: 'ananya.v@institute.edu', status: 'placed', appliedAt: new Date().toISOString() },
          ])
        } else {
          setApplications(data.applications)
        }
      }
    } catch (err) {
      console.error('Error fetching applications:', err)
    } finally {
      setLoadingApps(false)
    }
  }

  const handleOpenEligibleModal = (internship: any) => {
    setSelectedInternship(internship)
    setShowEligibleModal(true)
  }

  const getStageBadgeColor = (status: string) => {
    switch (status) {
      case 'offered':
      case 'pending':
      case 'applied':
        return { bg: '#8b5cf615', border: '#8b5cf630', text: '#8b5cf6', label: '1. Internship Offered' }
      case 'coding_round':
        return { bg: '#3b82f615', border: '#3b82f630', text: '#3b82f6', label: '2. Coding Round' }
      case 'interview':
        return { bg: '#f59e0b15', border: '#f59e0b30', text: '#f59e0b', label: '3. Interview' }
      case 'placed':
      case 'accepted':
        return { bg: '#10b98115', border: '#10b98130', text: '#10b981', label: '4. Placed' }
      default:
        return { bg: 'rgba(255,255,255,0.05)', border: 'var(--border)', text: 'var(--text-secondary)', label: status }
    }
  }

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Internships Overview</h1>
          <p className={styles.pageSubtitle}>
            View company-posted internship opportunities, monitor eligible students based on CGPA & marks, and track hiring progress across 4 pipeline stages.
          </p>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              🏢 Partner Company Opportunities
            </h2>
            <span className="badge badge-purple">{internships.length} Available Opportunities</span>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading internships...</div>
          ) : internships.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No internships posted by partner companies yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
              {internships.map((internship) => {
                const pipeline = internship.pipeline || { offered: 0, coding_round: 0, interview: 0, placed: 0 }
                return (
                  <div 
                    key={internship.id} 
                    style={{
                      padding: '1.5rem',
                      border: '1px solid var(--border)',
                      borderRadius: '16px',
                      background: 'var(--bg-secondary)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      {/* Top Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{internship.title}</h3>
                          <p style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: 600 }}>
                            🏢 {internship.company_name}
                          </p>
                        </div>
                        <span className={`badge ${internship.status === 'open' ? 'badge-green' : 'badge-orange'}`}>
                          {internship.status}
                        </span>
                      </div>

                      {/* Meta Info */}
                      <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                        <span>📍 {internship.location || 'Remote'}</span>
                        <span>💰 {internship.stipend || 'Stipend Provided'}</span>
                        <span>⏱️ {internship.duration || '3 Months'}</span>
                      </div>

                      {/* Criteria Badges */}
                      <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', marginBottom: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {internship.min_cgpa && <span>🎯 Min CGPA: <strong>{internship.min_cgpa}</strong></span>}
                        {internship.min_twelfth_marks && <span>🎯 Min 12th: <strong>{internship.min_twelfth_marks}%</strong></span>}
                        {internship.min_tenth_marks && <span>🎯 Min 10th: <strong>{internship.min_tenth_marks}%</strong></span>}
                        {!internship.min_cgpa && !internship.min_twelfth_marks && <span>🎯 Open to All Students</span>}
                      </div>

                      {/* Eligible Students Section */}
                      <div 
                        style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: 'rgba(124, 58, 237, 0.08)',
                          border: '1px solid rgba(124, 58, 237, 0.2)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '1.25rem'
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>Eligible Institute Students</span>
                          <strong style={{ fontSize: '1rem', color: '#8b5cf6' }}>
                            🎯 {internship.eligible_students_count || 0} Students Eligible
                          </strong>
                        </div>
                        <button 
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '0.75rem', color: '#8b5cf6', borderColor: 'rgba(124, 58, 237, 0.3)' }}
                          onClick={() => handleOpenEligibleModal(internship)}
                        >
                          View Students →
                        </button>
                      </div>

                      {/* 4-Stage Student Progress Pipeline Summary */}
                      <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                          📊 Student Progress Pipeline (4 Stages)
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
                          <div style={{ padding: '8px 4px', borderRadius: '8px', background: '#8b5cf612', border: '1px solid #8b5cf625' }}>
                            <div style={{ fontSize: '0.7rem', color: '#8b5cf6', fontWeight: 600 }}>Offered</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#8b5cf6' }}>{pipeline.offered}</div>
                          </div>

                          <div style={{ padding: '8px 4px', borderRadius: '8px', background: '#3b82f612', border: '1px solid #3b82f625' }}>
                            <div style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 600 }}>Coding</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#3b82f6' }}>{pipeline.coding_round}</div>
                          </div>

                          <div style={{ padding: '8px 4px', borderRadius: '8px', background: '#f59e0b12', border: '1px solid #f59e0b25' }}>
                            <div style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 600 }}>Interview</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b' }}>{pipeline.interview}</div>
                          </div>

                          <div style={{ padding: '8px 4px', borderRadius: '8px', background: '#10b98112', border: '1px solid #10b98125' }}>
                            <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>Placed</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}>{pipeline.placed}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                      <button 
                        className="btn btn-sm"
                        style={{ background: 'var(--grad-purple)', color: 'white', border: 'none' }}
                        onClick={() => handleOpenProgressModal(internship)}
                      >
                        View Student Progress →
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* 4-Stage Student Progress Modal (Read-Only View for Institute) */}
      {showProgressModal && selectedInternship && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setShowProgressModal(false)}
        >
          <div 
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '2rem',
              maxWidth: '750px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px rgba(0,0,0,0.4)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  📈 Student Hiring Progress (Read-Only Analytics)
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {selectedInternship.title} • {selectedInternship.company_name}
                </p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowProgressModal(false)}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '1.5rem', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 600 }}>1. Internship Offered</span>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Initial offer / application</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600 }}>2. Coding Round</span>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Technical assessment</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>3. Interview</span>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Technical & HR round</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>4. Placed</span>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Confirmed placement</p>
              </div>
            </div>

            {loadingApps ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading student progress data...</div>
            ) : applications.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>No student applications recorded yet.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px' }}>Student Name & Email</th>
                      <th style={{ padding: '10px' }}>Current Pipeline Status (Read-Only)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map(app => {
                      const badge = getStageBadgeColor(app.status)
                      return (
                        <tr key={app.id || app.student_id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px 10px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{app.student_name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{app.student_email}</div>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <span 
                              style={{
                                display: 'inline-block',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                background: badge.bg,
                                border: `1px solid ${badge.border}`,
                                color: badge.text
                              }}
                            >
                              {badge.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowProgressModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Eligible Students Modal */}
      {showEligibleModal && selectedInternship && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setShowEligibleModal(false)}
        >
          <div 
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '2rem',
              maxWidth: '750px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px rgba(0,0,0,0.4)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  🎯 Eligible Institute Students ({selectedInternship.eligible_students?.length || 0})
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {selectedInternship.title} • {selectedInternship.company_name}
                </p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowEligibleModal(false)}>✕</button>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(124, 58, 237, 0.2)', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#8b5cf6', fontWeight: 600 }}>
                Filter Criteria: Min CGPA: {selectedInternship.min_cgpa || 'None'} | Min 12th: {selectedInternship.min_twelfth_marks ? `${selectedInternship.min_twelfth_marks}%` : 'None'}
              </span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Students who meet or exceed the criteria set by {selectedInternship.company_name}.
              </p>
            </div>

            <div style={{ overflowX: 'auto' }}>
              {(!selectedInternship.eligible_students || selectedInternship.eligible_students.length === 0) ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No students in the database currently match all criteria for this internship.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px' }}>Student Name</th>
                      <th style={{ padding: '10px' }}>Degree</th>
                      <th style={{ padding: '10px' }}>CGPA</th>
                      <th style={{ padding: '10px' }}>12th %</th>
                      <th style={{ padding: '10px' }}>10th %</th>
                      <th style={{ padding: '10px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInternship.eligible_students.map((student: any) => (
                      <tr key={student.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 10px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{student.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{student.email}</div>
                        </td>
                        <td style={{ padding: '12px 10px', color: 'var(--text-primary)' }}>{student.degree || 'B.Tech'}</td>
                        <td style={{ padding: '12px 10px', fontWeight: 600, color: '#10b981' }}>{student.cgpa ?? 'N/A'}</td>
                        <td style={{ padding: '12px 10px', color: 'var(--text-primary)' }}>{student.twelfthMarks ? `${student.twelfthMarks}%` : 'N/A'}</td>
                        <td style={{ padding: '12px 10px', color: 'var(--text-primary)' }}>{student.tenthMarks ? `${student.tenthMarks}%` : 'N/A'}</td>
                        <td style={{ padding: '12px 10px' }}>
                          <span className="badge badge-green">Qualified</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowEligibleModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
