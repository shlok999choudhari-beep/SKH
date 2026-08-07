'use client'
import { useState, useEffect } from 'react'
import CompanySidebar from '@/components/CompanySidebar'
import styles from '../dashboard.module.css'

export default function CompanyProfile() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [formData, setFormData] = useState({
    company_name: '',
    email: '',
    industry: '',
    website: '',
    location: '',
    company_size: '',
    description: '',
    contact_person: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/company/profile')
      const data = await res.json()
      setProfile(data)
      setFormData({
        ...formData,
        company_name: data.company_name || '',
        email: data.email || '',
        industry: data.industry || '',
        website: data.website || '',
        location: data.location || '',
        company_size: data.company_size || '',
        description: data.description || '',
        contact_person: data.contact_person || '',
        phone: data.phone || ''
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
      const res = await fetch('/api/company/profile', {
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
        <CompanySidebar />
        <div className={styles.content}>
          <div style={{ padding: '60px', textAlign: 'center' }}>Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.layout}>
      <CompanySidebar />
      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>Company Profile</h1>
            <p className={styles.pageSubtitle}>Manage your company information and account settings</p>
          </div>
        </header>

        <main className={styles.main}>
          <form onSubmit={handleSubmit}>
            <div className={`glass ${styles.panel}`} style={{ maxWidth: '800px' }}>
              <h3 className={styles.panelTitle}>🏢 Company Information</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label className="form-label">Company Name *</label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
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
                  <label className="form-label">Industry</label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="form-input"
                    placeholder="e.g., Technology, Finance"
                  />
                </div>

                <div>
                  <label className="form-label">Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="form-input"
                    placeholder="https://company.com"
                  />
                </div>

                <div>
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="form-input"
                    placeholder="e.g., Bangalore, India"
                  />
                </div>

                <div>
                  <label className="form-label">Company Size</label>
                  <select
                    value={formData.company_size}
                    onChange={(e) => setFormData({ ...formData, company_size: e.target.value })}
                    className="form-select"
                  >
                    <option value="">Select size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="501-1000">501-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Company Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="form-input"
                    rows={4}
                    placeholder="Brief description of your company..."
                  />
                </div>
              </div>
            </div>

            <div className={`glass ${styles.panel}`} style={{ maxWidth: '800px' }}>
              <h3 className={styles.panelTitle}>👤 Contact Information</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label className="form-label">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="form-input"
                    placeholder="HR Manager Name"
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 className={styles.panelTitle}>🔒 Change Password</h3>
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
              <button type="submit" disabled={saving} className="btn btn-company btn-lg">
                {saving ? '⏳ Saving...' : '💾 Save Changes'}
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
