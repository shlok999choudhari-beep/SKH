'use client'
import { useState, useEffect } from 'react'
import StudentSidebar from '@/components/StudentSidebar'
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
  Loader2
} from 'lucide-react'

interface Job {
  position: string
  company: string
  location: string
  date: string
  jobUrl: string
  salary?: string
  companyUrl?: string
}

export default function BrowseJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set())
  const [filters, setFilters] = useState({
    type: 'all',
    experience: 'all'
  })

  const toggleSave = (idx: number) => {
    setSavedIds(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: search || 'intern', location: location || 'India' })
      })
      const data = await res.json()
      setJobs(data.jobs || [])
    } catch (err) {
      console.error('Failed to fetch jobs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchJobs()
  }

  const filteredJobs = jobs.filter(job => {
    if (filters.type !== 'all') {
      const isInternship = job.position.toLowerCase().includes('intern')
      if (filters.type === 'internship' && !isInternship) return false
      if (filters.type === 'fulltime' && isInternship) return false
    }
    return true
  })

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.content}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.headerTop}>
              <div>
                <h1 className={styles.title}>Browse <span className="grad-text">Jobs</span></h1>
                <p className={styles.subtitle}>Discover opportunities from top companies worldwide</p>
              </div>
              <div className={styles.stats}>
                <div className={styles.statItem}>
                  <span className={styles.statNum}>{filteredJobs.length}</span>
                  <span className={styles.statLabel}>Jobs Found</span>
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
                  placeholder="Search jobs, companies, keywords..."
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
                All Jobs
              </button>
              <button
                className={`${styles.filterBtn} ${filters.type === 'internship' ? styles.active : ''}`}
                onClick={() => setFilters({...filters, type: 'internship'})}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <GraduationCap size={14} strokeWidth={2} />
                <span>Internships</span>
              </button>
              <button
                className={`${styles.filterBtn} ${filters.type === 'fulltime' ? styles.active : ''}`}
                onClick={() => setFilters({...filters, type: 'fulltime'})}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Briefcase size={14} strokeWidth={2} />
                <span>Full-time</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className={styles.loading} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '3.5rem' }}>
              <MorphingInfinity className="size-16" style={{ width: '64px', height: '64px', color: '#8b5cf6' }} />
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Finding amazing opportunities for you...</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', marginTop: '16px' }}>
              {filteredJobs.map((job, idx) => (
                <Card1
                  key={idx}
                  position={job.position}
                  company={job.company}
                  location={job.location}
                  date={job.date}
                  jobUrl={job.jobUrl}
                  salary={job.salary}
                  isSaved={savedIds.has(idx)}
                  onSave={() => toggleSave(idx)}
                />
              ))}
            </div>
          )}

          {!loading && filteredJobs.length === 0 && (
            <div className={styles.empty}>
              <div className={styles.emptyIcon} style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                <Search size={40} strokeWidth={1.5} color="var(--text-muted)" />
              </div>
              <h3>No jobs found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

