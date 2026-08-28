'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import StudentSidebar from '@/components/StudentSidebar'
import BackButton from '@/components/BackButton'
import styles from './certificates.module.css'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  Award,
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  ShieldCheck,
  Calendar,
  User,
  FolderLock,
  QrCode,
  X,
  Sparkles
} from 'lucide-react'

export default function StudentCertificatesPage() {
  const [certificates, setCertificates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [previewCert, setPreviewCert] = useState<any | null>(null)

  useEffect(() => {
    fetchCertificates()
  }, [])

  const fetchCertificates = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/certificates')
      const data = await res.json()
      if (data.certificates) setCertificates(data.certificates)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const validCount = certificates.filter(c => c.status === 'valid').length

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.content}>
        {/* Sticky Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <BackButton fallbackHref="/student/dashboard" />
            <div>
              <h1 className={styles.pageTitle}>
                <Award size={22} color="#8b5cf6" strokeWidth={2} />
                <span>Certificates of Completion</span>
              </h1>
              <p className={styles.pageSubtitle}>
                Verified credentials and institutional accreditations earned through PlaceIQ masterclasses.
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Link
              href="/student/documents?category=Certificates"
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <FolderLock size={14} strokeWidth={2} />
              <span>Document Vault</span>
            </Link>
          </div>
        </header>

        <main className={styles.main}>
          {/* Stats */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIconWrap} style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#c4b5fd' }}>
                <Award size={22} strokeWidth={2} />
              </div>
              <div>
                <div className={styles.statValue}>{certificates.length}</div>
                <div className={styles.statLabel}>Total Certificates Issued</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconWrap} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}>
                <ShieldCheck size={22} strokeWidth={2} />
              </div>
              <div>
                <div className={styles.statValue}>{validCount}</div>
                <div className={styles.statLabel}>Cryptographically Verified</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconWrap} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24' }}>
                <Sparkles size={22} strokeWidth={2} />
              </div>
              <div>
                <div className={styles.statValue}>100%</div>
                <div className={styles.statLabel}>Accreditation Standard</div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className={styles.loadingBox}>
              <MorphingInfinity
                style={{
                  width: '52px',
                  height: '52px',
                  color: '#8b5cf6',
                  filter: 'drop-shadow(0 0 16px rgba(139, 92, 246, 0.5))'
                }}
              />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '4px' }}>
                  Loading Certificates
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0 }}>
                  Fetching your verified credentials...
                </p>
              </div>
            </div>
          ) : certificates.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-xl)',
              border: '1px dashed var(--border)'
            }}>
              <Award size={48} color="var(--text-muted)" style={{ margin: '0 auto 1.25rem' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                No Certificates Earned Yet
              </h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '460px', margin: '0 auto 1.75rem', fontSize: '0.875rem', lineHeight: 1.65 }}>
                Complete 100% of curriculum lessons, submit required assignments, and pass quizzes to unlock your verified course certificate.
              </p>
              <Link href="/student/courses" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Award size={14} />
                <span>Go to My Courses</span>
              </Link>
            </div>
          ) : (
            <div className={styles.certGrid}>
              {certificates.map((cert) => {
                const isValid = cert.status === 'valid'
                return (
                  <div key={cert.id} className={styles.certCard}>
                    <div className={styles.certCardHeader}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <span className={styles.certIdBadge}>{cert.certificateId}</span>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: isValid ? '#34d399' : '#f87171',
                          background: isValid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          border: `1px solid ${isValid ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                          padding: '3px 8px',
                          borderRadius: '9999px'
                        }}>
                          <CheckCircle2 size={11} /> {isValid ? 'Verified' : 'Revoked'}
                        </span>
                      </div>
                      <h3 className={styles.certCourseTitle}>{cert.courseTitle}</h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                        {cert.institutionName || 'PlaceIQ Institution'}
                      </p>
                    </div>

                    <div className={styles.certBody}>
                      <div className={styles.metaRow}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Calendar size={13} color="var(--text-muted)" />
                          Completion Date
                        </span>
                        <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                          {new Date(cert.issueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </strong>
                      </div>

                      <div className={styles.metaRow}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <User size={13} color="var(--text-muted)" />
                          Instructor
                        </span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                          {cert.instructorName || 'PlaceIQ Faculty'}
                        </span>
                      </div>

                      <div className={styles.metaRow}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <QrCode size={13} color="var(--text-muted)" />
                          QR Verification
                        </span>
                        <span style={{ color: '#818cf8', fontWeight: 600, fontSize: '0.78rem' }}>
                          Active
                        </span>
                      </div>
                    </div>

                    <div className={styles.certFooter}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                        onClick={() => setPreviewCert(cert)}
                      >
                        <Eye size={13} />
                        <span>Preview</span>
                      </button>

                      <a
                        href={`/api/certificates/${cert.id}/download`}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                        download
                      >
                        <Download size={13} />
                        <span>PDF</span>
                      </a>

                      <Link
                        href={`/verify/certificate/${cert.certificateId}`}
                        target="_blank"
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                      >
                        <ExternalLink size={13} />
                        <span>Verify</span>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>

      {/* Certificate Preview Modal */}
      {previewCert && (
        <div className={styles.modalBackdrop} onClick={() => setPreviewCert(null)}>
          <div className={styles.certificateFrame} onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={() => setPreviewCert(null)}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                background: 'rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.12)',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#334155',
                transition: 'background 0.15s'
              }}
            >
              <X size={17} />
            </button>

            <div className={styles.certInnerBorder}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.12em', color: '#6366f1', textTransform: 'uppercase', marginBottom: '6px' }}>
                PLACEIQ LEARNING HUB
              </div>
              <h2 style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: 'serif', color: '#0f172a', letterSpacing: '-0.01em', marginBottom: '6px' }}>
                CERTIFICATE OF COMPLETION
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1.5rem' }}>
                This is proudly presented to
              </p>

              <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', fontFamily: 'serif', borderBottom: '2px solid #d97706', display: 'inline-block', paddingBottom: '5px', marginBottom: '1.25rem' }}>
                {previewCert.studentName}
              </h1>

              <p style={{ fontSize: '0.875rem', color: '#475569', fontStyle: 'italic', maxWidth: '500px', margin: '0 auto 1.25rem', lineHeight: 1.6 }}>
                for successfully mastering the curriculum and fulfilling all practical assessments of
              </p>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4f46e5', marginBottom: '2rem' }}>
                {previewCert.courseTitle}
              </h3>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', textAlign: 'left', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>ISSUED ON</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {new Date(previewCert.issueDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px', fontFamily: 'monospace' }}>
                    ID: {previewCert.certificateId}
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>VERIFIED INSTRUCTOR</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {previewCert.instructorName || 'PlaceIQ Faculty'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {previewCert.institutionName || 'PlaceIQ Academic Division'}
                  </div>
                </div>

                {previewCert.qrCodeDataUrl && (
                  <div style={{ textAlign: 'center' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewCert.qrCodeDataUrl}
                      alt="Verification QR Code"
                      style={{ width: '68px', height: '68px', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                    />
                    <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '3px' }}>Scan to Verify</div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <a
                href={`/api/certificates/${previewCert.id}/download`}
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                download
              >
                <Download size={14} />
                <span>Download PDF Certificate</span>
              </a>
              <Link
                href={`/verify/certificate/${previewCert.certificateId}`}
                target="_blank"
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <ExternalLink size={14} />
                <span>Open Verification Page</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
