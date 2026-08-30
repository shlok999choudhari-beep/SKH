'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import styles from './academicVerification.module.css'
import {
  GraduationCap,
  UploadCloud,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ShieldCheck,
  FileText,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Clock,
  AlertCircle,
  Award,
  Check,
  Eye,
  X,
  ExternalLink,
  Loader2
} from 'lucide-react'

export interface MarksheetItem {
  id?: number
  documentId?: number
  educationLevel: 'TENTH' | 'TWELFTH'
  studentName?: string | null
  percentage?: number | null
  percentageSource?: string | null
  calculationEquation?: string | null
  calculationFormula?: string | null
  totalMarks?: number | null
  obtainedMarks?: number | null
  board?: string | null
  passingYear?: number | null
  rollNumber?: string | null
  seatNumber?: string | null
  verificationStatus?: string | null
  ocrConfidence?: number | null
  fileName?: string | null
  fileType?: string | null
  uploadedAt?: string | null
}

interface AcademicVerificationFlowProps {
  onSuccess?: (student: any) => void
  isModal?: boolean
  onClose?: () => void
}

const EXTRACTION_STAGES = [
  'Uploading document...',
  'Reading document...',
  'Extracting information...',
  'Validating marksheet...',
  'Finalizing verification...'
]

export default function AcademicVerificationFlow({
  onSuccess,
  isModal = false,
  onClose
}: AcademicVerificationFlowProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState<any>(null)
  const [tenthMarksheet, setTenthMarksheet] = useState<MarksheetItem | null>(null)
  const [twelfthMarksheet, setTwelfthMarksheet] = useState<MarksheetItem | null>(null)
  const [uploadingLevel, setUploadingLevel] = useState<'TENTH' | 'TWELFTH' | null>(null)
  const [loaderStageIdx, setLoaderStageIdx] = useState(0)
  const [completing, setCompleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState<'TENTH' | 'TWELFTH' | null>(null)
  const [nameComparison, setNameComparison] = useState<any>(null)
  const [step, setStep] = useState<number>(2) // 1: Account, 2: Documents, 3: Verification, 4: Ready

  // Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<{ id: number; fileName: string; fileType?: string } | null>(null)

  const tenthInputRef = useRef<HTMLInputElement>(null)
  const twelfthInputRef = useRef<HTMLInputElement>(null)

  // Rotate extraction stage text smoothly while in-flight
  useEffect(() => {
    let interval: any = null
    if (uploadingLevel || completing) {
      setLoaderStageIdx(0)
      interval = setInterval(() => {
        setLoaderStageIdx(prev => (prev < EXTRACTION_STAGES.length - 1 ? prev + 1 : prev))
      }, 2500)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [uploadingLevel, completing])

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      setLoading(true)
      setErrorMessage(null)
      const res = await fetch('/api/student/verify-academics', { cache: 'no-store' })
      if (res.status === 401) {
        window.location.href = '/auth/login?role=student'
        return
      }
      const data = await res.json()
      if (data && data.success) {
        setStudent(data.student)
        if (data.documents?.tenth) {
          setTenthMarksheet(data.documents.tenth)
        } else {
          setTenthMarksheet(null)
        }
        if (data.documents?.twelfth) {
          setTwelfthMarksheet(data.documents.twelfth)
        } else {
          setTwelfthMarksheet(null)
        }
        if (data.nameComparison) {
          setNameComparison(data.nameComparison)
        } else {
          setNameComparison(null)
        }

        // Determine step based on current status
        if (data.student?.isFullyVerified) {
          setStep(4)
        } else if (data.documents?.tenth?.percentage && data.documents?.twelfth?.percentage) {
          setStep(3)
        } else {
          setStep(2)
        }
      }
    } catch (err: any) {
      console.error('Failed to load academic verification status:', err)
      setErrorMessage('Could not load academic verification status. Please try refreshing.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (file: File, level: 'TENTH' | 'TWELFTH') => {
    if (!file) return

    setUploadingLevel(level)
    setErrorMessage(null)
    setSuccessMessage(null)

    // Clear previous extraction state for this slot so no stale values are shown
    if (level === 'TENTH') {
      setTenthMarksheet(null)
    } else {
      setTwelfthMarksheet(null)
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('educationLevel', level)

    try {
      const res = await fetch('/api/student/verify-academics/upload', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || `Failed to extract data from your ${level === 'TENTH' ? '10th' : '12th'} marksheet.`)
        // Store partial document info so View Document and Re-upload are still available
        if (data.documentId) {
          const failedItem: MarksheetItem = {
            documentId: data.documentId,
            educationLevel: level,
            fileName: data.fileName || file.name,
            fileType: data.fileType || file.type,
            verificationStatus: 'FAILED'
          }
          if (level === 'TENTH') setTenthMarksheet(failedItem)
          else setTwelfthMarksheet(failedItem)
        }
        return
      }

      if (data.success && data.marksheet) {
        if (level === 'TENTH') {
          setTenthMarksheet(data.marksheet)
        } else {
          setTwelfthMarksheet(data.marksheet)
        }
        setSuccessMessage(`${level === 'TENTH' ? '10th' : '12th'} marksheet extracted and verified successfully!`)
        // Refresh comparison status
        fetchStatus()
      }
    } catch (err: any) {
      console.error('Upload error:', err)
      setErrorMessage(`Network error during ${level === 'TENTH' ? '10th' : '12th'} marksheet upload. Please try again.`)
    } finally {
      setUploadingLevel(null)
    }
  }

  const handleCompleteVerification = async () => {
    if (!tenthMarksheet?.percentage || !twelfthMarksheet?.percentage) {
      setErrorMessage('Please upload and verify both 10th and 12th marksheets before proceeding.')
      return
    }

    setCompleting(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const res = await fetch('/api/student/verify-academics/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'Academic verification could not be completed.')
        if (data.nameComparison) {
          setNameComparison(data.nameComparison)
        }
        return
      }

      if (data.success) {
        setStep(4)
        setSuccessMessage('Academic verification completed successfully! Your profile is now verified and locked.')
        if (onSuccess) {
          onSuccess(data.student)
        }
        setTimeout(() => {
          if (!isModal) {
            router.push('/student/dashboard')
          }
        }, 1500)
      }
    } catch (err: any) {
      console.error('Completion error:', err)
      setErrorMessage('An unexpected error occurred while completing verification. Please try again.')
    } finally {
      setCompleting(false)
    }
  }

  const bothUploaded = Boolean(
    tenthMarksheet?.percentage &&
    twelfthMarksheet?.percentage
  )

  const isNameMismatch = Boolean(
    nameComparison && !nameComparison.isMatch
  )

  const verifiedDisplayName =
    nameComparison?.unifiedName ||
    tenthMarksheet?.studentName ||
    twelfthMarksheet?.studentName ||
    student?.name ||
    'Student'

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <MorphingInfinity className="size-16" style={{ width: '56px', height: '56px', color: '#8b5cf6' }} />
        <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>
          Loading document verification status...
        </p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* ── HEADER ── */}
      <div className={styles.headerSection}>
        <div className={styles.badge}>
          <ShieldCheck size={14} />
          <span>PlaceIQ Trust & Verification System</span>
        </div>
        <h1 className={styles.title}>Academic Document Verification</h1>
        <p className={styles.subtitle}>
          Your academic information will be automatically extracted from your marksheets.
          You will not need to enter your marks manually.
        </p>
      </div>

      {/* ── STEPPER ── */}
      <div className={styles.stepper}>
        <div className={`${styles.stepItem} ${styles.stepItemCompleted}`}>
          <div className={styles.stepNumber}>
            <Check size={14} strokeWidth={3} />
          </div>
          <span className={styles.stepLabel}>Step 1: Account</span>
        </div>

        <div className={`${styles.stepDivider} ${bothUploaded ? styles.stepDividerCompleted : ''}`} />

        <div className={`${styles.stepItem} ${bothUploaded ? styles.stepItemCompleted : styles.stepItemActive}`}>
          <div className={styles.stepNumber}>
            {bothUploaded ? <Check size={14} strokeWidth={3} /> : '2'}
          </div>
          <span className={styles.stepLabel}>Step 2: Documents</span>
        </div>

        <div className={`${styles.stepDivider} ${step >= 3 && !isNameMismatch ? styles.stepDividerCompleted : ''}`} />

        <div className={`${styles.stepItem} ${step >= 3 ? (isNameMismatch ? styles.stepItemActive : styles.stepItemCompleted) : ''}`}>
          <div className={styles.stepNumber}>
            {step === 4 ? <Check size={14} strokeWidth={3} /> : '3'}
          </div>
          <span className={styles.stepLabel}>Step 3: Verification</span>
        </div>

        <div className={`${styles.stepDivider} ${step === 4 ? styles.stepDividerCompleted : ''}`} />

        <div className={`${styles.stepItem} ${step === 4 ? styles.stepItemCompleted : ''}`}>
          <div className={styles.stepNumber}>
            {step === 4 ? <Check size={14} strokeWidth={3} /> : '4'}
          </div>
          <span className={styles.stepLabel}>Step 4: Profile Ready</span>
        </div>
      </div>

      {/* ── ALERTS ── */}
      {errorMessage && (
        <div className={`${styles.alertBox} ${styles.alertError}`}>
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Verification Warning:</strong> {errorMessage}
          </div>
        </div>
      )}

      {successMessage && (
        <div className={`${styles.alertBox} ${styles.alertSuccess}`}>
          <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>{successMessage}</div>
        </div>
      )}

      {/* ── DOCUMENT UPLOAD CARDS ── */}
      <div className={styles.cardsGrid}>

        {/* ══════════════════════════════════════════════════ */}
        {/* ── 10TH MARKSHEET CARD ── */}
        {/* ══════════════════════════════════════════════════ */}
        <div className={`${styles.docCard} ${tenthMarksheet?.percentage ? styles.docCardVerified : ''}`}>
          <div className={styles.docCardHeader}>
            <div className={styles.docCardTitleRow}>
              <div className={styles.docIconWrap}>
                <GraduationCap size={22} />
              </div>
              <div>
                <h3 className={styles.docCardTitle}>10th Marksheet</h3>
                <span className={styles.docCardSubtitle}>Secondary School Certificate (SSC)</span>
              </div>
            </div>
            {uploadingLevel === 'TENTH' ? (
              <span className={`${styles.statusPill} ${styles.statusPillProcessing}`}>
                <Loader2 size={12} className="animate-spin" />
                <span>Processing</span>
              </span>
            ) : tenthMarksheet?.percentage ? (
              <span className={`${styles.statusPill} ${styles.statusPillVerified}`}>
                <Check size={12} strokeWidth={3} />
                <span>Verified</span>
              </span>
            ) : tenthMarksheet?.verificationStatus === 'FAILED' ? (
              <span className={`${styles.statusPill} ${styles.statusPillFailed}`}>
                <AlertCircle size={12} />
                <span>Extraction Failed</span>
              </span>
            ) : (
              <span className={`${styles.statusPill} ${styles.statusPillPending}`}>
                <Clock size={12} />
                <span>Mandatory</span>
              </span>
            )}
          </div>

          {/* Hidden File Input */}
          <input
            ref={tenthInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0], 'TENTH')
              }
            }}
          />

          {/* Document State 1: In-Flight Extraction Loader */}
          {uploadingLevel === 'TENTH' ? (
            <div className={styles.loaderCard}>
              <p className={styles.loaderTitle}>Verifying your document</p>
              <MorphingInfinity className="size-10" style={{ width: '40px', height: '40px', color: '#8b5cf6' }} />
              <p className={styles.loaderStageText}>
                <span>{EXTRACTION_STAGES[loaderStageIdx]}</span>
              </p>
              <span className={styles.loaderSubHint}>This may take a few seconds.</span>
            </div>
          ) : !tenthMarksheet?.percentage ? (
            /* Document State 2: Dropzone or Failed with Re-upload */
            <div>
              <div
                className={`${styles.uploadDropzone} ${dragActive === 'TENTH' ? styles.uploadDropzoneDragging : ''}`}
                onClick={() => tenthInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragActive('TENTH') }}
                onDragLeave={() => setDragActive(null)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragActive(null)
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0], 'TENTH')
                  }
                }}
              >
                <div className={styles.uploadIconWrap}>
                  <UploadCloud size={22} />
                </div>
                <div>
                  <p className={styles.uploadText}>
                    {tenthMarksheet?.verificationStatus === 'FAILED' ? 'Re-upload 10th Marksheet' : 'Upload 10th Marksheet'}
                  </p>
                  <p className={styles.uploadHint}>PDF, JPG, JPEG, or PNG (Max 20MB)</p>
                </div>
              </div>

              {tenthMarksheet?.documentId && (
                <div className={styles.docMetaBar} style={{ marginTop: '12px' }}>
                  <span className={styles.docFileNameText} title={tenthMarksheet.fileName || '10th Marksheet'}>
                    <FileText size={14} color="#94a3b8" />
                    <span>{tenthMarksheet.fileName || '10th Marksheet'}</span>
                  </span>
                  <div className={styles.docActionButtons}>
                    <button
                      type="button"
                      className={styles.viewBtn}
                      onClick={() => setPreviewDoc({ id: tenthMarksheet.documentId!, fileName: tenthMarksheet.fileName || '10th Marksheet', fileType: tenthMarksheet.fileType || 'application/pdf' })}
                    >
                      <Eye size={13} />
                      <span>View Document</span>
                    </button>
                    <button
                      type="button"
                      className={styles.reuploadBtn}
                      onClick={() => tenthInputRef.current?.click()}
                    >
                      <RefreshCw size={13} />
                      <span>Re-upload</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Document State 3: Complete Verified Extraction View */
            <div className={styles.extractedBox}>
              {/* Document Meta Row with View & Re-upload */}
              <div className={styles.docMetaBar}>
                <span className={styles.docFileNameText} title={tenthMarksheet.fileName || '10th Marksheet'}>
                  <FileText size={14} color="#34d399" />
                  <span>{tenthMarksheet.fileName || '10th Marksheet'}</span>
                </span>
                <div className={styles.docActionButtons}>
                  {tenthMarksheet.documentId && (
                    <button
                      type="button"
                      className={styles.viewBtn}
                      onClick={() => setPreviewDoc({ id: tenthMarksheet.documentId!, fileName: tenthMarksheet.fileName || '10th Marksheet', fileType: tenthMarksheet.fileType || 'application/pdf' })}
                    >
                      <Eye size={13} />
                      <span>View Document</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.reuploadBtn}
                    onClick={() => tenthInputRef.current?.click()}
                    disabled={student?.isAcademicLocked}
                  >
                    <RefreshCw size={13} />
                    <span>Re-upload</span>
                  </button>
                </div>
              </div>

              <div className={styles.extractedHeader}>
                <span className={styles.extractedTitle}>
                  <FileCheck size={14} color="#34d399" />
                  <span>Extracted 10th Information</span>
                </span>
                <span className={styles.verifiedInlineBadge}>
                  <Lock size={10} />
                  <span>Verified from Marksheet</span>
                </span>
              </div>

              <div className={styles.extractedGrid}>
                <div className={styles.extractedItemFull}>
                  <span className={styles.fieldLabel}>Student Name</span>
                  <span className={styles.fieldValue}>
                    <span>{tenthMarksheet.studentName || 'Extracted from Marksheet'}</span>
                    <CheckCircle2 size={14} color="#34d399" />
                  </span>
                </div>

                <div className={styles.extractedItem}>
                  <span className={styles.fieldLabel}>10th Percentage</span>
                  <span className={styles.highlightPercentage}>
                    {tenthMarksheet.percentage?.toFixed(2)}%
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', fontWeight: 600 }}>
                    <Check size={11} strokeWidth={3} />
                    <span>{tenthMarksheet.percentageSource === 'CALCULATED_FROM_SUBJECT_MARKS' ? 'Calculated from Marksheet' : 'Verified from Marksheet'}</span>
                  </span>
                </div>

                <div className={styles.extractedItem}>
                  <span className={styles.fieldLabel}>Passing Year</span>
                  <span className={styles.fieldValue}>
                    {tenthMarksheet.passingYear || 'N/A'}
                  </span>
                </div>

                <div className={styles.extractedItemFull}>
                  <span className={styles.fieldLabel}>Education Board</span>
                  <span className={styles.fieldValue}>
                    {tenthMarksheet.board || 'State / National Board'}
                  </span>
                </div>

                {tenthMarksheet.calculationEquation && (
                  <div className={styles.extractedItemFull} style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ fontSize: '0.74rem', color: '#34d399', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Sparkles size={12} />
                      <span>Subject Marks Breakdown:</span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#f8fafc', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                      {tenthMarksheet.calculationEquation}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '3px' }}>
                      {tenthMarksheet.calculationFormula || `Calculated Percentage: ${tenthMarksheet.obtainedMarks} ÷ 5 = ${tenthMarksheet.percentage?.toFixed(2)}%`}
                    </div>
                  </div>
                )}

                {tenthMarksheet.seatNumber && (
                  <div className={styles.extractedItemFull}>
                    <span className={styles.fieldLabel}>Seat / Roll No.</span>
                    <span className={styles.fieldValue} style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>
                      {tenthMarksheet.seatNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════ */}
        {/* ── 12TH MARKSHEET CARD ── */}
        {/* ══════════════════════════════════════════════════ */}
        <div className={`${styles.docCard} ${twelfthMarksheet?.percentage ? styles.docCardVerified : ''}`}>
          <div className={styles.docCardHeader}>
            <div className={styles.docCardTitleRow}>
              <div className={styles.docIconWrap}>
                <Award size={22} />
              </div>
              <div>
                <h3 className={styles.docCardTitle}>12th Marksheet</h3>
                <span className={styles.docCardSubtitle}>Higher Secondary / Diploma (HSC)</span>
              </div>
            </div>
            {uploadingLevel === 'TWELFTH' ? (
              <span className={`${styles.statusPill} ${styles.statusPillProcessing}`}>
                <Loader2 size={12} className="animate-spin" />
                <span>Processing</span>
              </span>
            ) : twelfthMarksheet?.percentage ? (
              <span className={`${styles.statusPill} ${styles.statusPillVerified}`}>
                <Check size={12} strokeWidth={3} />
                <span>Verified</span>
              </span>
            ) : twelfthMarksheet?.verificationStatus === 'FAILED' ? (
              <span className={`${styles.statusPill} ${styles.statusPillFailed}`}>
                <AlertCircle size={12} />
                <span>Extraction Failed</span>
              </span>
            ) : (
              <span className={`${styles.statusPill} ${styles.statusPillPending}`}>
                <Clock size={12} />
                <span>Mandatory</span>
              </span>
            )}
          </div>

          {/* Hidden File Input */}
          <input
            ref={twelfthInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0], 'TWELFTH')
              }
            }}
          />

          {/* Document State 1: In-Flight Extraction Loader */}
          {uploadingLevel === 'TWELFTH' ? (
            <div className={styles.loaderCard}>
              <p className={styles.loaderTitle}>Verifying your document</p>
              <MorphingInfinity className="size-10" style={{ width: '40px', height: '40px', color: '#8b5cf6' }} />
              <p className={styles.loaderStageText}>
                <span>{EXTRACTION_STAGES[loaderStageIdx]}</span>
              </p>
              <span className={styles.loaderSubHint}>This may take a few seconds.</span>
            </div>
          ) : !twelfthMarksheet?.percentage ? (
            /* Document State 2: Dropzone or Failed with Re-upload */
            <div>
              <div
                className={`${styles.uploadDropzone} ${dragActive === 'TWELFTH' ? styles.uploadDropzoneDragging : ''}`}
                onClick={() => twelfthInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragActive('TWELFTH') }}
                onDragLeave={() => setDragActive(null)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragActive(null)
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0], 'TWELFTH')
                  }
                }}
              >
                <div className={styles.uploadIconWrap}>
                  <UploadCloud size={22} />
                </div>
                <div>
                  <p className={styles.uploadText}>
                    {twelfthMarksheet?.verificationStatus === 'FAILED' ? 'Re-upload 12th Marksheet' : 'Upload 12th Marksheet'}
                  </p>
                  <p className={styles.uploadHint}>PDF, JPG, JPEG, or PNG (Max 20MB)</p>
                </div>
              </div>

              {twelfthMarksheet?.documentId && (
                <div className={styles.docMetaBar} style={{ marginTop: '12px' }}>
                  <span className={styles.docFileNameText} title={twelfthMarksheet.fileName || '12th Marksheet'}>
                    <FileText size={14} color="#94a3b8" />
                    <span>{twelfthMarksheet.fileName || '12th Marksheet'}</span>
                  </span>
                  <div className={styles.docActionButtons}>
                    <button
                      type="button"
                      className={styles.viewBtn}
                      onClick={() => setPreviewDoc({ id: twelfthMarksheet.documentId!, fileName: twelfthMarksheet.fileName || '12th Marksheet', fileType: twelfthMarksheet.fileType || 'application/pdf' })}
                    >
                      <Eye size={13} />
                      <span>View Document</span>
                    </button>
                    <button
                      type="button"
                      className={styles.reuploadBtn}
                      onClick={() => twelfthInputRef.current?.click()}
                    >
                      <RefreshCw size={13} />
                      <span>Re-upload</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Document State 3: Complete Verified Extraction View */
            <div className={styles.extractedBox}>
              {/* Document Meta Row with View & Re-upload */}
              <div className={styles.docMetaBar}>
                <span className={styles.docFileNameText} title={twelfthMarksheet.fileName || '12th Marksheet'}>
                  <FileText size={14} color="#34d399" />
                  <span>{twelfthMarksheet.fileName || '12th Marksheet'}</span>
                </span>
                <div className={styles.docActionButtons}>
                  {twelfthMarksheet.documentId && (
                    <button
                      type="button"
                      className={styles.viewBtn}
                      onClick={() => setPreviewDoc({ id: twelfthMarksheet.documentId!, fileName: twelfthMarksheet.fileName || '12th Marksheet', fileType: twelfthMarksheet.fileType || 'application/pdf' })}
                    >
                      <Eye size={13} />
                      <span>View Document</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.reuploadBtn}
                    onClick={() => twelfthInputRef.current?.click()}
                    disabled={student?.isAcademicLocked}
                  >
                    <RefreshCw size={13} />
                    <span>Re-upload</span>
                  </button>
                </div>
              </div>

              <div className={styles.extractedHeader}>
                <span className={styles.extractedTitle}>
                  <FileCheck size={14} color="#34d399" />
                  <span>Extracted 12th Information</span>
                </span>
                <span className={styles.verifiedInlineBadge}>
                  <Lock size={10} />
                  <span>Verified from Marksheet</span>
                </span>
              </div>

              <div className={styles.extractedGrid}>
                <div className={styles.extractedItemFull}>
                  <span className={styles.fieldLabel}>Student Name</span>
                  <span className={styles.fieldValue}>
                    <span>{twelfthMarksheet.studentName || 'Extracted from Marksheet'}</span>
                    <CheckCircle2 size={14} color="#34d399" />
                  </span>
                </div>

                <div className={styles.extractedItem}>
                  <span className={styles.fieldLabel}>12th Percentage</span>
                  <span className={styles.highlightPercentage}>
                    {twelfthMarksheet.percentage?.toFixed(2)}%
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', fontWeight: 600 }}>
                    <Check size={11} strokeWidth={3} />
                    <span>{twelfthMarksheet.percentageSource === 'CALCULATED_FROM_SUBJECT_MARKS' ? 'Calculated from Marksheet' : 'Verified from Marksheet'}</span>
                  </span>
                </div>

                <div className={styles.extractedItem}>
                  <span className={styles.fieldLabel}>Passing Year</span>
                  <span className={styles.fieldValue}>
                    {twelfthMarksheet.passingYear || 'N/A'}
                  </span>
                </div>

                <div className={styles.extractedItemFull}>
                  <span className={styles.fieldLabel}>Education Board</span>
                  <span className={styles.fieldValue}>
                    {twelfthMarksheet.board || 'State / National Board'}
                  </span>
                </div>

                {twelfthMarksheet.calculationEquation && (
                  <div className={styles.extractedItemFull} style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ fontSize: '0.74rem', color: '#34d399', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Sparkles size={12} />
                      <span>Subject Marks Breakdown:</span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#f8fafc', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                      {twelfthMarksheet.calculationEquation}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '3px' }}>
                      {twelfthMarksheet.calculationFormula || `Calculated Percentage: ${twelfthMarksheet.obtainedMarks} ÷ 5 = ${twelfthMarksheet.percentage?.toFixed(2)}%`}
                    </div>
                  </div>
                )}

                {twelfthMarksheet.seatNumber && (
                  <div className={styles.extractedItemFull}>
                    <span className={styles.fieldLabel}>Seat / Roll No.</span>
                    <span className={styles.fieldValue} style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>
                      {twelfthMarksheet.seatNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── VERIFIED SUMMARY PREVIEW & NAME COMPARISON ── */}
      {bothUploaded && (
        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <h3 className={styles.summaryTitle}>
              <Sparkles size={18} color="#c084fc" />
              <span>Extracted Profile Summary</span>
            </h3>
            <span className={styles.verifiedInlineBadge}>
              <ShieldCheck size={12} />
              <span>Immutable Document Record</span>
            </span>
          </div>

          <div className={styles.summaryGrid}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryRowLabel}>Candidate Verified Name</span>
              <span className={styles.summaryRowValue}>
                <span>{verifiedDisplayName}</span>
                <CheckCircle2 size={15} color="#34d399" />
              </span>
            </div>

            <div className={styles.summaryRow}>
              <span className={styles.summaryRowLabel}>10th Percentage</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                <span className={styles.summaryRowValue} style={{ color: '#34d399', fontSize: '16px' }}>
                  <span>{tenthMarksheet?.percentage?.toFixed(2)}%</span>
                  <Lock size={13} color="#34d399" />
                </span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                  {tenthMarksheet?.percentageSource === 'CALCULATED_FROM_SUBJECT_MARKS' ? '✓ Calculated from 5 Subject Marks' : '✓ Verified from Marksheet'}
                </span>
              </div>
            </div>

            <div className={styles.summaryRow}>
              <span className={styles.summaryRowLabel}>12th Percentage</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                <span className={styles.summaryRowValue} style={{ color: '#34d399', fontSize: '16px' }}>
                  <span>{twelfthMarksheet?.percentage?.toFixed(2)}%</span>
                  <Lock size={13} color="#34d399" />
                </span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                  {twelfthMarksheet?.percentageSource === 'CALCULATED_FROM_SUBJECT_MARKS' ? '✓ Calculated from 5 Subject Marks' : '✓ Verified from Marksheet'}
                </span>
              </div>
            </div>
          </div>

          {/* Name Mismatch Alert */}
          {isNameMismatch ? (
            <div className={`${styles.alertBox} ${styles.alertError}`}>
              <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Name mismatch detected between your documents.</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                  10th Marksheet Name: <em>"{tenthMarksheet?.studentName}"</em> vs 12th Marksheet Name: <em>"{twelfthMarksheet?.studentName}"</em>.
                  Please contact your institution administrator to verify document identity.
                </p>
              </div>
            </div>
          ) : (
            <div className={`${styles.alertBox} ${styles.alertSuccess}`}>
              <CheckCircle2 size={18} strokeWidth={2.5} style={{ flexShrink: 0 }} />
              <div>
                Candidate name verified consistently across 10th and 12th documents.
                This verified information will become permanent and read-only.
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className={styles.actionFooter}>
            <span className={styles.footerNote}>
              <Lock size={13} />
              <span>Verified data will become read-only and locked against manual edits.</span>
            </span>

            <button
              type="button"
              className={styles.completeBtn}
              onClick={handleCompleteVerification}
              disabled={completing || isNameMismatch || !bothUploaded}
            >
              {completing ? (
                <>
                  <MorphingInfinity className="size-4" style={{ width: '16px', height: '16px' }} />
                  <span>Locking Verified Data...</span>
                </>
              ) : (
                <>
                  <span>Complete Verification</span>
                  <ArrowRight size={16} strokeWidth={2.5} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── IN-APP DOCUMENT PREVIEW MODAL ── */}
      {previewDoc && (
        <div className={styles.previewModalOverlay} onClick={() => setPreviewDoc(null)}>
          <div className={styles.previewModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.previewModalHeader}>
              <h3 className={styles.previewModalTitle}>
                <FileText size={18} color="#8b5cf6" />
                <span>{previewDoc.fileName}</span>
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <a
                  href={`/api/documents/${previewDoc.id}/stream`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost btn-xs"
                  title="Open in new tab"
                  style={{ color: '#94a3b8' }}
                >
                  <ExternalLink size={15} />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="btn btn-ghost btn-xs"
                  style={{ color: '#cbd5e1' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className={styles.previewModalBody}>
              {previewDoc.fileType?.includes('pdf') || previewDoc.fileName.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={`/api/documents/${previewDoc.id}/stream`}
                  title={previewDoc.fileName}
                  style={{ width: '100%', height: '70vh', border: 'none', borderRadius: '8px', background: '#ffffff' }}
                />
              ) : (
                <img
                  src={`/api/documents/${previewDoc.id}/stream`}
                  alt={previewDoc.fileName}
                  style={{ maxWidth: '100%', maxHeight: '68vh', objectFit: 'contain', borderRadius: '8px' }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
