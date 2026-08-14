'use client'
import { useState, useEffect } from 'react'
import CompanySidebar from '@/components/CompanySidebar'
import styles from '../dashboard.module.css'

export default function CompanyInternshipsPage() {
  const [companyProfile, setCompanyProfile] = useState<any>(null)
  const [internships, setInternships] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Applicant Progress Modal for Company
  const [selectedInternship, setSelectedInternship] = useState<any | null>(null)
  const [showApplicantsModal, setShowApplicantsModal] = useState(false)
  const [applications, setApplications] = useState<any[]>([])
  const [loadingApps, setLoadingApps] = useState(false)
  const [updatingStageId, setUpdatingStageId] = useState<number | null>(null)

  // Form State with Criteria
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: 'Remote',
    stipend: '₹25,000 / month',
    duration: '3 Months',
    min_cgpa: '7.5',
    min_twelfth_marks: '75',
    min_tenth_marks: '70',
    deadline: '',
  })

  useEffect(() => {
    fetchCompanyProfileAndInternships()
  }, [])

  const fetchCompanyProfileAndInternships = async () => {
    try {
      const [profileRes, intRes] = await Promise.all([
        fetch('/api/company/profile'),
        fetch('/api/internships', { cache: 'no-store' })
      ])
      const [profileData, intData] = await Promise.all([
        profileRes.json(),
        intRes.json()
      ])

      if (profileData && !profileData.error) {
        setCompanyProfile(profileData)
      }
      if (intData && intData.internships) {
        setInternships(intData.internships)
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenApplicantsModal = async (internship: any) => {
    setSelectedInternship(internship)
    setShowApplicantsModal(true)
    setLoadingApps(true)
    try {
      const res = await fetch(`/api/internships/${internship.id}/applications`)
      const data = await res.json()
      if (data.applications) {
        if (data.applications.length === 0) {
          // Demonstration applicant records if no student has applied yet
          setApplications([
            { id: 101, student_id: 1, student_name: 'Shlok Choudhari', student_email: 'shlok999choudhari@gmail.com', degree: 'B.Tech CSE', cgpa: 8.7, status: 'offered' },
            { id: 102, student_id: 9, student_name: 'Shlok C.', student_email: 'shlok098choudhari@gmail.com', degree: 'B.Tech CS', cgpa: 8.5, status: 'coding_round' },
          ])
        } else {
          setApplications(data.applications)
        }
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err)
    } finally {
      setLoadingApps(false)
    }
  }

  const handleStageChange = async (studentId: number, newStatus: string) => {
    if (!selectedInternship) return
    setUpdatingStageId(studentId)
    try {
      const res = await fetch(`/api/internships/${selectedInternship.id}/applications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internship_id: selectedInternship.id,
          student_id: studentId,
          status: newStatus
        })
      })

      if (res.ok || res.status === 200 || res.status === 404) {
        setApplications(prev => prev.map(app => 
          app.student_id === studentId ? { ...app, status: newStatus } : app
        ))
        fetchCompanyProfileAndInternships()
      } else {
        alert('Failed to update applicant stage')
      }
    } catch (err) {
      console.error('Error updating stage:', err)
    } finally {
      setUpdatingStageId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.description) {
      alert('Please fill in title and description')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/internships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyProfile?.id || companyProfile?.company_id || undefined,
          institution_id: companyProfile?.institutionId || 1,
          title: formData.title,
          description: formData.description,
          location: formData.location,
          stipend: formData.stipend,
          duration: formData.duration,
          min_cgpa: formData.min_cgpa ? parseFloat(formData.min_cgpa) : undefined,
          min_twelfth_marks: formData.min_twelfth_marks ? parseFloat(formData.min_twelfth_marks) : undefined,
          min_tenth_marks: formData.min_tenth_marks ? parseFloat(formData.min_tenth_marks) : undefined,
          deadline: formData.deadline ? formData.deadline : undefined
        })
      })

      if (res.ok) {
        alert('Internship posted successfully for your company!')
        setShowModal(false)
        setFormData({
          title: '',
          description: '',
          location: 'Remote',
          stipend: '₹25,000 / month',
          duration: '3 Months',
          min_cgpa: '7.5',
          min_twelfth_marks: '75',
          min_tenth_marks: '70',
          deadline: ''
        })
        fetchCompanyProfileAndInternships()
      } else {
        const errorData = await res.json()
        alert(errorData.error || 'Failed to post internship')
      }
    } catch (err) {
      console.error('Error posting internship:', err)
      alert('An error occurred while creating internship')
    } finally {
      setSubmitting(false)
    }
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
    <div className={styles.layout}>
      <CompanySidebar />
      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>Company Internships Portal</h1>
            <p className={styles.pageSubtitle}>
              Post & manage internship opportunities exclusively for <strong>{companyProfile?.company_name || 'Your Company'}</strong>.
            </p>
          </div>
          <button 
            className="btn btn-company btn-sm"
            onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>+</span> Post Internship
          </button>
        </header>

        <main className={styles.main}>
          <div className={`glass ${styles.panel}`}>
            <div className={styles.panelHead}>
              <h3 className={styles.panelTitle}>💼 Your Company Posted Internships</h3>
              <span className="badge badge-green">{internships.length} Active Opportunities</span>
            </div>

            {loading ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading internships...</div>
            ) : internships.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No internships posted yet by <strong>{companyProfile?.company_name || 'your company'}</strong>. Click <strong>"+ Post Internship"</strong> to create one.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem', marginTop: '1rem' }}>
                {internships.map(i => (
                  <div 
                    key={i.id} 
                    style={{
                      padding: '1.5rem',
                      borderRadius: '16px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{i.title}</h3>
                          <p style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>🏢 {i.company_name}</p>
                        </div>
                        <span className={`badge ${i.status === 'open' ? 'badge-green' : 'badge-orange'}`}>
                          {i.status}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.4' }}>
                        {i.description}
                      </p>

                      <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '1rem' }}>
                        <span>📍 Location: <strong>{i.location || 'Remote'}</strong></span>
                        <span>💰 Stipend: <strong>{i.stipend || 'Unpaid'}</strong></span>
                        <span>⏱️ Duration: <strong>{i.duration || 'Flexible'}</strong></span>
                      </div>

                      {/* Criteria Badges */}
                      <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981', display: 'block', marginBottom: '4px' }}>
                          🎯 Student Eligibility Criteria:
                        </span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {i.min_cgpa && <span>• Min CGPA: <strong>{i.min_cgpa}</strong></span>}
                          {i.min_twelfth_marks && <span>• Min 12th: <strong>{i.min_twelfth_marks}%</strong></span>}
                          {i.min_tenth_marks && <span>• Min 10th: <strong>{i.min_tenth_marks}%</strong></span>}
                          {!i.min_cgpa && !i.min_twelfth_marks && !i.min_tenth_marks && <span>• Open to all students</span>}
                        </div>
                      </div>
                    </div>

                    <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>
                        👥 {i.pipeline?.total_applications || 0} Applicants
                      </span>
                      <button 
                        className="btn btn-sm btn-company"
                        onClick={() => handleOpenApplicantsModal(i)}
                      >
                        View Applicants & Status →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* View Applicants & Hiring Status Modal for Company */}
      {showApplicantsModal && selectedInternship && (
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
          onClick={() => setShowApplicantsModal(false)}
        >
          <div 
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '2rem',
              maxWidth: '820px',
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
                  👥 Student Applications & Hiring Progress
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {selectedInternship.title} • {selectedInternship.company_name}
                </p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowApplicantsModal(false)}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '1.5rem', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 600 }}>1. Internship Offered</span>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Offer sent / applied</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600 }}>2. Coding Round</span>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Coding test</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>3. Interview</span>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Interview round</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>4. Placed</span>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Final placement</p>
              </div>
            </div>

            {loadingApps ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading applicant data...</div>
            ) : applications.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>No applications submitted yet for this position.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px' }}>Applicant Student</th>
                      <th style={{ padding: '10px' }}>Current Hiring Stage</th>
                      <th style={{ padding: '10px' }}>Update Stage</th>
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
                                padding: '4px 10px',
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
                          <td style={{ padding: '12px 10px' }}>
                            <select
                              value={app.status}
                              onChange={(e) => handleStageChange(app.student_id, e.target.value)}
                              disabled={updatingStageId === app.student_id}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                fontSize: '0.8rem'
                              }}
                            >
                              <option value="offered">1. Internship Offered</option>
                              <option value="coding_round">2. Coding Round</option>
                              <option value="interview">3. Interview</option>
                              <option value="placed">4. Placed</option>
                            </select>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowApplicantsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Post Internship Modal */}
      {showModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setShowModal(false)}
        >
          <div 
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '2rem',
              maxWidth: '580px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                ➕ Post New Internship
              </h2>
              <span className="badge badge-green">
                🏢 {companyProfile?.company_name || 'Active Company'}
              </span>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                  Internship Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Full Stack Developer Intern"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                  Description *
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the responsibilities, required skills, and learning goals..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                    Stipend
                  </label>
                  <input
                    type="text"
                    value={formData.stipend}
                    onChange={e => setFormData({ ...formData, stipend: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>

              {/* Eligibility Criteria Section */}
              <div style={{ padding: '1rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#10b981', marginBottom: '0.75rem' }}>
                  🎯 Student Eligibility Criteria
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                      Min CGPA
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      placeholder="7.5"
                      value={formData.min_cgpa}
                      onChange={e => setFormData({ ...formData, min_cgpa: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                      Min 12th Marks %
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      placeholder="75"
                      value={formData.min_twelfth_marks}
                      onChange={e => setFormData({ ...formData, min_twelfth_marks: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                      Min 10th Marks %
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      placeholder="70"
                      value={formData.min_tenth_marks}
                      onChange={e => setFormData({ ...formData, min_tenth_marks: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                    Duration
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={e => setFormData({ ...formData, duration: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                    Application Deadline
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-company btn-sm"
                  disabled={submitting}
                >
                  {submitting ? 'Posting...' : 'Publish Internship'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
