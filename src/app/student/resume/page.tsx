'use client'
import { useState, useEffect, useRef } from 'react'
import StudentSidebar from '@/components/StudentSidebar'
import styles from '../dashboard.module.css'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

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
      pdf.save(`resume-analysis-${Date.now()}.pdf`)
    } catch (error) {
      alert('PDF export failed')
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume Analysis Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 20px; padding: 40px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    h1 { color: #667eea; font-size: 36px; margin-bottom: 10px; }
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
    <h1>📄 Resume Analysis Report</h1>
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
      <h2 class="section-title">📊 Summary</h2>
      <p style="line-height: 1.8; color: #555;">${analysis.summary}</p>
    </div>

    <div class="grid">
      <div class="section">
        <h2 class="section-title">💪 Strengths</h2>
        ${analysis.strengths?.map((s: string) => `<div class="list-item">✅ ${s}</div>`).join('')}
      </div>

      <div class="section">
        <h2 class="section-title">⚠️ Areas to Improve</h2>
        ${analysis.weaknesses?.map((w: string) => `<div class="list-item">❌ ${w}</div>`).join('')}
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">💻 Technical Skills</h2>
      <div class="skills">
        ${analysis.skills?.technical?.map((s: string) => `<span class="skill-tag">${s}</span>`).join('')}
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">🤝 Soft Skills</h2>
      <div class="skills">
        ${analysis.skills?.soft?.map((s: string) => `<span class="skill-tag" style="background: #10b981;">${s}</span>`).join('')}
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">💡 Recommendations</h2>
      ${analysis.recommendations?.map((r: string) => `<div class="list-item">🎯 ${r}</div>`).join('')}
    </div>

    <div class="section">
      <h2 class="section-title">🔑 Missing Keywords</h2>
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
      { skill: 'Experience', value: Math.min((analysis.experience_years || 0) * 10, 100) },
      { skill: 'Education', value: analysis.education_level === 'Masters' ? 90 : 70 },
      { skill: 'ATS Score', value: analysis.ats_score || 0 },
    ]
  }

  const getScoreData = () => {
    if (!resumes.length) return []
    return resumes.slice(0, 5).map((r, i) => ({
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
            <h1 className={styles.pageTitle}>📄 Resume Analyzer</h1>
            <p className={styles.pageSubtitle}>Smart resume analysis • Upload PDF or Images</p>
          </div>
          {analysis && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginRight: '8px' }}>Download Report:</span>
              <button onClick={exportToPDF} disabled={exporting} className="btn btn-primary btn-sm">
                {exporting ? '⏳ Exporting...' : '📥 Download PDF'}
              </button>
              <button onClick={exportToHTML} className="btn btn-primary btn-sm">
                📄 Download HTML
              </button>
            </div>
          )}
        </header>

        <main className={styles.main}>
          {/* Info Banner */}
          {!analysis && (
            <div className={`glass ${styles.panel}`} style={{ background: 'rgba(124,58,237,0.1)', borderColor: 'rgba(124,58,237,0.3)' }}>
              <h3 className={styles.panelTitle}>💡 What is ATS Score?</h3>
              <p style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                <strong>ATS (Applicant Tracking System)</strong> is software used by companies to filter resumes. Our analyzer checks:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <strong>📝 Keyword Matching</strong>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Checks if your resume contains relevant industry keywords</p>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <strong>📊 Format & Structure</strong>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Evaluates readability and proper formatting</p>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <strong>🎯 Skills Analysis</strong>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Identifies technical and soft skills mentioned</p>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <strong>⚡ Quick Tips</strong>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Get instant recommendations to improve your score</p>
                </div>
              </div>
            </div>
          )}

          <div className={`glass ${styles.panel}`}>
            <h3 className={styles.panelTitle}>🚀 Upload Your Resume</h3>
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
                <div className={styles.uploadIcon}>📤</div>
                <div className={styles.uploadText}>
                  {file ? file.name : 'Drag & drop or click to upload'}
                </div>
                <div className={styles.uploadHint}>Supports PDF, JPG, PNG</div>
              </label>
            </div>
            {file && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '16px' }}
              >
                {uploading ? '🔄 Analyzing...' : '✨ Analyze Resume'}
              </button>
            )}
          </div>

          <div ref={reportRef}>
            {analysis && (
              <>
                <div className={`glass ${styles.panel}`}>
                  <h3 className={styles.panelTitle}>📊 Analysis Summary</h3>
                  <p style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
                    {analysis.summary}
                  </p>
                  <div className={styles.statsRow} style={{ marginTop: '20px' }}>
                    <div className={styles.miniStat}>
                      <div className={styles.miniStatValue} style={{ color: '#10b981' }}>
                        {analysis.ats_score}%
                      </div>
                      <div className={styles.miniStatLabel}>ATS Score</div>
                    </div>
                    <div className={styles.miniStat}>
                      <div className={styles.miniStatValue} style={{ color: '#7c3aed' }}>
                        {analysis.overall_rating}/10
                      </div>
                      <div className={styles.miniStatLabel}>Overall Rating</div>
                    </div>
                    <div className={styles.miniStat}>
                      <div className={styles.miniStatValue} style={{ color: '#3b82f6' }}>
                        {analysis.experience_years}y
                      </div>
                      <div className={styles.miniStatLabel}>Experience</div>
                    </div>
                    <div className={styles.miniStat}>
                      <div className={styles.miniStatValue} style={{ color: '#f59e0b' }}>
                        {analysis.education_level}
                      </div>
                      <div className={styles.miniStatLabel}>Education</div>
                    </div>
                  </div>
                </div>

                <div className={styles.grid2}>
                  <div className={`glass ${styles.panel}`}>
                    <h3 className={styles.panelTitle}>🎯 Skills Radar</h3>
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
                      <h3 className={styles.panelTitle}>📈 Resume Comparison</h3>
                      {comparisonData && (
                        <button onClick={clearComparison} className="btn btn-ghost btn-sm">
                          ❌ Clear
                        </button>
                      )}
                    </div>
                    {resumes.length > 1 && (
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                          Compare current resume with:
                        </label>
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
                    <h3 className={styles.panelTitle}>💪 Strengths</h3>
                    <div className={styles.listItems}>
                      {analysis.strengths?.map((s: string, i: number) => (
                        <div key={i} className={styles.listItem}>
                          <span className={styles.listIcon}>✅</span>
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={`glass ${styles.panel}`}>
                    <h3 className={styles.panelTitle}>⚠️ Areas to Improve</h3>
                    <div className={styles.listItems}>
                      {analysis.weaknesses?.map((w: string, i: number) => (
                        <div key={i} className={styles.listItem}>
                          <span className={styles.listIcon}>❌</span>
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={styles.grid2}>
                  <div className={`glass ${styles.panel}`}>
                    <h3 className={styles.panelTitle}>💻 Technical Skills</h3>
                    <div className={styles.skillTags}>
                      {analysis.skills?.technical?.map((s: string, i: number) => (
                        <span key={i} className={styles.skillTag}>{s}</span>
                      ))}
                    </div>
                  </div>

                  <div className={`glass ${styles.panel}`}>
                    <h3 className={styles.panelTitle}>🤝 Soft Skills</h3>
                    <div className={styles.skillTags}>
                      {analysis.skills?.soft?.map((s: string, i: number) => (
                        <span key={i} className={styles.skillTag} style={{ background: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={`glass ${styles.panel}`}>
                  <h3 className={styles.panelTitle}>💡 Recommendations</h3>
                  <div className={styles.listItems}>
                    {analysis.recommendations?.map((r: string, i: number) => (
                      <div key={i} className={styles.listItem}>
                        <span className={styles.listIcon}>🎯</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`glass ${styles.panel}`}>
                  <h3 className={styles.panelTitle}>🔑 Missing Keywords</h3>
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
              <h3 className={styles.panelTitle}>📚 Your Resume History</h3>
              <div className={styles.resumeList}>
                {resumes.map((r) => (
                  <div key={r.id} className={styles.resumeCard} onClick={() => viewResumeDetails(r.id)}>
                    <div className={styles.resumeIcon}>📄</div>
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
                        style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                      >
                        ⬇️
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
