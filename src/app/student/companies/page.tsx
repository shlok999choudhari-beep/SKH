'use client'
import { useState } from 'react'
import StudentSidebar from '@/components/StudentSidebar'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import styles from './companies.module.css'
import {
  Building2,
  ArrowLeft,
  ArrowRight,
  Search,
  Star,
  MapPin,
  Briefcase,
  Users,
  Lightbulb,
  CheckCircle2,
  BarChart2,
  ExternalLink,
  TriangleAlert
} from 'lucide-react'

const COMPANIES = [
  { id: 1, name: 'Google', logo: 'G', industry: 'Technology', jobs: 24, rating: 4.8, employees: '10,000+', color: '#4285f4', location: 'Mountain View, CA' },
  { id: 2, name: 'Amazon', logo: 'A', industry: 'E-Commerce', jobs: 18, rating: 4.6, employees: '5,000+', color: '#ff9900', location: 'Seattle, WA' },
  { id: 3, name: 'Microsoft', logo: 'M', industry: 'Software', jobs: 32, rating: 4.7, employees: '8,000+', color: '#0078d4', location: 'Redmond, WA' },
  { id: 4, name: 'Meta', logo: 'M', industry: 'Social Media', jobs: 15, rating: 4.5, employees: '3,000+', color: '#0668e1', location: 'Menlo Park, CA' },
  { id: 5, name: 'Apple', logo: 'A', industry: 'Technology', jobs: 12, rating: 4.9, employees: '6,000+', color: '#a2aaad', location: 'Cupertino, CA' },
  { id: 6, name: 'Netflix', logo: 'N', industry: 'Entertainment', jobs: 8, rating: 4.4, employees: '2,000+', color: '#e50914', location: 'Los Gatos, CA' },
  { id: 7, name: 'Tesla', logo: 'T', industry: 'Automotive', jobs: 20, rating: 4.3, employees: '4,000+', color: '#cc0000', location: 'Austin, TX' },
  { id: 8, name: 'Spotify', logo: 'S', industry: 'Music', jobs: 10, rating: 4.6, employees: '1,500+', color: '#1db954', location: 'Stockholm, Sweden' },
]

export default function Companies() {
  const [search, setSearch] = useState('')
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [companyData, setCompanyData] = useState<any>(null)

  const filtered = COMPANIES.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.industry.toLowerCase().includes(search.toLowerCase())
  )

  const fetchCompanyProfile = async (company: any) => {
    setSelectedCompany(company)
    setLoading(true)
    setCompanyData(null)

    try {
      const res = await fetch('/api/company-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: company.name })
      })

      const data = await res.json()
      if (res.ok) {
        setCompanyData(data)
      }
    } catch (error) {
      console.error('Error fetching company profile:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={24} strokeWidth={2} color="#8b5cf6" />
              <h1 className={styles.pageTitle}>Company Profiles</h1>
            </div>
            <p className={styles.pageSubtitle}>
              Explore companies, their culture, jobs, and important insights
            </p>
          </div>
          {selectedCompany && (
            <button 
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={() => {
                setSelectedCompany(null)
                setCompanyData(null)
              }}
            >
              <ArrowLeft size={14} strokeWidth={2} />
              <span>Back to Companies</span>
            </button>
          )}
        </header>

        <main className={styles.main}>
          {!selectedCompany ? (
            <>
              <div className={styles.searchBar}>
                <div className={styles.searchWrapper}>
                  <span className={styles.searchIcon} style={{ display: 'flex', alignItems: 'center' }}>
                    <Search size={16} strokeWidth={2} color="var(--text-muted)" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search companies by name or industry..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>
              </div>

              <div className={styles.companiesGrid}>
                {filtered.map(company => (
                  <div 
                    key={company.id} 
                    className={styles.companyCard}
                    onClick={() => fetchCompanyProfile(company)}
                  >
                    <div className={styles.companyHeader}>
                      <div className={styles.companyLogo} style={{ background: `${company.color}20`, fontWeight: 800, fontSize: '24px', color: company.color }}>
                        {company.logo}
                      </div>
                      <div className={styles.companyRating} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Star size={14} fill="#f59e0b" strokeWidth={0} />
                        <span className={styles.ratingValue}>{company.rating}</span>
                      </div>
                    </div>

                    <div className={styles.companyBody}>
                      <h3 className={styles.companyName}>{company.name}</h3>
                      <p className={styles.companyIndustry}>{company.industry}</p>
                      <p className={styles.companyLocation} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={13} strokeWidth={2} />
                        <span>{company.location}</span>
                      </p>

                      <div className={styles.companyStats}>
                        <div className={styles.statItem}>
                          <span className={styles.statIcon} style={{ display: 'inline-flex', alignItems: 'center' }}>
                            <Briefcase size={16} strokeWidth={2} color="#8b5cf6" />
                          </span>
                          <div>
                            <div className={styles.statValue}>{company.jobs}</div>
                            <div className={styles.statLabel}>Open Jobs</div>
                          </div>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statIcon} style={{ display: 'inline-flex', alignItems: 'center' }}>
                            <Users size={16} strokeWidth={2} color="#3b82f6" />
                          </span>
                          <div>
                            <div className={styles.statValue}>{company.employees}</div>
                            <div className={styles.statLabel}>Employees</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={styles.companyFooter}>
                      <button className={`btn btn-primary btn-sm ${styles.viewBtn}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <span>View Profile</span>
                        <ArrowRight size={14} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className={styles.profileSection}>
              {loading ? (
                <div className={styles.loadingCard} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '3.5rem' }}>
                  <MorphingInfinity className="size-16" style={{ width: '64px', height: '64px', color: '#8b5cf6' }} />
                  <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Loading {selectedCompany.name} profile...</p>
                </div>
              ) : companyData ? (
                <>
                  <div className={styles.profileHeader}>
                    <div className={styles.profileLogo} style={{ background: `${selectedCompany.color}20`, fontWeight: 800, fontSize: '32px', color: selectedCompany.color }}>
                      {selectedCompany.logo}
                    </div>
                    <div className={styles.profileInfo}>
                      <h2 className={styles.profileName}>{selectedCompany.name}</h2>
                      <p className={styles.profileIndustry}>{selectedCompany.industry}</p>
                      <div className={styles.profileMeta} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={13} strokeWidth={2} />
                          <span>{selectedCompany.location}</span>
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Star size={13} fill="#f59e0b" strokeWidth={0} />
                          <span>{selectedCompany.rating}/5</span>
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Users size={13} strokeWidth={2} />
                          <span>{selectedCompany.employees} employees</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {companyData.overview && (
                    <div className={styles.profileCard}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Building2 size={18} strokeWidth={2} color="#8b5cf6" />
                        <h3 className={styles.cardTitle} style={{ margin: 0 }}>Company Overview</h3>
                      </div>
                      <p className={styles.cardText}>{companyData.overview}</p>
                    </div>
                  )}

                  {companyData.keyPoints && companyData.keyPoints.length > 0 && (
                    <div className={styles.profileCard}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Lightbulb size={18} strokeWidth={2} color="#f59e0b" />
                        <h3 className={styles.cardTitle} style={{ margin: 0 }}>Key Points & Highlights</h3>
                      </div>
                      <div className={styles.keyPointsList}>
                        {companyData.keyPoints.map((point: string, i: number) => (
                          <div key={i} className={styles.keyPointItem} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle2 size={15} strokeWidth={2} color="#10b981" />
                            <span>{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {companyData.jobs && companyData.jobs.length > 0 && (
                    <div className={styles.profileCard}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Briefcase size={18} strokeWidth={2} color="#3b82f6" />
                        <h3 className={styles.cardTitle} style={{ margin: 0 }}>Open Positions</h3>
                      </div>
                      <div className={styles.jobsList}>
                        {companyData.jobs.map((job: any, i: number) => (
                          <div key={i} className={styles.jobItem}>
                            <div className={styles.jobHeader}>
                              <h4 className={styles.jobTitle}>{job.title}</h4>
                              {job.link && (
                                <a 
                                  href={job.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className={styles.jobLink}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <span>Apply</span>
                                  <ExternalLink size={12} strokeWidth={2} />
                                </a>
                              )}
                            </div>
                            {job.description && (
                              <p className={styles.jobDescription}>{job.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {companyData.insights && companyData.insights.length > 0 && (
                    <div className={styles.profileCard}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <BarChart2 size={18} strokeWidth={2} color="#8b5cf6" />
                        <h3 className={styles.cardTitle} style={{ margin: 0 }}>Market Insights & News</h3>
                      </div>
                      <div className={styles.insightsList}>
                        {companyData.insights.map((insight: any, i: number) => (
                          <div key={i} className={styles.insightItem}>
                            <div className={styles.insightNumber}>{i + 1}</div>
                            <div className={styles.insightContent}>
                              <h4 className={styles.insightTitle}>{insight.title}</h4>
                              {insight.snippet && (
                                <p className={styles.insightSnippet}>{insight.snippet}</p>
                              )}
                              {insight.link && (
                                <a 
                                  href={insight.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className={styles.insightLink}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <span>Read more</span>
                                  <ExternalLink size={12} strokeWidth={2} />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.errorCard} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <TriangleAlert size={32} strokeWidth={2} color="#ef4444" />
                  <p>Failed to load company profile. Please try again.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
