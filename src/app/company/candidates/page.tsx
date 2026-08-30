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
  X,
  Trophy,
  Zap,
  HelpCircle,
  BarChart3,
  Flame,
  CheckCheck,
  Info
} from 'lucide-react'
import {
  CandidateCardData,
  ROLE_PRESET_SKILLS,
  DimensionalScoreBreakdown,
  ScoringWeights,
  DEFAULT_SCORING_WEIGHTS
} from '@/lib/candidateIntelligenceService'

const PRESET_ROLES = [
  'Software Developer',
  'Software Developer Intern',
  'Frontend Developer',
  'Python Backend Developer',
  'Full Stack Developer',
  'Data Scientist / AI Engineer',
  'DevOps & Cloud Engineer',
  'Cybersecurity Specialist'
]

const BRANCH_OPTIONS = [
  { value: 'all', label: 'All Disciplines / Branches' },
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

import { dispatchPortalNotification } from '@/components/NotificationBell'

export default function CompanyCandidateIntelligencePage() {
  const [candidates, setCandidates] = useState<CandidateCardData[]>([])
  const [ineligibleCandidates, setIneligibleCandidates] = useState<CandidateCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [totalEligible, setTotalEligible] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [hasHighMatches, setHasHighMatches] = useState(true)
  const [scoringWeights, setScoringWeights] = useState<ScoringWeights>(DEFAULT_SCORING_WEIGHTS)
  const [activeTab, setActiveTab] = useState<'eligible' | 'ineligible'>('eligible')

  // Requirement States
  const [selectedRole, setSelectedRole] = useState('Software Developer')
  const [isCustomRole, setIsCustomRole] = useState(false)
  const [customRoleInput, setCustomRoleInput] = useState('')
  const [customSkillsInput, setCustomSkillsInput] = useState('')
  const [skillsList, setSkillsList] = useState<string[]>(ROLE_PRESET_SKILLS['Software Developer'] || ['JavaScript', 'React', 'Node.js', 'SQL'])
  const [newSkillTag, setNewSkillTag] = useState('')

  // Top Talent Limit Scope (Top 5, Top 10 [Default], Top 25, All)
  const [topLimit, setTopLimit] = useState<'5' | '10' | '25' | 'all'>('10')

  // Hard Eligibility & Filters
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [selectedDegree, setSelectedDegree] = useState('all')
  const [minCgpa, setMinCgpa] = useState<number>(0)
  const [minTenth, setMinTenth] = useState<number>(0)
  const [minTwelfth, setMinTwelfth] = useState<number>(0)
  const [minInternships, setMinInternships] = useState<number>(0)
  const [hasProjects, setHasProjects] = useState(false)
  const [hasAssessments, setHasAssessments] = useState(false)
  const [graduationYear, setGraduationYear] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'match' | 'cgpa' | 'sources' | 'experience'>('match')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showWeightsModal, setShowWeightsModal] = useState(false)

  // Interactive Detailed Breakdown Modal
  const [activeBreakdownCandidate, setActiveBreakdownCandidate] = useState<CandidateCardData | null>(null)

  // Action States
  const [requestingId, setRequestingId] = useState<number | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const activeRole = isCustomRole ? (customRoleInput.trim() || 'Custom Role') : selectedRole

  // Handle Preset Role Selection
  const handleSelectPresetRole = (role: string) => {
    setIsCustomRole(false)
    setSelectedRole(role)
    const preset = ROLE_PRESET_SKILLS[role] || ['JavaScript', 'React', 'Node.js', 'SQL']
    setSkillsList(preset)
  }

  // Handle Adding Skill Tag
  const handleAddSkillTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return
    e.preventDefault()
    const trimmed = newSkillTag.trim()
    if (trimmed && !skillsList.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkillsList([...skillsList, trimmed])
      setNewSkillTag('')
    }
  }

  // Handle Removing Skill Tag
  const handleRemoveSkillTag = (skillToRemove: string) => {
    setSkillsList(skillsList.filter(s => s !== skillToRemove))
  }

  useEffect(() => {
    fetchCandidates()
  }, [
    selectedRole,
    isCustomRole,
    skillsList,
    selectedBranch,
    selectedDegree,
    minCgpa,
    minTenth,
    minTwelfth,
    minInternships,
    hasProjects,
    hasAssessments,
    graduationYear,
    topLimit,
    sortBy
  ])

  const fetchCandidates = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('role', activeRole)
      if (skillsList.length > 0) {
        params.set('requiredSkills', skillsList.join(','))
      }
      if (selectedBranch !== 'all') params.set('branch', selectedBranch)
      if (selectedDegree !== 'all') params.set('degree', selectedDegree)
      if (minCgpa > 0) params.set('minCgpa', minCgpa.toString())
      if (minTenth > 0) params.set('minTenth', minTenth.toString())
      if (minTwelfth > 0) params.set('minTwelfth', minTwelfth.toString())
      if (minInternships > 0) params.set('minInternships', minInternships.toString())
      if (hasProjects) params.set('hasProjects', 'true')
      if (hasAssessments) params.set('hasAssessments', 'true')
      if (graduationYear !== 'all') params.set('graduationYear', graduationYear)
      params.set('topLimit', topLimit)
      params.set('sortBy', sortBy)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())

      const res = await fetch(`/api/company/candidates?${params.toString()}`)
      const data = await res.json()

      if (data.candidates) {
        setCandidates(data.candidates)
        setIneligibleCandidates(data.ineligibleCandidates || [])
        setTotalEligible(data.totalEligible || data.candidates.length)
        setTotalCount(data.totalCandidates || data.candidates.length)
        setHasHighMatches(data.hasHighMatches ?? true)
        if (data.scoringWeights) {
          setScoringWeights(data.scoringWeights)
        }
      }
    } catch (err) {
      console.error('Failed to fetch AI candidates:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchCandidates()
  }

  const handleRequestCandidate = async (candidate: CandidateCardData) => {
    setRequestingId(candidate.id)
    try {
      const res = await fetch(`/api/company/candidates/${candidate.id}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: activeRole,
          notes: `Candidate shortlisted directly from Candidate Intelligence recommendation for ${activeRole}.`
        })
      })

      const data = await res.json()
      if (res.ok) {
        // 1. Dispatch real-time notification to Company Portal inbox (Bell)
        dispatchPortalNotification({
          role: 'company',
          title: `✓ Shortlisted: ${candidate.name}`,
          message: `Candidate ${candidate.name} (${candidate.branch}) was shortlisted for ${activeRole}. Dossier added to your candidate pipeline.`,
          category: 'Candidate Shortlist',
          actionUrl: `/company/candidates/${candidate.id}?role=${encodeURIComponent(activeRole)}`,
          actionLabel: 'View Dossier',
          icon: 'target',
          color: '#10b981'
        })

        // 2. Dispatch real-time notification to Student Portal inbox
        dispatchPortalNotification({
          role: 'student',
          title: `⭐ Profile Shortlisted for ${activeRole}!`,
          message: `Congratulations! A technology partner company shortlisted your profile for the ${activeRole} position based on your verified skills & projects.`,
          category: 'Shortlist Alert',
          actionUrl: '/student/internships',
          actionLabel: 'View Shortlist',
          icon: 'placement',
          color: '#8b5cf6'
        })

        // 3. Dispatch real-time notification to Institution Placement Cell
        dispatchPortalNotification({
          role: 'institution',
          title: `🏢 Recruiter Shortlisted Student`,
          message: `Recruiter shortlisted student ${candidate.name} (${candidate.branch}) for the ${activeRole} recruitment drive.`,
          category: 'Placement Drive',
          actionUrl: '/institution/students',
          actionLabel: 'Student Directory',
          icon: 'resource',
          color: '#a855f7'
        })

        setToastMessage(`🔔 Notification Dispatched on Portal! "${candidate.name}" added to shortlist. Real-time alert delivered to your Notification Bell 🔔, Student & Placement Cell.`)
        setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, status: 'Requested' } : c))
      } else {
        alert(data.error || 'Failed to submit candidate request')
      }
    } catch (err) {
      console.error('Error submitting candidate request:', err)
      alert('An error occurred while submitting request.')
    } finally {
      setRequestingId(null)
      setTimeout(() => setToastMessage(null), 8000)
    }
  }

  const getInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'ST'
  }

  const getRankBadgeStyle = (rank?: number) => {
    if (rank === 1) return { bg: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: '1px solid #fbbf24', shadow: '0 0 12px rgba(245, 158, 11, 0.4)' }
    if (rank === 2) return { bg: 'linear-gradient(135deg, #94a3b8, #64748b)', color: '#fff', border: '1px solid #cbd5e1', shadow: '0 0 10px rgba(148, 163, 184, 0.3)' }
    if (rank === 3) return { bg: 'linear-gradient(135deg, #b45309, #78350f)', color: '#fff', border: '1px solid #d97706', shadow: '0 0 10px rgba(180, 83, 9, 0.3)' }
    return { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', shadow: 'none' }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10b981'
    if (score >= 75) return '#3b82f6'
    if (score >= 60) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className={styles.layout}>
      <CompanySidebar />
      <div className={styles.content}>
        {/* Top Header */}
        <header className={styles.header}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <Sparkles size={24} strokeWidth={2.2} color="#10b981" />
              <h1 className={styles.pageTitle}>Top Recommended Candidates</h1>
              <span className="badge badge-purple" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                AI-RANKED DISCOVERY
              </span>
            </div>
            <p className={styles.pageSubtitle}>
              AI-ranked candidates based on your job requirements. PlaceIQ analyzes all eligible students and surfaces the strongest candidates first.
            </p>
          </div>

          <div className={styles.headerActions}>
            <button
              onClick={() => setShowWeightsModal(true)}
              className="btn btn-ghost btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
            >
              <Info size={14} />
              <span>Scoring Weights</span>
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-ghost btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
            >
              <SlidersHorizontal size={14} strokeWidth={2} />
              <span>{showFilters ? 'Hide Filters' : 'Refine Cutoffs'}</span>
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

          {/* Section 1: Target Requirement Definition & Real-Time Skills Matcher */}
          <div className={`glass ${styles.panel}`} style={{ borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Briefcase size={18} strokeWidth={2} color="#10b981" />
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Active Job Requirement & Skills
                  </h2>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
                  Select a target role or customize required competencies. PlaceIQ re-evaluates all student evidence automatically.
                </p>
              </div>

              {/* Role Preset Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {PRESET_ROLES.map(role => (
                  <button
                    key={role}
                    onClick={() => handleSelectPresetRole(role)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
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
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: isCustomRole ? '1px solid #8b5cf6' : '1px solid var(--border)',
                    background: isCustomRole ? 'rgba(139, 92, 246, 0.15)' : 'var(--bg-secondary)',
                    color: isCustomRole ? '#a78bfa' : 'var(--text-secondary)'
                  }}
                >
                  + Custom Requirement
                </button>
              </div>
            </div>

            {/* Custom Role Input Box */}
            {isCustomRole && (
              <div style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Enter custom role title (e.g. Embedded Firmware Engineer, Cloud Security Architect)..."
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
              </div>
            )}

            {/* Required Skills Tag Editor */}
            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Required Skills:</span>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                {skillsList.map(skill => (
                  <span
                    key={skill}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#34d399',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}
                  >
                    <span>{skill}</span>
                    <button
                      onClick={() => handleRemoveSkillTag(skill)}
                      style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="text"
                    placeholder="+ Add Skill..."
                    value={newSkillTag}
                    onChange={(e) => setNewSkillTag(e.target.value)}
                    onKeyDown={handleAddSkillTag}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px dashed var(--border)',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      fontSize: '0.78rem',
                      width: '110px'
                    }}
                  />
                  {newSkillTag.trim() && (
                    <button
                      onClick={handleAddSkillTag}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '2px 6px', fontSize: '0.72rem' }}
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Top Talent Scope Selector & Secondary Cutoffs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            {/* Tab Controls: Top Eligible vs Ineligible */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => setActiveTab('eligible')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: activeTab === 'eligible' ? '1px solid #10b981' : '1px solid var(--border)',
                  background: activeTab === 'eligible' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)',
                  color: activeTab === 'eligible' ? '#34d399' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Trophy size={15} color={activeTab === 'eligible' ? '#10b981' : 'var(--text-muted)'} />
                <span>Top Recommended ({totalEligible})</span>
              </button>

              <button
                onClick={() => setActiveTab('ineligible')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: activeTab === 'ineligible' ? '1px solid #ef4444' : '1px solid var(--border)',
                  background: activeTab === 'ineligible' ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-card)',
                  color: activeTab === 'ineligible' ? '#fca5a5' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <AlertCircle size={15} color={activeTab === 'ineligible' ? '#ef4444' : 'var(--text-muted)'} />
                <span>Ineligible ({ineligibleCandidates.length})</span>
              </button>
            </div>

            {/* Top Talent Scope Filter Buttons */}
            {activeTab === 'eligible' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Surface Talent:</span>
                <div style={{ display: 'inline-flex', padding: '3px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  {(['5', '10', '25', 'all'] as const).map(limit => (
                    <button
                      key={limit}
                      onClick={() => setTopLimit(limit)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '7px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: 'none',
                        background: topLimit === limit ? '#10b981' : 'transparent',
                        color: topLimit === limit ? '#ffffff' : 'var(--text-secondary)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {limit === 'all' ? 'All Eligible' : `Top ${limit}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Collapsible Secondary Filters & Academic Cutoffs */}
          {showFilters && (
            <div className={`glass ${styles.panel}`} style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {/* Branch Cutoff */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Branch Cutoff
                  </label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="form-select"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: '#0e131f',
                      color: '#f8fafc',
                      fontSize: '0.88rem',
                      colorScheme: 'dark'
                    }}
                  >
                    {BRANCH_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value} style={{ background: '#0e131f', color: '#f8fafc' }}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Min CGPA Cutoff */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Min CGPA: <strong style={{ color: '#10b981' }}>{minCgpa > 0 ? `${minCgpa.toFixed(1)} CGPA` : 'Any'}</strong>
                  </label>
                  <select
                    value={minCgpa.toString()}
                    onChange={(e) => setMinCgpa(parseFloat(e.target.value))}
                    className="form-select"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: '#0e131f',
                      color: '#f8fafc',
                      fontSize: '0.88rem',
                      colorScheme: 'dark'
                    }}
                  >
                    <option value="0" style={{ background: '#0e131f', color: '#f8fafc' }}>No Cutoff (All CGPAs)</option>
                    <option value="6.0" style={{ background: '#0e131f', color: '#f8fafc' }}>6.0+ CGPA</option>
                    <option value="7.0" style={{ background: '#0e131f', color: '#f8fafc' }}>7.0+ CGPA</option>
                    <option value="7.5" style={{ background: '#0e131f', color: '#f8fafc' }}>7.5+ CGPA</option>
                    <option value="8.0" style={{ background: '#0e131f', color: '#f8fafc' }}>8.0+ CGPA</option>
                    <option value="8.5" style={{ background: '#0e131f', color: '#f8fafc' }}>8.5+ CGPA</option>
                  </select>
                </div>

                {/* Min 10th % Cutoff */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Min 10th Marks: <strong style={{ color: '#10b981' }}>{minTenth > 0 ? `${minTenth}%` : 'Any'}</strong>
                  </label>
                  <select
                    value={minTenth.toString()}
                    onChange={(e) => setMinTenth(parseFloat(e.target.value))}
                    className="form-select"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: '#0e131f',
                      color: '#f8fafc',
                      fontSize: '0.88rem',
                      colorScheme: 'dark'
                    }}
                  >
                    <option value="0" style={{ background: '#0e131f', color: '#f8fafc' }}>No Cutoff</option>
                    <option value="60" style={{ background: '#0e131f', color: '#f8fafc' }}>60%+ in 10th</option>
                    <option value="70" style={{ background: '#0e131f', color: '#f8fafc' }}>70%+ in 10th</option>
                    <option value="80" style={{ background: '#0e131f', color: '#f8fafc' }}>80%+ in 10th</option>
                  </select>
                </div>

                {/* Min 12th % Cutoff */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Min 12th Marks: <strong style={{ color: '#10b981' }}>{minTwelfth > 0 ? `${minTwelfth}%` : 'Any'}</strong>
                  </label>
                  <select
                    value={minTwelfth.toString()}
                    onChange={(e) => setMinTwelfth(parseFloat(e.target.value))}
                    className="form-select"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: '#0e131f',
                      color: '#f8fafc',
                      fontSize: '0.88rem',
                      colorScheme: 'dark'
                    }}
                  >
                    <option value="0" style={{ background: '#0e131f', color: '#f8fafc' }}>No Cutoff</option>
                    <option value="60" style={{ background: '#0e131f', color: '#f8fafc' }}>60%+ in 12th</option>
                    <option value="70" style={{ background: '#0e131f', color: '#f8fafc' }}>70%+ in 12th</option>
                    <option value="80" style={{ background: '#0e131f', color: '#f8fafc' }}>80%+ in 12th</option>
                  </select>
                </div>
              </div>

              {/* Toggles & Sort Options */}
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
                    <span>Verified Assessment Activity</span>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Sort Candidates:</span>
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="form-select"
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: '#0e131f',
                      color: '#f8fafc',
                      fontSize: '0.84rem',
                      colorScheme: 'dark'
                    }}
                  >
                    <option value="match" style={{ background: '#0e131f', color: '#f8fafc' }}>AI Match Score (Highest First)</option>
                    <option value="cgpa" style={{ background: '#0e131f', color: '#f8fafc' }}>Highest Academic CGPA</option>
                    <option value="sources" style={{ background: '#0e131f', color: '#f8fafc' }}>Most Verified Skill Evidence</option>
                    <option value="experience" style={{ background: '#0e131f', color: '#f8fafc' }}>Internship Experience</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Live Search Bar & Active Stats */}
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
              Showing <strong style={{ color: '#10b981' }}>{activeTab === 'eligible' ? candidates.length : ineligibleCandidates.length}</strong> {activeTab === 'eligible' ? 'top recommended candidates' : 'ineligible candidates'} for <strong>{activeRole}</strong>
            </div>
          </div>

          {/* Low Match Alert State */}
          {activeTab === 'eligible' && !loading && candidates.length > 0 && !hasHighMatches && (
            <div style={{
              padding: '16px 20px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <AlertCircle size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: '0.95rem', display: 'block', color: '#f59e0b' }}>
                  No highly matched candidates found (&gt;70%)
                </strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Displaying closest matches below along with identified skill gaps. You can adjust the required skill set or relax academic cutoffs to expand the candidate pool.
                </span>
              </div>
            </div>
          )}

          {/* Section 4: AI Ranked Candidate Grid */}
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <MorphingInfinity className="size-16" style={{ width: '64px', height: '64px', color: '#10b981' }} />
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                Evaluating student profiles and multi-dimensional intelligence evidence...
              </p>
            </div>
          ) : activeTab === 'eligible' && candidates.length === 0 ? (
            <div className={`glass ${styles.panel}`} style={{ textAlign: 'center', padding: '50px 20px' }}>
              <AlertCircle size={36} strokeWidth={1.5} color="#f59e0b" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>No Candidates Match Active Eligibility Requirements</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '8px auto 16px' }}>
                Try relaxing the CGPA threshold, expanding branch selections, or modifying required skills.
              </p>
              <button
                onClick={() => {
                  setSelectedBranch('all')
                  setMinCgpa(0)
                  setMinTenth(0)
                  setMinTwelfth(0)
                  setMinInternships(0)
                  setHasAssessments(false)
                  setHasProjects(false)
                  setSearchQuery('')
                  setTopLimit('10')
                }}
                className="btn btn-primary btn-sm"
              >
                Reset All Cutoffs
              </button>
            </div>
          ) : activeTab === 'ineligible' && ineligibleCandidates.length === 0 ? (
            <div className={`glass ${styles.panel}`} style={{ textAlign: 'center', padding: '50px 20px' }}>
              <CheckCircle2 size={36} strokeWidth={1.5} color="#10b981" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>All Candidates Meet Eligibility Cutoffs</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '8px auto 0' }}>
                Every student in the database currently meets all specified academic and discipline requirements.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px' }}>
              {(activeTab === 'eligible' ? candidates : ineligibleCandidates).map((candidate) => {
                const isRequested = candidate.status === 'Requested'
                const rankStyle = getRankBadgeStyle(candidate.rank)
                const scoreColor = getScoreColor(candidate.jobMatchScore)

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
                      border: candidate.rank === 1 ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid var(--border)',
                      background: candidate.rank === 1 ? 'linear-gradient(180deg, rgba(245, 158, 11, 0.05), rgba(255, 255, 255, 0.02))' : undefined,
                      transition: 'transform 0.2s ease, border-color 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    {/* Top Row: Rank Badge, Candidate Info & Match Score */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {/* Rank Badge */}
                        {candidate.rank && (
                          <div
                            style={{
                              padding: '4px 10px',
                              borderRadius: '8px',
                              fontSize: '0.85rem',
                              fontWeight: 800,
                              background: rankStyle.bg,
                              color: rankStyle.color,
                              border: rankStyle.border,
                              boxShadow: rankStyle.shadow,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              flexShrink: 0
                            }}
                          >
                            <Trophy size={13} />
                            <span>#{candidate.rank}</span>
                          </div>
                        )}

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 style={{ fontSize: '1.08rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                              {candidate.name}
                            </h3>
                            {isRequested && (
                              <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                                Shortlisted ✓
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                            {candidate.branch} • {candidate.institutionName}
                          </p>
                        </div>
                      </div>

                      {/* Match Score Display */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', justifyContent: 'flex-end' }}>
                          <span style={{ fontSize: '1.45rem', fontWeight: 900, color: scoreColor, fontFamily: 'Outfit, sans-serif' }}>
                            {candidate.jobMatchScore}%
                          </span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>MATCH</span>
                        </div>

                        <button
                          onClick={() => setActiveBreakdownCandidate(candidate)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#a78bfa',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: 0,
                            textDecoration: 'underline',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                            marginLeft: 'auto'
                          }}
                        >
                          <BarChart3 size={11} />
                          <span>View Breakdown</span>
                        </button>
                      </div>
                    </div>

                    {/* Hard Ineligibility Banner (If Ineligible) */}
                    {!candidate.isAcademicallyEligible && candidate.ineligibleReasons && (
                      <div style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        fontSize: '0.78rem',
                        color: '#fca5a5'
                      }}>
                        <strong>❌ Not Eligible:</strong> {candidate.ineligibleReasons.join(' • ')}
                      </div>
                    )}

                    {/* AI Match DNA / Dimensional Equalizer Gauges */}
                    <div style={{
                      padding: '11px 13px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <SlidersHorizontal size={12} color="#10b981" />
                          <span>Match DNA Index</span>
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700, background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                          {candidate.evidenceStrength || 'Strong Evidence'}
                        </span>
                      </div>

                      {/* 4-Column Mini Equalizer Gauges */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                        {/* Skills */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                            <span>Skills</span>
                            <strong style={{ color: '#34d399' }}>{candidate.matchBreakdown?.skillScore || 0}/{candidate.matchBreakdown?.maxSkillScore || 35}</strong>
                          </div>
                          <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.round(((candidate.matchBreakdown?.skillScore || 0) / (candidate.matchBreakdown?.maxSkillScore || 35)) * 100)}%`, background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: '2px' }} />
                          </div>
                        </div>

                        {/* Role */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                            <span>Role</span>
                            <strong style={{ color: '#a78bfa' }}>{candidate.matchBreakdown?.roleRelevanceScore || 0}/{candidate.matchBreakdown?.maxRoleRelevanceScore || 20}</strong>
                          </div>
                          <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.round(((candidate.matchBreakdown?.roleRelevanceScore || 0) / (candidate.matchBreakdown?.maxRoleRelevanceScore || 20)) * 100)}%`, background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)', borderRadius: '2px' }} />
                          </div>
                        </div>

                        {/* Academics */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                            <span>Academics</span>
                            <strong style={{ color: '#38bdf8' }}>{candidate.matchBreakdown?.academicScore || 0}/{candidate.matchBreakdown?.maxAcademicScore || 15}</strong>
                          </div>
                          <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.round(((candidate.matchBreakdown?.academicScore || 0) / (candidate.matchBreakdown?.maxAcademicScore || 15)) * 100)}%`, background: 'linear-gradient(90deg, #0ea5e9, #38bdf8)', borderRadius: '2px' }} />
                          </div>
                        </div>

                        {/* Projects */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                            <span>Projects</span>
                            <strong style={{ color: '#fbbf24' }}>{candidate.matchBreakdown?.projectScore || 0}/{candidate.matchBreakdown?.maxProjectScore || 10}</strong>
                          </div>
                          <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.round(((candidate.matchBreakdown?.projectScore || 0) / (candidate.matchBreakdown?.maxProjectScore || 10)) * 100)}%`, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', borderRadius: '2px' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Signal Highlights Grid (Bento Intelligence Deck) */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '8px'
                    }}>
                      {(candidate.aiSignals && candidate.aiSignals.length > 0 ? candidate.aiSignals : [
                        { id: '1', title: `${Math.round((candidate.requiredSkillsSupportedCount / Math.max(1, candidate.totalRequiredSkillsCount)) * 100)}% Skill Fit`, subtitle: `${candidate.requiredSkillsSupportedCount}/${candidate.totalRequiredSkillsCount} Core Skills`, tag: 'Skills', iconType: 'zap', theme: 'emerald' },
                        { id: '2', title: candidate.relevantProjects?.[0]?.title || 'Domain Projects', subtitle: `${candidate.relevantProjectsCount} Projects on record`, tag: 'Projects', iconType: 'code', theme: 'violet' },
                        { id: '3', title: `${candidate.cgpa.toFixed(2)} CGPA`, subtitle: 'Verified Academic Record', tag: 'Academics', iconType: 'shield', theme: 'blue' },
                        { id: '4', title: `${candidate.internshipsCount} Internship${candidate.internshipsCount === 1 ? '' : 's'}`, subtitle: 'Hands-on Experience', tag: 'Experience', iconType: 'briefcase', theme: 'cyan' }
                      ]).map((signal: any, idx: number) => {
                        const themeColors: Record<string, { bg: string; border: string; iconColor: string; tagBg: string; tagColor: string }> = {
                          emerald: { bg: 'rgba(16, 185, 129, 0.06)', border: 'rgba(16, 185, 129, 0.22)', iconColor: '#34d399', tagBg: 'rgba(16, 185, 129, 0.15)', tagColor: '#34d399' },
                          violet: { bg: 'rgba(139, 92, 246, 0.06)', border: 'rgba(139, 92, 246, 0.22)', iconColor: '#a78bfa', tagBg: 'rgba(139, 92, 246, 0.15)', tagColor: '#c4b5fd' },
                          amber: { bg: 'rgba(245, 158, 11, 0.06)', border: 'rgba(245, 158, 11, 0.22)', iconColor: '#fbbf24', tagBg: 'rgba(245, 158, 11, 0.15)', tagColor: '#fde68a' },
                          cyan: { bg: 'rgba(6, 182, 212, 0.06)', border: 'rgba(6, 182, 212, 0.22)', iconColor: '#22d3ee', tagBg: 'rgba(6, 182, 212, 0.15)', tagColor: '#a5f3fc' },
                          blue: { bg: 'rgba(59, 130, 246, 0.06)', border: 'rgba(59, 130, 246, 0.22)', iconColor: '#60a5fa', tagBg: 'rgba(59, 130, 246, 0.15)', tagColor: '#bfdbfe' }
                        }
                        const t = themeColors[signal.theme] || themeColors.emerald

                        return (
                          <div
                            key={signal.id || idx}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '8px',
                              background: t.bg,
                              border: `1px solid ${t.border}`,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px',
                              minWidth: 0
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px', color: t.tagColor, background: t.tagBg, padding: '1px 5px', borderRadius: '3px', whiteSpace: 'nowrap' }}>
                                {signal.tag}
                              </span>
                              {signal.iconType === 'zap' && <Zap size={11} color={t.iconColor} />}
                              {signal.iconType === 'code' && <Code2 size={11} color={t.iconColor} />}
                              {signal.iconType === 'award' && <Award size={11} color={t.iconColor} />}
                              {signal.iconType === 'shield' && <ShieldCheck size={11} color={t.iconColor} />}
                              {signal.iconType === 'briefcase' && <Briefcase size={11} color={t.iconColor} />}
                              {signal.iconType === 'star' && <Star size={11} color={t.iconColor} />}
                              {signal.iconType === 'sparkles' && <Sparkles size={11} color={t.iconColor} />}
                            </div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={signal.title}>
                              {signal.title}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={signal.subtitle}>
                              {signal.subtitle}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Verified Academic Badges */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '8px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid var(--border)',
                      fontSize: '0.8rem'
                    }}>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>10th Marks</div>
                        <div style={{ fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>{candidate.tenthMarks ? `${candidate.tenthMarks.toFixed(1)}%` : 'N/A'}</span>
                          <CheckCheck size={13} strokeWidth={2.5} color="#10b981" />
                        </div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>12th Marks</div>
                        <div style={{ fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>{candidate.twelfthMarks ? `${candidate.twelfthMarks.toFixed(1)}%` : 'N/A'}</span>
                          <CheckCheck size={13} strokeWidth={2.5} color="#10b981" />
                        </div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>CGPA</div>
                        <div style={{ fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>{candidate.cgpa.toFixed(2)}</span>
                          <ShieldCheck size={13} strokeWidth={2.5} color="#10b981" />
                        </div>
                      </div>
                    </div>

                    {/* Source-Backed Skills Chips */}
                    <div>
                      <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Verified Skills & Proficiency
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {candidate.topSkills.map((sk) => (
                          <div
                            key={sk.skill}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              background: sk.sourceCount > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                              border: sk.sourceCount > 0 ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border)',
                              fontSize: '0.78rem'
                            }}
                          >
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{sk.skill}</span>
                            {sk.actualAssessmentScore && (
                              <span style={{ fontSize: '0.66rem', fontWeight: 700, color: '#34d399', background: 'rgba(16, 185, 129, 0.2)', padding: '1px 4px', borderRadius: '4px' }}>
                                {sk.actualAssessmentScore}%
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Suite */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '6px' }}>
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
                            <span>Shortlisted</span>
                          </>
                        ) : (
                          <>
                            <Send size={14} strokeWidth={2} />
                            <span>Shortlist</span>
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

      {/* Dimensional Score Breakdown Modal */}
      {activeBreakdownCandidate && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setActiveBreakdownCandidate(null)}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '540px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {activeBreakdownCandidate.name}
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  Multi-Dimensional Match Score: <strong style={{ color: '#10b981', fontSize: '1.1rem' }}>{activeBreakdownCandidate.jobMatchScore}%</strong>
                </p>
              </div>
              <button
                onClick={() => setActiveBreakdownCandidate(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Dimensional Score Meters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Skill Match & Proficiency', score: activeBreakdownCandidate.matchBreakdown.skillScore, max: 35, color: '#10b981' },
                { label: 'Role & Job Relevance', score: activeBreakdownCandidate.matchBreakdown.roleRelevanceScore, max: 20, color: '#3b82f6' },
                { label: 'Verified Academic Standing', score: activeBreakdownCandidate.matchBreakdown.academicScore, max: 15, color: '#8b5cf6' },
                { label: 'Projects & Experience', score: activeBreakdownCandidate.matchBreakdown.projectScore, max: 10, color: '#f59e0b' },
                { label: 'Education & Branch Alignment', score: activeBreakdownCandidate.matchBreakdown.educationScore, max: 10, color: '#06b6d4' },
                { label: 'Relevant Certifications', score: activeBreakdownCandidate.matchBreakdown.certificationScore, max: 5, color: '#ec4899' },
                { label: 'Profile Completeness', score: activeBreakdownCandidate.matchBreakdown.profileScore, max: 5, color: '#6366f1' }
              ].map(dim => (
                <div key={dim.label} style={{ fontSize: '0.84rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{dim.label}</span>
                    <span style={{ fontWeight: 700, color: dim.color }}>{dim.score} / {dim.max} pts</span>
                  </div>
                  <div style={{ height: '7px', width: '100%', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(dim.score / dim.max) * 100}%`, background: dim.color, borderRadius: '4px' }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Total Aggregated Score</span>
              <span style={{ fontWeight: 900, fontSize: '1.2rem', color: '#10b981' }}>{activeBreakdownCandidate.matchBreakdown.totalScore} / 100 pts</span>
            </div>

            <button
              onClick={() => setActiveBreakdownCandidate(null)}
              className="btn btn-ghost btn-sm"
              style={{ width: '100%' }}
            >
              Close Breakdown
            </button>
          </div>
        </div>
      )}

      {/* Scoring Weights Information Modal */}
      {showWeightsModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowWeightsModal(false)}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '520px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="#10b981" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Candidate Intelligence Weights</h3>
              </div>
              <button
                onClick={() => setShowWeightsModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
              PlaceIQ utilizes an explainable 7-dimensional matching engine to rank candidates. Academic marks act as an eligibility filter and ranking signal, but cannot overpower missing technical skills.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { title: 'Skill Match & Proficiency', weight: '35%', desc: 'Semantic normalization, proficiency levels, and platform benchmarks.' },
                { title: 'Role & Job Relevance', weight: '20%', desc: 'Alignment with target role title and domain keywords.' },
                { title: 'Academic Eligibility', weight: '15%', desc: 'Verified 10th %, 12th %, and CGPA from official marksheets.' },
                { title: 'Projects & Experience', weight: '10%', desc: 'Tech stack alignment in capstone and domain projects.' },
                { title: 'Education / Branch Match', weight: '10%', desc: 'Discipline alignment (Computer Engineering, IT, etc.).' },
                { title: 'Verified Certifications', weight: '5%', desc: 'Domain-relevant digital certifications.' },
                { title: 'Profile Completeness', weight: '5%', desc: 'Document verification status and platform readiness.' }
              ].map(item => (
                <div key={item.title} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--text-primary)' }}>{item.title}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{item.desc}</div>
                  </div>
                  <span style={{ fontWeight: 800, color: '#10b981', fontSize: '0.9rem' }}>{item.weight}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowWeightsModal(false)}
              className="btn btn-primary btn-sm"
              style={{ width: '100%' }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
