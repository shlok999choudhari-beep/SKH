'use client'
import { useState, useEffect } from 'react'
import StudentSidebar from '@/components/StudentSidebar'
import BackButton from '@/components/BackButton'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import styles from './dream.module.css'
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Search,
  Calendar,
  Briefcase,
  CheckCircle2,
  Wrench,
  Code2,
  GraduationCap,
  Target,
  FileText,
  KeyRound,
  CheckSquare,
  Lightbulb,
  BookOpen,
  Mic,
  Layers,
  Rocket,
  Brain,
  DollarSign,
  Download,
  TriangleAlert,
  ExternalLink
} from 'lucide-react'

export default function DreamMode() {
  const [search, setSearch] = useState('')
  const [companies, setCompanies] = useState<any[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/dream-companies')
      const result = await res.json()
      if (res.ok) {
        setCompanies(result.companies)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoadingCompanies(false)
    }
  }

  const filtered = companies.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const fetchDreamCompany = async (company: any) => {
    setSelected(company)
    setLoading(true)
    setData(null)

    try {
      const res = await fetch('/api/dream-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: company.name })
      })

      const result = await res.json()
      if (res.ok) {
        setData(result)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = async (company: any, companyData: any) => {
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, data: companyData })
      })

      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${company.name}_Hiring_Details.pdf`
        if (document.body) {
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          if (a.parentNode) {
            a.parentNode.removeChild(a)
          }
        }
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
    }
  }

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.content}>
        <header className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <BackButton fallbackHref="/student/dashboard" />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={24} strokeWidth={2} color="#8b5cf6" />
                <h1 className={styles.pageTitle}>Dream Company Mode</h1>
              </div>
              <p className={styles.pageSubtitle}>Complete hiring insights for your dream companies</p>
            </div>
          </div>
          {selected && (
            <button className="btn btn-secondary btn-sm" onClick={() => { setSelected(null); setData(null) }} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={14} strokeWidth={2} />
              <span>Back</span>
            </button>
          )}
        </header>

        <main className={styles.main}>
          {!selected ? (
            <>
              <div className={styles.searchBar}>
                <span className={styles.searchIcon} style={{ display: 'flex', alignItems: 'center' }}>
                  <Search size={18} strokeWidth={2} color="var(--text-muted)" />
                </span>
                <input
                  type="text"
                  placeholder="Search your dream company..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              {loadingCompanies ? (
                <div className={styles.loading} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '3.5rem' }}>
                  <MorphingInfinity className="size-16" style={{ width: '64px', height: '64px', color: '#8b5cf6' }} />
                  <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Loading companies...</p>
                </div>
              ) : (
                <div className={styles.grid}>
                  {filtered.map(company => (
                    <div key={company.id} className={styles.card} onClick={() => fetchDreamCompany(company)}>
                      <div className={styles.cardLogo} style={{ background: `${company.color}20` }}>
                        <img src={company.logo} alt={company.name} style={{ width: '64px', height: '64px', objectFit: 'contain' }} onError={(e) => { e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ctext y=".9em" font-size="90"%3E🏢%3C/text%3E%3C/svg%3E' }} />
                      </div>
                      <h3 className={styles.cardName}>{company.name}</h3>
                      <p className={styles.cardIndustry}>{company.industry}</p>
                      <button className={`btn btn-primary btn-sm ${styles.cardBtn}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                        <span>View Details</span>
                        <ArrowRight size={14} strokeWidth={2} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className={styles.details}>
              {loading ? (
                <div className={styles.loading} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '3.5rem' }}>
                  <MorphingInfinity className="size-16" style={{ width: '64px', height: '64px', color: '#8b5cf6' }} />
                  <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Loading {selected.name} insights...</p>
                </div>
              ) : data ? (
                <>
                  <div className={styles.detailsHeader}>
                    <div className={styles.detailsLogo} style={{ background: `${selected.color}20` }}>
                      <img src={selected.logo} alt={selected.name} style={{ width: '80px', height: '80px', objectFit: 'contain' }} onError={(e) => { e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ctext y=".9em" font-size="90"%3E🏢%3C/text%3E%3C/svg%3E' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <h2 className={styles.detailsName} style={{ margin: 0 }}>{selected.name}</h2>
                        {data._source === 'live_ai' ? (
                          <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', padding: '4px 10px', borderRadius: '12px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
                            Live AI Intelligence
                          </span>
                        ) : (
                          <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', padding: '4px 10px', borderRadius: '12px' }}>
                            <BookOpen size={12} strokeWidth={2} />
                            <span>Curated Placement Intel</span>
                          </span>
                        )}
                      </div>
                      <p className={styles.detailsIndustry} style={{ marginTop: '4px' }}>{selected.industry}</p>
                    </div>
                  </div>

                  {data.hiringCycles && (
                    <div className={styles.section}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Calendar size={18} strokeWidth={2} color="#8b5cf6" />
                        <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Hiring Cycles</h3>
                      </div>
                      <p className={styles.sectionText}>{data.hiringCycles}</p>
                    </div>
                  )}

                  {data.jobOpenings && (
                    <div className={styles.section}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Briefcase size={18} strokeWidth={2} color="#3b82f6" />
                        <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Job Openings / Vacancies Timing</h3>
                      </div>
                      <p className={styles.sectionText}>{data.jobOpenings}</p>
                    </div>
                  )}

                  {data.eligibility && (
                    <div className={styles.section}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <CheckCircle2 size={18} strokeWidth={2} color="#10b981" />
                        <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Eligibility Criteria</h3>
                      </div>
                      <p className={styles.sectionText}>{data.eligibility}</p>
                    </div>
                  )}

                  {data.skills && (
                    <div className={styles.section}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Wrench size={18} strokeWidth={2} color="#f59e0b" />
                        <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Required Skill Set</h3>
                      </div>
                      <div className={styles.tags}>
                        {data.skills.map((skill: string, i: number) => (
                          <span key={i} className={styles.tag}>{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.technologies && (
                    <div className={styles.section}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Code2 size={18} strokeWidth={2} color="#8b5cf6" />
                        <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Preferred Technologies</h3>
                      </div>
                      <div className={styles.tags}>
                        {data.technologies.map((tech: string, i: number) => (
                          <span key={i} className={styles.tag}>{tech}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.cgpa && (
                    <div className={styles.section}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <GraduationCap size={18} strokeWidth={2} color="#3b82f6" />
                        <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Minimum CGPA Requirement</h3>
                      </div>
                      <p className={styles.sectionText}>{data.cgpa}</p>
                    </div>
                  )}

                  {data.experience && (
                    <div className={styles.section}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Briefcase size={18} strokeWidth={2} color="#10b981" />
                        <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Prior Experience Requirement</h3>
                      </div>
                      <p className={styles.sectionText}>{data.experience}</p>
                    </div>
                  )}

                  {data.internship && (
                    <div className={styles.section}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Target size={18} strokeWidth={2} color="#ef4444" />
                        <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Internship Requirements</h3>
                      </div>
                      <p className={styles.sectionText}>{data.internship}</p>
                    </div>
                  )}

                  {data.resumeCriteria && (
                    <div className={styles.section}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <FileText size={18} strokeWidth={2} color="#8b5cf6" />
                        <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Resume Shortlisting Criteria</h3>
                      </div>
                      <p className={styles.sectionText}>{data.resumeCriteria}</p>
                    </div>
                  )}

                  {data.atsKeywords && (
                    <div className={styles.section}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <KeyRound size={18} strokeWidth={2} color="#f59e0b" />
                        <h3 className={styles.sectionTitle} style={{ margin: 0 }}>ATS Keywords</h3>
                      </div>
                      <div className={styles.tags}>
                        {data.atsKeywords.map((keyword: string, i: number) => (
                          <span key={i} className={styles.tag}>{keyword}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.selectionProcess && (
                    <div className={styles.section}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Target size={18} strokeWidth={2} color="#3b82f6" />
                        <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Selection Process Stages</h3>
                      </div>
                      <p className={styles.sectionText}>{data.selectionProcess}</p>
                    </div>
                  )}

                  {data.assessmentPattern && (
                    <div className={styles.section}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <CheckSquare size={18} strokeWidth={2} color="#10b981" />
                        <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Online Assessment Pattern</h3>
                      </div>
                      <p className={styles.sectionText}>{data.assessmentPattern}</p>
                    </div>
                  )}

                  {data.dsaTopics && (
                    <div className={styles.section}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Lightbulb size={18} strokeWidth={2} color="#eab308" />
                        <h3 className={styles.sectionTitle} style={{ margin: 0 }}>DSA Topics Asked</h3>
                      </div>
                      <div className={styles.tags}>
                        {data.dsaTopics.map((topic: string, i: number) => (
                          <span key={i} className={styles.tag}>{topic}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.previousQuestions && data.previousQuestions.length > 0 && (
                    <div className={styles.section}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <BookOpen size={18} strokeWidth={2} color="#8b5cf6" />
                        <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Previous Year Questions</h3>
                      </div>
                      <div className={styles.links}>
                        {data.previousQuestions.map((item: any, i: number) => (
                          <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" className={styles.link} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span>{item.title}</span>
                            <ExternalLink size={13} strokeWidth={2} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.interviewBank && data.interviewBank.length > 0 && (
                    <div className={styles.section}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Mic size={18} strokeWidth={2} color="#ef4444" />
                        <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Interview Question Bank Links</h3>
                      </div>
                      <div className={styles.links}>
                        {data.interviewBank.map((item: any, i: number) => (
                          <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" className={styles.link} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span>{item.title}</span>
                            <ExternalLink size={13} strokeWidth={2} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.systemDesign && (
                    <div className={styles.section}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Layers size={18} strokeWidth={2} color="#3b82f6" />
                        <h3 className={styles.sectionTitle} style={{ margin: 0 }}>System Design Expectations</h3>
                      </div>
                      <p className={styles.sectionText}>{data.systemDesign}</p>
                    </div>
                  )}

                  {data.projects && (
                    <div className={styles.section}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Rocket size={18} strokeWidth={2} color="#10b981" />
                        <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Projects Expected</h3>
                      </div>
                      <p className={styles.sectionText}>{data.projects}</p>
                    </div>
                  )}

                  {data.behavioral && (
                    <div className={styles.section}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Brain size={18} strokeWidth={2} color="#8b5cf6" />
                        <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Behavioral / HR Questions</h3>
                      </div>
                      <p className={styles.sectionText}>{data.behavioral}</p>
                    </div>
                  )}

                  {data.culture && (
                    <div className={styles.section}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Sparkles size={18} strokeWidth={2} color="#eab308" />
                        <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Company Culture & Values</h3>
                      </div>
                      <p className={styles.sectionText}>{data.culture}</p>
                    </div>
                  )}

                  {data.salary && (
                    <div className={styles.section}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <DollarSign size={18} strokeWidth={2} color="#10b981" />
                        <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Salary & Compensation Structure</h3>
                      </div>
                      <p className={styles.sectionText}>{data.salary}</p>
                    </div>
                  )}

                  <div className={styles.section}>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => downloadPDF(selected, data)}
                      style={{ width: '100%', padding: '16px', fontSize: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <Download size={18} strokeWidth={2} />
                      <span>Download Complete Details as PDF</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className={styles.error} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <TriangleAlert size={32} strokeWidth={2} color="#ef4444" />
                  <p>Failed to load data</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

