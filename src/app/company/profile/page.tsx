'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import CompanySidebar from '@/components/CompanySidebar'
import BackButton from '@/components/BackButton'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import styles from '../dashboard.module.css'
import {
  Building2,
  User,
  Lock,
  Save,
  Globe,
  MapPin,
  Users,
  Briefcase,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Target,
  ArrowRight,
  X
} from 'lucide-react'

const INDUSTRY_SUGGESTIONS = [
  'Information Technology & Services',
  'Software Development & SaaS',
  'FinTech & Banking',
  'Artificial Intelligence & Data',
  'E-Commerce & Retail',
  'Healthcare & BioTech',
  'Consulting & Professional Services',
  'Telecommunications'
]

const COMPANY_SIZE_OPTIONS = [
  { value: '1-10', label: '1 - 10 employees', desc: 'Startup / Seed' },
  { value: '11-50', label: '11 - 50 employees', desc: 'Early Stage' },
  { value: '51-200', label: '51 - 200 employees', desc: 'Growth / Mid-sized' },
  { value: '201-500', label: '201 - 500 employees', desc: 'Established Enterprise' },
  { value: '501-1000', label: '501 - 1000 employees', desc: 'Large Enterprise' },
  { value: '1000+', label: '1000+ employees', desc: 'Global Corporation' }
]

export default function CompanyProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'contact' | 'security' | 'preview'>('profile')
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

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

  // Calculate profile completeness percentage
  const calculateCompleteness = () => {
    const fields = [
      formData.company_name,
      formData.email,
      formData.industry,
      formData.website,
      formData.location,
      formData.company_size,
      formData.description,
      formData.contact_person,
      formData.phone
    ]
    const filled = fields.filter(f => Boolean(f && f.toString().trim())).length
    return Math.round((filled / fields.length) * 100)
  }

  const completeness = calculateCompleteness()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (activeTab === 'security' || formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setToastMessage({ text: 'New passwords do not match.', type: 'error' })
        return
      }
      if (!formData.currentPassword) {
        setToastMessage({ text: 'Please enter your current password to authorize this change.', type: 'error' })
        return
      }
    }

    setSaving(true)
    setToastMessage(null)

    try {
      const res = await fetch('/api/company/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (res.ok) {
        setToastMessage({ text: 'Company profile updated successfully!', type: 'success' })
        setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' })
        fetchProfile()
      } else {
        setToastMessage({ text: data.error || 'Failed to update company profile.', type: 'error' })
      }
    } catch (error) {
      setToastMessage({ text: 'An unexpected network error occurred while updating profile.', type: 'error' })
    } finally {
      setSaving(false)
      setTimeout(() => setToastMessage(null), 6000)
    }
  }

  const getInitials = (name: string) => {
    return name
      ? name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'CO'
  }

  if (loading) {
    return (
      <div className={styles.layout}>
        <CompanySidebar />
        <div className={styles.content}>
          <div style={{ padding: '80px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <MorphingInfinity className="size-16" style={{ width: '64px', height: '64px', color: '#10b981' }} />
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
              Loading Company Profile & Employer Settings...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.layout}>
      <CompanySidebar />
      <div className={styles.content}>
        {/* Page Header */}
        <header className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <BackButton fallbackHref="/company/dashboard" />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={22} strokeWidth={2} color="#10b981" />
                <h1 className={styles.pageTitle}>Company Profile & Settings</h1>
              </div>
              <p className={styles.pageSubtitle}>
                Manage your employer branding, recruitment identity, key contacts, and security credentials.
              </p>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="btn btn-company btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {saving ? (
                <>
                  <MorphingInfinity className="size-4" style={{ width: '14px', height: '14px' }} />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={15} strokeWidth={2} />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </header>

        <main className={styles.main}>
          {/* Toast Notification */}
          {toastMessage && (
            <div style={{
              padding: '12px 18px',
              borderRadius: '10px',
              background: toastMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${toastMessage.type === 'success' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
              color: toastMessage.type === 'success' ? '#34d399' : '#f87171',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              fontWeight: 500,
              fontSize: '0.88rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {toastMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{toastMessage.text}</span>
              </div>
              <button
                onClick={() => setToastMessage(null)}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* HERO BANNER: Organization Profile Card */}
          <div className={`glass ${styles.panel}`} style={{
            padding: '24px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                <div style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.5rem',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
                  border: '2px solid rgba(255, 255, 255, 0.2)'
                }}>
                  {getInitials(formData.company_name)}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                      {formData.company_name || 'Your Company Name'}
                    </h2>
                    <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem' }}>
                      <ShieldCheck size={12} strokeWidth={2.5} />
                      Verified Partner Employer
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', flexWrap: 'wrap', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    {formData.industry && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Briefcase size={14} color="#10b981" /> {formData.industry}
                      </span>
                    )}
                    {formData.location && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} color="#3b82f6" /> {formData.location}
                      </span>
                    )}
                    {formData.company_size && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={14} color="#a78bfa" /> {formData.company_size} Employees
                      </span>
                    )}
                    {formData.website && (
                      <a
                        href={formData.website.startsWith('http') ? formData.website : `https://${formData.website}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#60a5fa', textDecoration: 'none' }}
                      >
                        <Globe size={14} /> {formData.website.replace(/^https?:\/\//, '')}
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Completeness Ring Widget */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Profile Strength</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: completeness >= 80 ? '#10b981' : '#f59e0b' }}>
                    {completeness}% Completed
                  </div>
                </div>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: `conic-gradient(#10b981 ${completeness}%, rgba(255,255,255,0.08) 0)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--bg-secondary, #121620)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: '#10b981' }}>
                    {completeness}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TAB NAVIGATION */}
          <div style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid var(--border)',
            marginBottom: '24px',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: '2px'
          }}>
            <button
              onClick={() => setActiveTab('profile')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                background: activeTab === 'profile' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                color: activeTab === 'profile' ? '#34d399' : 'var(--text-secondary)',
                borderBottom: activeTab === 'profile' ? '2px solid #10b981' : '2px solid transparent',
                fontWeight: activeTab === 'profile' ? 700 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Building2 size={16} />
              <span>Company Information & Branding</span>
            </button>

            <button
              onClick={() => setActiveTab('contact')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                background: activeTab === 'contact' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                color: activeTab === 'contact' ? '#34d399' : 'var(--text-secondary)',
                borderBottom: activeTab === 'contact' ? '2px solid #10b981' : '2px solid transparent',
                fontWeight: activeTab === 'contact' ? 700 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <User size={16} />
              <span>Recruiter & Contact Details</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                background: activeTab === 'security' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                color: activeTab === 'security' ? '#34d399' : 'var(--text-secondary)',
                borderBottom: activeTab === 'security' ? '2px solid #10b981' : '2px solid transparent',
                fontWeight: activeTab === 'security' ? 700 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Lock size={16} />
              <span>Security & Password</span>
            </button>

            <button
              onClick={() => setActiveTab('preview')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                background: activeTab === 'preview' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                color: activeTab === 'preview' ? '#34d399' : 'var(--text-secondary)',
                borderBottom: activeTab === 'preview' ? '2px solid #10b981' : '2px solid transparent',
                fontWeight: activeTab === 'preview' ? 700 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Eye size={16} />
              <span>Public Student Preview</span>
            </button>
          </div>

          {/* DUAL-COLUMN MAIN CONTENT */}
          <form onSubmit={handleSubmit}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)',
              gap: '24px',
              alignItems: 'start'
            }}>
              {/* LEFT PRIMARY WORK AREA */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* TAB 1: COMPANY INFORMATION & BRANDING */}
                {activeTab === 'profile' && (
                  <>
                    <div className={`glass ${styles.panel}`} style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                        <Building2 size={18} color="#10b981" />
                        <h3 className={styles.panelTitle} style={{ margin: 0 }}>Organization Profile</h3>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label className="form-label" style={{ fontWeight: 600 }}>Company Display / Legal Name *</label>
                          <input
                            type="text"
                            value={formData.company_name}
                            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                            className="form-input"
                            placeholder="e.g. Acme Technologies Inc."
                            required
                          />
                        </div>

                        <div>
                          <label className="form-label" style={{ fontWeight: 600 }}>Industry Sector</label>
                          <input
                            type="text"
                            value={formData.industry}
                            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                            className="form-input"
                            placeholder="e.g. Software & SaaS"
                          />
                        </div>

                        <div>
                          <label className="form-label" style={{ fontWeight: 600 }}>Company Size</label>
                          <select
                            value={formData.company_size}
                            onChange={(e) => setFormData({ ...formData, company_size: e.target.value })}
                            className="form-select"
                          >
                            <option value="">Select workforce size</option>
                            {COMPANY_SIZE_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label} ({opt.desc})</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="form-label" style={{ fontWeight: 600 }}>Official Website</label>
                          <input
                            type="url"
                            value={formData.website}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            className="form-input"
                            placeholder="https://company.com"
                          />
                        </div>

                        <div>
                          <label className="form-label" style={{ fontWeight: 600 }}>Headquarters / Primary Office</label>
                          <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="form-input"
                            placeholder="e.g. Bangalore, India (or Remote)"
                          />
                        </div>
                      </div>

                      {/* Industry Quick Select Pills */}
                      <div style={{ marginTop: '16px' }}>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                          Suggested Industries:
                        </span>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {INDUSTRY_SUGGESTIONS.map(ind => (
                            <button
                              key={ind}
                              type="button"
                              onClick={() => setFormData({ ...formData, industry: ind })}
                              style={{
                                fontSize: '0.72rem',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                background: formData.industry === ind ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.04)',
                                color: formData.industry === ind ? '#34d399' : 'var(--text-secondary)',
                                border: `1px solid ${formData.industry === ind ? 'rgba(16, 185, 129, 0.4)' : 'var(--border)'}`,
                                cursor: 'pointer'
                              }}
                            >
                              {ind}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className={`glass ${styles.panel}`} style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                        <Sparkles size={18} color="#10b981" />
                        <h3 className={styles.panelTitle} style={{ margin: 0 }}>About Company & Culture Pitch</h3>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                        This description is visible to eligible students and campus placement officers when you post roles or request candidates.
                      </p>

                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="form-input"
                        rows={5}
                        placeholder="Share your company mission, technical stack highlights, work culture, engineering values, and what makes working here exciting..."
                        style={{ lineHeight: 1.5 }}
                      />
                    </div>
                  </>
                )}

                {/* TAB 2: RECRUITER & CONTACT DETAILS */}
                {activeTab === 'contact' && (
                  <div className={`glass ${styles.panel}`} style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                      <User size={18} color="#3b82f6" />
                      <h3 className={styles.panelTitle} style={{ margin: 0 }}>Key Recruitment Contact</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label className="form-label" style={{ fontWeight: 600 }}>Primary Recruiter / Contact Person</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="text"
                            value={formData.contact_person}
                            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                            className="form-input"
                            placeholder="e.g. Priya Sharma (Lead Talent Acquisition)"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="form-label" style={{ fontWeight: 600 }}>Direct Contact Phone / WhatsApp</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="form-input"
                          placeholder="+91 98765 43210"
                        />
                      </div>

                      <div style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>Registered Company Email (Account Login)</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>🔒 Managed by PlaceIQ Admin</span>
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          className="form-input"
                          disabled
                          style={{ opacity: 0.6, cursor: 'not-allowed', background: 'rgba(0,0,0,0.2)' }}
                        />
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                          To change your registered corporate login email, please contact the PlaceIQ Institutional Support Team.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: SECURITY & PASSWORD */}
                {activeTab === 'security' && (
                  <div className={`glass ${styles.panel}`} style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                      <Lock size={18} color="#f59e0b" />
                      <h3 className={styles.panelTitle} style={{ margin: 0 }}>Change Company Password</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label className="form-label" style={{ fontWeight: 600 }}>Current Password *</label>
                        <input
                          type="password"
                          value={formData.currentPassword}
                          onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                          className="form-input"
                          placeholder="Enter your current password"
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <label className="form-label" style={{ fontWeight: 600 }}>New Password *</label>
                          <input
                            type="password"
                            value={formData.newPassword}
                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                            className="form-input"
                            placeholder="Enter new strong password"
                          />
                        </div>

                        <div>
                          <label className="form-label" style={{ fontWeight: 600 }}>Confirm New Password *</label>
                          <input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="form-input"
                            placeholder="Re-type new password"
                          />
                        </div>
                      </div>

                      <div style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        background: 'rgba(59, 130, 246, 0.08)',
                        border: '1px solid rgba(59, 130, 246, 0.25)',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)'
                      }}>
                        💡 <strong>Security Recommendation:</strong> Use at least 8 characters with a mix of uppercase letters, numbers, and special symbols.
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: PUBLIC STUDENT PREVIEW */}
                {activeTab === 'preview' && (
                  <div className={`glass ${styles.panel}`} style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                      <Eye size={18} color="#a78bfa" />
                      <h3 className={styles.panelTitle} style={{ margin: 0 }}>Public Employer Profile Card</h3>
                    </div>

                    <div style={{
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '16px',
                      padding: '24px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                        <div style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '14px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '1.3rem'
                        }}>
                          {getInitials(formData.company_name)}
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                            {formData.company_name || 'Acme Technologies'}
                          </h4>
                          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                            {formData.industry || 'Technology Sector'} • {formData.location || 'India'}
                          </span>
                        </div>
                      </div>

                      <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                        {formData.description || 'No company description provided yet. Add your story and mission in the profile tab.'}
                      </p>

                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                          ✓ Actively Recruiting
                        </span>
                        <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                          🏢 {formData.company_size || '50+'} Employees
                        </span>
                        {formData.website && (
                          <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0' }}>
                            🌐 {formData.website}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Save Action Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-company btn-lg"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minWidth: '160px', justifyContent: 'center' }}
                  >
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

                  <button
                    type="button"
                    onClick={fetchProfile}
                    className="btn btn-secondary btn-lg"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* RIGHT SIDEBAR: QUICK INSIGHTS & ACTIONS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* CARD 1: Profile Completeness Checklist */}
                <div className={`glass ${styles.panel}`} style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <SlidersHorizontal size={16} color="#10b981" />
                    <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Profile Strength Checklist
                    </h4>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: formData.company_name ? '#34d399' : 'var(--text-muted)' }}>
                      <span>Company Legal Name</span>
                      <span>{formData.company_name ? '✓' : 'Pending'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: formData.industry ? '#34d399' : 'var(--text-muted)' }}>
                      <span>Industry Category</span>
                      <span>{formData.industry ? '✓' : 'Pending'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: formData.location ? '#34d399' : 'var(--text-muted)' }}>
                      <span>Headquarters Location</span>
                      <span>{formData.location ? '✓' : 'Pending'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: formData.website ? '#34d399' : 'var(--text-muted)' }}>
                      <span>Company Website</span>
                      <span>{formData.website ? '✓' : 'Pending'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: formData.company_size ? '#34d399' : 'var(--text-muted)' }}>
                      <span>Company Size</span>
                      <span>{formData.company_size ? '✓' : 'Pending'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: formData.description ? '#34d399' : 'var(--text-muted)' }}>
                      <span>Company Description</span>
                      <span>{formData.description ? '✓' : 'Pending'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: formData.contact_person ? '#34d399' : 'var(--text-muted)' }}>
                      <span>Recruiter Contact Person</span>
                      <span>{formData.contact_person ? '✓' : 'Pending'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: formData.phone ? '#34d399' : 'var(--text-muted)' }}>
                      <span>Contact Phone</span>
                      <span>{formData.phone ? '✓' : 'Pending'}</span>
                    </div>
                  </div>
                </div>

                {/* CARD 2: Quick Hiring Navigation */}
                <div className={`glass ${styles.panel}`} style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <Target size={16} color="#3b82f6" />
                    <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Recruitment Shortcuts
                    </h4>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <Link
                      href="/company/candidates"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.25)',
                        color: '#60a5fa',
                        textDecoration: 'none',
                        fontSize: '0.84rem',
                        fontWeight: 600
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={16} />
                        <span>Candidate Intelligence</span>
                      </div>
                      <ChevronRight size={14} />
                    </Link>

                    <Link
                      href="/company/internships"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        color: '#34d399',
                        textDecoration: 'none',
                        fontSize: '0.84rem',
                        fontWeight: 600
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Briefcase size={16} />
                        <span>Manage Job Postings</span>
                      </div>
                      <ChevronRight size={14} />
                    </Link>

                    <Link
                      href="/company/dashboard"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)',
                        textDecoration: 'none',
                        fontSize: '0.84rem',
                        fontWeight: 600
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building2 size={16} />
                        <span>Company Dashboard</span>
                      </div>
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>

                {/* CARD 3: Verification & Security Status */}
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.06)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}>
                  <ShieldCheck size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: '#34d399', display: 'block', marginBottom: '2px' }}>Verified Partner Badge Active</strong>
                    Your organization is verified with partner institutions. Student candidate requests and recruitment postings are expedited.
                  </div>
                </div>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}
