'use client'
import { useState, useEffect } from 'react'
import StudentSidebar from '@/components/StudentSidebar'
import styles from '../dashboard.module.css'

interface DocumentItem {
  id: number
  fileName: string
  filePath: string
  fileType: string
  fileSize: number
  documentType: string
  category: string
  description?: string
  accessLevel: 'PRIVATE' | 'INSTITUTION_ONLY' | 'SHARED'
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NEEDS_REVIEW'
  qualityScore?: number
  qualityResult?: string
  extractedInformation?: string
  expiryDate?: string
  rejectionReason?: string
  version: number
  uploadedAt: string
}

interface DocumentRequestItem {
  id: number
  title: string
  reason: string
  category?: string
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED'
  requestedAt: string
  institution: {
    name: string
  }
}

interface AnalysisResult {
  documentDetected: boolean
  documentType: string
  qualityScore: number
  status: 'READY' | 'NEEDS_REVIEW' | 'POOR_QUALITY' | 'UNRECOGNIZED'
  checks: {
    readable: boolean
    cropped: boolean
    blurry: boolean
    blank: boolean
    randomImage: boolean
    nameDetected: boolean
    institutionDetected: boolean
    documentNumberDetected: boolean
    rollNumberDetected: boolean
    dateDetected: boolean
    photoDetected: boolean
    qrDetected: boolean
    barcodeDetected: boolean
  }
  extractedInformation: {
    name: string | null
    institution: string | null
    documentNumber: string | null
    rollNumber: string | null
    registrationNumber: string | null
    yearOrDate: string | null
    certificateNumber: string | null
  }
  warnings: string[]
  passedChecks: string[]
  message: string
}

const CATEGORIES = ['ALL', 'Academic', 'Identity', 'Certificates', 'Internship', 'Placement', 'Resume', 'Projects', 'Other']

export default function StudentDocumentVaultPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [requests, setRequests] = useState<DocumentRequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'my_docs' | 'shared' | 'requests' | 'verification'>('my_docs')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploadStep, setUploadStep] = useState<1 | 2 | 3>(1)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [docName, setDocName] = useState('')
  const [docCategory, setDocCategory] = useState('Academic')
  const [docType, setDocType] = useState('Marksheet')
  const [docDescription, setDocDescription] = useState('')
  const [accessLevel, setAccessLevel] = useState<'PRIVATE' | 'INSTITUTION_ONLY' | 'SHARED'>('PRIVATE')
  const [expiryDate, setExpiryDate] = useState('')
  const [linkedRequestId, setLinkedRequestId] = useState<number | null>(null)

  // AI Quality Analysis State
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [savingDoc, setSavingDoc] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Preview & Edit State
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null)
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [docsRes, reqsRes] = await Promise.all([
        fetch('/api/documents'),
        fetch('/api/documents/requests')
      ])
      const docsData = await docsRes.json()
      const reqsData = await reqsRes.json()

      if (docsData.documents) setDocuments(docsData.documents)
      if (reqsData.requests) setRequests(reqsData.requests)
    } catch (err) {
      console.error('Error fetching vault data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      if (!docName) {
        setDocName(file.name.replace(/\.[^/.]+$/, ''))
      }
    }
  }

  const handleStartAnalysis = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      setErrorMessage('Please select a document file to upload.')
      return
    }

    setErrorMessage('')
    setUploadStep(2)
    setAnalyzing(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const res = await fetch('/api/documents/analyze', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'AI analysis failed')
      }

      setAnalysisResult(data.analysis)
      if (data.analysis.documentType && data.analysis.documentType !== 'Other') {
        setDocType(data.analysis.documentType)
      }
      setUploadStep(3)
    } catch (err: any) {
      console.error('Analysis error:', err)
      setErrorMessage(err.message || 'AI document quality check failed. Please try again.')
      setUploadStep(1)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleConfirmSave = async () => {
    if (!selectedFile) return
    setSavingDoc(true)
    setErrorMessage('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('fileName', docName || selectedFile.name)
      formData.append('category', docCategory)
      formData.append('documentType', docType)
      formData.append('description', docDescription)
      formData.append('accessLevel', accessLevel)
      if (expiryDate) formData.append('expiryDate', expiryDate)
      if (linkedRequestId) formData.append('requestId', linkedRequestId.toString())

      if (analysisResult) {
        formData.append('qualityScore', analysisResult.qualityScore.toString())
        formData.append('qualityResult', JSON.stringify(analysisResult))
        formData.append('extractedInformation', JSON.stringify(analysisResult.extractedInformation))
      }

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save document')
      }

      // Reset Modal
      closeUploadModal()
      fetchData()
    } catch (err: any) {
      console.error('Save error:', err)
      setErrorMessage(err.message || 'Failed to save document.')
    } finally {
      setSavingDoc(false)
    }
  }

  const closeUploadModal = () => {
    setIsUploadOpen(false)
    setUploadStep(1)
    setSelectedFile(null)
    setDocName('')
    setDocDescription('')
    setDocCategory('Academic')
    setDocType('Marksheet')
    setAccessLevel('PRIVATE')
    setExpiryDate('')
    setLinkedRequestId(null)
    setAnalysisResult(null)
    setErrorMessage('')
  }

  const handleUpdatePermission = async (docId: number, newLevel: 'PRIVATE' | 'INSTITUTION_ONLY' | 'SHARED') => {
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessLevel: newLevel })
      })
      if (res.ok) {
        setDocuments(prev => prev.map(d => d.id === docId ? { ...d, accessLevel: newLevel } : d))
        if (editingDoc) setEditingDoc(prev => prev ? { ...prev, accessLevel: newLevel } : null)
      }
    } catch (err) {
      console.error('Update permission error:', err)
    }
  }

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm('Are you sure you want to delete this document from your vault?')) return
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' })
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== docId))
        if (previewDoc?.id === docId) setPreviewDoc(null)
      }
    } catch (err) {
      console.error('Delete document error:', err)
    }
  }

  // Filtered lists
  const filteredDocs = documents.filter(doc => {
    // Tab filter
    if (activeTab === 'shared' && doc.accessLevel === 'PRIVATE') return false
    if (activeTab === 'verification' && doc.verificationStatus === 'PENDING') return false

    // Category filter
    if (selectedCategory !== 'ALL' && doc.category !== selectedCategory) return false

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const nameMatch = doc.fileName.toLowerCase().includes(q)
      const typeMatch = doc.documentType.toLowerCase().includes(q)
      const catMatch = doc.category.toLowerCase().includes(q)
      return nameMatch || typeMatch || catMatch
    }
    return true
  })

  // Stats calculation
  const totalDocs = documents.length
  const verifiedDocs = documents.filter(d => d.verificationStatus === 'VERIFIED').length
  const pendingDocs = documents.filter(d => d.verificationStatus === 'PENDING').length
  const pendingRequests = requests.filter(r => r.status === 'PENDING').length

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.content}>
        <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className={styles.pageTitle} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              📁 Document Vault
            </h1>
            <p className={styles.pageSubtitle}>
              Securely store, analyze, and manage your academic and identity documents with AI verification.
            </p>
          </div>
          <button
            onClick={() => { setIsUploadOpen(true); setUploadStep(1); }}
            className="btn btn-primary"
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
              background: 'linear-gradient(135deg, var(--accent-violet) 0%, #6366f1 100%)',
              color: 'white',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
            }}
          >
            <span>📤</span> Upload Document
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Metric Cards */}
        <div className={styles.statsGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '1.5rem' }}>
          <div className={styles.statCard}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Documents</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              {totalDocs}
            </div>
          </div>
          <div className={styles.statCard}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Verified by Institution</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-green)', marginTop: '0.25rem' }}>
              {verifiedDocs}
            </div>
          </div>
          <div className={styles.statCard}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Pending Review</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-orange)', marginTop: '0.25rem' }}>
              {pendingDocs}
            </div>
          </div>
          <div className={styles.statCard}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Document Requests</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-violet)', marginTop: '0.25rem' }}>
              {pendingRequests}
            </div>
          </div>
        </div>

        {/* Tab & Search Bar Container */}
        <div className={styles.card} style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setActiveTab('my_docs')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'my_docs' ? 'var(--accent-violet)' : 'transparent',
                  color: activeTab === 'my_docs' ? 'white' : 'var(--text-secondary)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                📄 My Documents ({totalDocs})
              </button>
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
                🏫 Shared with Institution ({documents.filter(d => d.accessLevel !== 'PRIVATE').length})
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
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                📄 Document Requests
                {pendingRequests > 0 && (
                  <span style={{ marginLeft: '6px', background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '11px' }}>
                    {pendingRequests}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('verification')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'verification' ? 'var(--accent-violet)' : 'transparent',
                  color: activeTab === 'verification' ? 'white' : 'var(--text-secondary)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                🤖 Verification Status
              </button>
            </div>

            {/* Search Input */}
            <div style={{ minWidth: '240px' }}>
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

          {/* Categories Pill Filters */}
          {activeTab !== 'requests' && (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingTop: '1rem', paddingBottom: '4px' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    border: '1px solid var(--border)',
                    background: selectedCategory === cat ? 'var(--accent-violet)' : 'var(--bg-secondary)',
                    color: selectedCategory === cat ? 'white' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tab Contents */}
        {loading ? (
          <div className={styles.card} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            Loading document vault...
          </div>
        ) : activeTab === 'requests' ? (
          /* DOCUMENT REQUESTS TAB */
          <div className={styles.card}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              Institution Document Requests
            </h2>
            {requests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                No document requests from your institution yet.
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
                      background: 'var(--bg-secondary)',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem' }}>
                          📄 {req.title}
                        </h3>
                        <span className={`badge ${req.status === 'COMPLETED' ? 'badge-green' : 'badge-orange'}`}>
                          {req.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Requested by: <strong>{req.institution.name}</strong> • Reason: {req.reason}
                      </p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
                        Requested on: {new Date(req.requestedAt).toLocaleDateString()}
                      </span>
                    </div>

                    {req.status === 'PENDING' && (
                      <button
                        onClick={() => {
                          setLinkedRequestId(req.id)
                          setDocName(req.title)
                          if (req.category) setDocCategory(req.category)
                          setAccessLevel('INSTITUTION_ONLY')
                          setIsUploadOpen(true)
                          setUploadStep(1)
                        }}
                        className="btn btn-sm"
                        style={{
                          background: 'linear-gradient(135deg, var(--accent-violet) 0%, #6366f1 100%)',
                          color: 'white',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        📤 Upload Requested Document
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : filteredDocs.length === 0 ? (
          /* EMPTY STATE FOR DOCUMENTS */
          <div className={styles.card} style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              No Documents Yet
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
              Store your academic, identity, internship and career documents securely in your personal vault with smart AI quality verification.
            </p>
            <button
              onClick={() => { setIsUploadOpen(true); setUploadStep(1); }}
              className="btn btn-primary"
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '10px',
                background: 'var(--accent-violet)',
                color: 'white',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Upload Document Now
            </button>
          </div>
        ) : (
          /* DOCUMENTS GRID */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.25rem' }}>
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
                    border: '1px solid var(--border)',
                    position: 'relative'
                  }}
                >
                  {/* Top Bar: Icon, Title & Access Badge */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ fontSize: '1.8rem', padding: '6px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                          {doc.fileType.includes('pdf') ? '📕' : doc.fileType.startsWith('image') ? '🖼️' : '📄'}
                        </div>
                        <div>
                          <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem', margin: 0, wordBreak: 'break-word' }}>
                            {doc.fileName}
                          </h3>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {doc.category} • {formatFileSize(doc.fileSize)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Access Pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '0.75rem' }}>
                      <span className={`badge ${doc.verificationStatus === 'VERIFIED' ? 'badge-green' : doc.verificationStatus === 'REJECTED' ? 'badge-orange' : 'badge-purple'}`}>
                        {doc.verificationStatus === 'VERIFIED' ? '🟢 Verified' : doc.verificationStatus === 'REJECTED' ? '🔴 Rejected' : '🟡 Pending Review'}
                      </span>

                      <span className="badge badge-purple" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                        {doc.accessLevel === 'PRIVATE' ? '🔒 Private' : doc.accessLevel === 'INSTITUTION_ONLY' ? '🏫 Institution Access' : '🌐 Shared'}
                      </span>

                      {doc.qualityScore !== undefined && doc.qualityScore !== null && (
                        <span className="badge badge-green" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                          AI Score: {doc.qualityScore}%
                        </span>
                      )}
                    </div>

                    {/* Rejection Reason Alert if rejected */}
                    {doc.verificationStatus === 'REJECTED' && doc.rejectionReason && (
                      <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#f87171', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                        <strong>Rejection Reason:</strong> {doc.rejectionReason}
                      </div>
                    )}

                    {/* Extracted Info snippet */}
                    {parsedExtracted && (parsedExtracted.name || parsedExtracted.documentNumber || parsedExtracted.institution) && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: '6px', marginBottom: '0.75rem' }}>
                        {parsedExtracted.name && <div>• Name: <strong>{parsedExtracted.name}</strong></div>}
                        {parsedExtracted.institution && <div>• Institution: <strong>{parsedExtracted.institution}</strong></div>}
                        {parsedExtracted.documentNumber && <div>• Doc No: <strong>{parsedExtracted.documentNumber}</strong></div>}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="btn btn-sm"
                        style={{ padding: '4px 10px', fontSize: '0.8rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '6px' }}
                      >
                        👁️ Preview
                      </button>
                      <a
                        href={`/api/documents/${doc.id}/download?download=true`}
                        download
                        className="btn btn-sm"
                        style={{ padding: '4px 10px', fontSize: '0.8rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '6px', textDecoration: 'none' }}
                      >
                        ⬇️ Download
                      </a>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <select
                        value={doc.accessLevel}
                        onChange={e => handleUpdatePermission(doc.id, e.target.value as any)}
                        style={{
                          fontSize: '0.75rem',
                          padding: '3px 6px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="PRIVATE">🔒 Private</option>
                        <option value="INSTITUTION_ONLY">🏫 Institution</option>
                        <option value="SHARED">🌐 Shared</option>
                      </select>

                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem', padding: '2px 4px' }}
                        title="Delete Document"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
      </div>

      {/* UPLOAD & AI QUALITY CHECK MODAL */}
      {isUploadOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '16px', maxWidth: '580px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>

            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Upload Document to Vault
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Step {uploadStep} of 3: {uploadStep === 1 ? 'Details' : uploadStep === 2 ? 'AI Quality Check' : 'Quality Report'}
                </span>
              </div>
              <button onClick={closeUploadModal} style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            {errorMessage && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>
                ⚠️ {errorMessage}
              </div>
            )}

            {/* STEP 1: SELECT FILE & FILL METADATA */}
            {uploadStep === 1 && (
              <form onSubmit={handleStartAnalysis} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Select Document File *
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    required
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px', display: 'block' }}>
                    Supported formats: PDF, PNG, JPG, JPEG
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Document Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 12th Marksheet, B.Tech Degree Certificate"
                    value={docName}
                    onChange={e => setDocName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Category *
                    </label>
                    <select
                      value={docCategory}
                      onChange={e => setDocCategory(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    >
                      {CATEGORIES.filter(c => c !== 'ALL').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Access Permission *
                    </label>
                    <select
                      value={accessLevel}
                      onChange={e => setAccessLevel(e.target.value as any)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    >
                      <option value="PRIVATE">🔒 Private (Only Me)</option>
                      <option value="INSTITUTION_ONLY">🏫 Institution Access</option>
                      <option value="SHARED">🌐 Shared</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Optional Expiry Date
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={e => setExpiryDate(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                  <button type="button" onClick={closeUploadModal} className="btn" style={{ padding: '8px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px' }}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ padding: '8px 20px', background: 'linear-gradient(135deg, var(--accent-violet) 0%, #6366f1 100%)', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Run AI Quality Check →
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: AI ANALYZING SPINNER */}
            {uploadStep === 2 && (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'spin 2s linear infinite' }}>🤖</div>
                <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Analyzing Document Quality...
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Groq AI is evaluating readability, document type, visible fields, and image quality.
                </p>
              </div>
            )}

            {/* STEP 3: AI QUALITY REPORT CARD */}
            {uploadStep === 3 && analysisResult && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '10px', marginBottom: '1.25rem', border: '1px solid var(--border)' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Document Quality Score</span>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: analysisResult.qualityScore >= 70 ? 'var(--accent-green)' : analysisResult.qualityScore >= 45 ? 'var(--accent-orange)' : '#ef4444' }}>
                      {analysisResult.qualityScore} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/ 100</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge ${analysisResult.status === 'READY' ? 'badge-green' : analysisResult.status === 'NEEDS_REVIEW' ? 'badge-orange' : 'badge-red'}`} style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
                      {analysisResult.status === 'READY' ? '🟢 Ready to Upload' : analysisResult.status === 'NEEDS_REVIEW' ? '🟡 Needs Review' : '🔴 Poor Quality'}
                    </span>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Detected Type: <strong>{analysisResult.documentType}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    AI Analysis Checks:
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.825rem' }}>
                    <div style={{ color: analysisResult.checks.readable ? 'var(--accent-green)' : '#ef4444' }}>
                      {analysisResult.checks.readable ? '✓ Text readable' : '❌ Text unreadable'}
                    </div>
                    <div style={{ color: analysisResult.checks.nameDetected ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                      {analysisResult.checks.nameDetected ? '✓ Name detected' : '⚪ Name not detected'}
                    </div>
                    <div style={{ color: analysisResult.checks.institutionDetected ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                      {analysisResult.checks.institutionDetected ? '✓ Institution detected' : '⚪ Institution not detected'}
                    </div>
                    <div style={{ color: analysisResult.checks.documentNumberDetected ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                      {analysisResult.checks.documentNumberDetected ? '✓ Doc/Roll No detected' : '⚪ Doc No not detected'}
                    </div>
                    <div style={{ color: analysisResult.checks.qrDetected ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                      {analysisResult.checks.qrDetected ? '✓ QR Code detected' : '⚪ QR Code not detected'}
                    </div>
                    <div style={{ color: !analysisResult.checks.blurry ? 'var(--accent-green)' : '#ef4444' }}>
                      {!analysisResult.checks.blurry ? '✓ Image sharp' : '❌ Image blurry'}
                    </div>
                  </div>
                </div>

                {/* Extracted Fields Summary */}
                {analysisResult.extractedInformation && (
                  <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Extracted Information:</div>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      {analysisResult.extractedInformation.name && <div>• Name: <strong>{analysisResult.extractedInformation.name}</strong></div>}
                      {analysisResult.extractedInformation.institution && <div>• Institution: <strong>{analysisResult.extractedInformation.institution}</strong></div>}
                      {analysisResult.extractedInformation.documentNumber && <div>• Doc No: <strong>{analysisResult.extractedInformation.documentNumber}</strong></div>}
                      {analysisResult.extractedInformation.yearOrDate && <div>• Date/Year: <strong>{analysisResult.extractedInformation.yearOrDate}</strong></div>}
                    </div>
                  </div>
                )}

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '1.25rem' }}>
                  "{analysisResult.message}"
                </p>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    onClick={() => setUploadStep(1)}
                    className="btn"
                    style={{ padding: '8px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px' }}
                  >
                    Select Different File
                  </button>
                  <button
                    onClick={handleConfirmSave}
                    disabled={savingDoc}
                    className="btn btn-primary"
                    style={{ padding: '8px 20px', background: 'linear-gradient(135deg, var(--accent-green) 0%, #059669 100%)', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {savingDoc ? 'Saving Document...' : 'Confirm & Save Document'}
                  </button>
                </div>
              </div>
            )}
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
                  📄 {previewDoc.fileName}
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
    </div>
  )
}
