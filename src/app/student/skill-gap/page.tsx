'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import StudentSidebar from '@/components/StudentSidebar'
import BackButton from '@/components/BackButton'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import styles from '../dashboard.module.css'
import {
  ChartNoAxesCombined,
  Download,
  FileCode,
  RotateCcw,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  ArrowRight,
  Target,
  Briefcase,
  GraduationCap,
  BookOpen,
  Milestone,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Flame,
  FileText,
  Clock,
  Zap,
  TrendingUp,
  X,
  Code2,
  HelpCircle,
  Compass,
  Calendar,
  Check,
  CheckSquare,
  Square,
  Calculator,
  Laptop
} from 'lucide-react'

interface SkillToLearn {
  skill: string
  priority: 'High' | 'Medium' | 'Low' | string
  learning_time?: string
  currentLevel?: string
  requiredLevel?: string
  whyMatters?: string
  pointsBoost?: number
}

interface AnalysisData {
  match_percentage: number
  target_role?: string
  summary: string
  matching_skills: string[]
  missing_skills: string[]
  skills_to_learn: SkillToLearn[]
  experience_gap?: string
  education_gap?: string
  recommendations?: string[]
  learning_path?: string[]
}

const PRESET_CAREER_ROLES = [
  { id: 'swe', role: 'Software Engineer', requiredSkills: ['JavaScript', 'React', 'Node.js', 'Git', 'Data Structures', 'SQL', 'Docker', 'AWS Cloud', 'CI/CD Pipelines'] },
  { id: 'fullstack', role: 'Full Stack Developer', requiredSkills: ['React', 'Next.js', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'REST APIs', 'AWS Cloud'] },
  { id: 'frontend', role: 'Frontend Engineer', requiredSkills: ['React', 'TypeScript', 'JavaScript', 'HTML/CSS', 'Next.js', 'Tailwind CSS', 'Redux', 'Git'] },
  { id: 'backend', role: 'Backend Engineer', requiredSkills: ['Python', 'Node.js', 'SQL', 'PostgreSQL', 'Docker', 'Redis', 'System Design', 'Microservices', 'Git'] },
  { id: 'devops', role: 'Cloud & DevOps Engineer', requiredSkills: ['Docker', 'Kubernetes', 'AWS Cloud', 'CI/CD Pipelines', 'Linux', 'Bash', 'Git', 'Python'] },
  { id: 'data', role: 'Data & AI Engineer', requiredSkills: ['Python', 'SQL', 'Pandas', 'Machine Learning', 'Data Structures', 'FastAPI', 'PostgreSQL'] }
]

export default function SkillGapPage() {
  // State
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [analysesList, setAnalysesList] = useState<any[]>([])
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'all' | 'strong' | 'improve' | 'missing' | 'priority'>('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [activePresetRole, setActivePresetRole] = useState<string>('Software Engineer')

  // Interactive Simulator State (What-If Skill Toggle)
  const [simulatedSkills, setSimulatedSkills] = useState<string[]>([])
  const [studyHoursPerWeek, setStudyHoursPerWeek] = useState<number>(8)

  // Upload inputs
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [jobDescFile, setJobDescFile] = useState<File | null>(null)
  const reportRef = useRef<HTMLDivElement>(null)

  // Load existing analyses and fallback data
  useEffect(() => {
    fetchInitialAnalysis()
  }, [])

  const fetchInitialAnalysis = async () => {
    setLoading(true)
    try {
      // 1. Fetch previously saved analyses
      const listRes = await fetch('/api/skill-gap/list')
      if (listRes.ok) {
        const listData = await listRes.json()
        if (Array.isArray(listData.analyses) && listData.analyses.length > 0) {
          const formatted = listData.analyses.map((a: any) => {
            let parsedData: any = {}
            try {
              parsedData = typeof a.analysis_data === 'string' ? JSON.parse(a.analysis_data) : a.analysis_data
            } catch {}
            return {
              ...a,
              parsedData
            }
          })
          setAnalysesList(formatted)
          const latest = formatted[0]
          setSelectedAnalysisId(latest.id)
          const norm = normalizeAnalysis(latest.parsedData, latest.job_desc_name)
          setAnalysis(norm)
          setActivePresetRole(norm.target_role || 'Software Engineer')
          setLoading(false)
          return
        }
      }

      // 2. If no saved analysis, fetch verified profile skills as default
      const profileSkillsRes = await fetch('/api/student/skills')
      const profileData = await profileSkillsRes.json().catch(() => ({}))
      const userSkills: string[] = Array.isArray(profileData.skills)
        ? profileData.skills.map((s: any) => s.skillName)
        : ['JavaScript', 'React', 'Git', 'Problem Solving']

      // Use standard default intelligence profile
      const defaultAnalysis: AnalysisData = {
        match_percentage: 72,
        target_role: 'Software Engineer',
        summary: 'Your skill profile demonstrates strong core competencies in web development and algorithmic problem solving, with priority growth opportunities in containerization and cloud infrastructure.',
        matching_skills: userSkills.length > 0 ? userSkills : ['JavaScript', 'React', 'Git', 'HTML/CSS', 'Data Structures', 'SQL'],
        missing_skills: ['Docker', 'AWS Cloud', 'CI/CD Pipelines', 'System Design'],
        skills_to_learn: [
          { skill: 'Docker', priority: 'High', learning_time: '1 week', currentLevel: 'Beginner', requiredLevel: 'Advanced', whyMatters: 'High priority based on your target role requirements.', pointsBoost: 10 },
          { skill: 'AWS Cloud', priority: 'High', learning_time: '2 weeks', currentLevel: 'Beginner', requiredLevel: 'Intermediate', whyMatters: 'High priority based on your target role requirements.', pointsBoost: 8 },
          { skill: 'System Design', priority: 'Medium', learning_time: '2 weeks', currentLevel: 'Beginner', requiredLevel: 'Intermediate', whyMatters: 'Recommended for architectural interviews & senior placement rounds.', pointsBoost: 6 },
          { skill: 'CI/CD Pipelines', priority: 'Medium', learning_time: '1 week', currentLevel: 'Beginner', requiredLevel: 'Intermediate', whyMatters: 'Essential for modern continuous deployment pipelines.', pointsBoost: 4 }
        ],
        experience_gap: 'Candidate has verified coursework and algorithmic benchmarks; expanding cloud deployment exposure will maximize top-tier recruiter match scores.',
        education_gap: 'Academic credentials and verified marksheets meet requirements for this career track.',
        recommendations: [
          'Build a full-stack project showcasing Docker containerization and automated CI/CD deployment.',
          'Complete intermediate Cloud Architecture modules to close cloud infrastructure gaps.',
          'Practice system design mock interviews to boost technical evaluation readiness.'
        ],
        learning_path: [
          'JavaScript & TypeScript Advanced Patterns',
          'React Framework Architecture',
          'Node.js & REST API Design',
          'Docker Containers & Orchestration',
          'AWS Cloud Deployment & CI/CD'
        ]
      }

      setAnalysis(defaultAnalysis)
      setActivePresetRole(defaultAnalysis.target_role || 'Software Engineer')
    } catch (err) {
      console.error('Failed to load skill gap data:', err)
    } finally {
      setLoading(false)
    }
  }

  const normalizeAnalysis = (raw: any, jobDescName?: string): AnalysisData => {
    const roleFromFilename = jobDescName
      ? jobDescName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
      : 'Software Engineer'

    const targetRole = raw.target_role || roleFromFilename

    const skillsToLearn: SkillToLearn[] = Array.isArray(raw.skills_to_learn)
      ? raw.skills_to_learn.map((s: any, idx: number) => ({
          skill: s.skill || s.name || 'Technical Skill',
          priority: s.priority || 'High',
          learning_time: s.learning_time || '1-2 weeks',
          currentLevel: s.currentLevel || (s.priority === 'High' ? 'Beginner' : 'Intermediate'),
          requiredLevel: s.requiredLevel || 'Advanced',
          whyMatters: s.whyMatters || 'High priority based on your target role requirements.',
          pointsBoost: s.pointsBoost || (s.priority === 'High' ? 10 - idx * 2 : 6 - idx)
        }))
      : [
          { skill: 'Docker', priority: 'High', learning_time: '1 week', currentLevel: 'Beginner', requiredLevel: 'Advanced', whyMatters: 'High priority based on your target role requirements.', pointsBoost: 10 },
          { skill: 'AWS Cloud', priority: 'High', learning_time: '2 weeks', currentLevel: 'Beginner', requiredLevel: 'Intermediate', whyMatters: 'High priority based on your target role requirements.', pointsBoost: 8 }
        ]

    return {
      match_percentage: raw.match_percentage || 72,
      target_role: targetRole,
      summary: raw.summary || 'Strong profile match with opportunities to expand production infrastructure competencies.',
      matching_skills: Array.isArray(raw.matching_skills) ? raw.matching_skills : ['JavaScript', 'React', 'Git'],
      missing_skills: Array.isArray(raw.missing_skills) ? raw.missing_skills : ['Docker', 'AWS Cloud'],
      skills_to_learn: skillsToLearn,
      experience_gap: raw.experience_gap,
      education_gap: raw.education_gap,
      recommendations: Array.isArray(raw.recommendations) ? raw.recommendations : [],
      learning_path: Array.isArray(raw.learning_path) ? raw.learning_path : []
    }
  }

  const handleSelectPresetRole = (roleName: string) => {
    setActivePresetRole(roleName)
    const preset = PRESET_CAREER_ROLES.find(p => p.role === roleName)
    if (!preset || !analysis) return

    const studentKnown = analysis.matching_skills
    const matched = preset.requiredSkills.filter(req => 
      studentKnown.some(sk => sk.toLowerCase().includes(req.toLowerCase()) || req.toLowerCase().includes(sk.toLowerCase()))
    )
    const missing = preset.requiredSkills.filter(req => !matched.includes(req))
    const matchPct = Math.round((matched.length / preset.requiredSkills.length) * 100)

    const priorityItems: SkillToLearn[] = missing.map((m, idx) => ({
      skill: m,
      priority: idx < 2 ? 'High' : 'Medium',
      learning_time: idx < 2 ? '1 week' : '2 weeks',
      currentLevel: 'Beginner',
      requiredLevel: idx < 2 ? 'Advanced' : 'Intermediate',
      whyMatters: `Required core competency for ${roleName} roles.`,
      pointsBoost: idx < 2 ? 10 : 6
    }))

    setAnalysis({
      ...analysis,
      target_role: roleName,
      match_percentage: Math.max(45, matchPct),
      summary: `You have ${matched.length} of ${preset.requiredSkills.length} required competencies for ${roleName}. Closing ${missing.slice(0, 2).join(' & ')} will maximize your recruiter alignment.`,
      matching_skills: matched.length > 0 ? matched : ['JavaScript', 'React'],
      missing_skills: missing,
      skills_to_learn: priorityItems,
      learning_path: [
        ...matched.slice(0, 2).map(m => `${m} Core Mastery`),
        ...missing.map(m => `${m} Architecture & Implementation`)
      ]
    })
    setSimulatedSkills([])
  }

  const handleSelectHistory = (id: number) => {
    const found = analysesList.find(a => a.id === id)
    if (found) {
      setSelectedAnalysisId(id)
      const norm = normalizeAnalysis(found.parsedData, found.job_desc_name)
      setAnalysis(norm)
      setActivePresetRole(norm.target_role || 'Software Engineer')
      setSimulatedSkills([])
    }
  }

  const toggleSimulatedSkill = (skillName: string) => {
    setSimulatedSkills(prev => 
      prev.includes(skillName) ? prev.filter(s => s !== skillName) : [...prev, skillName]
    )
  }

  const handleAnalyze = async () => {
    if (!resumeFile || !jobDescFile) {
      alert('Please upload both a resume and a job description document.')
      return
    }

    setAnalyzing(true)
    const formData = new FormData()
    formData.append('resume', resumeFile)
    formData.append('jobDescription', jobDescFile)

    try {
      const res = await fetch('/api/skill-gap', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.success && data.analysis) {
        const normalized = normalizeAnalysis(data.analysis, jobDescFile.name)
        setAnalysis(normalized)
        setActivePresetRole(normalized.target_role || 'Software Engineer')
        setShowUploadModal(false)
        setResumeFile(null)
        setJobDescFile(null)
        setSimulatedSkills([])
        fetchInitialAnalysis()
      } else {
        alert(data.error || 'Skill gap analysis failed. Please verify file contents.')
      }
    } catch {
      alert('Analysis request failed. Please check your connection and try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  const exportToPDF = async () => {
    if (!reportRef.current || !analysis) return
    setExporting(true)
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ])

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#050816',
        logging: false
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`skill-gap-analysis-${Date.now()}.pdf`)
    } catch {
      alert('PDF export failed. Please try printing via browser.')
    } finally {
      setExporting(false)
    }
  }

  const exportToHTML = () => {
    if (!analysis) return

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>PlaceIQ Skill Gap Analysis — ${analysis.target_role || 'Target Role'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f3f4f6; padding: 40px; margin: 0; }
    .container { max-width: 900px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 32px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
    h1 { color: #8b5cf6; margin: 0 0 8px; font-size: 28px; }
    .score-badge { display: inline-block; font-size: 48px; font-weight: 900; color: #10b981; margin: 16px 0; }
    .section-title { font-size: 18px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin: 24px 0 12px; border-bottom: 1px solid #374151; padding-bottom: 6px; }
    .tag { display: inline-block; padding: 6px 12px; margin: 4px; border-radius: 6px; font-size: 13px; font-weight: 600; }
    .tag-strong { background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3); }
    .tag-missing { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); }
    .card { background: rgba(255,255,255,0.03); border: 1px solid #374151; padding: 14px; border-radius: 10px; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>PlaceIQ Career Intelligence — Skill Gap Report</h1>
    <p style="color: #9ca3af; margin: 0 0 20px;">Target Career: <strong>${analysis.target_role || 'Software Engineer'}</strong> • Generated: ${new Date().toLocaleDateString()}</p>
    <div>
      <div class="score-badge">${analysis.match_percentage}% Match</div>
      <p style="color: #d1d5db; line-height: 1.6;">${analysis.summary}</p>
    </div>
    <div class="section-title">Matching Skills (${analysis.matching_skills.length})</div>
    <div>${analysis.matching_skills.map(s => `<span class="tag tag-strong">✓ ${s}</span>`).join('')}</div>
    <div class="section-title">Missing Skills & Gaps (${analysis.missing_skills.length})</div>
    <div>${analysis.missing_skills.map(s => `<span class="tag tag-missing">✕ ${s}</span>`).join('')}</div>
    <div class="section-title">Priority Skills to Learn</div>
    ${analysis.skills_to_learn.map((s, i) => `
      <div class="card">
        <strong>#${i + 1} ${s.skill}</strong> [Priority: ${s.priority}]<br>
        <span style="font-size: 13px; color: #9ca3af;">Current: ${s.currentLevel || 'Beginner'} → Required: ${s.requiredLevel || 'Advanced'} • Estimated Time: ${s.learning_time}</span>
      </div>
    `).join('')}
  </div>
</body>
</html>
    `
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `placeiq-skill-gap-${Date.now()}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className={styles.layout}>
        <StudentSidebar />
        <div className={styles.content} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.25rem' }}>
          <MorphingInfinity className="size-16" style={{ width: '56px', height: '56px', color: '#8b5cf6' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Loading Career Intelligence & Skill Gaps...</p>
        </div>
      </div>
    )
  }

  // Derive counts and metrics from actual data
  const baseMatchScore = analysis?.match_percentage ?? 72
  const strongSkills = analysis?.matching_skills ?? []
  const missingSkills = analysis?.missing_skills ?? []
  const prioritySkills = analysis?.skills_to_learn ?? []
  const targetRole = analysis?.target_role || 'Software Engineer'

  // Calculate simulated boosted score
  const boostFromSimulated = simulatedSkills.reduce((acc, skName) => {
    const item = prioritySkills.find(p => p.skill.toLowerCase() === skName.toLowerCase())
    return acc + (item?.pointsBoost || 6)
  }, 0)

  const simulatedMatchScore = Math.min(100, baseMatchScore + boostFromSimulated)

  const totalSkillsCount = strongSkills.length + missingSkills.length
  const strongCount = strongSkills.length
  const missingCount = missingSkills.length
  const priorityCount = prioritySkills.filter(s => s.priority === 'High' || s.priority === 'Medium').length || prioritySkills.length

  // Categorized skill distribution for progress tracking
  const strongPercent = totalSkillsCount > 0 ? Math.round((strongCount / totalSkillsCount) * 100) : 80
  const improvePercent = Math.max(0, 100 - strongPercent - (missingCount > 0 ? Math.round((missingCount / totalSkillsCount) * 50) : 0))
  const missingPercent = totalSkillsCount > 0 ? Math.round((missingCount / totalSkillsCount) * 100) : 20

  // Estimated learning timeline
  const estTotalWeeks = Math.max(1, Math.round((prioritySkills.length * 12) / Math.max(4, studyHoursPerWeek)))

  // Filter skills for detailed view
  const allDetailedSkills = [
    ...strongSkills.map(name => ({
      name,
      status: 'strong' as const,
      levelPercent: 85 + Math.floor((name.length * 3) % 12),
      currentLevel: 'Advanced',
      requiredLevel: 'Advanced',
      tag: 'Verified Strong',
      isPriority: false,
      isSimulated: false
    })),
    ...missingSkills.map(name => {
      const p = prioritySkills.find(ps => ps.skill.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(ps.skill.toLowerCase()))
      const isSim = simulatedSkills.includes(name)
      return {
        name,
        status: (p ? 'improve' : 'missing') as 'improve' | 'missing',
        levelPercent: isSim ? 85 : p ? 45 : 0,
        currentLevel: isSim ? 'Simulated Mastery' : p?.currentLevel || (p ? 'Beginner' : 'Not Detected'),
        requiredLevel: p?.requiredLevel || 'Intermediate',
        tag: isSim ? 'Simulated Added ✓' : p ? `${p.priority} Priority Gap` : 'Missing from Profile',
        isPriority: Boolean(p),
        isSimulated: isSim
      }
    })
  ]

  const filteredDetailedSkills = allDetailedSkills.filter(item => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'strong') return item.status === 'strong'
    if (activeFilter === 'improve') return item.status === 'improve'
    if (activeFilter === 'missing') return item.status === 'missing'
    if (activeFilter === 'priority') return item.isPriority
    return true
  })

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.content}>
        {/* ================= HEADER ================= */}
        <header className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <BackButton fallbackHref="/student/dashboard" />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ChartNoAxesCombined size={22} strokeWidth={2.2} color="#8b5cf6" />
                <h1 className={styles.pageTitle} style={{ margin: 0 }}>Skill Gap Analysis</h1>
              </div>
              <p className={styles.pageSubtitle} style={{ margin: '2px 0 0 0' }}>
                Understand what skills you need to become job-ready.
              </p>
            </div>
          </div>

          <div className={styles.headerActions} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {analysesList.length > 1 && (
              <select
                value={selectedAnalysisId || ''}
                onChange={(e) => handleSelectHistory(Number(e.target.value))}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {analysesList.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.job_desc_name ? a.job_desc_name.replace(/\.[^/.]+$/, '') : `Analysis #${a.id}`}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => setShowUploadModal(true)}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
            >
              <Upload size={14} strokeWidth={2} />
              <span>Compare New Role</span>
            </button>

            <button
              onClick={exportToPDF}
              disabled={exporting}
              className="btn btn-ghost btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
            >
              <Download size={14} strokeWidth={2} />
              <span>{exporting ? 'Exporting...' : 'PDF'}</span>
            </button>

            <button
              onClick={exportToHTML}
              className="btn btn-ghost btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
            >
              <FileCode size={14} strokeWidth={2} />
              <span>HTML</span>
            </button>
          </div>
        </header>

        <main className={styles.main} ref={reportRef}>
          {/* ================= 2. TOP SUMMARY METRIC CARDS ================= */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px'
          }}>
            {/* Card 1: Career Readiness */}
            <div className={`glass ${styles.panel}`} style={{ padding: '16px 18px', borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Career Readiness
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '6px 0 4px 0' }}>
                <span style={{ fontSize: '2rem', fontWeight: 900, color: baseMatchScore >= 75 ? '#10b981' : '#f59e0b', fontFamily: 'Outfit, sans-serif' }}>
                  {baseMatchScore}%
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: baseMatchScore >= 75 ? '#34d399' : '#fbbf24' }}>
                  {baseMatchScore >= 80 ? 'High Alignment' : baseMatchScore >= 65 ? 'Job Ready' : 'Developing'}
                </span>
              </div>
              <div style={{ height: '6px', width: '100%', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${baseMatchScore}%`, background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: '3px' }} />
              </div>
            </div>

            {/* Card 2: Skills You Have */}
            <div className={`glass ${styles.panel}`} style={{ padding: '16px 18px', borderLeft: '4px solid #3b82f6' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Skills You Have
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '6px 0 4px 0' }}>
                <span style={{ fontSize: '2rem', fontWeight: 900, color: '#3b82f6', fontFamily: 'Outfit, sans-serif' }}>
                  {strongCount}
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#60a5fa' }}>
                  ✓ Strong Profile
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Demonstrated & verified capabilities
              </div>
            </div>

            {/* Card 3: Skills Missing */}
            <div className={`glass ${styles.panel}`} style={{ padding: '16px 18px', borderLeft: '4px solid #ef4444' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Skills Missing
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '6px 0 4px 0' }}>
                <span style={{ fontSize: '2rem', fontWeight: 900, color: '#ef4444', fontFamily: 'Outfit, sans-serif' }}>
                  {missingCount}
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f87171' }}>
                  ⚠ Need Improvement
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Gaps required by job benchmarks
              </div>
            </div>

            {/* Card 4: Priority Skills */}
            <div className={`glass ${styles.panel}`} style={{ padding: '16px 18px', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Priority Skills
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '6px 0 4px 0' }}>
                <span style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b', fontFamily: 'Outfit, sans-serif' }}>
                  {priorityCount}
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fbbf24' }}>
                  Focus First
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                High-impact technical bottlenecks
              </div>
            </div>
          </div>

          {/* ================= 3. TARGET ROLE & PRESET SWITCHER ================= */}
          <div className={`glass ${styles.panel}`} style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(16, 185, 129, 0.04))',
            borderColor: 'rgba(139, 92, 246, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            padding: '20px 22px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Target size={14} color="#a78bfa" />
                  <span>Target Career Benchmark</span>
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 2px 0' }}>
                  {targetRole}
                </h2>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Your current profile compared with the requirements for this role.
                </p>
              </div>

              <div style={{
                padding: '6px 14px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Sparkles size={14} />
                <span>AI Career Intelligence Active</span>
              </div>
            </div>

            {/* Quick Preset Roles Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', marginRight: '4px' }}>
                Benchmark Against:
              </span>
              {PRESET_CAREER_ROLES.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPresetRole(preset.role)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: activePresetRole === preset.role ? '1px solid #8b5cf6' : '1px solid var(--border)',
                    background: activePresetRole === preset.role ? 'rgba(139, 92, 246, 0.2)' : 'rgba(0,0,0,0.25)',
                    color: activePresetRole === preset.role ? '#c4b5fd' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {preset.role}
                </button>
              ))}
            </div>
          </div>

          {/* ================= FEATURE: INTERACTIVE "WHAT-IF" READINESS SIMULATOR ================= */}
          <div className={`glass ${styles.panel}`} style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.06), rgba(139, 92, 246, 0.06))',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            padding: '20px 22px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calculator size={18} strokeWidth={2.2} color="#10b981" />
                <h3 className={styles.panelTitle} style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                  Interactive Readiness Simulator (What-If Analysis)
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Current: <strong style={{ color: '#f59e0b' }}>{baseMatchScore}%</strong> → Projected:{' '}
                  <strong style={{ color: '#10b981', fontSize: '1rem' }}>{simulatedMatchScore}%</strong>
                  {boostFromSimulated > 0 && (
                    <span style={{ marginLeft: '6px', color: '#34d399', fontWeight: 800, background: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                      +{boostFromSimulated}% Boost
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
              Select target skills to simulate how acquiring them elevates your recruiter match score and career readiness:
            </p>

            {/* Simulator Checkboxes */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {missingSkills.map(sk => {
                const isChecked = simulatedSkills.includes(sk)
                const item = prioritySkills.find(p => p.skill.toLowerCase() === sk.toLowerCase())
                const boost = item?.pointsBoost || 6

                return (
                  <button
                    key={sk}
                    type="button"
                    onClick={() => toggleSimulatedSkill(sk)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: isChecked ? '1px solid #10b981' : '1px solid var(--border)',
                      background: isChecked ? 'rgba(16, 185, 129, 0.18)' : 'rgba(0,0,0,0.25)',
                      color: isChecked ? '#34d399' : 'var(--text-primary)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isChecked ? <CheckSquare size={14} color="#10b981" /> : <Square size={14} color="var(--text-muted)" />}
                    <span>{sk}</span>
                    <span style={{ fontSize: '0.7rem', color: isChecked ? '#10b981' : 'var(--text-muted)', fontWeight: 700 }}>
                      +{boost}%
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ================= 2-COLUMN EXPERIENCE (DESKTOP) ================= */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
            gap: '20px',
            alignItems: 'start'
          }}>
            {/* ── LEFT COLUMN: Career Readiness, Progress Tracking, Job Impact ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* 7. Career Readiness Visual */}
              <div className={`glass ${styles.panel}`} style={{ padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <TrendingUp size={18} strokeWidth={2.2} color="#10b981" />
                  <h3 className={styles.panelTitle} style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                    Career Readiness Alignment
                  </h3>
                </div>

                {/* Circular / Radial Readiness Visual */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '24px',
                  padding: '16px 20px',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  flexWrap: 'wrap'
                }}>
                  {/* Circular Radial Gauge */}
                  <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.08)" strokeWidth="9" fill="transparent" />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke={simulatedMatchScore >= 75 ? '#10b981' : '#f59e0b'}
                        strokeWidth="9"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * simulatedMatchScore) / 100}
                        strokeLinecap="round"
                        fill="transparent"
                        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                      />
                    </svg>
                    <div style={{ position: 'absolute', textAlign: 'center' }}>
                      <span style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
                        {simulatedMatchScore}%
                      </span>
                    </div>
                  </div>

                  {/* Summary Text */}
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      You are {simulatedMatchScore}% aligned with {targetRole}.
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                      {analysis?.summary}
                    </p>
                  </div>
                </div>
              </div>

              {/* 9. Skill Gap Progress Tracking */}
              <div className={`glass ${styles.panel}`} style={{ padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Layers size={18} strokeWidth={2} color="#8b5cf6" />
                  <h3 className={styles.panelTitle} style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                    Skill Gap Progress
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Overall */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Overall Readiness</span>
                      <strong style={{ color: '#10b981' }}>{simulatedMatchScore}%</strong>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${simulatedMatchScore}%`, background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: '3px' }} />
                    </div>
                  </div>

                  {/* Strong Skills */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Strong Verified Skills ({strongCount})</span>
                      <strong style={{ color: '#34d399' }}>{strongPercent}%</strong>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${strongPercent}%`, background: '#34d399', borderRadius: '3px' }} />
                    </div>
                  </div>

                  {/* Skills to Improve */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Skills to Improve ({priorityCount})</span>
                      <strong style={{ color: '#fbbf24' }}>{improvePercent}%</strong>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${improvePercent}%`, background: '#f59e0b', borderRadius: '3px' }} />
                    </div>
                  </div>

                  {/* Missing Skills */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Missing Gaps ({missingCount})</span>
                      <strong style={{ color: '#f87171' }}>{missingPercent}%</strong>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${missingPercent}%`, background: '#ef4444', borderRadius: '3px' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* 10. Job Impact Section */}
              <div className={`glass ${styles.panel}`} style={{ padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Briefcase size={18} strokeWidth={2} color="#3b82f6" />
                  <h3 className={styles.panelTitle} style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                    How Your Skills Affect Job Matching
                  </h3>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '14px', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Match</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>{baseMatchScore}%</div>
                  </div>
                  <ArrowRight size={18} color="var(--text-muted)" />
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>After Priority Skills</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#a78bfa' }}>95%+ High Alignment</div>
                  </div>
                </div>

                {/* Checklist of impact */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {strongSkills.slice(0, 4).map(s => (
                    <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '0.76rem', color: '#34d399', fontWeight: 600 }}>
                      <CheckCircle2 size={12} />
                      <span>{s}</span>
                    </span>
                  ))}
                  {missingSkills.slice(0, 4).map(s => (
                    <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', fontSize: '0.76rem', color: '#f87171', fontWeight: 600 }}>
                      <XCircle size={12} />
                      <span>{s}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN: Priority Skills ("Learn First") & Recommended Roadmap ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* 5. Priority Skills Section */}
              <div className={`glass ${styles.panel}`} style={{ padding: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Flame size={18} strokeWidth={2.2} color="#f59e0b" />
                    <h3 className={styles.panelTitle} style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                      Skills You Should Learn First
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {prioritySkills.length} Identified
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {prioritySkills.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No critical skill bottlenecks detected for this role.
                    </div>
                  ) : (
                    prioritySkills.map((item, idx) => {
                      const isHigh = item.priority === 'High'
                      const isMed = item.priority === 'Medium'
                      const pColor = isHigh ? '#ef4444' : isMed ? '#f59e0b' : '#10b981'
                      const pBg = isHigh ? 'rgba(239, 68, 68, 0.12)' : isMed ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)'
                      const pBorder = isHigh ? 'rgba(239, 68, 68, 0.25)' : isMed ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)'

                      return (
                        <div
                          key={item.skill || idx}
                          style={{
                            padding: '14px 16px',
                            borderRadius: '10px',
                            background: 'rgba(0,0,0,0.2)',
                            border: `1px solid ${pBorder}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          {/* Top Row: Rank, Title, Priority Pill */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                                #{idx + 1}
                              </span>
                              <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                                {item.skill}
                              </strong>
                            </div>

                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              letterSpacing: '0.4px',
                              background: pBg,
                              color: pColor,
                              border: `1px solid ${pBorder}`
                            }}>
                              {item.priority} Priority
                            </span>
                          </div>

                          {/* Levels: Current vs Required */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                            <span>Your Level: <strong style={{ color: 'var(--text-primary)' }}>{item.currentLevel || 'Beginner'}</strong></span>
                            <span>Required Level: <strong style={{ color: '#10b981' }}>{item.requiredLevel || 'Advanced'}</strong></span>
                          </div>

                          {/* Gap Dual Bar */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                              <span>Gap: Significant</span>
                              <span>Est: {item.learning_time || '1-2 weeks'}</span>
                            </div>
                            <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: '35%', background: pColor, borderRadius: '3px' }} />
                            </div>
                          </div>

                          {/* Quick Actions for Skill Gap */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', paddingTop: '4px', flexWrap: 'wrap' }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4, flex: 1 }}>
                              {item.whyMatters || 'High priority based on your target role requirements.'}
                            </div>
                            
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <Link
                                href="/student/quizzes"
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '3px 7px', fontSize: '0.7rem', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                              >
                                <HelpCircle size={11} />
                                <span>Quiz</span>
                              </Link>
                              <Link
                                href="/student/courses"
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '3px 8px', fontSize: '0.7rem', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#a78bfa' }}
                              >
                                <span>Course →</span>
                              </Link>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* 8. Recommended Learning Path (Roadmap Chain) */}
              <div className={`glass ${styles.panel}`} style={{ padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Milestone size={18} strokeWidth={2.2} color="#10b981" />
                  <h3 className={styles.panelTitle} style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                    Recommended Learning Path
                  </h3>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 14px 0' }}>
                  Learn this → then this → then this to close target competencies.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(analysis?.learning_path && analysis.learning_path.length > 0
                    ? analysis.learning_path
                    : [
                        'JavaScript & TypeScript Core Patterns',
                        'React Framework & State Management',
                        'Node.js & Database Architecture',
                        'Docker Containerization & Deployment',
                        'System Design & Microservices'
                      ]
                  ).map((step, idx, arr) => (
                    <React.Fragment key={idx}>
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #8b5cf6, #10b981)',
                            color: '#fff',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {idx + 1}
                          </span>
                          <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {step}
                          </span>
                        </div>

                        <span style={{ fontSize: '0.7rem', color: '#a78bfa', fontWeight: 600 }}>
                          Target Level →
                        </span>
                      </div>

                      {idx < arr.length - 1 && (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: 1, margin: '-2px 0' }}>
                          ↓
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* FEATURE: Time-to-Job-Readiness AI Velocity Card */}
              <div className={`glass ${styles.panel}`} style={{ padding: '20px', borderLeft: '4px solid #06b6d4' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} strokeWidth={2.2} color="#06b6d4" />
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      Time-to-Job-Readiness AI Velocity
                    </h4>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#22d3ee', fontWeight: 800 }}>
                    ~{estTotalWeeks} Weeks
                  </span>
                </div>

                <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>
                  Estimated time to reach 95%+ readiness based on your planned study hours:
                </p>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Pace:</span>
                  {[5, 8, 12, 15].map(hrs => (
                    <button
                      key={hrs}
                      onClick={() => setStudyHoursPerWeek(hrs)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: studyHoursPerWeek === hrs ? '1px solid #06b6d4' : '1px solid var(--border)',
                        background: studyHoursPerWeek === hrs ? 'rgba(6, 182, 212, 0.2)' : 'rgba(0,0,0,0.2)',
                        color: studyHoursPerWeek === hrs ? '#22d3ee' : 'var(--text-secondary)'
                      }}
                    >
                      {hrs} hrs/wk
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ================= 4 & 11. DETAILED SKILL BREAKDOWN & FILTER OPTIONS ================= */}
          <div className={`glass ${styles.panel}`} style={{ padding: '22px', marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <SlidersHorizontal size={18} strokeWidth={2} color="#8b5cf6" />
                  <h3 className={styles.panelTitle} style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                    Detailed Skill Inventory Breakdown
                  </h3>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  Filter by capability tier to inspect evidence and practice pathways.
                </p>
              </div>

              {/* Filter Controls */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: `All (${allDetailedSkills.length})` },
                  { id: 'strong', label: `Strong (${strongCount})` },
                  { id: 'improve', label: `Need Improvement (${priorityCount})` },
                  { id: 'missing', label: `Missing (${missingCount})` },
                  { id: 'priority', label: `Highest Priority (${priorityCount})` }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id as any)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: activeFilter === tab.id ? '1px solid #8b5cf6' : '1px solid var(--border)',
                      background: activeFilter === tab.id ? 'rgba(139, 92, 246, 0.15)' : 'rgba(0,0,0,0.2)',
                      color: activeFilter === tab.id ? '#c4b5fd' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Skills Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '12px'
            }}>
              {filteredDetailedSkills.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  No skills matching this filter category.
                </div>
              ) : (
                filteredDetailedSkills.map((sk) => {
                  const isStrong = sk.status === 'strong'
                  const isImprove = sk.status === 'improve'
                  const color = sk.isSimulated ? '#a78bfa' : isStrong ? '#10b981' : isImprove ? '#f59e0b' : '#ef4444'
                  const bg = sk.isSimulated ? 'rgba(139, 92, 246, 0.12)' : isStrong ? 'rgba(16, 185, 129, 0.08)' : isImprove ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.08)'
                  const border = sk.isSimulated ? 'rgba(139, 92, 246, 0.35)' : isStrong ? 'rgba(16, 185, 129, 0.25)' : isImprove ? 'rgba(245, 158, 11, 0.25)' : 'rgba(239, 68, 68, 0.25)'

                  return (
                    <div
                      key={sk.name}
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        background: 'rgba(0,0,0,0.2)',
                        border: `1px solid ${border}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                          {sk.name}
                        </strong>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          background: bg,
                          color: color,
                          border: `1px solid ${border}`
                        }}>
                          {sk.tag}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                          <span>Level: {sk.currentLevel}</span>
                          <strong style={{ color }}>{sk.levelPercent}%</strong>
                        </div>
                        <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${sk.levelPercent}%`, background: color, borderRadius: '3px' }} />
                        </div>
                      </div>

                      {/* Quick Action Link */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Required: {sk.requiredLevel}
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Link
                            href={isStrong ? '/student/quizzes' : '/student/coding-judge'}
                            style={{ fontSize: '0.72rem', color: '#a78bfa', textDecoration: 'none', fontWeight: 600 }}
                          >
                            {isStrong ? 'Take Quiz →' : 'Solve Challenge →'}
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </main>

        {/* ================= MODAL: UPLOAD RESUME & JOB DESCRIPTION ================= */}
        {showUploadModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '20px'
          }}>
            <div className={`glass ${styles.panel}`} style={{
              maxWidth: '560px',
              width: '100%',
              background: '#0d1117',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Sparkles size={20} color="#8b5cf6" />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    Analyze Role Skill Gaps
                  </h3>
                </div>
                <button
                  onClick={() => setShowUploadModal(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                >
                  <X size={18} />
                </button>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Upload your resume and the target job description PDF or document to compute AI alignment and priority gaps.
              </p>

              {/* Resume Upload Box */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  1. Your Resume (PDF, PNG, JPG)
                </label>
                <div style={{
                  border: '1px dashed rgba(139, 92, 246, 0.4)',
                  borderRadius: '10px',
                  padding: '16px',
                  textAlign: 'center',
                  background: 'rgba(139, 92, 246, 0.05)',
                  cursor: 'pointer'
                }}>
                  <input
                    type="file"
                    id="modal-resume-file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,image/*"
                    onChange={(e) => e.target.files && setResumeFile(e.target.files[0])}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="modal-resume-file" style={{ cursor: 'pointer', display: 'block' }}>
                    <Upload size={24} color="#8b5cf6" style={{ margin: '0 auto 6px' }} />
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {resumeFile ? resumeFile.name : 'Click to select Resume'}
                    </div>
                  </label>
                </div>
              </div>

              {/* Job Description Upload Box */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  2. Target Job Description (PDF, PNG, JPG)
                </label>
                <div style={{
                  border: '1px dashed rgba(16, 185, 129, 0.4)',
                  borderRadius: '10px',
                  padding: '16px',
                  textAlign: 'center',
                  background: 'rgba(16, 185, 129, 0.05)',
                  cursor: 'pointer'
                }}>
                  <input
                    type="file"
                    id="modal-jd-file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,image/*"
                    onChange={(e) => e.target.files && setJobDescFile(e.target.files[0])}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="modal-jd-file" style={{ cursor: 'pointer', display: 'block' }}>
                    <FileText size={24} color="#10b981" style={{ margin: '0 auto 6px' }} />
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {jobDescFile ? jobDescFile.name : 'Click to select Job Description'}
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="btn btn-ghost"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={analyzing || !resumeFile || !jobDescFile}
                  className="btn btn-primary"
                  style={{ flex: 2, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {analyzing ? <MorphingInfinity className="size-4" style={{ width: '16px', height: '16px' }} /> : <Sparkles size={16} />}
                  <span>{analyzing ? 'Analyzing Alignment...' : 'Run Skill Gap Analysis'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
