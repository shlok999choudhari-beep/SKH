'use client'
import { useState, useEffect } from 'react'
import StudentSidebar from '@/components/StudentSidebar'
import styles from './jobs.module.css'

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
  const [filters, setFilters] = useState({
    type: 'all',
    experience: 'all'
  })

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
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search jobs, companies, keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.searchGroup}>
            <span className={styles.searchIcon}>📍</span>
            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '⏳' : '🚀'} Search
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
          >
            🎓 Internships
          </button>
          <button
            className={`${styles.filterBtn} ${filters.type === 'fulltime' ? styles.active : ''}`}
            onClick={() => setFilters({...filters, type: 'fulltime'})}
          >
            💼 Full-time
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Finding amazing opportunities for you...</p>
        </div>
      ) : (
        <div className={styles.jobsGrid}>
          {filteredJobs.map((job, idx) => (
            <div key={idx} className={`glass ${styles.jobCard}`}>
              <div className={styles.jobHeader}>
                <div className={styles.companyLogo}>
                  {job.company.charAt(0).toUpperCase()}
                </div>
                <div className={styles.jobMeta}>
                  <h3 className={styles.jobTitle}>{job.position}</h3>
                  <p className={styles.companyName}>{job.company}</p>
                </div>
              </div>

              <div className={styles.jobDetails}>
                <div className={styles.jobDetail}>
                  <span className={styles.detailIcon}>📍</span>
                  <span>{job.location}</span>
                </div>
                <div className={styles.jobDetail}>
                  <span className={styles.detailIcon}>📅</span>
                  <span>{job.date}</span>
                </div>
                {job.salary && (
                  <div className={styles.jobDetail}>
                    <span className={styles.detailIcon}>💰</span>
                    <span>{job.salary}</span>
                  </div>
                )}
              </div>

              <div className={styles.jobTags}>
                {job.position.toLowerCase().includes('intern') && (
                  <span className="badge badge-purple">Internship</span>
                )}
                {job.position.toLowerCase().includes('remote') && (
                  <span className="badge badge-green">Remote</span>
                )}
                {job.position.toLowerCase().includes('senior') && (
                  <span className="badge badge-orange">Senior</span>
                )}
              </div>

              <div className={styles.jobActions}>
                <a
                  href={job.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                >
                  Apply Now →
                </a>
                <button className="btn btn-secondary btn-sm">
                  💾 Save
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredJobs.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🔍</div>
          <h3>No jobs found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      )}
        </div>
      </div>
    </div>
  )
}
