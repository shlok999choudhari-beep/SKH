'use client'
import { useState, useEffect } from 'react'
import styles from '../institution.module.css'

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
    if (!requestStudentId || !requestTitle || !requestReason) return
    setSendingRequest(true)
    setRequestMessage('')

    try {
      const res = await fetch('/api/institution/document-requests', {
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
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send request')
      }

      setIsRequestModalOpen(false)
      setRequestStudentId('')
      setRequestTitle('')
      setRequestReason('')
      fetchData()
    } catch (err: any) {
      setRequestMessage(err.message || 'Error sending document request')
    } finally {
      setSendingRequest(false)
    }
  }

  const filteredDocs = documents.filter(doc => {
    if (selectedCategory !== 'ALL' && doc.category !== selectedCategory) return false
    if (selectedStatus !== 'ALL' && doc.verificationStatus !== selectedStatus) return false

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const studentMatch = doc.student.name.toLowerCase().includes(q) || doc.student.email.toLowerCase().includes(q)
      const docMatch = doc.fileName.toLowerCase().includes(q) || doc.documentType.toLowerCase().includes(q)
      return studentMatch || docMatch
    }
    return true
  })

  const totalShared = documents.length
  const pendingCount = documents.filter(d => d.verificationStatus === 'PENDING').length
  const verifiedCount = documents.filter(d => d.verificationStatus === 'VERIFIED').length
  const openRequestsCount = requests.filter(r => r.status === 'PENDING').length

  return (
    <>
      <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className={styles.pageTitle} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              📁 Student Documents
            </h1>
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
              cursor: 'pointer'
            }}
          >
            📋 Request Document from Student
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Metric Cards */}
        <div className={styles.statsGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '1.5rem' }}>
          <div className={styles.card} style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Shared Documents</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              {totalShared}
            </div>
          </div>
          <div className={styles.card} style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Pending Verification</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-orange)', marginTop: '0.25rem' }}>
              {pendingCount}
            </div>
          </div>
          <div className={styles.card} style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Verified Documents</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-green)', marginTop: '0.25rem' }}>
              {verifiedCount}
            </div>
          </div>
          <div className={styles.card} style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Open Document Requests</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-violet)', marginTop: '0.25rem' }}>
              {openRequestsCount}
            </div>
          </div>
        </div>

        {/* Tab & Search Bar */}
        <div className={styles.card} style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setActiveTab('shared')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'shared' ? 'var(--accent-violet)' : 'transparent',
                  color: activeTab === 'shared' ? 'white' : 'var(--text-secondary)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                📁 Shared Documents ({totalShared})
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'requests' ? 'var(--accent-violet)' : 'transparent',
                  color: activeTab === 'requests' ? 'white' : 'var(--text-secondary)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                📋 Requested Documents ({requests.length})
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search student or document..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  minWidth: '220px'
                }}
              />

              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">🟡 Pending Review</option>
                <option value="VERIFIED">🟢 Verified</option>
                <option value="REJECTED">🔴 Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className={styles.card} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            Loading student documents...
          </div>
        ) : activeTab === 'requests' ? (
          /* REQUESTS LIST */
          <div className={styles.card}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              Sent Document Requests
            </h2>
            {requests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                No document requests sent yet. Click "Request Document from Student" to get started.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {requests.map(req => (
                  <div
                    key={req.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1.25rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-secondary)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                          📄 {req.title}
                        </h3>
                        <span className={`badge ${req.status === 'COMPLETED' ? 'badge-green' : 'badge-orange'}`}>
                          {req.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Student: <strong>{req.student.name}</strong> ({req.student.email}) • Reason: {req.reason}
                      </p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
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
          <div className={styles.card} style={{ textAlign: 'center', padding: '3.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              No Shared Documents
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto' }}>
              Students have not explicitly shared documents with your institution yet. You can request specific documents using the button above.
            </p>
          </div>
        ) : (
          /* SHARED DOCUMENTS GRID */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
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
                    border: '1px solid var(--border)'
                  }}
                >
                  <div>
                    {/* Student Info header */}
                    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                        👤 {doc.student.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {doc.student.email} {doc.student.college ? `• ${doc.student.college}` : ''}
                      </div>
                    </div>

                    {/* Document details */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '1.8rem', padding: '6px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                        {doc.fileType.includes('pdf') ? '📕' : doc.fileType.startsWith('image') ? '🖼️' : '📄'}
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                          {doc.fileName}
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Category: {doc.category}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '0.75rem' }}>
                      <span className={`badge ${doc.verificationStatus === 'VERIFIED' ? 'badge-green' : doc.verificationStatus === 'REJECTED' ? 'badge-orange' : 'badge-purple'}`}>
                        {doc.verificationStatus === 'VERIFIED' ? '🟢 Verified' : doc.verificationStatus === 'REJECTED' ? '🔴 Rejected' : '🟡 Pending Review'}
                      </span>

                      {doc.qualityScore !== undefined && (
                        <span className="badge badge-green" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                          AI Score: {doc.qualityScore}%
                        </span>
                      )}
                    </div>

                    {/* Rejection Reason if rejected */}
                    {doc.verificationStatus === 'REJECTED' && doc.rejectionReason && (
                      <div style={{ padding: '8px 10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', color: '#f87171', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                        Reason: {doc.rejectionReason}
                      </div>
                    )}

                    {/* Extracted Details */}
                    {parsedExtracted && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: '6px', marginBottom: '0.75rem' }}>
                        {parsedExtracted.name && <div>• Student Name: <strong>{parsedExtracted.name}</strong></div>}
                        {parsedExtracted.institution && <div>• Institution: <strong>{parsedExtracted.institution}</strong></div>}
                        {parsedExtracted.documentNumber && <div>• Doc No: <strong>{parsedExtracted.documentNumber}</strong></div>}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="btn btn-sm"
                      style={{ padding: '6px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      👁️ View Document
                    </button>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleVerify(doc.id)}
                        disabled={doc.verificationStatus === 'VERIFIED'}
                        className="btn btn-sm"
                        style={{ padding: '6px 12px', background: 'var(--accent-green)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', opacity: doc.verificationStatus === 'VERIFIED' ? 0.6 : 1 }}
                      >
                        ✓ Verify
                      </button>

                      <button
                        onClick={() => { setRejectDoc(doc); setRejectionReason(''); }}
                        disabled={doc.verificationStatus === 'REJECTED'}
                        className="btn btn-sm"
                        style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', opacity: doc.verificationStatus === 'REJECTED' ? 0.6 : 1 }}
                      >
                        ✕ Reject
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
              <button onClick={() => setIsRequestModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            {requestMessage && (
              <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>
                ⚠️ {requestMessage}
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
                <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  📄 {previewDoc.fileName} (Student: {previewDoc.student.name})
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Category: {previewDoc.category} • Access: {previewDoc.accessLevel}
                </span>
              </div>
              <button onClick={() => setPreviewDoc(null)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                ✕
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
