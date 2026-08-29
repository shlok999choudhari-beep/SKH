'use client'

import { useState, useEffect, use } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import CompanySidebar from '@/components/CompanySidebar'
import BackButton from '@/components/BackButton'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import styles from '../../dashboard.module.css'
import {
  Sparkles,
  Briefcase,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Code2,
  FileText,
  Building2,
  Award,
  Send,
  User,
  Star,
  ExternalLink,
  Target,
  Clock,
  TrendingUp,
  Cpu,
  Layers,
  Check,
  X,
  Printer,
  ChevronRight,
  Database,
  HelpCircle
} from 'lucide-react'

interface ActiveEvidenceModal {
  title: string
  subtitle: string
  trustLevel: 'VERIFIED' | 'PLATFORM EVIDENCE' | 'STUDENT PROVIDED' | 'AI EXTRACTED'
  sourceDocument: string
  location: string
  detail: string
  verificationAuthority?: string
  timestamp?: string
  evidenceList?: {
    sourceTitle: string
    sourceType: string
    location: string
    detail: string
    timestamp?: string
  }[]
}

export default function MasterCandidateProfilePage({ params }: { params?: Promise<{ id: string }> }) {
  const routeParams = useParams()
  const resolvedParams = params ? use(params) : null
  const candidateId = resolvedParams?.id || (routeParams?.id as string) || ''

  const searchParams = useSearchParams()
  const roleParam = searchParams.get('role') || 'Software Developer'

  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isShortlisted, setIsShortlisted] = useState(false)

  // Evidence Drawer / Modal State
  const [activeModal, setActiveModal] = useState<ActiveEvidenceModal | null>(null)

  useEffect(() => {
    if (candidateId) {
      fetchProfile()
    }
  }, [candidateId, roleParam])

  const fetchProfile = async () => {
    if (!candidateId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/company/candidates/${candidateId}?role=${encodeURIComponent(roleParam)}`)
      const data = await res.json()
      if (data.profile) {
        setProfile(data.profile)
      }
    } catch (err) {
      console.error('Failed to load candidate profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestCandidate = async () => {
    if (!profile) return
    setRequesting(true)
    try {
      const res = await fetch(`/api/company/candidates/${profile.id}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: roleParam,
          notes: `Master profile recruiter request for ${roleParam}`
        })
      })

      const data = await res.json()
      if (res.ok) {
        setToastMessage(`✓ Candidate Request successfully submitted for ${profile.name}! The institution placement cell has been notified.`)
        setProfile((prev: any) => ({ ...prev, status: 'Requested' }))
      } else {
        alert(data.error || 'Failed to request candidate')
      }
    } catch (err) {
      console.error('Error requesting candidate:', err)
      alert('An error occurred.')
    } finally {
      setRequesting(false)
      setTimeout(() => setToastMessage(null), 7000)
    }
  }

  const getInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'ST'
  }

  const renderTrustBadge = (trust: string) => {
    if (trust === 'VERIFIED') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 8px',
          borderRadius: '6px',
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#34d399',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          fontSize: '0.72rem',
          fontWeight: 700
        }}>
          <ShieldCheck size={12} strokeWidth={2.5} />
          VERIFIED
        </span>
      )
    }
    if (trust === 'PLATFORM EVIDENCE') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 8px',
          borderRadius: '6px',
          background: 'rgba(59, 130, 246, 0.15)',
          color: '#60a5fa',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          fontSize: '0.72rem',
          fontWeight: 700
        }}>
          <Code2 size={12} strokeWidth={2} />
          PLATFORM EVIDENCE
        </span>
      )
    }
    if (trust === 'AI EXTRACTED') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 8px',
          borderRadius: '6px',
          background: 'rgba(139, 92, 246, 0.15)',
          color: '#a78bfa',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          fontSize: '0.72rem',
          fontWeight: 700
        }}>
          <Sparkles size={12} strokeWidth={2} />
          AI EXTRACTED
        </span>
      )
    }
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        borderRadius: '6px',
        background: 'rgba(245, 158, 11, 0.15)',
        color: '#fbbf24',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        fontSize: '0.72rem',
        fontWeight: 700
      }}>
        <User size={12} strokeWidth={2} />
        STUDENT PROVIDED
      </span>
    )
  }

  if (loading) {
    return (
      <div className={styles.layout}>
        <CompanySidebar />
        <div className={styles.content}>
          <div style={{ padding: '80px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <MorphingInfinity className="size-16" style={{ width: '64px', height: '64px', color: '#10b981' }} />
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
              Assembling Master Candidate Dossier & verifying evidence chains...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className={styles.layout}>
        <CompanySidebar />
        <div className={styles.content}>
          <div style={{ padding: '60px 40px', textAlign: 'center' }}>
            <h2>Candidate Dossier Not Found</h2>
            <Link href="/company/candidates" className="btn btn-primary btn-sm" style={{ marginTop: '16px' }}>
              Back to Candidate Intelligence
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isRequested = profile.status === 'Requested'

  return (
    <div className={styles.layout}>
      <CompanySidebar />
      <div className={styles.content}>
        {/* Header */}
        <header className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <BackButton fallbackHref="/company/candidates" />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} strokeWidth={2} color="#10b981" />
                <h1 className={styles.pageTitle}>Master Candidate Profile</h1>
              </div>
              <p className={styles.pageSubtitle}>
                Source-backed, traceable candidate intelligence & verified evidence dossier
              </p>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button
              onClick={() => setIsShortlisted(!isShortlisted)}
              className="btn btn-ghost btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: isShortlisted ? '#f59e0b' : undefined }}
            >
              <Star size={14} fill={isShortlisted ? '#f59e0b' : 'none'} />
              <span>{isShortlisted ? 'Shortlisted' : 'Shortlist'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="btn btn-ghost btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={14} />
              <span>Print Dossier</span>
            </button>

            <button
              onClick={handleRequestCandidate}
              disabled={requesting || isRequested}
              className={isRequested ? 'btn btn-ghost btn-sm' : 'btn btn-company btn-sm'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: isRequested ? 'rgba(16, 185, 129, 0.15)' : undefined,
                color: isRequested ? '#34d399' : undefined,
                borderColor: isRequested ? 'rgba(16, 185, 129, 0.3)' : undefined
              }}
            >
              {requesting ? (
                <MorphingInfinity className="size-4" style={{ width: '14px', height: '14px' }} />
              ) : isRequested ? (
                <>
                  <CheckCircle2 size={14} strokeWidth={2} />
                  <span>Requested</span>
                </>
              ) : (
                <>
                  <Send size={14} strokeWidth={2} />
                  <span>Request Candidate</span>
                </>
              )}
            </button>
          </div>
        </header>

        <main className={styles.main}>
          {/* Toast Notification */}
          {toastMessage && (
            <div style={{
              padding: '14px 20px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontWeight: 500,
              fontSize: '0.92rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} strokeWidth={2} />
                <span>{toastMessage}</span>
              </div>
              <button
                onClick={() => setToastMessage(null)}
                style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Section 1: Candidate Overview Card */}
          <div className={`glass ${styles.panel}`} style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #10b981, #3b82f6)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.4rem'
                }}>
                  {getInitials(profile.name)}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                      {profile.name}
                    </h2>
                    <span className="badge badge-green" style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldCheck size={12} strokeWidth={2.5} />
                      Verified Student Record
                    </span>
                    {isRequested && (
                      <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
                        Requested ✓
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                    {profile.degree || 'B.Tech'} in {profile.branch} • Graduating {profile.graduationYear || 2026}
                  </p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    {profile.institutionName} • {profile.email} {profile.phone ? `• ${profile.phone}` : ''}
                  </p>
                </div>
              </div>

              {/* Top Quick Highlights Grid */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div
                  onClick={() => setActiveModal({
                    title: 'Cumulative CGPA: ' + profile.cgpa.toFixed(2),
                    subtitle: 'Official Academic Registrar Record',
                    trustLevel: 'VERIFIED',
                    sourceDocument: 'Verified Academic Record',
                    location: 'Institution Examination Controller Database',
                    detail: `Student has an official cumulative grade point average of ${profile.cgpa.toFixed(2)} on a 10.0 scale.`,
                    verificationAuthority: 'Institution Controller of Examinations'
                  })}
                  style={{
                    padding: '12px 18px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>CGPA</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <span>{profile.cgpa.toFixed(1)}</span>
                    <ShieldCheck size={14} strokeWidth={2.5} />
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#34d399', marginTop: '2px' }}>Click for Source</div>
                </div>

                <div style={{
                  padding: '12px 18px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>INTERNSHIPS</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {profile.internshipsCount}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>Verified Experiences</div>
                </div>

                <div style={{
                  padding: '12px 18px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>PROJECTS</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {profile.relevantProjectsCount}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>Relevant to Role</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Job Relevance & Evidence Check (Top Section) */}
          <div className={`glass ${styles.panel}`} style={{ borderLeft: '4px solid #3b82f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Target size={18} strokeWidth={2} color="#3b82f6" />
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Job Requirement Evidence: {roleParam}
                  </h2>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  Transparent check of required qualifications, skills evidence, and supporting records.
                </p>
              </div>

              <div style={{
                padding: '6px 14px',
                borderRadius: '10px',
                background: profile.evidenceStrength === 'Strong Evidence' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                border: `1px solid ${profile.evidenceStrength === 'Strong Evidence' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(139, 92, 246, 0.3)'}`,
                color: profile.evidenceStrength === 'Strong Evidence' ? '#34d399' : '#a78bfa',
                fontWeight: 700,
                fontSize: '0.86rem'
              }}>
                {profile.evidenceStrength} ({profile.requiredSkillsSupportedCount}/{profile.totalRequiredSkillsCount} Required Skills Supported)
              </div>
            </div>

            {/* Checklist Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} color="#10b981" />
                  <span>Supporting Evidence Found:</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {profile.matchFactors.map((factor: string, idx: number) => (
                    <div key={idx} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>✓</span>
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
              </div>

              {profile.missingFactors && profile.missingFactors.length > 0 && (
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fca5a5', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={14} color="#ef4444" />
                    <span>Missing or Unverified Signals:</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {profile.missingFactors.map((factor: string, idx: number) => (
                      <div key={idx} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ color: '#ef4444', fontWeight: 700 }}>!</span>
                        <span>{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Academic Performance Summary (Summary-First) */}
          <div className={`glass ${styles.panel}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GraduationCap size={18} strokeWidth={2} color="#10b981" />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Academic Performance Summary
                </h2>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Click any record for source verification</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              {profile.academicItems?.map((item: any) => (
                <div
                  key={item.field}
                  onClick={() => setActiveModal({
                    title: `${item.field}: ${item.value}`,
                    subtitle: item.sourceTitle,
                    trustLevel: item.sourceType,
                    sourceDocument: item.sourceTitle,
                    location: item.location,
                    detail: item.detail,
                    verificationAuthority: item.sourceType === 'VERIFIED' ? 'Institution Registrar & Examination Cell' : undefined
                  })}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{item.field}</span>
                    {renderTrustBadge(item.status)}
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>
                    {item.value}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                    <span>Source: {item.sourceTitle}</span>
                    <ChevronRight size={12} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Relevant Skills & Source Traceability */}
          <div className={`glass ${styles.panel}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cpu size={18} strokeWidth={2} color="#8b5cf6" />
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Skill Intelligence & Source Traceability
                  </h2>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  Every skill is mapped to its exact source and evidence count. Click to inspect full evidence.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {profile.allSkills.map((sk: any) => (
                <div
                  key={sk.skill}
                  onClick={() => setActiveModal({
                    title: `Skill Evidence: ${sk.skill}`,
                    subtitle: `Found across ${sk.sourceCount} source${sk.sourceCount === 1 ? '' : 's'}`,
                    trustLevel: sk.sourceTypes.includes('VERIFIED')
                      ? 'VERIFIED'
                      : sk.sourceTypes.includes('PLATFORM EVIDENCE')
                      ? 'PLATFORM EVIDENCE'
                      : sk.sourceTypes.includes('AI EXTRACTED')
                      ? 'AI EXTRACTED'
                      : 'STUDENT PROVIDED',
                    sourceDocument: `${sk.sourceCount} Connected Sources`,
                    location: 'Platform Skill Evidence Graph',
                    detail: `${sk.skill} has been documented across ${sk.sourceCount} distinct verifiable sources in PlaceIQ.`,
                    evidenceList: sk.sources.map((s: any) => ({
                      sourceTitle: s.sourceTitle,
                      sourceType: s.sourceType,
                      location: s.location,
                      detail: s.detail,
                      timestamp: s.timestamp
                    }))
                  })}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: sk.isRelevant ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{sk.skill}</span>
                      {sk.isRelevant && (
                        <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>Role Req</span>
                      )}
                    </div>
                    {sk.actualAssessmentScore && (
                      <span className="badge badge-green" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                        Score: {sk.actualAssessmentScore}%
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                    <span style={{ color: sk.sourceCount > 0 ? '#34d399' : 'var(--text-muted)' }}>
                      {sk.sourceCount > 0 ? `Mentioned in ${sk.sourceCount} source${sk.sourceCount === 1 ? '' : 's'}` : 'No sources found'}
                    </span>
                    <span style={{ color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
                      View Evidence <ChevronRight size={12} />
                    </span>
                  </div>

                  {/* Badges Preview */}
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {sk.sourceTypes.map((st: string) => (
                      <span key={st} style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                        {st}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Relevant Projects & Experiences Grid */}
          <div className={`glass ${styles.panel}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Code2 size={18} strokeWidth={2} color="#3b82f6" />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Relevant Technical Projects ({profile.relevantProjects.length})
                </h2>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
              {profile.relevantProjects.map((proj: any) => (
                <div
                  key={proj.id}
                  onClick={() => setActiveModal({
                    title: proj.title,
                    subtitle: `Project Record (${proj.domain || 'Engineering'})`,
                    trustLevel: proj.sourceType,
                    sourceDocument: proj.sourceTitle,
                    location: proj.location,
                    detail: `${proj.description}\n\nTechnologies: ${proj.techStack.join(', ')}`,
                    verificationAuthority: proj.sourceType === 'PLATFORM EVIDENCE' ? 'PlaceIQ Technical Evaluation' : undefined
                  })}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      {proj.title}
                    </h3>
                    {renderTrustBadge(proj.sourceType)}
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
                    {proj.description}
                  </p>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: 'auto' }}>
                    {proj.techStack.map((tech: string) => (
                      <span key={tech} className="badge badge-gray" style={{ fontSize: '0.7rem' }}>
                        {tech}
                      </span>
                    ))}
                  </div>

                  <div style={{ fontSize: '0.74rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <span>Source: {proj.sourceTitle}</span>
                    <ChevronRight size={12} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: Internships & Practical Experience */}
          <div className={`glass ${styles.panel}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Briefcase size={18} strokeWidth={2} color="#f59e0b" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Practical Experience & Internships ({profile.experiences.length})
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {profile.experiences.map((exp: any) => (
                <div
                  key={exp.id}
                  onClick={() => setActiveModal({
                    title: `${exp.role} at ${exp.organization}`,
                    subtitle: exp.duration,
                    trustLevel: exp.sourceType,
                    sourceDocument: exp.sourceTitle,
                    location: exp.location,
                    detail: exp.detail || exp.description,
                    verificationAuthority: exp.sourceType === 'VERIFIED' ? 'Institution Placement Cell' : undefined
                  })}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{exp.role}</span>
                      <span style={{ color: 'var(--text-muted)' }}>•</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{exp.organization}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                      {exp.duration} • Source: {exp.sourceTitle}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {renderTrustBadge(exp.sourceType)}
                    <ChevronRight size={14} color="var(--text-muted)" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 7: Assessments & Coding Benchmarks */}
          <div className={`glass ${styles.panel}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Award size={18} strokeWidth={2} color="#10b981" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Platform Technical Assessments & Benchmarks
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
              {profile.assessments.map((asm: any) => (
                <div
                  key={asm.id}
                  onClick={() => setActiveModal({
                    title: asm.name,
                    subtitle: `Actual Test Score: ${asm.score}%`,
                    trustLevel: asm.sourceType,
                    sourceDocument: asm.sourceTitle,
                    location: asm.location,
                    detail: asm.detail,
                    timestamp: asm.date
                  })}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{asm.type}</span>
                    {renderTrustBadge(asm.sourceType)}
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {asm.name}
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#10b981' }}>
                    {asm.score}% Score
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Source: {asm.sourceTitle}</span>
                    <ChevronRight size={12} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 8: Recruiter Executive Summary */}
          <div className={`glass ${styles.panel}`} style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(16, 185, 129, 0.05))', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sparkles size={16} color="#a78bfa" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#a78bfa' }}>
                Recruiter Executive Summary
              </h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: '1.5', margin: 0 }}>
              {profile.recruiterSummary}
            </p>
          </div>
        </main>
      </div>

      {/* CLICK-TO-REVEAL EVIDENCE MODAL / DRAWER */}
      {activeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#121620',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Database size={16} color="#10b981" />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    SOURCE & EVIDENCE AUDIT
                  </span>
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {activeModal.title}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  {activeModal.subtitle}
                </p>
              </div>

              <button
                onClick={() => setActiveModal(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Trust Classification Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Trust Classification:</span>
              {renderTrustBadge(activeModal.trustLevel)}
            </div>

            {/* Provenance Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Source Document / System</div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{activeModal.sourceDocument}</div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Location in Document</div>
                <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{activeModal.location}</div>
              </div>

              {activeModal.verificationAuthority && (
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Verification Authority</div>
                  <div style={{ color: '#34d399', fontWeight: 700, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={14} />
                    <span>{activeModal.verificationAuthority}</span>
                  </div>
                </div>
              )}

              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Recorded Detail / Evidence Text</div>
                <div style={{
                  marginTop: '4px',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.45',
                  fontSize: '0.84rem'
                }}>
                  {activeModal.detail}
                </div>
              </div>

              {/* Multi-Source Chain List if present */}
              {activeModal.evidenceList && activeModal.evidenceList.length > 0 && (
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
                    Connected Evidence Sources ({activeModal.evidenceList.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {activeModal.evidenceList.map((ev, i) => (
                      <div key={i} style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.82rem' }}>{i + 1}. {ev.sourceTitle}</span>
                          {renderTrustBadge(ev.sourceType)}
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                          {ev.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
              <button
                onClick={() => setActiveModal(null)}
                className="btn btn-primary btn-sm"
                style={{ padding: '0 20px' }}
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
