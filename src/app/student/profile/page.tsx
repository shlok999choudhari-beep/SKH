'use client'
import { useState, useEffect } from 'react'
import StudentSidebar from '@/components/StudentSidebar'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import styles from '../dashboard.module.css'
import {
  User,
  Link as LinkIcon,
  Lock,
  Save,
  Loader2
} from 'lucide-react'

export default function StudentProfile() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    college: '',
    degree: '',
    graduation_year: '',
    phone: '',
    github_url: '',
    linkedin_url: '',
    portfolio_url: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/student/profile')
      const data = await res.json()
      setProfile(data)
      setFormData({
        ...formData,
        name: data.name || '',
        email: data.email || '',
        college: data.college || '',
        degree: data.degree || '',
        graduation_year: data.graduation_year || '',
        phone: data.phone || '',
        github_url: data.github_url || '',
        linkedin_url: data.linkedin_url || '',
        portfolio_url: data.portfolio_url || ''
      })
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (showPasswordSection) {
      if (formData.newPassword !== formData.confirmPassword) {
        alert('New passwords do not match')
        return
      }
      if (!formData.currentPassword) {
        alert('Please enter your current password')
        return
      }
    }

    setSaving(true)
    try {
      const res = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      
      if (res.ok) {
        alert('Profile updated successfully!')
        setShowPasswordSection(false)
        setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' })
        fetchProfile()
      } else {
        alert(data.error || 'Failed to update profile')
      }
    } catch (error) {
      alert('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.layout}>
        <StudentSidebar />
        <div className={styles.content}>
          <div style={{ padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <MorphingInfinity className="size-16" style={{ width: '64px', height: '64px', color: '#8b5cf6' }} />
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Loading profile...</p>
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
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={24} strokeWidth={2} color="#8b5cf6" />
              <h1 className={styles.pageTitle}>My Profile</h1>
            </div>
            <p className={styles.pageSubtitle}>Manage your personal information and account settings</p>
          </div>
        </header>

        <main className={styles.main}>
          <form onSubmit={handleSubmit}>
            <div className={`glass ${styles.panel}`} style={{ maxWidth: '800px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <User size={18} strokeWidth={2} color="#8b5cf6" />
                <h3 className={styles.panelTitle} style={{ margin: 0 }}>Personal Information</h3>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Email (Read-only)</label>
                  <input
                    type="email"
                    value={formData.email}
                    className="form-input"
                    disabled
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  />
                </div>

                <div>
                  <label className="form-label">College/University</label>
                  <input
                    type="text"
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                    className="form-input"
                    placeholder="e.g., IIT Bombay"
                  />
                </div>

                <div>
                  <label className="form-label">Degree</label>
                  <input
                    type="text"
                    value={formData.degree}
                    onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                    className="form-input"
                    placeholder="e.g., B.Tech Computer Science"
                  />
                </div>

                <div>
                  <label className="form-label">Graduation Year</label>
                  <input
                    type="number"
                    value={formData.graduation_year}
                    onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })}
                    className="form-input"
                    placeholder="e.g., 2025"
                  />
                </div>

                <div>
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="form-input"
                    placeholder="+91 XXXXXXXXXX"
                  />
                </div>
              </div>
            </div>

            <div className={`glass ${styles.panel}`} style={{ maxWidth: '800px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <LinkIcon size={18} strokeWidth={2} color="#3b82f6" />
                <h3 className={styles.panelTitle} style={{ margin: 0 }}>Social Links</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label">GitHub Profile</label>
                  <input
                    type="url"
                    value={formData.github_url}
                    onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                    className="form-input"
                    placeholder="https://github.com/username"
                  />
                </div>

                <div>
                  <label className="form-label">LinkedIn Profile</label>
                  <input
                    type="url"
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                    className="form-input"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>

                <div>
                  <label className="form-label">Portfolio Website</label>
                  <input
                    type="url"
                    value={formData.portfolio_url}
                    onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                    className="form-input"
                    placeholder="https://yourportfolio.com"
                  />
                </div>
              </div>
            </div>

            <div className={`glass ${styles.panel}`} style={{ maxWidth: '800px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={18} strokeWidth={2} color="#f59e0b" />
                  <h3 className={styles.panelTitle} style={{ margin: 0 }}>Change Password</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                  className="btn btn-ghost btn-sm"
                >
                  {showPasswordSection ? 'Cancel' : 'Change Password'}
                </button>
              </div>

              {showPasswordSection && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className="form-label">Current Password *</label>
                    <input
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                      className="form-input"
                      placeholder="Enter current password"
                    />
                  </div>

                  <div>
                    <label className="form-label">New Password *</label>
                    <input
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      className="form-input"
                      placeholder="Enter new password"
                    />
                  </div>

                  <div>
                    <label className="form-label">Confirm New Password *</label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="form-input"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              )}
            </div>

            <div style={{ maxWidth: '800px', display: 'flex', gap: '12px' }}>
              <button type="submit" disabled={saving} className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                {saving ? (
                  <>
                    <MorphingInfinity className="size-4" style={{ width: '16px', height: '16px' }} />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} strokeWidth={2} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
              <button type="button" onClick={fetchProfile} className="btn btn-secondary btn-lg">
                Cancel
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}

