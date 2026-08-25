'use client'
import { useState, useEffect } from 'react'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import styles from '../institution.module.css'
import {
  FolderLock,
  FileQuestion,
  FileText,
  Lock,
  User,
  Image as ImageIcon,
  CheckCircle2,
  CircleX,
  Clock,
  Eye,
  X,
  TriangleAlert,
  Loader2,
  Search
} from 'lucide-react'

interface SharedDocument {
  id: number
  fileName: string
  fileType: string
  fileSize: number
  documentType: string
  category: string
  accessLevel: string
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NEEDS_REVIEW'
  qualityScore?: number
  extractedInformation?: string
  rejectionReason?: string
  uploadedAt: string
  student: {
    id: number
    name: string
    email: string
    college?: string
  }
}

interface DocumentRequest {
  id: number
  title: string
  reason: string
  category?: string
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED'
  requestedAt: string
  student: {
    name: string
    email: string
  }
}

interface StudentOption {
  id: number
  name: string
  email: string
  college?: string
}

export default function InstitutionStudentDocumentsPage() {
  const [documents, setDocuments] = useState<SharedDocument[]>([])
  const [requests, setRequests] = useState<DocumentRequest[]>([])
  const [students, setStudents] = useState<StudentOption[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'shared' | 'requests'>('shared')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('ALL')

  // Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<SharedDocument | null>(null)

  // Rejection Modal State
  const [rejectDoc, setRejectDoc] = useState<SharedDocument | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejecting, setRejecting] = useState(false)

  // Request Document Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [requestStudentId, setRequestStudentId] = useState<number | ''>('')
  const [requestTitle, setRequestTitle] = useState('')
  const [requestReason, setRequestReason] = useState('')
  const [requestCategory, setRequestCategory] = useState('Academic')
  const [sendingRequest, setSendingRequest] = useState(false)
  const [requestMessage, setRequestMessage] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [docsRes, reqsRes, studentsRes] = await Promise.all([
        fetch('/api/institution/documents'),
        fetch('/api/documents/requests'),
        fetch('/api/institution/students')
      ])

      const docsData = await docsRes.json()
      const reqsData = await reqsRes.json()
      const studentsData = await studentsRes.json()

      if (docsData.documents) setDocuments(docsData.documents)
      if (reqsData.requests) setRequests(reqsData.requests)
      if (studentsData.students) setStudents(studentsData.students)
    } catch (err) {
      console.error('Error fetching institution documents:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (docId: number) => {
    try {
      const res = await fetch(`/api/institution/documents/${docId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'VERIFIED' })
      })
      if (res.ok) {
        setDocuments(prev => prev.map(d => d.id === docId ? { ...d, verificationStatus: 'VERIFIED', rejectionReason: undefined } : d))
      }
    } catch (err) {
      console.error('Verify error:', err)
    }
  }

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectDoc || !rejectionReason.trim()) return
    setRejecting(true)

    try {
      const res = await fetch(`/api/institution/documents/${rejectDoc.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED', rejectionReason })
      })

      if (res.ok) {
        setDocuments(prev => prev.map(d => d.id === rejectDoc.id ? { ...d, verificationStatus: 'REJECTED', rejectionReason } : d))
        setRejectDoc(null)
        setRejectionReason('')
      }
    } catch (err) {
      console.error('Reject error:', err)
    } finally {
      setRejecting(false)
    }
  }

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!requestStudentId || !requestTitle.trim() || !requestReason.trim()) return
    setSendingRequest(true)
    setRequestMessage('')

    try {
      const res = await fetch('/api/documents/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: Number(requestStudentId),
          title: requestTitle,
          reason: requestReason,
          category: requestCategory
        })
      })

      const data = await res.json()
      if (res.ok && data.request) {
        setRequests(prev => [data.request, ...prev])
        setIsRequestModalOpen(false)
        setRequestTitle('')
        setRequestReason('')
        setRequestStudentId('')
      } else {
        setRequestMessage(data.error || 'Failed to submit document request')
      }
    } catch (err) {
      console.error('Send request error:', err)
      setRequestMessage('Network error submitting request')
    } finally {
      setSendingRequest(false)
    }
  }

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.student.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === 'ALL' || doc.category === selectedCategory
    const matchesStatus = selectedStatus === 'ALL' || doc.verificationStatus === selectedStatus

    return matchesSearch && matchesCategory && matchesStatus
  })

  const totalShared = documents.length
  const pendingCount = documents.filter(d => d.verificationStatus === 'PENDING' || d.verificationStatus === 'NEEDS_REVIEW').length
  const verifiedCount = documents.filter(d => d.verificationStatus === 'VERIFIED').length
  const openRequestsCount = requests.filter(r => r.status === 'PENDING').length

  return (
    <>
      <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', width: '100%' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderLock size={24} strokeWidth={2} color="#a855f7" />
              <h1 className={styles.pageTitle}>Student Documents Vault</h1>
            </div>
            <p className={styles.pageSubtitle}>
              Review, verify, and request academic and verification documents explicitly shared by students.
            </p>
          </div>
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="btn btn-primary"
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '10px',
              fontWeight: 600,
              background: 'linear-gradient(135deg, var(--accent-violet) 0%, #6366f1 100%)',
              color: 'white',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FileQuestion size={16} strokeWidth={2} />
            <span>Request Document from Student</span>
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Metric Cards */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7' }}>
              <FolderLock size={22} strokeWidth={2} />
            </div>
            <div>
              <div className={styles.statValue}>{totalShared}</div>
              <div className={styles.statLabel}>Total Shared Documents</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Clock size={22} strokeWidth={2} />
            </div>
            <div>
              <div className={styles.statValue} style={{ color: '#f59e0b' }}>{pendingCount}</div>
              <div className={styles.statLabel}>Pending Verification</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <CheckCircle2 size={22} strokeWidth={2} />
            </div>
            <div>
              <div className={styles.statValue} style={{ color: '#10b981' }}>{verifiedCount}</div>
              <div className={styles.statLabel}>Verified Documents</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
              <FileQuestion size={22} strokeWidth={2} />
            </div>
            <div>
              <div className={styles.statValue} style={{ color: '#818cf8' }}>{openRequestsCount}</div>
              <div className={styles.statLabel}>Open Document Requests</div>
            </div>
          </div>
        </div>

        {/* Tab & Search Bar */}
        <div className={styles.card} style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setActiveTab('shared')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: activeTab === 'shared' ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid var(--border)',
                  background: activeTab === 'shared' ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                  color: activeTab === 'shared' ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <FolderLock size={15} strokeWidth={2} color={activeTab === 'shared' ? '#c084fc' : 'currentColor'} />
                <span>Shared Documents ({totalShared})</span>
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: activeTab === 'requests' ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid var(--border)',
                  background: activeTab === 'requests' ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                  color: activeTab === 'requests' ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <FileQuestion size={15} strokeWidth={2} color={activeTab === 'requests' ? '#c084fc' : 'currentColor'} />
                <span>Requested Documents ({requests.length})</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                  <Search size={14} strokeWidth={2} />
                </span>
                <input
                  type="text"
                  placeholder="Search student or document..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    padding: '8px 12px 8px 32px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '13.5px',
                    minWidth: '240px'
                  }}
                />
              </div>

              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '13.5px',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Review</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className={styles.card} style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <MorphingInfinity className="size-16" style={{ width: '64px', height: '64px', color: '#a855f7' }} />
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Loading student documents...</p>
          </div>
        ) : activeTab === 'requests' ? (
          /* REQUESTS LIST */
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Sent Document Requests
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{requests.length} active requests</span>
            </div>
            {requests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                No document requests sent yet. Click &quot;Request Document from Student&quot; above to request missing credentials.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {requests.map(req => (
                  <div
                    key={req.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem 1.25rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      background: 'rgba(255, 255, 255, 0.02)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={16} strokeWidth={2} color="#a855f7" />
                        <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0, fontSize: '14.5px' }}>
                          {req.title}
                        </h3>
                        <span className={`badge ${req.status === 'COMPLETED' ? 'badge-green' : 'badge-orange'}`}>
                          {req.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '2px' }}>
                        Student: <strong>{req.student.name}</strong> ({req.student.email}) • Reason: {req.reason}
                      </p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Sent on: {new Date(req.requestedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : filteredDocs.length === 0 ? (
          /* EMPTY SHARED DOCUMENTS */
          <div className={styles.card} style={{ textAlign: 'center', padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ marginBottom: '1rem', width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={28} strokeWidth={1.5} color="var(--text-muted)" />
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              No Shared Documents Found
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto', fontSize: '13.5px' }}>
              {searchQuery || selectedStatus !== 'ALL'
                ? 'No documents match your current search or status filter.'
                : 'Students have not shared documents with your institution yet. You can request specific documents using the button above.'}
            </p>
          </div>
        ) : (
          /* SHARED DOCUMENTS GRID */
          <div className={styles.docGrid}>
            {filteredDocs.map(doc => {
              const parsedExtracted = doc.extractedInformation ? JSON.parse(doc.extractedInformation) : null

              return (
                <div
                  key={doc.id}
                  className={styles.card}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '1.25rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg, 12px)',
                    gap: '12px'
                  }}
                >
                  <div>
                    {/* Student Info header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc', fontWeight: 700, fontSize: '13px' }}>
                          {doc.student.name ? doc.student.name.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                            {doc.student.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {doc.student.email} {doc.student.college ? `• ${doc.student.college}` : ''}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Document details */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '0.75rem' }}>
                      <div style={{ padding: '8px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {doc.fileType.includes('pdf') ? (
                          <FileText size={22} strokeWidth={2} color="#ef4444" />
                        ) : doc.fileType.startsWith('image') ? (
                          <ImageIcon size={22} strokeWidth={2} color="#3b82f6" />
                        ) : (
                          <FileText size={22} strokeWidth={2} color="#a855f7" />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px 0', fontSize: '14.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={doc.fileName}>
                          {doc.fileName}
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Category: {doc.category}
                        </span>
                      </div>
                    </div>

                    {/* Badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '0.75rem' }}>
                      <span className={`badge ${doc.verificationStatus === 'VERIFIED' ? 'badge-green' : doc.verificationStatus === 'REJECTED' ? 'badge-orange' : 'badge-purple'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px' }}>
                        {doc.verificationStatus === 'VERIFIED' ? (
                          <>
                            <CheckCircle2 size={12} strokeWidth={2} />
                            <span>Verified</span>
                          </>
                        ) : doc.verificationStatus === 'REJECTED' ? (
                          <>
                            <CircleX size={12} strokeWidth={2} />
                            <span>Rejected</span>
                          </>
                        ) : (
                          <>
                            <Clock size={12} strokeWidth={2} />
                            <span>Pending Review</span>
                          </>
                        )}
                      </span>

                      {doc.qualityScore !== undefined && (
                        <span className="badge badge-green" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '11.5px' }}>
                          AI Score: {doc.qualityScore}%
                        </span>
                      )}
                    </div>

                    {/* Rejection Reason if rejected */}
                    {doc.verificationStatus === 'REJECTED' && doc.rejectionReason && (
                      <div style={{ padding: '8px 10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: '#f87171', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                        Reason: {doc.rejectionReason}
                      </div>
                    )}

                    {/* Extracted Details */}
                    {parsedExtracted && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', padding: '8px 10px', borderRadius: '6px', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {parsedExtracted.name && <div>• Student Name: <strong style={{ color: 'var(--text-primary)' }}>{parsedExtracted.name}</strong></div>}
                        {parsedExtracted.institution && <div>• Institution: <strong style={{ color: 'var(--text-primary)' }}>{parsedExtracted.institution}</strong></div>}
                        {parsedExtracted.documentNumber && <div>• Doc No: <strong style={{ color: 'var(--text-primary)' }}>{parsedExtracted.documentNumber}</strong></div>}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="btn btn-sm btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <Eye size={13} strokeWidth={2} />
                      <span>View Document</span>
                    </button>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleVerify(doc.id)}
                        disabled={doc.verificationStatus === 'VERIFIED'}
                        className="btn btn-sm"
                        style={{
                          padding: '6px 12px',
                          background: doc.verificationStatus === 'VERIFIED' ? 'rgba(16, 185, 129, 0.2)' : 'var(--accent-green)',
                          color: doc.verificationStatus === 'VERIFIED' ? '#6ee7b7' : 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: doc.verificationStatus === 'VERIFIED' ? 'default' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12.5px'
                        }}
                      >
                        <CheckCircle2 size={13} strokeWidth={2} />
                        <span>Verify</span>
                      </button>

                      <button
                        onClick={() => { setRejectDoc(doc); setRejectionReason(''); }}
                        disabled={doc.verificationStatus === 'REJECTED'}
                        className="btn btn-sm"
                        style={{
                          padding: '6px 12px',
                          background: doc.verificationStatus === 'REJECTED' ? 'rgba(239, 68, 68, 0.2)' : '#ef4444',
                          color: doc.verificationStatus === 'REJECTED' ? '#fca5a5' : 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: doc.verificationStatus === 'REJECTED' ? 'default' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12.5px'
                        }}
                      >
                        <CircleX size={13} strokeWidth={2} />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* REQUEST DOCUMENT MODAL */}
      {isRequestModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '16px', maxWidth: '520px', width: '100%', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Request Document from Student
              </h2>
              <button onClick={() => setIsRequestModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {requestMessage && (
              <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TriangleAlert size={14} strokeWidth={2} color="#ef4444" />
                <span>{requestMessage}</span>
              </div>
            )}

            <form onSubmit={handleSendRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Select Student *
                </label>
                <select
                  value={requestStudentId}
                  onChange={e => setRequestStudentId(Number(e.target.value))}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  <option value="">-- Choose Student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Required Document Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2nd Semester Marksheet, Identity Proof"
                  value={requestTitle}
                  onChange={e => setRequestTitle(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Category
                </label>
                <select
                  value={requestCategory}
                  onChange={e => setRequestCategory(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  <option value="Academic">Academic</option>
                  <option value="Identity">Identity</option>
                  <option value="Certificates">Certificates</option>
                  <option value="Internship">Internship</option>
                  <option value="Placement">Placement</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Reason for Request *
                </label>
                <textarea
                  placeholder="Required for academic verification and placement drive eligibility."
                  value={requestReason}
                  onChange={e => setRequestReason(e.target.value)}
                  required
                  rows={3}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsRequestModalOpen(false)} className="btn" style={{ padding: '8px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px' }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingRequest}
                  className="btn btn-primary"
                  style={{ padding: '8px 20px', background: 'var(--accent-violet)', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                >
                  {sendingRequest ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectDoc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 1rem' }}>
              Reject Document: {rejectDoc.fileName}
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Please provide a clear reason for rejecting this student document so they can re-upload an acceptable version.
            </p>

            <form onSubmit={handleConfirmReject}>
              <textarea
                placeholder="e.g. Document image is incomplete / text is unreadable / incorrect document uploaded."
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                required
                rows={4}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', marginBottom: '1rem' }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setRejectDoc(null)} className="btn" style={{ padding: '8px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px' }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejecting}
                  className="btn"
                  style={{ padding: '8px 20px', background: '#ef4444', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                >
                  {rejecting ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewDoc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '16px', maxWidth: '800px', width: '100%', height: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={16} strokeWidth={2} color="#a855f7" />
                  <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    {previewDoc.fileName} (Student: {previewDoc.student.name})
                  </h3>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                  Category: {previewDoc.category} • Access: {previewDoc.accessLevel}
                </span>
              </div>
              <button onClick={() => setPreviewDoc(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <div style={{ flex: 1, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {previewDoc.fileType.startsWith('image/') ? (
                <img
                  src={`/api/documents/${previewDoc.id}/download`}
                  alt={previewDoc.fileName}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              ) : (
                <iframe
                  src={`/api/documents/${previewDoc.id}/download`}
                  title={previewDoc.fileName}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
