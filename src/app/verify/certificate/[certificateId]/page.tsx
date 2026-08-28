'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import styles from './verify.module.css'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  Award,
  Calendar,
  User,
  Building2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Sparkles
} from 'lucide-react'

export default function PublicCertificateVerificationPage() {
  const params = useParams()
  const certificateId = params?.certificateId as string
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (certificateId) {
      verifyCertificate()
    }
  }, [certificateId])

  const verifyCertificate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/verify/certificate/${certificateId}`)
      const result = await res.json()
      setData(result)
    } catch (err) {
      console.error(err)
      setData({ valid: false, status: 'error', message: 'Unable to reach verification servers' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.verifyContainer}>
      <Link href="/" className={styles.brandHeader}>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={18} color="#ffffff" />
        </div>
        <span className={styles.brandName}>PlaceIQ Credential Verification</span>
      </Link>

      <div className={styles.verifyCard}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem 0' }}>
            <MorphingInfinity className="size-14" style={{ width: '52px', height: '52px', color: '#a855f7', filter: 'drop-shadow(0 0 12px rgba(168,85,247,0.4))' }} />
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Verifying cryptographic signature & database record...</p>
          </div>
        ) : data?.valid ? (
          <>
            <div className={styles.sealGlow} />

            <div className={`${styles.statusBadge} ${styles.statusVerified}`}>
              <ShieldCheck size={16} />
              <span>Certificate Verified</span>
            </div>

            <div className={styles.certTitle}>Certificate of Completion</div>
            <p style={{ color: '#94a3b8', fontSize: '0.825rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Official Institutional Accreditation
            </p>

            <div className={styles.studentName}>{data.studentName}</div>
            <div className={styles.courseTitle}>{data.courseTitle}</div>

            <div className={styles.detailsList}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Certificate ID</span>
                <span className={styles.certIdValue}>{data.certificateId}</span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Issued By</span>
                <span className={styles.detailValue}>{data.institutionName}</span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Certified Instructor</span>
                <span className={styles.detailValue}>{data.instructorName}</span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Completion Date</span>
                <span className={styles.detailValue}>
                  {new Date(data.issueDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Integrity Status</span>
                <span style={{ color: '#34d399', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <CheckCircle2 size={13} /> Active & Authentic
                </span>
              </div>
            </div>

            <p className={styles.footerNote}>
              This credential was verified in real time against the PlaceIQ institutional registry on {new Date().toLocaleDateString()}.
            </p>
          </>
        ) : data?.status === 'revoked' ? (
          <>
            <div className={`${styles.sealGlow} ${styles.sealGlowRevoked}`} />

            <div className={`${styles.statusBadge} ${styles.statusRevoked}`}>
              <ShieldAlert size={16} />
              <span>Certificate Revoked</span>
            </div>

            <div className={styles.certTitle}>Accreditation Revoked</div>
            <div className={styles.studentName} style={{ color: '#f87171' }}>{data.studentName}</div>
            <div className={styles.courseTitle}>{data.courseTitle}</div>

            <div className={styles.detailsList} style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Certificate ID</span>
                <span className={styles.certIdValue} style={{ color: '#f87171' }}>{data.certificateId}</span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Revocation Reason</span>
                <span className={styles.detailValue} style={{ color: '#f87171' }}>{data.revokedReason || 'Administrative suspension'}</span>
              </div>

              {data.revokedAt && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Revoked On</span>
                  <span className={styles.detailValue}>{new Date(data.revokedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <p className={styles.footerNote} style={{ color: '#f87171' }}>
              This certificate has been formally revoked by the institution and is no longer valid for academic or employment verification.
            </p>
          </>
        ) : (
          <>
            <div className={`${styles.statusBadge} ${styles.statusNotFound}`}>
              <HelpCircle size={16} />
              <span>Certificate Not Found</span>
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.75rem' }}>
              Invalid or Unregistered Credential
            </h2>

            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              The certificate identifier <strong style={{ color: '#818cf8', fontFamily: 'monospace' }}>{certificateId}</strong> does not match any issued certificate in the PlaceIQ institutional registry.
            </p>

            <p className={styles.footerNote}>
              If you believe this is an error, please ensure the certificate ID was entered accurately or contact the issuing institution.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
