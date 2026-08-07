'use client'
import { useState } from 'react'
import StudentSidebar from '@/components/StudentSidebar'
import styles from './companies.module.css'

const COMPANIES = [
  { id: 1, name: 'Google', logo: '🏔', industry: 'Technology', jobs: 24, rating: 4.8, employees: '10,000+', color: '#4285f4', location: 'Mountain View, CA' },
  { id: 2, name: 'Amazon', logo: '⚡', industry: 'E-Commerce', jobs: 18, rating: 4.6, employees: '5,000+', color: '#ff9900', location: 'Seattle, WA' },
  { id: 3, name: 'Microsoft', logo: '🔷', industry: 'Software', jobs: 32, rating: 4.7, employees: '8,000+', color: '#0078d4', location: 'Redmond, WA' },
  { id: 4, name: 'Meta', logo: '🌐', industry: 'Social Media', jobs: 15, rating: 4.5, employees: '3,000+', color: '#0668e1', location: 'Menlo Park, CA' },
  { id: 5, name: 'Apple', logo: '🍎', industry: 'Technology', jobs: 12, rating: 4.9, employees: '6,000+', color: '#a2aaad', location: 'Cupertino, CA' },
  { id: 6, name: 'Netflix', logo: '🎬', industry: 'Entertainment', jobs: 8, rating: 4.4, employees: '2,000+', color: '#e50914', location: 'Los Gatos, CA' },
  { id: 7, name: 'Tesla', logo: '⚡', industry: 'Automotive', jobs: 20, rating: 4.3, employees: '4,000+', color: '#cc0000', location: 'Austin, TX' },
  { id: 8, name: 'Spotify', logo: '🎵', industry: 'Music', jobs: 10, rating: 4.6, employees: '1,500+', color: '#1db954', location: 'Stockholm, Sweden' },
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
            <h1 className={styles.pageTitle}>🏢 Company Profiles</h1>
            <p className={styles.pageSubtitle}>
              Explore companies, their culture, jobs, and important insights
            </p>
          </div>
          {selectedCompany && (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSelectedCompany(null)
                setCompanyData(null)
              }}
            >
              ← Back to Companies
            </button>
          )}
        </header>

        <main className={styles.main}>
          {!selectedCompany ? (
            <>
              <div className={styles.searchBar}>
                <div className={styles.searchWrapper}>
                  <span className={styles.searchIcon}>🔍</span>
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
                      <div className={styles.companyLogo} style={{ background: `${company.color}20` }}>
                        <span style={{ fontSize: '32px' }}>{company.logo}</span>
                      </div>
                      <div className={styles.companyRating}>
                        <span className={styles.ratingIcon}>⭐</span>
                        <span className={styles.ratingValue}>{company.rating}</span>
                      </div>
                    </div>

                    <div className={styles.companyBody}>
                      <h3 className={styles.companyName}>{company.name}</h3>
                      <p className={styles.companyIndustry}>{company.industry}</p>
                      <p className={styles.companyLocation}>📍 {company.location}</p>

                      <div className={styles.companyStats}>
                        <div className={styles.statItem}>
                          <span className={styles.statIcon}>💼</span>
                          <div>
                            <div className={styles.statValue}>{company.jobs}</div>
                            <div className={styles.statLabel}>Open Jobs</div>
                          </div>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statIcon}>👥</span>
                          <div>
                            <div className={styles.statValue}>{company.employees}</div>
                            <div className={styles.statLabel}>Employees</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={styles.companyFooter}>
                      <button className={`btn btn-primary btn-sm ${styles.viewBtn}`}>
                        View Profile →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className={styles.profileSection}>
              {loading ? (
                <div className={styles.loadingCard}>
                  <div className={styles.loadingSpinner}></div>
                  <p>Loading {selectedCompany.name} profile...</p>
                </div>
              ) : companyData ? (
                <>
                  <div className={styles.profileHeader}>
                    <div className={styles.profileLogo} style={{ background: `${selectedCompany.color}20` }}>
                      <span style={{ fontSize: '48px' }}>{selectedCompany.logo}</span>
                    </div>
                    <div className={styles.profileInfo}>
                      <h2 className={styles.profileName}>{selectedCompany.name}</h2>
                      <p className={styles.profileIndustry}>{selectedCompany.industry}</p>
                      <div className={styles.profileMeta}>
                        <span>📍 {selectedCompany.location}</span>
                        <span>⭐ {selectedCompany.rating}/5</span>
                        <span>👥 {selectedCompany.employees} employees</span>
                      </div>
                    </div>
                  </div>

                  {companyData.overview && (
                    <div className={styles.profileCard}>
                      <h3 className={styles.cardTitle}>🏢 Company Overview</h3>
                      <p className={styles.cardText}>{companyData.overview}</p>
                    </div>
                  )}

                  {companyData.keyPoints && companyData.keyPoints.length > 0 && (
                    <div className={styles.profileCard}>
                      <h3 className={styles.cardTitle}>💡 Key Points & Highlights</h3>
                      <div className={styles.keyPointsList}>
                        {companyData.keyPoints.map((point: string, i: number) => (
                          <div key={i} className={styles.keyPointItem}>
                            <span className={styles.keyPointIcon}>✓</span>
                            <span>{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {companyData.jobs && companyData.jobs.length > 0 && (
                    <div className={styles.profileCard}>
                      <h3 className={styles.cardTitle}>💼 Open Positions</h3>
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
                                >
                                  Apply →
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
                      <h3 className={styles.cardTitle}>📊 Market Insights & News</h3>
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
                                >
                                  Read more →
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
                <div className={styles.errorCard}>
                  <span className={styles.errorIcon}>⚠️</span>
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
