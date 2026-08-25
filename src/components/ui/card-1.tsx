'use client'

import React from 'react'
import styles from './card-1.module.css'
import {
  MapPin,
  ExternalLink,
  Briefcase,
  Building2,
  Bookmark,
  CheckCircle2,
  Calendar
} from 'lucide-react'

export interface JobOpportunityCardProps {
  position: string
  company: string
  location?: string
  date?: string
  jobUrl: string
  type?: string
  experience?: string
  salary?: string
  logo?: string
  status?: string
  onSave?: () => void
  isSaved?: boolean
  className?: string
}

function getAvatarColor(name: string) {
  const colors = [
    'linear-gradient(135deg, #7c3aed, #4f46e5)',
    'linear-gradient(135deg, #2563eb, #06b6d4)',
    'linear-gradient(135deg, #059669, #10b981)',
    'linear-gradient(135deg, #d97706, #f59e0b)',
    'linear-gradient(135deg, #db2777, #f43f5e)',
    'linear-gradient(135deg, #9333ea, #c084fc)'
  ]
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function deriveJobType(position: string, explicitType?: string): string {
  if (explicitType) return explicitType
  const lower = (position || '').toLowerCase()
  if (lower.includes('intern') || lower.includes('trainee')) return 'Internship'
  if (lower.includes('contract') || lower.includes('freelance')) return 'Contract'
  if (lower.includes('part-time') || lower.includes('part time')) return 'Part-Time'
  return 'Full-Time'
}

function deriveExperience(position: string, explicitExp?: string): string {
  if (explicitExp) return explicitExp
  const lower = (position || '').toLowerCase()
  if (lower.includes('senior') || lower.includes('lead') || lower.includes('sr.')) return '3–6 Yrs'
  if (lower.includes('principal') || lower.includes('architect') || lower.includes('staff')) return '5+ Yrs'
  if (lower.includes('junior') || lower.includes('intern') || lower.includes('fresher') || lower.includes('entry') || lower.includes('associate')) return '0–2 Yrs'
  return '1–3 Yrs'
}

function deriveSalary(position: string, explicitSalary?: string): string {
  if (explicitSalary && explicitSalary.trim() !== '') return explicitSalary
  const lower = (position || '').toLowerCase()
  if (lower.includes('intern')) return '₹25K–40K/mo'
  if (lower.includes('senior') || lower.includes('lead')) return '₹18–28 LPA'
  return '₹8–15 LPA'
}

export const Card1: React.FC<JobOpportunityCardProps> = ({
  position,
  company,
  location = 'India (Remote / Hybrid)',
  date = 'Recently Added',
  jobUrl,
  type,
  experience,
  salary,
  logo,
  status = 'Active Hiring',
  onSave,
  isSaved = false,
  className = ''
}) => {
  const resolvedType = deriveJobType(position, type)
  const resolvedExp = deriveExperience(position, experience)
  const resolvedSalary = deriveSalary(position, salary)
  const initial = company ? company.trim().charAt(0).toUpperCase() : 'J'

  return (
    <div className={`${styles.card} ${className}`}>
      {/* 1. Top Bar: Presence Indicator & Posted Date */}
      <div className={styles.topBar}>
        <div className={styles.presenceBadge}>
          <span className={styles.presenceDot} />
          <span>{status}</span>
        </div>
        <span className={styles.postedDate}>{date}</span>
      </div>

      {/* 2. Header: Company Logo, Job Title & Location */}
      <div className={styles.header}>
        <div
          className={styles.logoWrapper}
          style={{ background: getAvatarColor(company || position) }}
        >
          {logo ? (
            <img src={logo} alt={company} className={styles.logoImg} onError={(e) => {
              e.currentTarget.style.display = 'none'
            }} />
          ) : (
            <span>{initial}</span>
          )}
        </div>
        <div className={styles.info}>
          <h4 className={styles.jobTitle} title={position}>
            {position}
          </h4>
          <div className={styles.companyRow}>
            <Building2 size={13} strokeWidth={2} />
            <span>{company || 'Tech Partner'}</span>
          </div>
          <div className={styles.locationRow}>
            <MapPin size={12} strokeWidth={2} />
            <span>{location}</span>
          </div>
        </div>
      </div>

      {/* 3. Three-Up Stat Strip */}
      <div className={styles.statStrip}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Type</span>
          <span className={styles.statValue} title={resolvedType}>{resolvedType}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Exp Level</span>
          <span className={styles.statValue} title={resolvedExp}>{resolvedExp}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Package</span>
          <span className={styles.statValue} title={resolvedSalary}>{resolvedSalary}</span>
        </div>
      </div>

      {/* 4. Footer: View/Apply CTA and Connect Toggle */}
      <div className={styles.footer}>
        <a
          href={jobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.applyButton}
          aria-label={`View job ${position} at ${company}`}
        >
          <span>View Job</span>
          <ExternalLink size={14} strokeWidth={2} />
        </a>
        {onSave && (
          <button
            onClick={onSave}
            type="button"
            className={styles.secondaryAction}
            aria-label={isSaved ? 'Job saved' : 'Save job'}
            title={isSaved ? 'Saved' : 'Save Job'}
          >
            <Bookmark
              size={15}
              strokeWidth={2}
              color={isSaved ? '#f59e0b' : 'currentColor'}
              fill={isSaved ? '#f59e0b' : 'none'}
            />
          </button>
        )}
      </div>
    </div>
  )
}

export default Card1
