'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import StudentSidebar from '@/components/StudentSidebar'
import BackButton from '@/components/BackButton'
import Card1 from '@/components/ui/card-1'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import styles from './jobs.module.css'
import {
  Search,
  MapPin,
  Calendar,
  DollarSign,
  GraduationCap,
  Briefcase,
  ExternalLink,
  Bookmark,
  Building2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react'

interface Job {
  position: string
  company: string
  location: string
  date: string
  jobUrl: string
  salary?: string
  companyUrl?: string
  isPartner?: boolean
  id?: number
  duration?: string
  minCgpa?: number | null
}

export default function BrowseJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [partnerInternships, setPartnerInternships] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState({
    type: 'all',
    experience: 'all'
  })

  const toggleSave = (key: string) => {
    setSavedIds(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const fetchOpportunities = async () => {
    setLoading(true)
    try {
      const [internRes, jobsRes] = await Promise.all([
        fetch('/api/internships', { cache: 'no-store' }).then(r => r.json()).catch(() => ({})),
        fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword: search || 'intern', location: location || 'India' })
        }).then(r => r.json()).catch(() => ({}))
      ])

      const partnerList = internRes.internships || []
      setPartnerInternships(partnerList)

      const externalJobs: Job[] = (jobsRes.jobs || []).map((j: any) => ({
        position: j.position,
        company: j.company,
        location: j.location,
        date: j.date,
        jobUrl: j.jobUrl,
        salary: j.salary,
        companyUrl: j.companyUrl,
        isPartner: false
      }))

      setJobs(externalJobs)
    } catch (err) {
      console.error('Failed to fetch opportunities:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOpportunities()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchOpportunities()
  }

  // Filter partner company internships based on search query
  const filteredPartnerInternships = partnerInternships.filter(p => {
    if (filters.type === 'fulltime') return false
    const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.company_name?.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase())
    const matchLoc = !location || p.location?.toLowerCase().includes(location.toLowerCase())
    return matchSearch && matchLoc
  })

  const filteredExternalJobs = jobs.filter(job => {
    if (filters.type !== 'all') {
      const isInternship = job.position.toLowerCase().includes('intern')
      if (filters.type === 'internship' && !isInternship) return false
      if (filters.type === 'fulltime' && isInternship) return false
    }
    return true
  })

  const totalCount = filteredPartnerInternships.length + filteredExternalJobs.length

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.content}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.headerTop}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <BackButton fallbackHref="/student/dashboard" />
                <div>
                  <h1 className={styles.title}>Browse <span className="grad-text">Jobs & Internships</span></h1>
                  <p className={styles.subtitle}>Discover verified partner roles and global job market opportunities</p>
                </div>
              </div>
              <div className={styles.stats}>
                <div className={styles.statItem}>
                  <span className={styles.statNum}>{totalCount}</span>
                  <span className={styles.statLabel}>Opportunities</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSearch} className={styles.searchBar}>
              <div className={styles.searchGroup}>
                <span className={styles.searchIcon} style={{ display: 'flex', alignItems: 'center' }}>
                  <Search size={16} strokeWidth={2} />
                </span>
                <input
                  type="text"
                  placeholder="Search roles, companies, skills..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
              <div className={styles.searchGroup}>
                <span className={styles.searchIcon} style={{ display: 'flex', alignItems: 'center' }}>
                  <MapPin size={16} strokeWidth={2} />
                </span>
                <input
                  type="text"
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {loading ? <MorphingInfinity className="size-4" style={{ width: '16px', height: '16px' }} /> : <Search size={16} strokeWidth={2} />}
                <span>Search</span>
              </button>
            </form>

            <div className={styles.filters}>
              <button
                className={`${styles.filterBtn} ${filters.type === 'all' ? styles.active : ''}`}
                onClick={() => setFilters({...filters, type: 'all'})}
              >
                All Opportunities
              </button>
              <button
                className={`${styles.filterBtn} ${filters.type === 'internship' ? styles.active : ''}`}
                onClick={() => setFilters({...filters, type: 'internship'})}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <GraduationCap size={14} strokeWidth={2} />
                <span>Internships ({filteredPartnerInternships.length + (filters.type === 'internship' ? filteredExternalJobs.length : 0)})</span>
              </button>
              <button
                className={`${styles.filterBtn} ${filters.type === 'fulltime' ? styles.active : ''}`}
                onClick={() => setFilters({...filters, type: 'fulltime'})}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Briefcase size={14} strokeWidth={2} />
                <span>Full-time Roles</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className={styles.loading} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '3.5rem' }}>
              <MorphingInfinity className="size-16" style={{ width: '64px', height: '64px', color: '#8b5cf6' }} />
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Loading latest opportunities...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Partner Company Verified Opportunities Section */}
              {filteredPartnerInternships.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={18} strokeWidth={2} color="#10b981" />
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                        Verified Partner Opportunities ({filteredPartnerInternships.length})
                      </h3>
                    </div>
                    <Link
                      href="/student/internships"
                      style={{ fontSize: '0.85rem', color: '#8b5cf6', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <span>Go to Internships Portal</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                    {filteredPartnerInternships.map((intern) => (
                      <div
                        key={`partner-${intern.id}`}
                        style={{
                          background: 'var(--bg-secondary)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          borderRadius: '16px',
                          padding: '1.25rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          position: 'relative',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <ShieldCheck size={12} strokeWidth={2} />
                              <span>Campus Partner</span>
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {intern.duration || '3 Months'}
                            </span>
                          </div>

                          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '4px 0', color: 'var(--text-primary)' }}>
                            {intern.title}
                          </h4>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>
                            <Building2 size={14} strokeWidth={2} />
                            <span>{intern.company_name}</span>
                            <span style={{ color: 'var(--text-muted)' }}>•</span>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>{intern.location || 'Remote'}</span>
                          </div>

                          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {intern.description}
                          </p>
                        </div>

                        <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {intern.stipend || '₹25,000 / month'}
                          </div>
                          <Link
                            href="/student/internships"
                            className="btn btn-primary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <span>Apply in Portal</span>
                            <ArrowRight size={13} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* External Job Market Listings */}
              {filteredExternalJobs.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                    <Briefcase size={18} strokeWidth={2} color="#8b5cf6" />
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      Global Job Market Listings ({filteredExternalJobs.length})
                    </h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {filteredExternalJobs.map((job, idx) => {
                      const saveKey = `ext-${idx}`
                      return (
                        <Card1
                          key={saveKey}
                          position={job.position}
                          company={job.company}
                          location={job.location}
                          date={job.date}
                          jobUrl={job.jobUrl}
                          salary={job.salary}
                          isSaved={savedIds.has(saveKey)}
                          onSave={() => toggleSave(saveKey)}
                        />
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {!loading && totalCount === 0 && (
            <div className={styles.empty}>
              <div className={styles.emptyIcon} style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                <Search size={40} strokeWidth={1.5} color="var(--text-muted)" />
              </div>
              <h3>No opportunities found</h3>
              <p>Try adjusting your search query or reset filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

