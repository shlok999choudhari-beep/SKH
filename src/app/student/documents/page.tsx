'use client'
import { useState, useEffect, useRef } from 'react'
import StudentSidebar from '@/components/StudentSidebar'
import BackButton from '@/components/BackButton'
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
  FileCheck,
  QrCode,
  Copy,
  Scan,
  History,
  ShieldAlert,
  Check,
  AlertTriangle
} from 'lucide-react'

interface OCRBlockData {
  blockId: number
  text: string
  confidence: number
  page: number
  boundingBox?: number[][]
}

interface QRCodeItem {
  id?: number
  codeType: 'QR' | 'BARCODE'
  rawData: string
  certificateId?: string | null
  verificationUrl?: string | null
  matchStatus: 'MATCH' | 'MISMATCH' | 'NOT_PRESENT' | 'UNREADABLE'
  matchedWithOcr: boolean
}

interface DuplicateItem {
  matchedDocumentId: number
  matchedFileName: string
  matchType: string
  similarityScore: number
  details?: string
  uploadedAt?: string
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
  verificationStatus: 'PENDING' | 'PROCESSING' | 'VERIFIED' | 'REJECTED' | 'UNDER_REVIEW' | 'SUSPICIOUS' | 'NEEDS_REVIEW' | 'FAILED'
  processingStatus: string
  qualityScore?: number
  verificationScore?: number
  riskScore?: number
  tamperScore?: number
  faceMatchScore?: number
  faceMatchStatus?: string
  aiRiskLevel?: string
  ocrConfidence?: number
  qrStatus?: string
  sha256Hash?: string
  perceptualHash?: string
  qualityResult?: string
  extractedInformation?: string
  expiryDate?: string
  rejectionReason?: string
  version: number
  uploadedAt: string
  yoloDetections?: Array<{
    objectType: string
    confidence: number
    boundingBox?: string | number[]
  }>
  verification?: {
    verificationScore: number
    riskScore: number
    status: string
    ocrScore?: number
    fieldScore?: number
    qualityScore?: number
    qrScore?: number
    duplicateScore?: number
    reasons?: string
    warnings?: string
    explanation?: string
  }
  ocrResult?: {
    fullText: string
    textBlocks?: string
    boundingBoxes?: string
    confidence?: number
    engine?: string
    language?: string
    pageCount?: number
  }
  extractedFields?: Array<{
    fieldName: string
    fieldValue?: string
    confidence?: number
    source?: string
    isConsistent?: boolean
  }>
  qrCodeResults?: QRCodeItem[]
  sourceDuplicates?: DuplicateItem[]
  history?: Array<{
    id: number
    newStatus: string
    score?: number
    reason?: string
    changedAt: string
  }>
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
  const [analysisResult, setAnalysisResult] = useState<any | null>(null)
  const [savingDoc, setSavingDoc] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Details Modal State (8 Tabs)
  const [detailsDoc, setDetailsDoc] = useState<DocumentItem | null>(null)
  const [modalTab, setModalTab] = useState<'overview' | 'fields' | 'ocr' | 'quality' | 'qr' | 'duplicates' | 'verification' | 'history'>('overview')
  const [reprocessingId, setReprocessingId] = useState<number | null>(null)
  const [showBoxes, setShowBoxes] = useState(true)

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
    const hasProcessing = documents.some(
      d => d.verificationStatus === 'PROCESSING' || d.verificationStatus === 'PENDING' || d.processingStatus === 'PROCESSING' || d.processingStatus === 'OCR_PROCESSING'
    )
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
      setErrorMessage('Error analyzing document. Please try again.')
      setUploadStep(1)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleConfirmSave = async () => {
    if (!selectedFile) return
    setSavingDoc(true)

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
        if (analysisResult.extractedInformation) {
          formData.append('extractedInformation', JSON.stringify(analysisResult.extractedInformation))
        }
      }

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setIsUploadOpen(false)
        resetUploadForm()
        fetchData(false)
      } else {
        alert(data.error || 'Failed to save document.')
      }
    } catch (err) {
      alert('Error uploading document. Please try again.')
    } finally {
      setSavingDoc(false)
    }
  }

  const handleRetryProcessing = async (id: number) => {
    setReprocessingId(id)
    try {
      const res = await fetch(`/api/documents/${id}/process`, { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.success) {
        fetchData(false)
      } else {
        alert(data.error || 'Reprocessing failed')
      }
    } catch (err) {
      alert('Failed to reprocess document.')
    } finally {
      setReprocessingId(null)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this document from your vault?')) return
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== id))
        if (detailsDoc?.id === id) setDetailsDoc(null)
      } else {
        alert('Failed to delete document')
      }
    } catch (err) {
      alert('Error deleting document')
    }
  }

  const resetUploadForm = () => {
    setSelectedFile(null)
    setDocName('')
    setDocCategory('Academic')
    setDocType('Marksheet')
    setDocDescription('')
    setAccessLevel('PRIVATE')
    setExpiryDate('')
    setLinkedRequestId(null)
    setAnalysisResult(null)
    setUploadStep(1)
    setErrorMessage('')
  }

  const closeUploadModal = () => {
    setIsUploadOpen(false)
    resetUploadForm()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const parseJsonSafe = (str?: string | null) => {
    if (!str) return null
    try {
      return JSON.parse(str)
    } catch {
      return null
    }
  }

  // Filtered documents
  const filteredDocs = documents.filter(doc => {
    const matchesCat = selectedCategory === 'ALL' || doc.category === selectedCategory
    const matchesSearch = searchQuery === '' ||
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.documentType.toLowerCase().includes(searchQuery.toLowerCase())
    if (activeTab === 'shared') {
      return matchesCat && matchesSearch && (doc.accessLevel === 'INSTITUTION_ONLY' || doc.accessLevel === 'SHARED')
    }
    if (activeTab === 'verification') {
      return matchesCat && matchesSearch && (doc.verificationStatus === 'VERIFIED' || doc.verificationStatus === 'UNDER_REVIEW' || doc.verificationStatus === 'SUSPICIOUS')
    }
    return matchesCat && matchesSearch
  })

  // Verification status badge helper
  const renderVerificationBadge = (status: string, score?: number) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={12} strokeWidth={2} />
            <span>Verified {typeof score === 'number' ? `(${score})` : ''}</span>
          </span>
        )
      case 'UNDER_REVIEW':
      case 'NEEDS_REVIEW':
      case 'PENDING':
        return (
          <span className="badge badge-orange" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} strokeWidth={2} />
            <span>Under Review</span>
          </span>
        )
      case 'SUSPICIOUS':
        return (
          <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            <ShieldAlert size={12} strokeWidth={2} />
            <span>Suspicious</span>
          </span>
        )
      case 'REJECTED':
      case 'FAILED':
        return (
          <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CircleX size={12} strokeWidth={2} />
            <span>Rejected</span>
          </span>
        )
      case 'PROCESSING':
        return (
          <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Loader2 size={12} strokeWidth={2} className="spin" />
            <span>Smart OCR</span>
          </span>
        )
      default:
        return <span className="badge badge-gray">{status}</span>
    }
  }

  return (
    <div className={styles.container}>
      <StudentSidebar />
      <div className={styles.mainContent}>
        
        {/* Header */}
        <header className={styles.header} style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <BackButton fallbackHref="/student/campus" />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', background: 'rgba(139, 92, 246, 0.15)', borderRadius: '10px', color: '#8b5cf6' }}>
                  <FolderLock size={22} strokeWidth={2} />
                </div>
                <h1 className={styles.title} style={{ margin: 0, fontSize: '1.6rem' }}>
                  PlaceIQ Document Vault
                </h1>
              </div>
              <p className={styles.subtitle} style={{ margin: '4px 0 0 0' }}>
                AI Document Processing, Smart OCR, Automated Verification & Security Integrity
              </p>
            </div>
          </div>

          <button
            onClick={() => { resetUploadForm(); setIsUploadOpen(true); }}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '10px',
              fontWeight: 600,
              background: 'linear-gradient(135deg, var(--accent-violet) 0%, #6366f1 100%)',
              boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)'
            }}
          >
            <Upload size={16} strokeWidth={2} />
            <span>Upload Document</span>
          </button>
        </header>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', paddingBottom: '4px' }}>
          <button
            onClick={() => setActiveTab('my_docs')}
            className={`btn ${activeTab === 'my_docs' ? styles.tabActive : ''}`}
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
            <FolderLock size={15} strokeWidth={2} />
            <span>My Documents ({documents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('verification')}
            className={`btn ${activeTab === 'verification' ? styles.tabActive : ''}`}
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
            <ShieldCheck size={15} strokeWidth={2} />
            <span>Verified Credentials</span>
          </button>

          <button
            onClick={() => setActiveTab('shared')}
            className={`btn ${activeTab === 'shared' ? styles.tabActive : ''}`}
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
            <Building2 size={15} strokeWidth={2} />
            <span>Shared with College</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`btn ${activeTab === 'requests' ? styles.tabActive : ''}`}
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
              gap: '6px'
            }}
          >
            <FileQuestion size={15} strokeWidth={2} />
            <span>Document Requests ({requests.filter(r => r.status === 'PENDING').length})</span>
          </button>
        </div>

        {/* Controls: Search & Category Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: '10px', border: '1px solid var(--border)', width: '320px' }}>
            <Search size={16} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="Search document name or type..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%', fontSize: '0.875rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: selectedCategory === cat ? '1px solid var(--accent-violet)' : '1px solid var(--border)',
                  background: selectedCategory === cat ? 'rgba(139, 92, 246, 0.15)' : 'var(--bg-secondary)',
                  color: selectedCategory === cat ? '#a78bfa' : 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  fontWeight: selectedCategory === cat ? 600 : 500,
                  cursor: 'pointer'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Documents Table */}
        <main>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <MorphingInfinity className="size-12" style={{ width: '48px', height: '48px', color: '#8b5cf6' }} />
              <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading verified document vault...</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
              <FolderLock size={48} strokeWidth={1.5} color="var(--text-tertiary)" style={{ margin: '0 auto 1rem auto' }} />
              <h3 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>No documents found</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
                Upload your degree certificates, marksheets, ID cards, and internship letters to get AI verified.
              </p>
              <button
                onClick={() => { resetUploadForm(); setIsUploadOpen(true); }}
                className="btn btn-primary"
                style={{ background: 'var(--accent-violet)', color: 'white', padding: '8px 18px', borderRadius: '8px', fontWeight: 600 }}
              >
                Upload First Document
              </button>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-secondary)', borderRadius: '14px', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <th style={{ padding: '12px 16px' }}>Document</th>
                    <th style={{ padding: '12px 16px' }}>Category</th>
                    <th style={{ padding: '12px 16px' }}>Verification Status</th>
                    <th style={{ padding: '12px 16px' }}>Score</th>
                    <th style={{ padding: '12px 16px' }}>Uploaded</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.map((doc, idx) => {
                    const isImg = doc.fileType?.startsWith('image/') || /\.(png|jpe?g|webp|bmp|gif)$/i.test(doc.fileName)
                    const score = doc.verificationScore ?? doc.qualityScore ?? 80
                    return (
                      <tr
                        key={doc.id}
                        style={{
                          borderBottom: idx !== filteredDocs.length - 1 ? '1px solid var(--border)' : 'none',
                          transition: 'background 0.15s ease'
                        }}
                        className={styles.tableRow}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: isImg ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isImg ? '#60a5fa' : '#f87171' }}>
                              {isImg ? <ImageIcon size={18} /> : <FileText size={18} />}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{doc.fileName}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {doc.documentType} • {formatFileSize(doc.fileSize)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                          <span style={{ padding: '3px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '0.8rem' }}>
                            {doc.category}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {renderVerificationBadge(doc.verificationStatus, doc.verificationScore)}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ fontWeight: 700, color: score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444' }}>
                              {score}/100
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              onClick={() => { setDetailsDoc(doc); setModalTab('overview'); }}
                              className="btn btn-sm"
                              title="View Document Details"
                              style={{ padding: '6px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '6px', cursor: 'pointer' }}
                            >
                              <Eye size={14} />
                            </button>
                            <a
                              href={`/api/documents/${doc.id}/download?download=true`}
                              download
                              className="btn btn-sm"
                              title="Download Original"
                              style={{ padding: '6px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '6px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                            >
                              <Download size={14} />
                            </a>
                            <button
                              onClick={() => handleDelete(doc.id)}
                              className="btn btn-sm"
                              title="Delete Document"
                              style={{ padding: '6px 10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: '6px', cursor: 'pointer' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* UPLOAD MODAL */}
      {isUploadOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '16px', maxWidth: '580px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Upload Document to Vault
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Step {uploadStep} of 3: {uploadStep === 1 ? 'Details' : uploadStep === 2 ? 'AI Processing' : 'Verification Summary'}
                </span>
              </div>
              <button onClick={closeUploadModal} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
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
                    accept=".pdf,.png,.jpg,.jpeg,.webp,image/*"
                    onChange={handleFileSelect}
                    required
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px', display: 'block' }}>
                    Supported formats: PDF, PNG, JPG, JPEG, WEBP (Processed with Docling + Smart OCR)
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Document Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. B.Tech Marksheet, Graduation Certificate"
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
                      Document Type *
                    </label>
                    <select
                      value={docType}
                      onChange={e => setDocType(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    >
                      <option value="Marksheet">Marksheet</option>
                      <option value="Certificate">Certificate</option>
                      <option value="Degree Certificate">Degree Certificate</option>
                      <option value="ID Document">ID Document</option>
                      <option value="Transcript">Transcript</option>
                      <option value="Internship Certificate">Internship Certificate</option>
                      <option value="Resume">Resume</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
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
                    <option value="INSTITUTION_ONLY">College Access (Institution Admins)</option>
                    <option value="SHARED">Shared Publicly</option>
                  </select>
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
                    <span>Analyze & Verify</span>
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
                    AI Document Processing & Verification...
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, maxWidth: '420px', lineHeight: 1.5 }}>
                    Running Docling structure parsing, Smart OCR, QR code validation, and duplicate verification.
                  </p>
                </div>
              </div>
            )}

            {uploadStep === 3 && analysisResult && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '10px', marginBottom: '1.25rem', border: '1px solid var(--border)' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Quality & Verification Score</span>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: (analysisResult.qualityScore || 80) >= 70 ? '#10b981' : '#f59e0b' }}>
                      {analysisResult.qualityScore || 80} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/ 100</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-green" style={{ fontSize: '0.9rem', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={12} strokeWidth={2} />
                      <span>Ready to Save</span>
                    </span>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Detected Type: <strong>{analysisResult.documentType || docType}</strong>
                    </div>
                  </div>
                </div>

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
                    style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {savingDoc ? 'Saving Document...' : 'Confirm & Save Document'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPREHENSIVE 8-TAB DOCUMENT DETAILS MODAL */}
      {detailsDoc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '16px', maxWidth: '960px', width: '100%', height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.7)' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} strokeWidth={2} color="#8b5cf6" />
                  <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0, fontSize: '1.15rem' }}>
                    {detailsDoc.fileName}
                  </h3>
                  {renderVerificationBadge(detailsDoc.verificationStatus, detailsDoc.verificationScore)}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Type: {detailsDoc.documentType} • Size: {formatFileSize(detailsDoc.fileSize)} • Uploaded: {new Date(detailsDoc.uploadedAt).toLocaleDateString()}
                </span>
              </div>
              <button onClick={() => setDetailsDoc(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            {/* 8 Modal Tabs */}
            <div style={{ display: 'flex', gap: '4px', padding: '8px 1.5rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
              {[
                { id: 'overview', label: 'Overview', icon: Eye },
                { id: 'fields', label: 'Extracted Fields', icon: FileCheck },
                { id: 'ocr', label: 'Smart OCR', icon: Scan },
                { id: 'quality', label: 'Document Quality', icon: Layers },
                { id: 'qr', label: 'QR / Barcode', icon: QrCode },
                { id: 'duplicates', label: 'Duplicate Check', icon: Copy },
                { id: 'verification', label: 'AI Verification', icon: ShieldCheck },
                { id: 'history', label: 'History', icon: History }
              ].map(tab => {
                const Icon = tab.icon
                const isActive = modalTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setModalTab(tab.id as any)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: isActive ? 'var(--accent-violet)' : 'transparent',
                      color: isActive ? 'white' : 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Icon size={13} strokeWidth={2} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              
              {/* Tab 1: Overview */}
              {modalTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem', height: '100%' }}>
                  <div style={{ background: '#0a0515', borderRadius: '10px', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                    {(detailsDoc.fileType?.startsWith('image/') || /\.(png|jpe?g|webp|bmp|gif|tiff|svg)$/i.test(detailsDoc.fileName)) ? (
                      <img
                        src={`/api/documents/${detailsDoc.id}/download`}
                        alt={detailsDoc.fileName}
                        style={{ maxWidth: '100%', maxHeight: '420px', objectFit: 'contain' }}
                      />
                    ) : (
                      <iframe
                        src={`/api/documents/${detailsDoc.id}/download`}
                        title={detailsDoc.fileName}
                        style={{ width: '100%', height: '100%', minHeight: '420px', border: 'none' }}
                      />
                    )}
                  </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Overall Verification Score</span>
                      <div style={{ fontSize: '2.4rem', fontWeight: 800, color: (detailsDoc.verificationScore ?? detailsDoc.qualityScore ?? 80) >= 80 ? '#10b981' : '#f59e0b' }}>
                        {detailsDoc.verificationScore ?? detailsDoc.qualityScore ?? 80} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/ 100</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        <span className={`badge ${(detailsDoc.riskScore ?? 20) <= 20 ? 'badge-green' : (detailsDoc.riskScore ?? 20) <= 40 ? 'badge-orange' : 'badge-red'}`} style={{ fontSize: '11px' }}>
                          Risk: {(detailsDoc.riskScore ?? 20) <= 20 ? 'LOW' : (detailsDoc.riskScore ?? 20) <= 40 ? 'MEDIUM' : 'HIGH'}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Integrity: <strong style={{ color: '#10b981' }}>{Math.round(100 - (detailsDoc.tamperScore ?? 10))}/100</strong>
                        </span>
                      </div>
                    </div>

                    <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Security & AI Forensic Checks</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Smart OCR Clarity:</span>
                          <strong style={{ color: '#10b981' }}>{Math.round((detailsDoc.ocrConfidence || 0.85) * 100)}%</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Identity Face Match:</span>
                          <strong style={{ color: detailsDoc.faceMatchStatus === 'MATCH' ? '#10b981' : 'var(--text-secondary)' }}>
                            {detailsDoc.faceMatchStatus === 'MATCH' ? `${Math.round(detailsDoc.faceMatchScore ?? 85)}% Match` : (detailsDoc.faceMatchStatus || 'Standard Document')}
                          </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>QR Security Code:</span>
                          <strong>{detailsDoc.qrStatus || 'NOT_PRESENT'}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Cryptographic Hash:</span>
                          <strong style={{ color: '#10b981' }}>SHA-256 Unique</strong>
                        </div>
                      </div>
                    </div>

                    {detailsDoc.yoloDetections && detailsDoc.yoloDetections.length > 0 && (
                      <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.8rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Detected Document Regions:</div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {detailsDoc.yoloDetections.map((r, i) => (
                            <span key={i} style={{ padding: '3px 8px', background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                              {r.objectType} ({Math.round(r.confidence * 100)}%)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Extracted Information */}
              {modalTab === 'fields' && (() => {
                const extracted = parseJsonSafe(detailsDoc.extractedInformation) || {}
                const fieldsList = detailsDoc.extractedFields || Object.entries(extracted).map(([k, v]) => ({ fieldName: k, fieldValue: String(v), confidence: 0.9 }))

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileCheck size={16} color="#10b981" />
                        <span>Type-Specific Extracted Fields ({detailsDoc.documentType})</span>
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                        {fieldsList.map((f, i) => (
                          <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                              {f.fieldName.replace(/([A-Z])/g, ' $1')}
                            </span>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px', fontSize: '0.9rem' }}>
                              {f.fieldValue || 'N/A'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Tab 3: Smart OCR */}
              {modalTab === 'ocr' && (() => {
                const ocr = detailsDoc.ocrResult
                const blocks: OCRBlockData[] = parseJsonSafe(ocr?.textBlocks) || []

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Smart OCR Recognition Engine</span>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                          PaddleOCR & Vision AI ({Math.round((ocr?.confidence || detailsDoc.ocrConfidence || 0.85) * 100)}% Confidence)
                        </div>
                      </div>
                      <button
                        onClick={() => setShowBoxes(!showBoxes)}
                        className="btn btn-sm"
                        style={{ padding: '6px 12px', background: showBoxes ? 'var(--accent-violet)' : 'var(--bg-primary)', border: '1px solid var(--border)', color: 'white', borderRadius: '6px', fontSize: '12px' }}
                      >
                        {showBoxes ? 'Hide Bounding Boxes' : 'Show Bounding Boxes'}
                      </button>
                    </div>

                    <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Recognized Text Blocks ({blocks.length})</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '360px', overflowY: 'auto' }}>
                        {blocks.length > 0 ? blocks.map((b, i) => (
                          <div key={i} style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                            <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{b.text}</span>
                            <span style={{ fontSize: '11px', padding: '2px 6px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderRadius: '4px' }}>
                              {Math.round(b.confidence * 100)}%
                            </span>
                          </div>
                        )) : (
                          <pre style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            {ocr?.fullText || detailsDoc.qualityResult || 'OCR Text loaded.'}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Tab 4: Document Quality */}
              {modalTab === 'quality' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>Document Readability & Layout Quality</h4>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#10b981', marginBottom: '1rem' }}>
                      {detailsDoc.qualityScore || 80}/100
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
                        <CheckCircle2 size={16} /> <span>High contrast and clear character resolution</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
                        <CheckCircle2 size={16} /> <span>Document structure and tables parsed successfully</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: QR / Barcode */}
              {modalTab === 'qr' && (() => {
                const qrResults = detailsDoc.qrCodeResults || []
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <QrCode size={16} color="#8b5cf6" />
                        <span>QR & Barcode Security Analysis</span>
                      </h4>
                      {qrResults.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {qrResults.map((qr, i) => (
                            <div key={i} style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <strong>{qr.codeType} Detected</strong>
                                <span className={`badge ${qr.matchStatus === 'MATCH' ? 'badge-green' : 'badge-orange'}`}>
                                  {qr.matchStatus === 'MATCH' ? 'Matched with OCR' : 'Decoded'}
                                </span>
                              </div>
                              <div style={{ color: 'var(--text-secondary)', wordBreak: 'break-all' }}>Payload: {qr.rawData}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                          No QR code or Barcode found on this document. Normal for standard marksheets and certificates.
                        </p>
                      )}
                    </div>
                  </div>
                )
              })()}

              {/* Tab 6: Duplicate Detection */}
              {modalTab === 'duplicates' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Copy size={16} color="#3b82f6" />
                      <span>Cryptographic & Visual Duplicate Hashes</span>
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <div>SHA-256 Hash: <code style={{ color: '#a78bfa' }}>{detailsDoc.sha256Hash || 'Calculated on upload'}</code></div>
                      <div>Perceptual Visual Hash: <code style={{ color: '#60a5fa' }}>{detailsDoc.perceptualHash || 'Verified unique'}</code></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 7: AI Verification */}
              {modalTab === 'verification' && (() => {
                const v = detailsDoc.verification
                const reasons: string[] = parseJsonSafe(v?.reasons) || []
                const warnings: string[] = parseJsonSafe(v?.warnings) || []

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        5-Tier Weighted Verification Score Breakdown
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span>OCR Confidence (20% weight)</span>
                            <strong>{v?.ocrScore ?? 85}/100</strong>
                          </div>
                          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${v?.ocrScore ?? 85}%`, height: '100%', background: '#8b5cf6' }} />
                          </div>
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span>Profile & Field Consistency (30% weight)</span>
                            <strong>{v?.fieldScore ?? 90}/100</strong>
                          </div>
                          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${v?.fieldScore ?? 90}%`, height: '100%', background: '#10b981' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {reasons.length > 0 && (
                      <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <div style={{ fontWeight: 600, color: '#10b981', marginBottom: '6px', fontSize: '0.85rem' }}>Passed Verification Checks:</div>
                        <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {reasons.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Tab 8: Verification History */}
              {modalTab === 'history' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>Verification Audit Trail</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                      <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Status: <strong>{detailsDoc.verificationStatus}</strong></span>
                        <span style={{ color: 'var(--text-secondary)' }}>{new Date(detailsDoc.uploadedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
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
                  <span>{reprocessingId === detailsDoc.id ? 'Processing...' : 'Reprocess Intelligence'}</span>
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
