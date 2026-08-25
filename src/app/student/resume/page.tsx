'use client'
import { useState, useEffect, useRef } from 'react'
import StudentSidebar from '@/components/StudentSidebar'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import styles from '../dashboard.module.css'
import SpecularButton from '@/components/SpecularButton'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import {
  FileText,
  Upload,
  Download,
  Lightbulb,
  Sparkles,
  Search,
  CheckCircle2,
  CircleX,
  TriangleAlert,
  Code2,
  Users,
  Target,
  KeyRound,
  TrendingUp,
  BarChart2,
  Clock,
  X,
  FileCode,
  Layout
} from 'lucide-react'

export default function ResumeAnalyzer() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const [resumes, setResumes] = useState<any[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [compareWith, setCompareWith] = useState<number | null>(null)
  const [comparisonData, setComparisonData] = useState<any>(null)
  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchResumes()
  }, [])

  const fetchResumes = async () => {
    const res = await fetch('/api/resume')
    const data = await res.json()
    setResumes(data.resumes || [])
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('resume', file)

    try {
      const res = await fetch('/api/resume', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()
      
      if (data.success) {
        setAnalysis(data.analysis)
        setFile(null)
        fetchResumes()
      } else {
        alert(data.error || 'Upload failed')
      }
    } catch (error) {
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const viewResumeDetails = async (id: number) => {
    const res = await fetch(`/api/resume/${id}`)
    const data = await res.json()
    setAnalysis(data.analysis_data)
    setCompareWith(null)
    setComparisonData(null)
  }

  const handleCompare = async (compareId: number) => {
    if (!compareId) {
      setComparisonData(null)
      return
    }
    const res = await fetch(`/api/resume/${compareId}`)
    const data = await res.json()
    setComparisonData(data.analysis_data)
  }

  const clearComparison = () => {
    setCompareWith(null)
    setComparisonData(null)
  }

  const exportToPDF = async () => {
    if (!reportRef.current || !analysis) return
    
    setExporting(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')
      
      const element = reportRef.current
      const canvas = await html2canvas(element, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/jpeg', 0.98)
      
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 190
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 10

      pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`resume-analysis-${Date.now()}.pdf`)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export PDF. Please try HTML export instead.')
    } finally {
      setExporting(false)
    }
  }

  const exportToHTML = () => {
    if (!analysis) return
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Resume Analysis Report - PlaceIQ</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 40px 20px; background: #fff; }
    .container { background: #fff; }
    h1 { color: #1a1a1a; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-bottom: 10px; }
    .subtitle { color: #666; margin-bottom: 30px; }
    .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 30px 0; }
    .metric { text-align: center; padding: 20px; background: #f8f9fa; border-radius: 12px; }
    .metric-value { font-size: 32px; font-weight: bold; color: #667eea; }
    .metric-label { font-size: 14px; color: #666; margin-top: 8px; }
    .section { margin: 30px 0; }
    .section-title { font-size: 24px; color: #333; margin-bottom: 15px; border-bottom: 3px solid #667eea; padding-bottom: 10px; }
    .list-item { padding: 12px; margin: 8px 0; background: #f8f9fa; border-left: 4px solid #667eea; border-radius: 6px; }
    .skills { display: flex; flex-wrap: wrap; gap: 10px; }
    .skill-tag { padding: 8px 16px; background: #667eea; color: white; border-radius: 20px; font-size: 14px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #eee; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Resume Analysis Report</h1>
    <p class="subtitle">Generated on ${new Date().toLocaleDateString()}</p>
    
    <div class="metrics">
      <div class="metric">
        <div class="metric-value">${analysis.ats_score}%</div>
        <div class="metric-label">ATS Score</div>
      </div>
      <div class="metric">
        <div class="metric-value">${analysis.overall_rating}/10</div>
        <div class="metric-label">Overall Rating</div>
      </div>
      <div class="metric">
        <div class="metric-value">${analysis.experience_years}y</div>
        <div class="metric-label">Experience</div>
      </div>
      <div class="metric">
        <div class="metric-value">${analysis.education_level}</div>
        <div class="metric-label">Education</div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">Summary</h2>
      <p style="line-height: 1.8; color: #555;">${analysis.summary}</p>
    </div>

    <div class="grid">
      <div class="section">
        <h2 class="section-title">Strengths</h2>
        ${analysis.strengths?.map((s: string) => `<div class="list-item">✓ ${s}</div>`).join('')}
      </div>

      <div class="section">
        <h2 class="section-title">Areas to Improve</h2>
        ${analysis.weaknesses?.map((w: string) => `<div class="list-item">✕ ${w}</div>`).join('')}
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">Technical Skills</h2>
      <div class="skills">
        ${analysis.skills?.technical?.map((s: string) => `<span class="skill-tag">${s}</span>`).join('')}
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">Soft Skills</h2>
      <div class="skills">
        ${analysis.skills?.soft?.map((s: string) => `<span class="skill-tag" style="background: #10b981;">${s}</span>`).join('')}
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">Recommendations</h2>
      ${analysis.recommendations?.map((r: string) => `<div class="list-item">→ ${r}</div>`).join('')}
    </div>

    <div class="section">
      <h2 class="section-title">Missing Keywords</h2>
      <div class="skills">
        ${analysis.missing_keywords?.map((k: string) => `<span class="skill-tag" style="background: #f59e0b;">${k}</span>`).join('')}
      </div>
    </div>

    <div class="footer">
      <p>Generated by PLACEIQ Resume Analyzer • Career Intelligence Platform</p>
    </div>
  </div>
</body>
</html>
    `
    
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `resume-analysis-${Date.now()}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getSkillRadarData = () => {
    if (!analysis) return []
    return [
      { skill: 'Technical', value: Math.min((analysis.skills?.technical?.length || 0) * 4, 100) },
      { skill: 'Soft Skills', value: Math.min((analysis.skills?.soft?.length || 0) * 15, 100) },
      { skill: 'ATS Keywords', value: analysis.ats_score || 0 },
      { skill: 'Experience', value: Math.min((analysis.experience_years || 0) * 20, 100) },
      { skill: 'Overall', value: (analysis.overall_rating || 0) * 10 }
    ]
  }

  const getScoreData = () => {
    return resumes.slice(0, 5).reverse().map((r, i) => ({
      name: `Resume ${i + 1}`,
      ats: r.ats_score,
      rating: r.overall_rating * 10
    }))
  }

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={24} strokeWidth={2} color="#7c3aed" />
              <h1 className={styles.pageTitle}>Resume Analyzer</h1>
            </div>
            <p className={styles.pageSubtitle}>Smart resume analysis • Upload PDF or Images</p>
          </div>
          {analysis && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginRight: '8px' }}>Download Report:</span>
              <button onClick={exportToPDF} disabled={exporting} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Download size={14} strokeWidth={2} />
                <span>{exporting ? 'Exporting...' : 'Download PDF'}</span>
              </button>
              <button onClick={exportToHTML} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FileCode size={14} strokeWidth={2} />
                <span>Download HTML</span>
              </button>
            </div>
          )}
        </header>

        <main className={styles.main}>
          {!analysis && (
            <div className={`glass ${styles.panel}`} style={{ background: 'rgba(124,58,237,0.1)', borderColor: 'rgba(124,58,237,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Lightbulb size={20} strokeWidth={2} color="#f59e0b" />
                <h3 className={styles.panelTitle}>What is ATS Score?</h3>
              </div>
              <p style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                <strong>ATS (Applicant Tracking System)</strong> is software used by companies to filter resumes. Our analyzer checks:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                    <Search size={15} strokeWidth={2} color="#8b5cf6" />
                    <span>Keyword Matching</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Checks if your resume contains relevant industry keywords</p>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                    <Layout size={15} strokeWidth={2} color="#3b82f6" />
                    <span>Format & Structure</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Evaluates readability and proper formatting</p>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                    <Target size={15} strokeWidth={2} color="#10b981" />
                    <span>Skills Analysis</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Identifies technical and soft skills mentioned</p>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                    <Sparkles size={15} strokeWidth={2} color="#f59e0b" />
                    <span>Quick Tips</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Get instant recommendations to improve your score</p>
                </div>
              </div>
            </div>
          )}

          <div className={`glass ${styles.panel}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Upload size={18} strokeWidth={2} color="#8b5cf6" />
              <h3 className={styles.panelTitle}>Upload Your Resume</h3>
            </div>
            <div
              className={`${styles.uploadZone} ${dragActive ? styles.dragActive : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="resume-upload"
                accept=".pdf,image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="resume-upload" className={styles.uploadLabel}>
                <div className={styles.uploadIcon} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 8px' }}>
                  <Upload size={32} strokeWidth={1.75} color="#8b5cf6" />
                </div>
                <div className={styles.uploadText}>
                  {file ? file.name : 'Drag & drop or click to upload'}
                </div>
                <div className={styles.uploadHint}>Supports PDF, JPG, PNG</div>
              </label>
            </div>
            {file && (
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
                <SpecularButton
                  onClick={handleUpload}
                  disabled={uploading}
                  size="md"
                  radius={8}
                  tint="#7c3aed"
                  tintOpacity={0.18}
                  blur={0}
                  textColor="#ffffff"
                  lineColor="#c4b5fd"
                  baseColor="#581c87"
                  intensity={0.85}
                  shineSize={8}
                  shineFade={35}
                  thickness={1}
                  speed={0.3}
                  followMouse
                  proximity={220}
                  style={{ width: '100%' }}
                >
                  {uploading ? <MorphingInfinity className="size-4" style={{ width: '16px', height: '16px' }} /> : <Sparkles size={16} strokeWidth={2} />}
                  <span>{uploading ? 'Analyzing...' : 'Analyze Resume'}</span>
                </SpecularButton>
              </div>
            )}
          </div>

          <div ref={reportRef}>
            {analysis && (
              <>
                <div className={`glass ${styles.panel}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <BarChart2 size={18} strokeWidth={2} color="#8b5cf6" />
                    <h3 className={styles.panelTitle}>Analysis Summary</h3>
                  </div>
                  <p style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
                    {analysis.summary}
                  </p>
                  <div className={styles.statsRow} style={{ marginTop: '20px' }}>
                    <div className={styles.miniStat}>
                      <div className={styles.miniStatValue} style={{ color: '#10b981' }}>{analysis.ats_score}%</div>
                      <div className={styles.miniStatLabel}>ATS Score</div>
                    </div>
                    <div className={styles.miniStat}>
                      <div className={styles.miniStatValue} style={{ color: '#7c3aed' }}>{analysis.overall_rating}/10</div>
                      <div className={styles.miniStatLabel}>Overall Rating</div>
                    </div>
                    <div className={styles.miniStat}>
                      <div className={styles.miniStatValue} style={{ color: '#3b82f6' }}>{analysis.experience_years}y</div>
                      <div className={styles.miniStatLabel}>Experience</div>
                    </div>
                    <div className={styles.miniStat}>
                      <div className={styles.miniStatValue} style={{ color: '#f59e0b' }}>{analysis.education_level}</div>
                      <div className={styles.miniStatLabel}>Education</div>
                    </div>
                  </div>
                </div>

                <div className={styles.grid2}>
                  <div className={`glass ${styles.panel}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <Target size={18} strokeWidth={2} color="#7c3aed" />
                      <h3 className={styles.panelTitle}>Skills Radar</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={getSkillRadarData()}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis dataKey="skill" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'var(--text-muted)' }} />
                        <Radar name="Score" dataKey="value" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.6} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className={`glass ${styles.panel}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingUp size={18} strokeWidth={2} color="#10b981" />
                        <h3 className={styles.panelTitle}>Resume Comparison</h3>
                      </div>
                      {comparisonData && (
                        <button onClick={clearComparison} className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <X size={13} strokeWidth={2} />
                          <span>Clear</span>
                        </button>
                      )}
                    </div>
                    {resumes.length > 1 && (
                      <div style={{ marginBottom: '16px' }}>
                        <select 
                          value={compareWith || ''} 
                          onChange={(e) => {
                            const val = e.target.value ? parseInt(e.target.value) : null
                            setCompareWith(val)
                            if (val) handleCompare(val)
                            else clearComparison()
                          }}
                          className="form-input"
                          style={{ width: '100%' }}
                        >
                          <option value="">No comparison - Show history</option>
                          {resumes.filter(r => r.id !== resumes[0]?.id).map(r => (
                            <option key={r.id} value={r.id}>
                              {r.filename} ({new Date(r.created_at).toLocaleDateString()})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={comparisonData ? [
                        { name: 'Current', ats: analysis.ats_score, rating: analysis.overall_rating * 10 },
                        { name: 'Previous', ats: comparisonData.ats_score, rating: comparisonData.overall_rating * 10 }
                      ] : getScoreData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)' }} />
                        <YAxis tick={{ fill: 'var(--text-secondary)' }} />
                        <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }} />
                        <Legend />
                        <Bar dataKey="ats" fill="#10b981" name="ATS Score" />
                        <Bar dataKey="rating" fill="#7c3aed" name="Rating" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className={styles.grid2}>
                  <div className={`glass ${styles.panel}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <CheckCircle2 size={18} strokeWidth={2} color="#10b981" />
                      <h3 className={styles.panelTitle}>Strengths</h3>
                    </div>
                    <div className={styles.listItems}>
                      {analysis.strengths?.map((s: string, i: number) => (
                        <div key={i} className={styles.listItem}>
                          <span className={styles.listIcon} style={{ display: 'flex', alignItems: 'center' }}>
                            <CheckCircle2 size={15} strokeWidth={2} color="#10b981" />
                          </span>
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={`glass ${styles.panel}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <TriangleAlert size={18} strokeWidth={2} color="#ef4444" />
                      <h3 className={styles.panelTitle}>Areas to Improve</h3>
                    </div>
                    <div className={styles.listItems}>
                      {analysis.weaknesses?.map((w: string, i: number) => (
                        <div key={i} className={styles.listItem}>
                          <span className={styles.listIcon} style={{ display: 'flex', alignItems: 'center' }}>
                            <CircleX size={15} strokeWidth={2} color="#ef4444" />
                          </span>
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={styles.grid2}>
                  <div className={`glass ${styles.panel}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <Code2 size={18} strokeWidth={2} color="#3b82f6" />
                      <h3 className={styles.panelTitle}>Technical Skills</h3>
                    </div>
                    <div className={styles.skillTags}>
                      {analysis.skills?.technical?.map((s: string, i: number) => (
                        <span key={i} className={styles.skillTag}>{s}</span>
                      ))}
                    </div>
                  </div>

                  <div className={`glass ${styles.panel}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <Users size={18} strokeWidth={2} color="#10b981" />
                      <h3 className={styles.panelTitle}>Soft Skills</h3>
                    </div>
                    <div className={styles.skillTags}>
                      {analysis.skills?.soft?.map((s: string, i: number) => (
                        <span key={i} className={styles.skillTag} style={{ background: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={`glass ${styles.panel}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Lightbulb size={18} strokeWidth={2} color="#f59e0b" />
                    <h3 className={styles.panelTitle}>Recommendations</h3>
                  </div>
                  <div className={styles.listItems}>
                    {analysis.recommendations?.map((r: string, i: number) => (
                      <div key={i} className={styles.listItem}>
                        <span className={styles.listIcon} style={{ display: 'flex', alignItems: 'center' }}>
                          <Target size={15} strokeWidth={2} color="#8b5cf6" />
                        </span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`glass ${styles.panel}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <KeyRound size={18} strokeWidth={2} color="#f59e0b" />
                    <h3 className={styles.panelTitle}>Missing Keywords</h3>
                  </div>
                  <div className={styles.skillTags}>
                    {analysis.missing_keywords?.map((k: string, i: number) => (
                      <span key={i} className={styles.skillTag} style={{ background: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.3)' }}>{k}</span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {resumes.length > 0 && (
            <div className={`glass ${styles.panel}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Clock size={18} strokeWidth={2} color="#8b5cf6" />
                <h3 className={styles.panelTitle}>Your Resume History</h3>
              </div>
              <div className={styles.resumeList}>
                {resumes.map((r) => (
                  <div key={r.id} className={styles.resumeCard} onClick={() => viewResumeDetails(r.id)}>
                    <div className={styles.resumeIcon} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={20} strokeWidth={2} color="#8b5cf6" />
                    </div>
                    <div className={styles.resumeInfo}>
                      <div className={styles.resumeName}>{r.filename}</div>
                      <div className={styles.resumeMeta}>
                        {new Date(r.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className={styles.resumeScores}>
                        <div className={styles.resumeScore}>
                          <span style={{ color: '#10b981' }}>{r.ats_score}%</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ATS</span>
                        </div>
                        <div className={styles.resumeScore}>
                          <span style={{ color: '#7c3aed' }}>{r.overall_rating}/10</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Rating</span>
                        </div>
                      </div>
                      <a
                        href={r.download_url || `/api/resume/${r.id}/download?download=true`}
                        download
                        onClick={(e) => e.stopPropagation()}
                        title="Download Original Resume"
                        className="btn btn-sm btn-ghost"
                        style={{ padding: '6px 10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Download size={14} strokeWidth={2} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
