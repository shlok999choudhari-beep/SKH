'use client'
import { useState, useEffect, useRef } from 'react'
import StudentSidebar from '@/components/StudentSidebar'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import styles from '../dashboard.module.css'
import {
  FolderLock,
  Upload,
  FileText,
  Building2,
  FileQuestion,
  ShieldCheck,
  Search,
  Eye,
  Download,
  Trash2,
  Lock,
  Globe,
  CheckCircle2,
  CircleX,
  Clock,
  TriangleAlert,
  X,
  Loader2,
  ArrowRight,
  Image as ImageIcon,
  Circle,
  Sparkles,
  RefreshCw,
  Table,
  Layers,
  FileCheck
} from 'lucide-react'

interface DoclingTableData {
  tableIndex: number
  headers: string[]
  rows: string[][]
}

interface DoclingSectionData {
  title: string
  level: number
  text: string
}

interface ExtractedInfo {
  name?: string | null
  studentId?: string | null
  rollNumber?: string | null
  institution?: string | null
  documentType?: string | null
  dates?: string[] | null
  cgpaOrGrade?: string | null
  certificateNumber?: string | null
}

interface QualityResultData {
  success?: boolean
  documentDetected?: boolean
  documentType?: string
  qualityScore?: number
  verificationStatus?: 'VERIFIED' | 'NEEDS_REVIEW' | 'REJECTED' | 'FAILED' | 'PROCESSING'
  pages?: number
  checks?: {
    readable?: boolean
    structureValid?: boolean
    tablesDetected?: boolean
    nameDetected?: boolean
    nameMatchesStudent?: boolean
    institutionDetected?: boolean
    documentNumberDetected?: boolean
    dateDetected?: boolean
    noSuspiciousArtifacts?: boolean
  }
  extractedInformation?: ExtractedInfo
  doclingData?: {
    markdown?: string
    sections?: DoclingSectionData[]
    tables?: DoclingTableData[]
    metadata?: Record<string, any>
  }
  warnings?: string[]
  passedChecks?: string[]
  explanation?: string
}

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
  verificationStatus: 'PENDING' | 'PROCESSING' | 'VERIFIED' | 'REJECTED' | 'NEEDS_REVIEW' | 'FAILED'
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
  const [analysisResult, setAnalysisResult] = useState<QualityResultData | null>(null)
  const [savingDoc, setSavingDoc] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Details Modal State
  const [detailsDoc, setDetailsDoc] = useState<DocumentItem | null>(null)
  const [modalTab, setModalTab] = useState<'preview' | 'docling' | 'verification'>('preview')
  const [reprocessingId, setReprocessingId] = useState<number | null>(null)

  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const fetchData = async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const [docsRes, reqsRes] = await Promise.all([
        fetch('/api/documents'),
        fetch('/api/documents/requests')
      ])
      const docsData = await docsRes.json()
      const reqsData = await reqsRes.json()

      if (docsData.documents) {
        setDocuments(docsData.documents)
        // If the details modal is open, keep its state synced with fresh data
        setDetailsDoc(prev => {
          if (!prev) return null
          const updated = docsData.documents.find((d: DocumentItem) => d.id === prev.id)
          return updated || prev
        })
      }
      if (reqsData.requests) setRequests(reqsData.requests)
    } catch (err) {
      console.error('Error fetching vault data:', err)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(true)
  }, [])

  // Auto-polling when documents are in PROCESSING state
  useEffect(() => {
    const hasProcessing = documents.some(d => d.verificationStatus === 'PROCESSING' || d.verificationStatus === 'PENDING')
    if (hasProcessing) {
      if (!pollingRef.current) {
        pollingRef.current = setInterval(() => {
          fetchData(false)
        }, 3500)
      }
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [documents])

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
    setAnalyzing(true)
    setUploadStep(2)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('documentName', docName)
      formData.append('category', docCategory)
      formData.append('documentType', docType)

      const res = await fetch('/api/documents/analyze', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setAnalysisResult(data.analysis)
        setUploadStep(3)
      } else {
        setErrorMessage(data.error || 'AI Document Analysis failed. Please try again.')
        setUploadStep(1)
      }
    } catch (err) {
      console.error('Analysis error:', err)
      setErrorMessage('Network error during AI analysis. Please retry.')
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
      formData.append('fileName', docName)
      formData.append('category', docCategory)
      formData.append('documentType', docType)
      formData.append('description', docDescription)
      formData.append('accessLevel', accessLevel)
      if (expiryDate) formData.append('expiryDate', expiryDate)
      if (linkedRequestId) formData.append('requestId', linkedRequestId.toString())
      if (analysisResult) {
        formData.append('qualityScore', (analysisResult.qualityScore || 80).toString())
        formData.append('qualityResult', JSON.stringify(analysisResult))
        formData.append('extractedInformation', JSON.stringify(analysisResult.extractedInformation || {}))
      }

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (res.ok && data.success) {
        closeUploadModal()
        fetchData(false)
      } else {
        setErrorMessage(data.error || 'Failed to save document.')
      }
    } catch (err) {
      console.error('Save error:', err)
      setErrorMessage('Error uploading document.')
    } finally {
      setSavingDoc(false)
    }
  }

  const handleRetryProcessing = async (docId: number) => {
    setReprocessingId(docId)
    try {
      const res = await fetch(`/api/documents/${docId}/process`, {
        method: 'POST'
      })
      if (res.ok) {
        const data = await res.json()
        if (data.document) {
          setDocuments(prev => prev.map(d => d.id === docId ? data.document : d))
          if (detailsDoc?.id === docId) {
            setDetailsDoc(data.document)
          }
        }
      }
    } catch (err) {
      console.error('Retry processing error:', err)
    } finally {
      setReprocessingId(null)
    }
  }

  const closeUploadModal = () => {
    setIsUploadOpen(false)
    setUploadStep(1)
    setSelectedFile(null)
    setDocName('')
    setDocDescription('')
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
        if (detailsDoc?.id === docId) {
          setDetailsDoc(prev => prev ? { ...prev, accessLevel: newLevel } : null)
        }
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
        if (detailsDoc?.id === docId) setDetailsDoc(null)
      }
    } catch (err) {
      console.error('Delete document error:', err)
    }
  }

  // Filtered lists
  const filteredDocs = documents.filter(doc => {
    if (activeTab === 'shared' && doc.accessLevel === 'PRIVATE') return false
    if (activeTab === 'verification' && (doc.verificationStatus === 'PENDING' || doc.verificationStatus === 'PROCESSING')) return false

    if (selectedCategory !== 'ALL' && doc.category !== selectedCategory) return false

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
  const processingDocs = documents.filter(d => d.verificationStatus === 'PROCESSING' || d.verificationStatus === 'PENDING').length
  const pendingRequests = requests.filter(r => r.status === 'PENDING').length

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const parseJsonSafe = (raw?: string | null) => {
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.content}>
        <header className={styles.header}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FolderLock size={24} strokeWidth={2} color="#8b5cf6" />
                <h1 className={styles.pageTitle}>Document Vault</h1>
              </div>
              <p className={styles.pageSubtitle}>
                Docling-powered document intelligence & structure extraction with Groq AI verification.
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
              <Upload size={16} strokeWidth={2} />
              <span>Upload Document</span>
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
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Verified Documents</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-green)', marginTop: '0.25rem' }}>
                {verifiedDocs}
              </div>
            </div>
            <div className={styles.statCard}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Processing / Review</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-orange)', marginTop: '0.25rem' }}>
                {processingDocs}
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
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <FileText size={16} strokeWidth={2} />
                  <span>My Documents ({totalDocs})</span>
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
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Building2 size={16} strokeWidth={2} />
                  <span>Shared with Institution ({documents.filter(d => d.accessLevel !== 'PRIVATE').length})</span>
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
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    position: 'relative'
                  }}
                >
                  <FileQuestion size={16} strokeWidth={2} />
                  <span>Document Requests</span>
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
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <ShieldCheck size={16} strokeWidth={2} />
                  <span>Verification Status</span>
                </button>
              </div>

              {/* Search Input */}
              <div style={{ minWidth: '240px', position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 14px 8px 34px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)'
                  }}
                />
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                  <Search size={14} strokeWidth={2} color="var(--text-muted)" />
                </span>
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

          {/* Content */}
          {loading ? (
            <div className={styles.card} style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <MorphingInfinity className="size-16" style={{ width: '64px', height: '64px', color: '#8b5cf6' }} />
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Loading document vault...</p>
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
                          <FileText size={16} strokeWidth={2} color="#8b5cf6" />
                          <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem', margin: 0 }}>
                            {req.title}
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
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Upload size={14} strokeWidth={2} />
                          <span>Upload Requested Document</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : filteredDocs.length === 0 ? (
            /* EMPTY STATE FOR DOCUMENTS */
            <div className={styles.card} style={{ textAlign: 'center', padding: '3.5rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <FolderLock size={48} strokeWidth={1.5} color="#8b5cf6" />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                No Documents Yet
              </h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: 0 }}>
                Store and analyze your academic and professional documents securely with Docling structure understanding & Groq AI verification.
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
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '8px'
                }}
              >
                <Upload size={15} strokeWidth={2} />
                <span>Upload Document Now</span>
              </button>
            </div>
          ) : (
            /* DOCUMENTS GRID */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {filteredDocs.map(doc => {
                const parsedExtracted: ExtractedInfo | null = parseJsonSafe(doc.extractedInformation)
                const qualityData: QualityResultData | null = parseJsonSafe(doc.qualityResult)
                const isProcessing = doc.verificationStatus === 'PROCESSING' || reprocessingId === doc.id

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
                          <div style={{ width: '40px', height: '40px', background: 'var(--bg-secondary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {doc.fileType.includes('pdf') ? (
                              <FileText size={20} strokeWidth={2} color="#ef4444" />
                            ) : doc.fileType.startsWith('image') ? (
                              <ImageIcon size={20} strokeWidth={2} color="#3b82f6" />
                            ) : (
                              <FileText size={20} strokeWidth={2} color="#8b5cf6" />
                            )}
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
                        {isProcessing ? (
                          <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc' }}>
                            <MorphingInfinity className="size-4" style={{ width: '16px', height: '16px', color: '#c084fc' }} />
                            <span>Docling Processing...</span>
                          </span>
                        ) : doc.verificationStatus === 'VERIFIED' ? (
                          <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={11} strokeWidth={2} />
                            <span>Verified</span>
                          </span>
                        ) : doc.verificationStatus === 'REJECTED' ? (
                          <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
                            <CircleX size={11} strokeWidth={2} />
                            <span>Rejected</span>
                          </span>
                        ) : doc.verificationStatus === 'FAILED' ? (
                          <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
                            <CircleX size={11} strokeWidth={2} />
                            <span>Failed</span>
                          </span>
                        ) : (
                          <span className="badge badge-orange" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={11} strokeWidth={2} />
                            <span>Needs Review</span>
                          </span>
                        )}

                        <span className="badge badge-purple" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {doc.accessLevel === 'PRIVATE' ? (
                            <>
                              <Lock size={11} strokeWidth={2} />
                              <span>Private</span>
                            </>
                          ) : doc.accessLevel === 'INSTITUTION_ONLY' ? (
                            <>
                              <Building2 size={11} strokeWidth={2} />
                              <span>Institution</span>
                            </>
                          ) : (
                            <>
                              <Globe size={11} strokeWidth={2} />
                              <span>Shared</span>
                            </>
                          )}
                        </span>

                        {doc.qualityScore !== undefined && doc.qualityScore !== null && (
                          <span className="badge badge-green" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Sparkles size={11} strokeWidth={2} />
                            <span>Score: {doc.qualityScore}%</span>
                          </span>
                        )}
                      </div>

                      {/* Rejection Alert */}
                      {doc.verificationStatus === 'REJECTED' && doc.rejectionReason && (
                        <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#f87171', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                          <strong>Reason:</strong> {doc.rejectionReason}
                        </div>
                      )}

                      {/* Extracted Info snippet */}
                      {parsedExtracted && (parsedExtracted.name || parsedExtracted.rollNumber || parsedExtracted.institution) && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: '6px', marginBottom: '0.75rem' }}>
                          {parsedExtracted.name && <div>• Name: <strong>{parsedExtracted.name}</strong></div>}
                          {parsedExtracted.institution && <div>• Institution: <strong>{parsedExtracted.institution}</strong></div>}
                          {parsedExtracted.rollNumber && <div>• ID / Roll: <strong>{parsedExtracted.rollNumber}</strong></div>}
                        </div>
                      )}
                    </div>

                    {/* Actions Bar */}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => {
                            setDetailsDoc(doc)
                            setModalTab('preview')
                          }}
                          className="btn btn-sm"
                          style={{ padding: '4px 10px', fontSize: '0.8rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Eye size={12} strokeWidth={2} />
                          <span>View Details</span>
                        </button>

                        <button
                          onClick={() => handleRetryProcessing(doc.id)}
                          disabled={isProcessing}
                          title="Reprocess with Docling"
                          className="btn btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.8rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: isProcessing ? 'default' : 'pointer', borderRadius: '6px', display: 'inline-flex', alignItems: 'center' }}
                        >
                          {isProcessing ? (
                            <MorphingInfinity className="size-3" style={{ width: '13px', height: '13px', color: '#8b5cf6' }} />
                          ) : (
                            <RefreshCw size={12} strokeWidth={2} />
                          )}
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
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
                          <option value="PRIVATE">Private</option>
                          <option value="INSTITUTION_ONLY">Institution</option>
                          <option value="SHARED">Shared</option>
                        </select>

                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                          title="Delete Document"
                        >
                          <Trash2 size={14} strokeWidth={2} />
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

      {/* UPLOAD MODAL */}
      {isUploadOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '16px', maxWidth: '580px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Upload Document to Vault
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Step {uploadStep} of 3: {uploadStep === 1 ? 'Details' : uploadStep === 2 ? 'Docling & AI Analysis' : 'Verification Preview'}
                </span>
              </div>
              <button onClick={closeUploadModal} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {errorMessage && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TriangleAlert size={14} strokeWidth={2} />
                <span>{errorMessage}</span>
              </div>
            )}

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
                    Supported formats: PDF, PNG, JPG, JPEG (Processed with Docling Engine)
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
                      <option value="PRIVATE">Private (Only Me)</option>
                      <option value="INSTITUTION_ONLY">Institution Access</option>
                      <option value="SHARED">Shared</option>
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
                    style={{ padding: '8px 20px', background: 'linear-gradient(135deg, var(--accent-violet) 0%, #6366f1 100%)', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>Analyze with Docling</span>
                    <ArrowRight size={14} strokeWidth={2} />
                  </button>
                </div>
              </form>
            )}

            {uploadStep === 2 && (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <MorphingInfinity className="size-16" style={{ width: '64px', height: '64px', color: '#8b5cf6' }} />
                <div>
                  <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0', fontSize: '1.15rem' }}>
                    Extracting with Docling & Verifying...
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, maxWidth: '420px', lineHeight: 1.5 }}>
                    Parsing document layout, tables, structural hierarchy, and validating candidate credentials.
                  </p>
                </div>
              </div>
            )}

            {uploadStep === 3 && analysisResult && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '10px', marginBottom: '1.25rem', border: '1px solid var(--border)' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quality Confidence Score</span>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: (analysisResult.qualityScore || 80) >= 70 ? 'var(--accent-green)' : 'var(--accent-orange)' }}>
                      {analysisResult.qualityScore || 80} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/ 100</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-green" style={{ fontSize: '0.9rem', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={12} strokeWidth={2} />
                      <span>Ready to Upload</span>
                    </span>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Type: <strong>{analysisResult.documentType || docType}</strong>
                    </div>
                  </div>
                </div>

                {analysisResult.extractedInformation && (
                  <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Docling Extracted Summary:</div>
                    <div style={{ color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                      {analysisResult.extractedInformation.name && <div>• Name: <strong>{analysisResult.extractedInformation.name}</strong></div>}
                      {analysisResult.extractedInformation.institution && <div>• Inst: <strong>{analysisResult.extractedInformation.institution}</strong></div>}
                      {analysisResult.extractedInformation.rollNumber && <div>• Roll/ID: <strong>{analysisResult.extractedInformation.rollNumber}</strong></div>}
                      {analysisResult.extractedInformation.cgpaOrGrade && <div>• Grade: <strong>{analysisResult.extractedInformation.cgpaOrGrade}</strong></div>}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    onClick={() => setUploadStep(1)}
                    className="btn"
                    style={{ padding: '8px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px' }}
                  >
                    Back
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

      {/* DOCUMENT DETAILS MODAL (PREVIEW + DOCLING INTELLIGENCE + VERIFICATION REPORT) */}
      {detailsDoc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '16px', maxWidth: '880px', width: '100%', height: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.6)' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} strokeWidth={2} color="#8b5cf6" />
                  <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0, fontSize: '1.1rem' }}>
                    {detailsDoc.fileName}
                  </h3>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Category: {detailsDoc.category} • Size: {formatFileSize(detailsDoc.fileSize)} • Uploaded: {new Date(detailsDoc.uploadedAt).toLocaleDateString()}
                </span>
              </div>
              <button onClick={() => setDetailsDoc(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', gap: '8px', padding: '10px 1.5rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
              <button
                onClick={() => setModalTab('preview')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: modalTab === 'preview' ? 'var(--accent-violet)' : 'transparent',
                  color: modalTab === 'preview' ? 'white' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Eye size={14} strokeWidth={2} />
                <span>Original Preview</span>
              </button>
              <button
                onClick={() => setModalTab('docling')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: modalTab === 'docling' ? 'var(--accent-violet)' : 'transparent',
                  color: modalTab === 'docling' ? 'white' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Layers size={14} strokeWidth={2} />
                <span>Docling Extracted Data</span>
              </button>
              <button
                onClick={() => setModalTab('verification')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: modalTab === 'verification' ? 'var(--accent-violet)' : 'transparent',
                  color: modalTab === 'verification' ? 'white' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ShieldCheck size={14} strokeWidth={2} />
                <span>AI Verification Report</span>
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              {modalTab === 'preview' && (
                <div style={{ width: '100%', height: '100%', minHeight: '400px', background: '#0a0515', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {detailsDoc.fileType.startsWith('image/') ? (
                    <img
                      src={`/api/documents/${detailsDoc.id}/download`}
                      alt={detailsDoc.fileName}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <iframe
                      src={`/api/documents/${detailsDoc.id}/download`}
                      title={detailsDoc.fileName}
                      style={{ width: '100%', height: '100%', minHeight: '520px', border: 'none' }}
                    />
                  )}
                </div>
              )}

              {modalTab === 'docling' && (() => {
                const report: QualityResultData | null = parseJsonSafe(detailsDoc.qualityResult)
                const extracted: ExtractedInfo | null = parseJsonSafe(detailsDoc.extractedInformation) || report?.extractedInformation || null
                const doclingData = report?.doclingData

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Key-Value Fields Strip */}
                    <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileCheck size={16} strokeWidth={2} color="#10b981" />
                        <span>Extracted Document Entities</span>
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.85rem' }}>
                        <div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Candidate Name</span>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{extracted?.name || 'Not detected'}</div>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Student ID / Roll No</span>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{extracted?.rollNumber || extracted?.studentId || 'Not detected'}</div>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Institution / College</span>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{extracted?.institution || 'Not detected'}</div>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Inferred Document Type</span>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{extracted?.documentType || detailsDoc.documentType}</div>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>CGPA / Grade</span>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{extracted?.cgpaOrGrade || 'N/A'}</div>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Extracted Dates</span>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{extracted?.dates?.join(', ') || 'N/A'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Detected Tables */}
                    {doclingData?.tables && doclingData.tables.length > 0 && (
                      <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Table size={16} strokeWidth={2} color="#3b82f6" />
                          <span>Detected Tables ({doclingData.tables.length})</span>
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {doclingData.tables.map((tbl, tIdx) => (
                            <div key={tIdx} style={{ overflowX: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                <thead>
                                  <tr style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                                    {tbl.headers.map((h, hIdx) => (
                                      <th key={hIdx} style={{ padding: '6px 10px', textAlign: 'left', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {tbl.rows.map((r, rIdx) => (
                                    <tr key={rIdx}>
                                      {r.map((c, cIdx) => (
                                        <td key={cIdx} style={{ padding: '6px 10px', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{c}</td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sections & Markdown View */}
                    <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Structured Text & Hierarchy
                      </h4>
                      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                        {doclingData?.markdown || 'Structured text representation extracted.'}
                      </pre>
                    </div>
                  </div>
                )
              })()}

              {modalTab === 'verification' && (() => {
                const report: QualityResultData | null = parseJsonSafe(detailsDoc.qualityResult)

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Status & Score Banner */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>AI Confidence Score</span>
                        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: (detailsDoc.qualityScore || 80) >= 70 ? 'var(--accent-green)' : 'var(--accent-orange)' }}>
                          {detailsDoc.qualityScore || 80} <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>/ 100</span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span className={`badge ${detailsDoc.verificationStatus === 'VERIFIED' ? 'badge-green' : detailsDoc.verificationStatus === 'REJECTED' ? 'badge-red' : 'badge-orange'}`} style={{ fontSize: '1rem', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {detailsDoc.verificationStatus === 'VERIFIED' ? <CheckCircle2 size={15} strokeWidth={2} /> : <Clock size={15} strokeWidth={2} />}
                          <span>{detailsDoc.verificationStatus}</span>
                        </span>
                      </div>
                    </div>

                    {/* Verification Checklist */}
                    {report?.checks && (
                      <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          Verification Checks Checklist
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                          <div style={{ color: report.checks.readable ? 'var(--accent-green)' : '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {report.checks.readable ? <CheckCircle2 size={14} strokeWidth={2} /> : <CircleX size={14} strokeWidth={2} />}
                            <span>Text Readability & Resolution</span>
                          </div>
                          <div style={{ color: report.checks.structureValid ? 'var(--accent-green)' : '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {report.checks.structureValid ? <CheckCircle2 size={14} strokeWidth={2} /> : <CircleX size={14} strokeWidth={2} />}
                            <span>Docling Structure & Layout Integrity</span>
                          </div>
                          <div style={{ color: report.checks.nameMatchesStudent ? 'var(--accent-green)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {report.checks.nameMatchesStudent ? <CheckCircle2 size={14} strokeWidth={2} /> : <Circle size={14} strokeWidth={2} />}
                            <span>Student Profile Match</span>
                          </div>
                          <div style={{ color: report.checks.institutionDetected ? 'var(--accent-green)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {report.checks.institutionDetected ? <CheckCircle2 size={14} strokeWidth={2} /> : <Circle size={14} strokeWidth={2} />}
                            <span>Institution Validation</span>
                          </div>
                          <div style={{ color: report.checks.noSuspiciousArtifacts ? 'var(--accent-green)' : '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {report.checks.noSuspiciousArtifacts ? <CheckCircle2 size={14} strokeWidth={2} /> : <CircleX size={14} strokeWidth={2} />}
                            <span>Authenticity & Tamper Evaluation</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AI Explanation */}
                    <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        AI Verification Summary
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {report?.explanation || 'Document verified with Docling layout parsing and Groq AI validation.'}
                      </p>
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Modal Footer Actions */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a
                  href={`/api/documents/${detailsDoc.id}/download?download=true`}
                  download
                  className="btn btn-sm"
                  style={{ padding: '6px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '6px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                >
                  <Download size={14} strokeWidth={2} />
                  <span>Download Original</span>
                </a>

                <button
                  onClick={() => handleRetryProcessing(detailsDoc.id)}
                  disabled={reprocessingId === detailsDoc.id}
                  className="btn btn-sm"
                  style={{ padding: '6px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '6px', cursor: reprocessingId === detailsDoc.id ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                >
                  <RefreshCw size={14} strokeWidth={2} className={reprocessingId === detailsDoc.id ? 'spin' : ''} />
                  <span>{reprocessingId === detailsDoc.id ? 'Processing...' : 'Reprocess with Docling'}</span>
                </button>
              </div>

              <button
                onClick={() => setDetailsDoc(null)}
                className="btn btn-primary"
                style={{ padding: '6px 18px', background: 'var(--accent-violet)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
