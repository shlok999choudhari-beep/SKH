'use client'
import { useState, useRef } from 'react'
import StudentSidebar from '@/components/StudentSidebar'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import styles from '../dashboard.module.css'
import {
  ChartNoAxesCombined,
  Download,
  FileCode,
  RotateCcw,
  Upload,
  CheckCircle2,
  FileText,
  Sparkles,
  Loader2,
  BarChart2,
  CircleX,
  BookOpen,
  Briefcase,
  GraduationCap,
  Lightbulb,
  Target,
  Milestone
} from 'lucide-react'

export default function SkillGapDetector() {
  const [step, setStep] = useState(1)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [jobDescFile, setJobDescFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const [exporting, setExporting] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0])
      setStep(2)
    }
  }

  const handleJobDescUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setJobDescFile(e.target.files[0])
    }
  }

  const handleAnalyze = async () => {
    if (!resumeFile || !jobDescFile) return

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
      
      if (data.success) {
        setAnalysis(data.analysis)
        setStep(3)
      } else {
        alert(data.error || 'Analysis failed')
      }
    } catch (error) {
      alert('Analysis failed. Please try again.')
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
  <title>Skill Gap Analysis Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 20px; padding: 40px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    h1 { color: #667eea; font-size: 36px; margin-bottom: 10px; }
    .match-score { text-align: center; padding: 30px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border-radius: 15px; margin: 30px 0; }
    .match-value { font-size: 64px; font-weight: bold; }
    .section { margin: 30px 0; }
    .section-title { font-size: 24px; color: #333; margin-bottom: 15px; border-bottom: 3px solid #667eea; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #667eea; color: white; }
    .skill-tag { display: inline-block; padding: 8px 16px; margin: 5px; background: #667eea; color: white; border-radius: 20px; }
    .priority-high { background: #ef4444; }
    .priority-medium { background: #f59e0b; }
    .priority-low { background: #10b981; }
    .list-item { padding: 12px; margin: 8px 0; background: #f8f9fa; border-left: 4px solid #667eea; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Skill Gap Analysis Report</h1>
    <p style="color: #666; margin-bottom: 30px;">Generated on ${new Date().toLocaleDateString()}</p>
    
    <div class="match-score">
      <div class="match-value">${analysis.match_percentage}%</div>
      <div style="font-size: 18px; margin-top: 10px;">Match Score</div>
    </div>

    <div class="section">
      <h2 class="section-title">Summary</h2>
      <p style="line-height: 1.8; color: #555;">${analysis.summary}</p>
    </div>

    <div class="section">
      <h2 class="section-title">Matching Skills</h2>
      <div>
        ${analysis.matching_skills?.map((s: string) => `<span class="skill-tag">${s}</span>`).join('')}
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">Missing Skills</h2>
      <div>
        ${analysis.missing_skills?.map((s: string) => `<span class="skill-tag" style="background: #ef4444;">${s}</span>`).join('')}
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">Skills to Learn</h2>
      <table>
        <tr>
          <th>Skill</th>
          <th>Priority</th>
          <th>Learning Time</th>
        </tr>
        ${analysis.skills_to_learn?.map((s: any) => `
          <tr>
            <td>${s.skill}</td>
            <td><span class="skill-tag priority-${s.priority.toLowerCase()}">${s.priority}</span></td>
            <td>${s.learning_time}</td>
          </tr>
        `).join('')}
      </table>
    </div>

    <div class="section">
      <h2 class="section-title">Recommendations</h2>
      ${analysis.recommendations?.map((r: string) => `<div class="list-item">→ ${r}</div>`).join('')}
    </div>

    <div class="section">
      <h2 class="section-title">Learning Path</h2>
      ${analysis.learning_path?.map((step: string, i: number) => `<div class="list-item">${i + 1}. ${step}</div>`).join('')}
    </div>
  </div>
</body>
</html>
    `
    
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `skill-gap-analysis-${Date.now()}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const reset = () => {
    setStep(1)
    setResumeFile(null)
    setJobDescFile(null)
    setAnalysis(null)
  }

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ChartNoAxesCombined size={24} strokeWidth={2} color="#8b5cf6" />
              <h1 className={styles.pageTitle}>Skill Gap Detector</h1>
            </div>
            <p className={styles.pageSubtitle}>Compare your resume with job requirements</p>
          </div>
          {analysis && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginRight: '8px' }}>Download Report:</span>
              <button onClick={exportToPDF} disabled={exporting} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Download size={14} strokeWidth={2} />
                <span>{exporting ? 'Exporting...' : 'Download PDF'}</span>
              </button>
              <button onClick={exportToHTML} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FileCode size={14} strokeWidth={2} />
                <span>Download HTML</span>
              </button>
              <button onClick={reset} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <RotateCcw size={14} strokeWidth={2} />
                <span>New Analysis</span>
              </button>
            </div>
          )}
        </header>

        <main className={styles.main}>
          {step === 1 && (
            <div className={`glass ${styles.panel}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Upload size={18} strokeWidth={2} color="#8b5cf6" />
                <h3 className={styles.panelTitle}>Step 1: Upload Your Resume</h3>
              </div>
              <div className={styles.uploadZone}>
                <input
                  type="file"
                  id="resume-upload"
                  accept=".pdf,image/*"
                  onChange={handleResumeUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="resume-upload" className={styles.uploadLabel}>
                  <div className={styles.uploadIcon} style={{ display: 'flex', justifyContent: 'center', margin: '0 auto 8px' }}>
                    <Upload size={32} strokeWidth={1.75} color="#8b5cf6" />
                  </div>
                  <div className={styles.uploadText}>
                    {resumeFile ? resumeFile.name : 'Upload your resume (PDF or Image)'}
                  </div>
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <>
              <div className={`glass ${styles.panel}`} style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircle2 size={24} strokeWidth={2} color="#10b981" />
                  <div>
                    <strong>Resume uploaded:</strong> {resumeFile?.name}
                  </div>
                </div>
              </div>

              <div className={`glass ${styles.panel}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <FileText size={18} strokeWidth={2} color="#8b5cf6" />
                  <h3 className={styles.panelTitle}>Step 2: Upload Job Description</h3>
                </div>
                <div className={styles.uploadZone}>
                  <input
                    type="file"
                    id="job-desc-upload"
                    accept=".pdf,image/*"
                    onChange={handleJobDescUpload}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="job-desc-upload" className={styles.uploadLabel}>
                    <div className={styles.uploadIcon} style={{ display: 'flex', justifyContent: 'center', margin: '0 auto 8px' }}>
                      <Upload size={32} strokeWidth={1.75} color="#8b5cf6" />
                    </div>
                    <div className={styles.uploadText}>
                      {jobDescFile ? jobDescFile.name : 'Upload job description (PDF or Image)'}
                    </div>
                  </label>
                </div>
                {jobDescFile && (
                  <button
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    {analyzing ? <MorphingInfinity className="size-4" style={{ width: '16px', height: '16px' }} /> : <Sparkles size={16} strokeWidth={2} />}
                    <span>{analyzing ? 'Analyzing Skill Gap...' : 'Analyze Skill Gap'}</span>
                  </button>
                )}
              </div>
            </>
          )}

          <div ref={reportRef}>
            {step === 3 && analysis && (
              <>
                <div className={`glass ${styles.panel}`} style={{ textAlign: 'center', padding: '48px 40px', background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(16,185,129,0.1))' }}>
                  <div style={{ fontSize: '80px', fontWeight: '900', background: 'linear-gradient(135deg, #7c3aed, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: '1', marginBottom: '12px' }}>
                    {analysis.match_percentage}%
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '0.5px' }}>
                    Match Score
                  </div>
                </div>

                <div className={`glass ${styles.panel}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <BarChart2 size={18} strokeWidth={2} color="#8b5cf6" />
                    <h3 className={styles.panelTitle}>Summary</h3>
                  </div>
                  <p style={{ fontSize: '15px', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
                    {analysis.summary}
                  </p>
                </div>

                <div className={styles.grid2}>
                  <div className={`glass ${styles.panel}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <CheckCircle2 size={18} strokeWidth={2} color="#10b981" />
                      <h3 className={styles.panelTitle}>Matching Skills ({analysis.matching_skills?.length || 0})</h3>
                    </div>
                    <div className={styles.skillTags}>
                      {analysis.matching_skills?.map((s: string, i: number) => (
                        <span key={i} className={styles.skillTag} style={{ background: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)', color: '#10b981', fontSize: '13px', padding: '8px 14px' }}>{s}</span>
                      ))}
                    </div>
                  </div>

                  <div className={`glass ${styles.panel}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <CircleX size={18} strokeWidth={2} color="#ef4444" />
                      <h3 className={styles.panelTitle}>Missing Skills ({analysis.missing_skills?.length || 0})</h3>
                    </div>
                    <div className={styles.skillTags}>
                      {analysis.missing_skills?.map((s: string, i: number) => (
                        <span key={i} className={styles.skillTag} style={{ background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '13px', padding: '8px 14px' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={`glass ${styles.panel}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                    <BookOpen size={18} strokeWidth={2} color="#8b5cf6" />
                    <h3 className={styles.panelTitle}>Skills to Learn</h3>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                      <thead>
                        <tr style={{ background: 'rgba(124,58,237,0.1)' }}>
                          <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-primary)', fontWeight: '700', fontSize: '14px', borderTopLeftRadius: '8px' }}>Skill</th>
                          <th style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--text-primary)', fontWeight: '700', fontSize: '14px' }}>Priority</th>
                          <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-primary)', fontWeight: '700', fontSize: '14px', borderTopRightRadius: '8px' }}>Learning Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysis.skills_to_learn?.map((s: any, i: number) => (
                          <tr key={i} style={{ borderBottom: i < analysis.skills_to_learn.length - 1 ? '1px solid var(--border)' : 'none' }}>
                            <td style={{ padding: '14px 16px', color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500' }}>{s.skill}</td>
                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <span className={styles.skillTag} style={{
                                background: s.priority === 'High' ? 'rgba(239,68,68,0.15)' : s.priority === 'Medium' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                                borderColor: s.priority === 'High' ? 'rgba(239,68,68,0.3)' : s.priority === 'Medium' ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)',
                                color: s.priority === 'High' ? '#ef4444' : s.priority === 'Medium' ? '#f59e0b' : '#10b981',
                                fontSize: '13px',
                                padding: '6px 14px',
                                fontWeight: '600'
                              }}>
                                {s.priority}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '14px' }}>{s.learning_time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {(analysis.experience_gap || analysis.education_gap) && (
                  <div className={styles.grid2}>
                    {analysis.experience_gap && (
                      <div className={`glass ${styles.panel}`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                          <Briefcase size={18} strokeWidth={2} color="#3b82f6" />
                          <h3 className={styles.panelTitle}>Experience Gap</h3>
                        </div>
                        <p style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
                          {analysis.experience_gap}
                        </p>
                      </div>
                    )}

                    {analysis.education_gap && (
                      <div className={`glass ${styles.panel}`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                          <GraduationCap size={18} strokeWidth={2} color="#f59e0b" />
                          <h3 className={styles.panelTitle}>Education Gap</h3>
                        </div>
                        <p style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
                          {analysis.education_gap}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className={`glass ${styles.panel}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Lightbulb size={18} strokeWidth={2} color="#f59e0b" />
                    <h3 className={styles.panelTitle}>Recommendations</h3>
                  </div>
                  <div className={styles.listItems}>
                    {analysis.recommendations?.map((r: string, i: number) => (
                      <div key={i} className={styles.listItem} style={{ padding: '12px', background: 'rgba(124,58,237,0.05)', borderRadius: '8px', border: '1px solid rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Target size={16} strokeWidth={2} color="#8b5cf6" />
                        <span style={{ fontSize: '14px', lineHeight: '1.6' }}>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`glass ${styles.panel}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Milestone size={18} strokeWidth={2} color="#10b981" />
                    <h3 className={styles.panelTitle}>Learning Path</h3>
                  </div>
                  <div className={styles.listItems}>
                    {analysis.learning_path?.map((step: string, i: number) => (
                      <div key={i} className={styles.listItem} style={{ padding: '14px', background: 'rgba(16,185,129,0.05)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className={styles.listIcon} style={{ background: 'linear-gradient(135deg, #7c3aed, #10b981)', color: 'white', borderRadius: '50%', width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', flexShrink: '0' }}>{i + 1}</span>
                        <span style={{ fontSize: '14px', lineHeight: '1.6', flex: '1' }}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

