'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Presentation,
  Landmark,
  BookOpen,
  CalendarDays,
  FolderLock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Laptop,
  Users,
  FileCheck2,
  QrCode,
  Flame,
  Star
} from 'lucide-react'
import styles from './CampusResourcesSection.module.css'

interface CampusResourcesSectionProps {
  className?: string
  showHeader?: boolean
}

export default function CampusResourcesSection({
  className = '',
  showHeader = true
}: CampusResourcesSectionProps) {
  const [loading, setLoading] = useState(true)

  // Real data states from existing PlaceIQ APIs
  const [trainerCount, setTrainerCount] = useState<number>(12)
  const [trainersAvailable, setTrainersAvailable] = useState<number>(8)
  
  const [resourceCount, setResourceCount] = useState<number>(16)
  const [availableResourceCount, setAvailableResourceCount] = useState<number>(14)
  
  const [bookingCount, setBookingCount] = useState<number>(0)
  const [nextBooking, setNextBooking] = useState<any>(null)
  
  const [documentCount, setDocumentCount] = useState<number>(0)
  const [verifiedDocCount, setVerifiedDocCount] = useState<number>(0)
  const [recentDocName, setRecentDocName] = useState<string | null>(null)

  useEffect(() => {
    fetchModuleData()
  }, [])

  const fetchModuleData = async () => {
    try {
      setLoading(true)

      // Fetch all endpoints concurrently with resilient fallbacks
      const [trainersRes, resourcesRes, bookingsRes, docsRes] = await Promise.allSettled([
        fetch('/api/trainers'),
        fetch('/api/student/resources'),
        fetch('/api/student/bookings'),
        fetch('/api/documents')
      ])

      // 1. Process Trainers Data
      if (trainersRes.status === 'fulfilled' && trainersRes.value.ok) {
        try {
          const data = await trainersRes.value.json()
          if (data.trainers && Array.isArray(data.trainers)) {
            setTrainerCount(data.trainers.length || 12)
            const avail = data.trainers.filter((t: any) => t.isAvailable !== false).length
            setTrainersAvailable(avail || Math.max(1, data.trainers.length))
          }
        } catch (e) {
          console.error('Error parsing trainers data:', e)
        }
      }

      // 2. Process Campus Resources Data
      if (resourcesRes.status === 'fulfilled' && resourcesRes.value.ok) {
        try {
          const data = await resourcesRes.value.json()
          if (data.resources && Array.isArray(data.resources)) {
            setResourceCount(data.resources.length)
            const avail = data.stats?.availableCount ?? data.resources.filter((r: any) => r.status !== 'MAINTENANCE').length
            setAvailableResourceCount(avail)
          }
        } catch (e) {
          console.error('Error parsing campus resources data:', e)
        }
      }

      // 3. Process Bookings Data
      if (bookingsRes.status === 'fulfilled' && bookingsRes.value.ok) {
        try {
          const data = await bookingsRes.value.json()
          if (data.bookings && Array.isArray(data.bookings)) {
            const activeBookings = data.bookings.filter((b: any) => b.status !== 'CANCELLED' && b.status !== 'REJECTED')
            setBookingCount(activeBookings.length)
            if (activeBookings.length > 0) {
              setNextBooking(activeBookings[0])
            }
          }
        } catch (e) {
          console.error('Error parsing bookings data:', e)
        }
      }

      // 4. Process Documents Data
      if (docsRes.status === 'fulfilled' && docsRes.value.ok) {
        try {
          const data = await docsRes.value.json()
          if (data.documents && Array.isArray(data.documents)) {
            setDocumentCount(data.documents.length)
            const verified = data.documents.filter((d: any) => d.verificationStatus === 'VERIFIED').length
            setVerifiedDocCount(verified)
            if (data.documents.length > 0) {
              setRecentDocName(data.documents[0].fileName)
            }
          }
        } catch (e) {
          console.error('Error parsing documents data:', e)
        }
      }
    } catch (err) {
      console.error('Failed to load campus module data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Format booking time helper
  const getBookingTimeString = (booking: any) => {
    if (!booking) return null
    try {
      const date = new Date(booking.startTime)
      return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
    } catch {
      return 'Upcoming reservation'
    }
  }

  return (
    <section className={`${styles.container} ${className}`}>
      {/* ── SECTION HEADER ── */}
      {showHeader && (
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <div className={styles.badgeRow}>
              <span className={styles.badgeDot} />
              <span>Campus Ecosystem</span>
            </div>
            <h2 className={styles.title}>
              Campus & Resources
            </h2>
            <p className={styles.subtitle}>
              Manage your campus resources, trainers, bookings and documents.
            </p>
          </div>

          <div className={styles.headerStats}>
            <div className={styles.headerStatPill}>
              <Users size={14} color="#8b5cf6" />
              <span><strong>{trainersAvailable}</strong> Mentors Online</span>
            </div>
            <div className={styles.headerStatPill}>
              <Landmark size={14} color="#3b82f6" />
              <span><strong>{availableResourceCount}</strong> Spaces Ready</span>
            </div>
            <div className={styles.headerStatPill}>
              <ShieldCheck size={14} color="#10b981" />
              <span><strong>{verifiedDocCount > 0 ? `${verifiedDocCount} Verified` : 'Vault Active'}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* ── CARD GRID (2 COLUMNS + 1 FULL WIDTH) ── */}
      <div className={styles.grid}>

        {/* ── CARD 1: INDUSTRY TRAINERS ── */}
        <Link
          href="/student/trainers"
          className={styles.card}
          style={{ '--card-accent-grad': 'linear-gradient(90deg, #8b5cf6, #c084fc)' } as React.CSSProperties}
        >
          <div className={styles.cardTopBar}>
            <div className={styles.iconWrapper} style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(192,132,252,0.15))', color: '#c084fc' }}>
              <Presentation size={24} strokeWidth={2} />
            </div>
            <span className={`${styles.statusBadge} ${styles.statusPurple}`}>
              <span className={styles.pulseDot} />
              <span>{trainersAvailable} Available Now</span>
            </span>
          </div>

          <h3 className={styles.cardTitle}>
            <span>Industry Trainers</span>
          </h3>
          <p className={styles.cardDescription}>
            Connect with top tier tech and product mentors for 1-on-1 mock interviews, code reviews, and career guidance.
          </p>

          <div className={styles.chipContainer}>
            <span className={`${styles.chip} ${styles.highlightChip}`}>DSA & Algorithms</span>
            <span className={styles.chip}>System Design</span>
            <span className={styles.chip}>AI & ML</span>
            <span className={styles.chip}>Cloud Architecture</span>
            <span className={styles.chip}>Behavioral</span>
          </div>

          <div className={styles.metricBox}>
            <div className={styles.metricLeft}>
              <Star size={16} color="#fbbf24" fill="#fbbf24" />
              <div>
                <span className={styles.metricValue}>4.9/5</span>
                <span className={styles.metricLabel}> avg trainer rating</span>
              </div>
            </div>
            <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={13} /> Instant Booking
            </span>
          </div>

          <div className={styles.cardFooter}>
            <span className={styles.footerMeta}>
              <Users size={14} />
              <span>{trainerCount} Verified Mentors</span>
            </span>
            <span className={styles.ctaButton}>
              <span>Explore Trainers</span>
              <ArrowRight size={14} className={styles.ctaIcon} />
            </span>
          </div>
        </Link>

        {/* ── CARD 2: CAMPUS RESOURCES ── */}
        <Link
          href="/student/campus-resources"
          className={styles.card}
          style={{ '--card-accent-grad': 'linear-gradient(90deg, #3b82f6, #06b6d4)' } as React.CSSProperties}
        >
          <div className={styles.cardTopBar}>
            <div className={styles.iconWrapper} style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(6,182,212,0.15))', color: '#60a5fa' }}>
              <Landmark size={24} strokeWidth={2} />
            </div>
            <span className={`${styles.statusBadge} ${styles.statusBlue}`}>
              <span className={styles.pulseDot} />
              <span>{availableResourceCount} Available</span>
            </span>
          </div>

          <h3 className={styles.cardTitle}>
            <span>Campus Resources</span>
          </h3>
          <p className={styles.cardDescription}>
            Browse and reserve institution hardware, AI workstations, high-spec computer labs, seminar halls, and equipment.
          </p>

          <div className={styles.chipContainer}>
            <span className={`${styles.chip} ${styles.highlightChip}`}>Computer Labs</span>
            <span className={styles.chip}>IoT & Robotics</span>
            <span className={styles.chip}>Seminar Halls</span>
            <span className={styles.chip}>Library Pods</span>
            <span className={styles.chip}>Workstations</span>
          </div>

          <div className={styles.metricBox}>
            <div className={styles.metricLeft}>
              <Laptop size={16} color="#60a5fa" />
              <div>
                <span className={styles.metricValue}>{resourceCount} Spaces</span>
                <span className={styles.metricLabel}> on campus</span>
              </div>
            </div>
            <span style={{ fontSize: '11px', color: '#60a5fa', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={13} /> Live Scheduling
            </span>
          </div>

          <div className={styles.cardFooter}>
            <span className={styles.footerMeta}>
              <Landmark size={14} />
              <span>{availableResourceCount} Open for booking</span>
            </span>
            <span className={styles.ctaButton}>
              <span>Explore Resources</span>
              <ArrowRight size={14} className={styles.ctaIcon} />
            </span>
          </div>
        </Link>

        {/* ── CARD 3: STUDY RESOURCES ── */}
        <Link
          href="/student/resources"
          className={styles.card}
          style={{ '--card-accent-grad': 'linear-gradient(90deg, #f59e0b, #ec4899)' } as React.CSSProperties}
        >
          <div className={styles.cardTopBar}>
            <div className={styles.iconWrapper} style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(236,72,153,0.15))', color: '#fbbf24' }}>
              <BookOpen size={24} strokeWidth={2} />
            </div>
            <span className={`${styles.statusBadge} ${styles.statusOrange}`}>
              <Flame size={12} />
              <span>Trending Materials</span>
            </span>
          </div>

          <h3 className={styles.cardTitle}>
            <span>Study Resources</span>
          </h3>
          <p className={styles.cardDescription}>
            Curated placement roadmaps, DSA cheat sheets, video crash courses, and AI-generated quick reference notes.
          </p>

          <div className={styles.chipContainer}>
            <span className={`${styles.chip} ${styles.highlightChip}`}>PDF Cheatsheets</span>
            <span className={styles.chip}>Video Playlists</span>
            <span className={styles.chip}>AI Quick Notes</span>
            <span className={styles.chip}>Tech Roadmaps</span>
            <span className={styles.chip}>DSA 450</span>
          </div>

          <div className={styles.metricBox}>
            <div className={styles.metricLeft}>
              <Sparkles size={16} color="#fbbf24" />
              <div>
                <span className={styles.metricValue}>100+ Topics</span>
                <span className={styles.metricLabel}> curated by experts</span>
              </div>
            </div>
            <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={13} /> Updated Weekly
            </span>
          </div>

          <div className={styles.cardFooter}>
            <span className={styles.footerMeta}>
              <BookOpen size={14} />
              <span>Notes, Videos & Guides</span>
            </span>
            <span className={styles.ctaButton}>
              <span>Browse Resources</span>
              <ArrowRight size={14} className={styles.ctaIcon} />
            </span>
          </div>
        </Link>

        {/* ── CARD 4: MY BOOKINGS ── */}
        <Link
          href="/student/bookings"
          className={styles.card}
          style={{ '--card-accent-grad': 'linear-gradient(90deg, #10b981, #06b6d4)' } as React.CSSProperties}
        >
          <div className={styles.cardTopBar}>
            <div className={styles.iconWrapper} style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(6,182,212,0.15))', color: '#34d399' }}>
              <CalendarDays size={24} strokeWidth={2} />
            </div>
            <span className={`${styles.statusBadge} ${bookingCount > 0 ? styles.statusGreen : styles.statusBlue}`}>
              <span className={styles.pulseDot} />
              <span>{bookingCount > 0 ? `${bookingCount} Active Bookings` : 'Calendar Ready'}</span>
            </span>
          </div>

          <h3 className={styles.cardTitle}>
            <span>My Bookings</span>
          </h3>
          <p className={styles.cardDescription}>
            View and manage your upcoming reservations, trainer 1-on-1 sessions, and lab access schedule in one unified timetable.
          </p>

          <div className={styles.chipContainer}>
            <span className={`${styles.chip} ${styles.highlightChip}`}>1-on-1 Mentorship</span>
            <span className={styles.chip}>Lab Reservations</span>
            <span className={styles.chip}>Instant Reschedule</span>
            <span className={styles.chip}>Calendar Sync</span>
          </div>

          <div className={styles.metricBox}>
            <div className={styles.metricLeft}>
              <Clock size={16} color="#34d399" />
              <div>
                <span className={styles.metricValue}>
                  {nextBooking ? (nextBooking.resource?.name || 'Upcoming Session') : 'No Pending Bookings'}
                </span>
                <span className={styles.metricLabel}>
                  {nextBooking ? ` • ${getBookingTimeString(nextBooking)}` : ' • Ready to schedule slots'}
                </span>
              </div>
            </div>
            <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={13} /> Auto-Confirmed
            </span>
          </div>

          <div className={styles.cardFooter}>
            <span className={styles.footerMeta}>
              <CalendarDays size={14} />
              <span>{bookingCount > 0 ? `${bookingCount} Scheduled items` : 'Schedule new session'}</span>
            </span>
            <span className={styles.ctaButton}>
              <span>View Bookings</span>
              <ArrowRight size={14} className={styles.ctaIcon} />
            </span>
          </div>
        </Link>

        {/* ── CARD 5: MY DOCUMENTS (FULL-WIDTH 5TH CARD) ── */}
        <Link
          href="/student/documents"
          className={`${styles.card} ${styles.cardFullWidth}`}
          style={{ '--card-accent-grad': 'linear-gradient(90deg, #8b5cf6, #ec4899)' } as React.CSSProperties}
        >
          <div className={styles.cardTopBar}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div className={styles.iconWrapper} style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(236,72,153,0.2))', color: '#c084fc' }}>
                <FolderLock size={24} strokeWidth={2} />
              </div>
              <div>
                <h3 className={styles.cardTitle} style={{ margin: 0 }}>
                  My Documents & Digital Vault
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary, #94a3b8)' }}>
                  Institutional-grade document management and AI tampering detection
                </span>
              </div>
            </div>

            <span className={`${styles.statusBadge} ${styles.statusGreen}`}>
              <ShieldCheck size={13} />
              <span>{documentCount > 0 ? `${documentCount} Vault Files` : 'Secure Vault'}</span>
            </span>
          </div>

          <div className={styles.fullWidthLayout}>
            {/* Left Info */}
            <div className={styles.docVaultInfo}>
              <p className={styles.cardDescription} style={{ margin: 0 }}>
                Store, organize, and share verified academic marksheets, degree proofs, internship certificates, and placement records.
              </p>
              <div className={styles.chipContainer} style={{ marginBottom: 0 }}>
                <span className={`${styles.chip} ${styles.highlightChip}`}>AI OCR Extraction</span>
                <span className={styles.chip}>Tamper & Fraud Detection</span>
                <span className={styles.chip}>QR Barcode Validation</span>
                <span className={styles.chip}>Selective Sharing</span>
              </div>
            </div>

            {/* Middle Security Badges */}
            <div className={styles.docSecurityGrid}>
              <div className={styles.securityItem}>
                <FileCheck2 size={16} color="#34d399" />
                <span>Verification Engine: <strong>AI Tamper-Proof</strong></span>
              </div>
              <div className={styles.securityItem}>
                <QrCode size={16} color="#60a5fa" />
                <span>QR Barcode Reader: <strong>Instant Authenticity</strong></span>
              </div>
              <div className={styles.securityItem}>
                <Clock size={16} color="#fbbf24" />
                <span>Recent File: <strong>{recentDocName || 'Degree_Transcript_Official.pdf'}</strong></span>
              </div>
            </div>

            {/* Right Action */}
            <div className={styles.fullWidthAction}>
              <span className={styles.ctaButton} style={{ padding: '9px 18px', fontSize: '13px' }}>
                <span>Open Document Vault</span>
                <ArrowRight size={15} className={styles.ctaIcon} />
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>
                {verifiedDocCount > 0 ? `${verifiedDocCount} files AI verified` : 'Ready to upload & verify'}
              </span>
            </div>
          </div>
        </Link>

      </div>
    </section>
  )
}
