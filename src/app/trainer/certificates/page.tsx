'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './trainer-certificates.module.css'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  Award,
  CheckCircle2,
  Download,
  ExternalLink,
  ShieldCheck,
  Search,
  Filter,
  User,
  Calendar,
  BookOpen,
  Eye,
  X,
  Sparkles,
  LayoutGrid,
  List,
  QrCode,
  Check
} from 'lucide-react'

export default function TrainerCertificatesPage() {
  const [certificates, setCertificates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'revoked'>('all')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [previewCert, setPreviewCert] = useState<any | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(text)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const validCount = certificates.filter(c => c.status === 'valid').length
  const uniqueCourses = Array.from(new Set(certificates.map(c => c.courseTitle))).length

  const filtered = certificates.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      c.studentName?.toLowerCase().includes(q) ||
      c.certificateId?.toLowerCase().includes(q) ||
      c.courseTitle?.toLowerCase().includes(q) ||
      c.student?.email?.toLowerCase().includes(q)
    )
  })

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Course Certificates & Credentials</h1>
          <p className={styles.subtitle}>
            Audit, verify, and monitor all cryptographic course completion certificates earned across your cohorts.
          </p>
        </div>
        <div className={styles.actions}>
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '2px' }}>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '6px 10px' }}
              title="Table View"
            >
              <List size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '6px 10px' }}
              title="Card Grid View"
            >
              <LayoutGrid size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
            <Award size={22} strokeWidth={2} />
          </div>
          <div>
            <div className={styles.statValue}>{certificates.length}</div>
            <div className={styles.statLabel}>Total Issued</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <ShieldCheck size={22} strokeWidth={2} />
          </div>
          <div>
            <div className={styles.statValue}>{validCount}</div>
            <div className={styles.statLabel}>Verified & Active</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
            <BookOpen size={22} strokeWidth={2} />
          </div>
          <div>
            <div className={styles.statValue}>{uniqueCourses}</div>
            <div className={styles.statLabel}>Courses Certified</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <Sparkles size={22} strokeWidth={2} />
          </div>
          <div>
            <div className={styles.statValue}>100%</div>
            <div className={styles.statLabel}>Accreditation Rate</div>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className={styles.filterBar}>
        <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by student name, course, or certificate ID..."
            className="form-input"
            style={{ paddingLeft: '38px', width: '100%' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => setStatusFilter('all')}
            className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          >
            All ({certificates.length})
          </button>
          <button
            onClick={() => setStatusFilter('valid')}
            className={`btn btn-sm ${statusFilter === 'valid' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Verified ({validCount})
          </button>
          <button
            onClick={() => setStatusFilter('revoked')}
            className={`btn btn-sm ${statusFilter === 'revoked' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Revoked ({certificates.length - validCount})
          </button>
        </div>
      </div>

      {/* Content Rendering */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <MorphingInfinity className="size-14" style={{ width: '48px', height: '48px', color: '#a855f7' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading certificate registry...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <Award size={42} strokeWidth={1.5} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
          <h3>No Certificates Found</h3>
          <p style={{ maxWidth: '420px', margin: '0 auto 1rem', fontSize: '0.875rem' }}>
            No students match the current search or filters. Once students complete curriculum requirements, their verified certificates will appear here.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Card Grid View */
        <div className={styles.certGrid}>
          {filtered.map(cert => {
            const isValid = cert.status === 'valid'
            return (
              <div key={cert.id} className={styles.certCard}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span
                      onClick={() => handleCopy(cert.certificateId)}
                      title="Click to copy Certificate ID"
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#c084fc',
                        background: 'rgba(168, 85, 247, 0.12)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {copiedId === cert.certificateId ? <Check size={11} color="#34d399" /> : null}
                      {cert.certificateId}
                    </span>
                    <span className={`badge ${isValid ? 'badge-green' : 'badge-orange'}`} style={{ fontSize: '10.5px' }}>
                      <CheckCircle2 size={11} style={{ marginRight: '4px' }} />
                      {isValid ? 'Verified' : 'Revoked'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    {cert.courseTitle}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    {cert.institutionName || 'PlaceIQ Learning Academy'}
                  </p>

                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <User size={14} color="#c084fc" />
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{cert.studentName}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <Calendar size={13} />
                      <span>Issued on {new Date(cert.issueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setPreviewCert(cert)}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                  >
                    <Eye size={13} />
                    <span>Preview</span>
                  </button>
                  <a
                    href={`/api/certificates/${cert.id}/download`}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '6px 12px' }}
                    title="Download PDF"
                    download
                  >
                    <Download size={13} />
                  </a>
                  <Link
                    href={`/verify/certificate/${cert.certificateId}`}
                    target="_blank"
                    className="btn btn-primary btn-sm"
                    style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    title="Public Verification Link"
                  >
                    <ExternalLink size={13} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Detailed Table View */
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Certificate ID</th>
                  <th>Student</th>
                  <th>Course Title</th>
                  <th>Issue Date</th>
                  <th>Verification Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(cert => {
                  const isValid = cert.status === 'valid'
                  return (
                    <tr key={cert.id}>
                      <td>
                        <span
                          onClick={() => handleCopy(cert.certificateId)}
                          title="Click to copy"
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 600,
                            color: '#c084fc',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {copiedId === cert.certificateId ? <Check size={12} color="#34d399" /> : null}
                          {cert.certificateId}
                        </span>
                      </td>
                      <td>
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                            {cert.studentName}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {cert.student?.email || cert.student?.college || 'Enrolled Student'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                          {cert.courseTitle}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {new Date(cert.issueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            color: isValid ? '#34d399' : '#f87171',
                            background: isValid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            border: `1px solid ${isValid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                            padding: '3px 9px',
                            borderRadius: '12px'
                          }}
                        >
                          <CheckCircle2 size={12} /> {isValid ? 'Verified' : 'Revoked'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => setPreviewCert(cert)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '5px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Eye size={12} strokeWidth={2} />
                            <span>Preview</span>
                          </button>
                          <a
                            href={`/api/certificates/${cert.id}/download`}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '5px 8px' }}
                            title="Download PDF"
                            download
                          >
                            <Download size={13} strokeWidth={2} />
                          </a>
                          <Link
                            href={`/verify/certificate/${cert.certificateId}`}
                            target="_blank"
                            className="btn btn-primary btn-sm"
                            style={{ padding: '5px 8px' }}
                            title="Public QR Verification Page"
                          >
                            <ExternalLink size={13} strokeWidth={2} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Certificate Parchment Preview Modal */}
      {previewCert && (
        <div className={styles.modalBackdrop} onClick={() => setPreviewCert(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={20} color="#c084fc" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' }}>Certificate Credential Preview</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewCert(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Parchment Card */}
            <div
              style={{
                border: '2px solid #a855f7',
                borderRadius: 'var(--radius-lg)',
                padding: '2.25rem 2rem',
                background: 'linear-gradient(135deg, rgba(168,85,247,0.06) 0%, rgba(20,20,30,0.95) 100%)',
                textAlign: 'center',
                position: 'relative',
                boxShadow: '0 0 40px rgba(168,85,247,0.15)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(168,85,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #c084fc' }}>
                  <Award size={30} color="#c084fc" />
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#c084fc', fontWeight: 700, marginBottom: '0.25rem' }}>
                PlaceIQ Certified Credential
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
                Certificate of Completion
              </h2>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                This is proudly presented to
              </p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f3e8ff', marginBottom: '1rem', fontFamily: 'Outfit, sans-serif' }}>
                {previewCert.studentName}
              </h3>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                for successfully mastering all curriculum modules, lab assignments, and assessment diagnostics in
              </p>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.75rem' }}>
                {previewCert.courseTitle}
              </div>

              {/* Bottom Metadata & Signatures */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.75rem', textAlign: 'center' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Certificate ID</div>
                  <div style={{ fontWeight: 600, fontFamily: 'monospace', color: '#c084fc' }}>{previewCert.certificateId}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Issued Date</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {new Date(previewCert.issueDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Verification</div>
                  <div style={{ fontWeight: 600, color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                    <ShieldCheck size={13} /> Active
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <a
                href={`/api/certificates/${previewCert.id}/download`}
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                download
              >
                <Download size={14} />
                <span>Download PDF</span>
              </a>
              <Link
                href={`/verify/certificate/${previewCert.certificateId}`}
                target="_blank"
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <ExternalLink size={14} />
                <span>Open Public Verification</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
