'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import CompanySidebar from '@/components/CompanySidebar'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import styles from '../dashboard.module.css'
import {
  Sparkles,
  Search,
  Filter,
  Briefcase,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Code2,
  FileText,
  Building2,
  Award,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Send,
  User,
  SlidersHorizontal,
  Star,
  Layers,
  Database,
  Check,
  X
} from 'lucide-react'

const PRESET_ROLES = [
  'Software Developer',
  'Software Engineer',
  'Python Backend Developer',
  'Full Stack Developer',
  'Frontend Developer',
  'Data Scientist / AI Engineer',
  'DevOps & Cloud Engineer',
  'Cybersecurity Specialist'
]

const BRANCH_OPTIONS = [
  { value: 'all', label: 'All Branches' },
  { value: 'computer', label: 'Computer Engineering / CSE' },
  { value: 'information', label: 'Information Technology' },
  { value: 'electronics', label: 'Electronics & Telecommunication' },
  { value: 'mechanical', label: 'Mechanical Engineering' },
  { value: 'civil', label: 'Civil Engineering' }
]

const DEGREE_OPTIONS = [
  { value: 'all', label: 'All Degrees' },
  { value: 'b.tech', label: 'B.Tech / B.E.' },
  { value: 'm.tech', label: 'M.Tech' },
  { value: 'mca', label: 'MCA' },
  { value: 'bca', label: 'BCA' }
]

export default function CompanyCandidatesDiscoveryPage() {
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [totalEligible, setTotalEligible] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  // Filter States
  const [selectedRole, setSelectedRole] = useState('Software Developer')
  const [isCustomRole, setIsCustomRole] = useState(false)
  const [customRoleInput, setCustomRoleInput] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [selectedDegree, setSelectedDegree] = useState('all')
  const [minCgpa, setMinCgpa] = useState<number>(0)
  const [minInternships, setMinInternships] = useState<number>(0)
  const [hasProjects, setHasProjects] = useState(false)
  const [hasAssessments, setHasAssessments] = useState(false)
  const [graduationYear, setGraduationYear] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'match' | 'cgpa' | 'sources' | 'experience'>('match')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(true)

  // Quick Action States
  const [requestingId, setRequestingId] = useState<number | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [expandedMatchId, setExpandedMatchId] = useState<number | null>(null)

  const activeRole = isCustomRole ? (customRoleInput.trim() || 'Custom Role') : selectedRole

  useEffect(() => {
    fetchCandidates()
  }, [
    selectedRole,
    isCustomRole,
    selectedBranch,
    selectedDegree,
    minCgpa,
    minInternships,
    hasProjects,
    hasAssessments,
    graduationYear,
    sortBy
  ])

  const fetchCandidates = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('role', activeRole)
      if (selectedBranch !== 'all') params.set('branch', selectedBranch)
      if (selectedDegree !== 'all') params.set('degree', selectedDegree)
      if (minCgpa > 0) params.set('minCgpa', minCgpa.toString())
      if (minInternships > 0) params.set('minInternships', minInternships.toString())
      if (hasProjects) params.set('hasProjects', 'true')
      if (hasAssessments) params.set('hasAssessments', 'true')
      if (graduationYear !== 'all') params.set('graduationYear', graduationYear)
      params.set('sortBy', sortBy)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())

      const res = await fetch(`/api/company/candidates?${params.toString()}`)
      const data = await res.json()

      if (data.candidates) {
        setCandidates(data.candidates)
        setTotalEligible(data.totalEligible || data.candidates.length)
        setTotalCount(data.totalCandidates || data.candidates.length)
      }
    } catch (err) {
      console.error('Failed to fetch candidates:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchCandidates()
  }

  const handleRequestCandidate = async (candidate: any) => {
    setRequestingId(candidate.id)
    try {
      const res = await fetch(`/api/company/candidates/${candidate.id}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: activeRole,
          notes: `Candidate requested for ${activeRole} directly from candidate discovery list.`
        })
      })

      const data = await res.json()
      if (res.ok) {
        setToastMessage(`✓ Request sent for ${candidate.name}! The institution placement cell has been notified.`)
        // Update local status
        setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, status: 'Requested' } : c))
      } else {
        alert(data.error || 'Failed to submit candidate request')
      }
    } catch (err) {
      console.error('Error submitting candidate request:', err)
      alert('An error occurred while submitting request.')
    } finally {
      setRequestingId(null)
      setTimeout(() => setToastMessage(null), 6000)
    }
  }

  const getInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'ST'
  }

  return (
    <div className={styles.layout}>
      <CompanySidebar />
      <div className={styles.content}>
        {/* Top Header */}
        <header className={styles.header}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={22} strokeWidth={2} color="#10b981" />
              <h1 className={styles.pageTitle}>Candidate Discovery & Screening</h1>
              <span className="badge badge-purple" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                SOURCE-BACKED INTELLIGENCE
              </span>
            </div>
            <p className={styles.pageSubtitle}>
              Discover eligible candidates organized by verified academic records and traceable source evidence.
            </p>
          </div>

          <div className={styles.headerActions}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-ghost btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <SlidersHorizontal size={14} strokeWidth={2} />
              <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
            </button>
          </div>
        </header>

        <main className={styles.main}>
          {/* Toast Alert */}
          {toastMessage && (
            <div style={{
              padding: '12px 18px',
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

          {/* Section 1: Role Requirement Selector */}
          <div className={`glass ${styles.panel}`} style={{ borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Briefcase size={18} strokeWidth={2} color="#10b981" />
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Target Hiring Requirement
                  </h2>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
                  PlaceIQ matches and highlights candidate skill sources specifically for this role requirement.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {PRESET_ROLES.map(role => (
                  <button
                    key={role}
                    onClick={() => {
                      setIsCustomRole(false)
                      setSelectedRole(role)
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: (!isCustomRole && selectedRole === role) ? '1px solid #10b981' : '1px solid var(--border)',
                      background: (!isCustomRole && selectedRole === role) ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-secondary)',
                      color: (!isCustomRole && selectedRole === role) ? '#34d399' : 'var(--text-secondary)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {role}
                  </button>
                ))}
                <button
                  onClick={() => setIsCustomRole(!isCustomRole)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: isCustomRole ? '1px solid #8b5cf6' : '1px solid var(--border)',
                    background: isCustomRole ? 'rgba(139, 92, 246, 0.15)' : 'var(--bg-secondary)',
                    color: isCustomRole ? '#a78bfa' : 'var(--text-secondary)'
                  }}
                >
                  + Custom Role
                </button>
              </div>
            </div>

            {isCustomRole && (
              <div style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Enter custom role (e.g. Embedded Firmware Engineer, Cloud Security Architect)..."
                  value={customRoleInput}
                  onChange={(e) => setCustomRoleInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                />
                <button
                  onClick={fetchCandidates}
                  className="btn btn-primary btn-sm"
                  style={{ padding: '0 18px' }}
                >
                  Apply Role
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Multi-Dimensional Filter Bar */}
          {showFilters && (
            <div className={`glass ${styles.panel}`} style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {/* Branch Filter */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Branch / Discipline
                  </label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem'
                    }}
                  >
                    {BRANCH_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Min CGPA Filter */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Min CGPA: <strong style={{ color: '#10b981' }}>{minCgpa > 0 ? `${minCgpa.toFixed(1)} CGPA` : 'Any'}</strong>
                  </label>
                  <select
                    value={minCgpa.toString()}
                    onChange={(e) => setMinCgpa(parseFloat(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem'
                    }}
                  >
                    <option value="0">No CGPA Cutoff</option>
                    <option value="6.0">6.0+ CGPA</option>
                    <option value="7.0">7.0+ CGPA</option>
                    <option value="7.5">7.5+ CGPA</option>
                    <option value="8.0">8.0+ CGPA</option>
                    <option value="8.5">8.5+ CGPA</option>
                  </select>
                </div>

                {/* Min Internships */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Internships Completed
                  </label>
                  <select
                    value={minInternships.toString()}
                    onChange={(e) => setMinInternships(parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem'
                    }}
                  >
                    <option value="0">Any Experience</option>
                    <option value="1">1+ Technical Internship</option>
                    <option value="2">2+ Technical Internships</option>
                  </select>
                </div>

                {/* Graduation Year */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Graduation Batch
                  </label>
                  <select
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem'
                    }}
                  >
                    <option value="all">All Batches</option>
                    <option value="2024">Batch 2024</option>
                    <option value="2025">Batch 2025</option>
                    <option value="2026">Batch 2026</option>
                    <option value="2027">Batch 2027</option>
                  </select>
                </div>
              </div>

              {/* Toggles & Sort By */}
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={hasProjects}
                      onChange={(e) => setHasProjects(e.target.checked)}
                      style={{ accentColor: '#10b981', width: '16px', height: '16px' }}
                    />
                    <span>Must Have Domain Projects</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={hasAssessments}
                      onChange={(e) => setHasAssessments(e.target.checked)}
                      style={{ accentColor: '#10b981', width: '16px', height: '16px' }}
                    />
                    <span>Verified Assessment Activity Only</span>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Sort Candidates:</span>
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.84rem'
                    }}
                  >
                    <option value="match">Job Match (Evidence First)</option>
                    <option value="cgpa">Highest Academic CGPA</option>
                    <option value="sources">Most Skill Evidence Sources</option>
                    <option value="experience">Internship Experience</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Live Search & Summary Stats */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: '280px', maxWidth: '460px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search candidate name, college, or specific skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem'
                }}
              />
            </form>

            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Showing <strong style={{ color: '#10b981' }}>{candidates.length}</strong> eligible candidates for <strong>{activeRole}</strong>
            </div>
          </div>

          {/* Section 4: Smart Candidate Grid */}
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <MorphingInfinity className="size-16" style={{ width: '64px', height: '64px', color: '#10b981' }} />
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                Organizing student profiles and verifying source evidence...
              </p>
            </div>
          ) : candidates.length === 0 ? (
            <div className={`glass ${styles.panel}`} style={{ textAlign: 'center', padding: '50px 20px' }}>
              <AlertCircle size={36} strokeWidth={1.5} color="#f59e0b" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>No Candidates Match Selected Criteria</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '8px auto 16px' }}>
                Try relaxing the CGPA threshold, expanding branch selections, or searching for broader technical skill requirements.
              </p>
              <button
                onClick={() => {
                  setSelectedBranch('all')
                  setMinCgpa(0)
                  setMinInternships(0)
                  setHasAssessments(false)
                  setHasProjects(false)
                  setSearchQuery('')
                }}
                className="btn btn-primary btn-sm"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px' }}>
              {candidates.map((candidate) => {
                const isExpanded = expandedMatchId === candidate.id
                const isRequested = candidate.status === 'Requested'

                return (
                  <div
                    key={candidate.id}
                    className="glass"
                    style={{
                      borderRadius: '16px',
                      padding: '22px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      border: '1px solid var(--border)',
                      transition: 'transform 0.2s ease, border-color 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    {/* Top Row: Candidate Identity & Job Match */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #10b981, #3b82f6)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '1rem',
                          flexShrink: 0
                        }}>
                          {getInitials(candidate.name)}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 style={{ fontSize: '1.08rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                              {candidate.name}
                            </h3>
                            {isRequested && (
                              <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                                Requested ✓
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                            {candidate.branch} • {candidate.degree || 'B.Tech'} ({candidate.graduationYear || 2026})
                          </p>
                        </div>
                      </div>

                      {/* Evidence Strength Badge */}
                      <div
                        onClick={() => setExpandedMatchId(isExpanded ? null : candidate.id)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          cursor: 'pointer',
                          padding: '6px 10px',
                          borderRadius: '10px',
                          background: candidate.evidenceStrength === 'Strong Evidence' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(139, 92, 246, 0.12)',
                          border: `1px solid ${candidate.evidenceStrength === 'Strong Evidence' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(139, 92, 246, 0.3)'}`
                        }}
                      >
                        <span style={{ fontSize: '0.88rem', fontWeight: 800, color: candidate.evidenceStrength === 'Strong Evidence' ? '#34d399' : '#a78bfa' }}>
                          {candidate.requiredSkillsSupportedCount}/{candidate.totalRequiredSkillsCount} Skills
                        </span>
                        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          {candidate.evidenceStrength} {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                        </span>
                      </div>
                    </div>

                    {/* Academic Standing & Stats Bar */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '8px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border)',
                      fontSize: '0.8rem'
                    }}>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>CGPA (Verified)</div>
                        <div style={{ fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>{candidate.cgpa.toFixed(1)}</span>
                          <ShieldCheck size={12} strokeWidth={2.5} color="#10b981" />
                        </div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Experience</div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {candidate.internshipsCount} Internship{candidate.internshipsCount === 1 ? '' : 's'}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Projects</div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {candidate.relevantProjectsCount} Relevant
                        </div>
                      </div>
                    </div>

                    {/* Source-Backed Skills Summary */}
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Source-Backed Skills Found
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {candidate.topSkills.map((sk: any) => (
                          <div key={sk.skill} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{sk.skill}</span>
                              {sk.actualAssessmentScore && (
                                <span className="badge badge-green" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                                  Test: {sk.actualAssessmentScore}%
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '0.74rem', color: sk.sourceCount > 0 ? '#34d399' : 'var(--text-muted)' }}>
                              {sk.sourceCount > 0 ? `Found in ${sk.sourceCount} source${sk.sourceCount === 1 ? '' : 's'}` : 'No sources'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Expanded Match Breakdown Preview */}
                    {isExpanded && (
                      <div style={{
                        padding: '12px',
                        borderRadius: '10px',
                        background: 'rgba(0,0,0,0.25)',
                        border: '1px solid var(--border)',
                        fontSize: '0.78rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        <div style={{ fontWeight: 700, color: '#34d399' }}>Requirement Evidence Check:</div>
                        {candidate.matchFactors.map((mf: string, idx: number) => (
                          <div key={idx} style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CheckCircle2 size={12} color="#10b981" />
                            <span>{mf}</span>
                          </div>
                        ))}
                        {candidate.missingFactors.map((mf: string, idx: number) => (
                          <div key={idx} style={{ color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <AlertCircle size={12} color="#ef4444" />
                            <span>{mf}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recruiter Summary Snippet */}
                    <p style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.4',
                      margin: 0,
                      background: 'rgba(255,255,255,0.02)',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      borderLeft: '2px solid #8b5cf6'
                    }}>
                      {candidate.recruiterSummary}
                    </p>

                    {/* Action Suite */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '4px' }}>
                      <Link
                        href={`/company/candidates/${candidate.id}?role=${encodeURIComponent(activeRole)}`}
                        className="btn btn-ghost btn-sm"
                        style={{
                          flex: 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          textDecoration: 'none'
                        }}
                      >
                        <FileText size={14} strokeWidth={2} />
                        <span>Master Profile</span>
                      </Link>

                      <button
                        onClick={() => handleRequestCandidate(candidate)}
                        disabled={requestingId === candidate.id || isRequested}
                        className={isRequested ? 'btn btn-ghost btn-sm' : 'btn btn-company btn-sm'}
                        style={{
                          flex: 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          background: isRequested ? 'rgba(16, 185, 129, 0.15)' : undefined,
                          color: isRequested ? '#34d399' : undefined,
                          borderColor: isRequested ? 'rgba(16, 185, 129, 0.3)' : undefined
                        }}
                      >
                        {requestingId === candidate.id ? (
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
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
