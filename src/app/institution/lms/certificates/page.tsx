'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from '../../../student/certificates/certificates.module.css'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  Award,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Download,
  ExternalLink,
  RotateCcw,
  X,
  Sparkles,
  AlertTriangle
} from 'lucide-react'

export default function AdminCertificatesPage() {
  const [certificates, setCertificates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedCert, setSelectedCert] = useState<any | null>(null)
  const [revokeReason, setRevokeReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

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

  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCert || !revokeReason.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/certificates/${selectedCert.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke', reason: revokeReason.trim() })
      })
      const data = await res.json()
      if (data.success) {
        setSelectedCert(null)
        setRevokeReason('')
        fetchCertificates()
      } else {
        alert(data.error || 'Failed to revoke certificate')
      }
    } catch (err: any) {
      alert(err.message || 'Error revoking certificate')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRestore = async (cert: any) => {
    if (!confirm(`Are you sure you want to restore the validity of certificate ${cert.certificateId}?`)) return
    try {
      const res = await fetch(`/api/certificates/${cert.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' })
      })
      const data = await res.json()
      if (data.success) {
        fetchCertificates()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const validCount = certificates.filter(c => c.status === 'valid').length
  const revokedCount = certificates.filter(c => c.status === 'revoked').length

  const filtered = certificates.filter(c => {
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter
    const matchesSearch = !search ||
      c.studentName?.toLowerCase().includes(search.toLowerCase()) ||
      c.certificateId?.toLowerCase().includes(search.toLowerCase()) ||
      c.courseTitle?.toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>LMS Certificate Governance</h1>
          <p className={styles.subtitle}>Institution-wide credential management, cryptographic authenticity, and revocation governance.</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap}>
            <Award size={24} />
          </div>
          <div>
            <div className={styles.statValue}>{certificates.length}</div>
            <div className={styles.statLabel}>Total Issued Accreditations</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className={styles.statValue}>{validCount}</div>
            <div className={styles.statLabel}>Active & Valid Credentials</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <div className={styles.statValue}>{revokedCount}</div>
            <div className={styles.statLabel}>Revoked / Suspended</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.875rem', width: '100%', maxWidth: '380px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%', fontSize: '0.875rem' }}
            placeholder="Search student, ID, or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Filter size={16} color="var(--text-muted)" />
          <select
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.875rem', outline: 'none' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses ({certificates.length})</option>
            <option value="valid">Valid Only ({validCount})</option>
            <option value="revoked">Revoked Only ({revokedCount})</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
          <MorphingInfinity size={48} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <Award size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Certificates Found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>No issued credentials match the filter.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '1rem 1.25rem' }}>Certificate ID</th>
                <th style={{ padding: '1rem 1.25rem' }}>Student</th>
                <th style={{ padding: '1rem 1.25rem' }}>Course</th>
                <th style={{ padding: '1rem 1.25rem' }}>Issue Date</th>
                <th style={{ padding: '1rem 1.25rem' }}>Status</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((cert) => {
                const isValid = cert.status === 'valid'
                return (
                  <tr key={cert.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '1rem 1.25rem', fontFamily: 'monospace', fontWeight: 600, color: '#818cf8' }}>
                      {cert.certificateId}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cert.studentName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cert.student?.email}</div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-primary)' }}>
                      {cert.courseTitle}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)' }}>
                      {new Date(cert.issueDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: isValid ? '#34d399' : '#f87171',
                        background: isValid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '99px'
                      }}>
                        {isValid ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {isValid ? 'Valid' : 'Revoked'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Link
                          href={`/verify/certificate/${cert.certificateId}`}
                          target="_blank"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <ExternalLink size={12} />
                          <span>Verify</span>
                        </Link>

                        {isValid ? (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 8px', fontSize: '11px', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                            onClick={() => setSelectedCert(cert)}
                          >
                            Revoke
                          </button>
                        ) : (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 8px', fontSize: '11px', color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            onClick={() => handleRestore(cert)}
                          >
                            <RotateCcw size={11} />
                            <span>Restore</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Revocation Modal */}
      {selectedCert && (
        <div className={styles.modalBackdrop}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '520px', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171' }}>
                <AlertTriangle size={18} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Revoke Certificate Credential
                </h3>
              </div>
              <button
                onClick={() => setSelectedCert(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRevoke}>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  You are about to revoke certificate <strong style={{ color: 'var(--text-primary)' }}>{selectedCert.certificateId}</strong> issued to <strong style={{ color: 'var(--text-primary)' }}>{selectedCert.studentName}</strong> for <em>{selectedCert.courseTitle}</em>.
                </p>

                <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.8rem', color: '#f87171' }}>
                  The public QR verification page will immediately display this certificate as <strong>REVOKED</strong>.
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Reason for Revocation *
                  </label>
                  <textarea
                    style={{ width: '100%', minHeight: '90px', padding: '0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', resize: 'vertical' }}
                    placeholder="e.g. Academic integrity violation, administrative reassessment, or incorrect issuance..."
                    value={revokeReason}
                    onChange={(e) => setRevokeReason(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ padding: '1.25rem 1.5rem', background: 'var(--bg-primary)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedCert(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#ef4444', borderColor: '#ef4444' }}
                  disabled={submitting || !revokeReason.trim()}
                >
                  {submitting ? 'Revoking...' : 'Confirm Revocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
