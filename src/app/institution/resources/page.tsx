'use client'
import { useState, useEffect } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import styles from '../institution.module.css'
import {
  Share2,
  Building2,
  Laptop,
  Monitor,
  FlaskConical,
  BookOpen,
  Target,
  Wrench,
  Code2,
  UserCheck,
  Globe,
  Plus,
  LayoutDashboard,
  FolderKanban,
  Inbox,
  Handshake,
  GraduationCap,
  Calendar,
  Box,
  CheckCircle2,
  Bell,
  Clock,
  MapPin,
  Users,
  Search,
  RotateCcw,
  ArrowRight,
  AlertCircle,
  X,
  Edit2,
  Trash2,
  SlidersHorizontal,
  FileText,
  Loader2,
  Sparkles
} from 'lucide-react'

const CATEGORY_OPTIONS = [
  { value: 'Computer Labs', label: 'Computer Labs' },
  { value: 'Computers / Systems', label: 'Computers / Systems' },
  { value: 'Laboratories', label: 'Laboratories' },
  { value: 'Library Resources', label: 'Library Resources' },
  { value: 'Classrooms / Seminar Halls', label: 'Classrooms / Seminar Halls' },
  { value: 'Training Infrastructure', label: 'Training Infrastructure' },
  { value: 'Equipment', label: 'Equipment' },
  { value: 'Software / Licenses', label: 'Software / Licenses' },
  { value: 'Training Facilities', label: 'Training Facilities' },
  { value: 'Other Institutional Resources', label: 'Other Institutional Resources' }
]

function getCategoryIcon(cat: string, size = 16) {
  switch (cat) {
    case 'Computer Labs': return <Laptop size={size} strokeWidth={2} />
    case 'Computers / Systems': return <Monitor size={size} strokeWidth={2} />
    case 'Laboratories': return <FlaskConical size={size} strokeWidth={2} />
    case 'Library Resources': return <BookOpen size={size} strokeWidth={2} />
    case 'Classrooms / Seminar Halls': return <Building2 size={size} strokeWidth={2} />
    case 'Training Infrastructure': return <Target size={size} strokeWidth={2} />
    case 'Equipment': return <Wrench size={size} strokeWidth={2} />
    case 'Software / Licenses': return <Code2 size={size} strokeWidth={2} />
    case 'Training Facilities': return <UserCheck size={size} strokeWidth={2} />
    default: return <Globe size={size} strokeWidth={2} />
  }
}


export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'my-resources' | 'marketplace' | 'requests' | 'agreements' | 'calendar' | 'student-bookings'>('overview')
  const [myResources, setMyResources] = useState<any[]>([])
  const [marketplaceResources, setMarketplaceResources] = useState<any[]>([])
  const [incomingRequests, setIncomingRequests] = useState<any[]>([])
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([])
  const [agreements, setAgreements] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Student Bookings State
  const [studentBookings, setStudentBookings] = useState<any[]>([])
  const [bookingStats, setBookingStats] = useState<any>({
    pendingRequests: 0,
    approvedToday: 0,
    upcomingBookings: 0,
    activeResources: 0
  })

  // Filter States (Marketplace)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [minCapacity, setMinCapacity] = useState('')

  // Calendar State
  const [selectedResourceForCalendar, setSelectedResourceForCalendar] = useState<any>(null)
  const [resourceBookings, setResourceBookings] = useState<any[]>([])

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedResource, setSelectedResource] = useState<any>(null)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)

  // Form States
  const [resourceForm, setResourceForm] = useState({
    name: '',
    category: 'Computer Labs',
    description: '',
    location: '',
    capacity: '',
    availability: 'Mon-Fri',
    facilities: '',
    status: 'AVAILABLE',
    sharingEnabled: false,
    availableToStudents: false
  })

  const [requestForm, setRequestForm] = useState({
    purpose: '',
    requestedDate: '',
    startTime: '',
    endTime: '',
    studentCount: '',
    additionalRequirements: ''
  })

  const [rejectionReason, setRejectionReason] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [actionSubmitting, setActionSubmitting] = useState(false)

  // Fetch initial data
  useEffect(() => {
    fetchInitialData()
  }, [])

  // Refetch marketplace when filters change
  useEffect(() => {
    fetchMarketplace()
  }, [searchQuery, selectedCategory, selectedLocation, minCapacity])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchMyResources(),
        fetchMarketplace(),
        fetchRequests(),
        fetchAgreements(),
        fetchNotifications()
      ])
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Let's fetch profile first
  const [myInstitutionId, setMyInstitutionId] = useState<number | null>(null)
  const [myInstitutionName, setMyInstitutionName] = useState<string>('My Institution')

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/institution/me')
      if (res.ok) {
        const data = await res.json()
        setMyInstitutionId(data.institution.id)
        setMyInstitutionName(data.institution.name)
        return data.institution.id
      }
    } catch (e) {
      console.error('Error fetching profile:', e)
    }
    return 1 // Fallback
  }

  const fetchMyResources = async (instId?: number) => {
    try {
      const activeId = instId || myInstitutionId || 1
      const res = await fetch(`/api/resources?institutionId=${activeId}`)
      const data = await res.json()
      if (data.resources) {
        setMyResources(data.resources)
      }
    } catch (err) {
      console.error('Error fetching my resources:', err)
    }
  }

  const fetchMarketplace = async () => {
    try {
      const activeId = myInstitutionId || 1
      let url = `/api/resources?sharingEnabled=true&excludeInstitutionId=${activeId}`
      if (selectedCategory !== 'all') url += `&category=${encodeURIComponent(selectedCategory)}`
      if (selectedLocation) url += `&location=${encodeURIComponent(selectedLocation)}`
      if (minCapacity) url += `&capacityMin=${encodeURIComponent(minCapacity)}`
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`

      const res = await fetch(url)
      const data = await res.json()
      if (data.resources) {
        setMarketplaceResources(data.resources)
      }
    } catch (err) {
      console.error('Error fetching marketplace:', err)
    }
  }

  const fetchRequests = async () => {
    try {
      const resInc = await fetch('/api/resources/requests?type=incoming')
      const dataInc = await resInc.json()
      if (dataInc.requests) setIncomingRequests(dataInc.requests)

      const resOut = await fetch('/api/resources/requests?type=outgoing')
      const dataOut = await resOut.json()
      if (dataOut.requests) setOutgoingRequests(dataOut.requests)
    } catch (err) {
      console.error('Error fetching requests:', err)
    }
  }

  const fetchAgreements = async () => {
    try {
      const res = await fetch('/api/resources/agreements')
      const data = await res.json()
      if (data.agreements) setAgreements(data.agreements)
    } catch (err) {
      console.error('Error fetching agreements:', err)
    }
  }

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/resources/notifications')
      const data = await res.json()
      if (data.notifications) setNotifications(data.notifications)
    } catch (err) {
      console.error('Error fetching notifications:', err)
    }
  }

  const [bookingRejectionReason, setBookingRejectionReason] = useState('')
  const [selectedBookingForRejection, setSelectedBookingForRejection] = useState<any>(null)

  const fetchStudentBookings = async () => {
    try {
      const res = await fetch('/api/resources/bookings')
      const data = await res.json()
      if (data.bookings) setStudentBookings(data.bookings)
      if (data.stats) setBookingStats(data.stats)
    } catch (err) {
      console.error('Error fetching student bookings:', err)
    }
  }

  const handleApproveBooking = async (id: number) => {
    setActionSubmitting(true)
    setActionError('')
    setActionSuccess('')
    try {
      const res = await fetch(`/api/resources/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setActionSuccess('Student booking approved!')
        fetchStudentBookings()
      } else {
        setActionError(data.error || 'Failed to approve booking')
      }
    } catch (err) {
      setActionError('Network error. Please try again.')
    } finally {
      setActionSubmitting(false)
    }
  }

  const handleRejectBookingSubmit = async () => {
    if (!selectedBookingForRejection) return
    setActionSubmitting(true)
    setActionError('')
    setActionSuccess('')
    try {
      const res = await fetch(`/api/resources/bookings/${selectedBookingForRejection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          rejectionReason: bookingRejectionReason
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setActionSuccess('Student booking rejected.')
        setSelectedBookingForRejection(null)
        setBookingRejectionReason('')
        fetchStudentBookings()
      } else {
        setActionError(data.error || 'Failed to reject booking')
      }
    } catch (err) {
      setActionError('Network error. Please try again.')
    } finally {
      setActionSubmitting(false)
    }
  }

  const fetchBookings = async (resourceId: number) => {
    try {
      const res = await fetch(`/api/resources/${resourceId}/bookings`)
      const data = await res.json()
      if (data.bookings) setResourceBookings(data.bookings)
    } catch (err) {
      console.error('Error fetching bookings:', err)
    }
  }

  // Chain load profile then resources
  useEffect(() => {
    async function load() {
      const instId = await fetchProfile()
      await fetchMyResources(instId)
      await fetchStudentBookings()
      // Refetch marketplace with correct exclude ID
      try {
        let url = `/api/resources?sharingEnabled=true&excludeInstitutionId=${instId}`
        const res = await fetch(url)
        const data = await res.json()
        if (data.resources) {
          setMarketplaceResources(data.resources)
        }
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [])

  // Create Resource
  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionError('')
    setActionSuccess('')
    setSubmitting(true)

    if (!resourceForm.name || !resourceForm.category) {
      setActionError('Name and Category are required')
      setSubmitting(false)
      return
    }

    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...resourceForm,
          capacity: resourceForm.capacity ? parseInt(resourceForm.capacity, 10) : undefined
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setActionSuccess('Resource created successfully!')
        setShowAddModal(false)
        setResourceForm({
          name: '',
          category: 'Computer Labs',
          description: '',
          location: '',
          capacity: '',
          availability: 'Mon-Fri',
          facilities: '',
          status: 'AVAILABLE',
          sharingEnabled: false,
          availableToStudents: false
        })
        fetchMyResources()
      } else {
        setActionError(data.error || 'Failed to create resource')
      }
    } catch (err) {
      setActionError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Toggle Sharing
  const handleToggleSharing = async (resource: any) => {
    try {
      const res = await fetch(`/api/resources/${resource.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sharingEnabled: !resource.sharingEnabled })
      })
      if (res.ok) {
        fetchMyResources()
        fetchMarketplace()
      }
    } catch (err) {
      console.error('Error toggling sharing:', err)
    }
  }

  // Edit Resource
  const handleEditResource = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionError('')
    setActionSuccess('')
    setSubmitting(true)

    try {
      const res = await fetch(`/api/resources/${selectedResource.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...resourceForm,
          capacity: resourceForm.capacity ? parseInt(resourceForm.capacity, 10) : undefined
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setActionSuccess('Resource updated successfully!')
        setShowEditModal(false)
        fetchMyResources()
        fetchMarketplace()
      } else {
        setActionError(data.error || 'Failed to update resource')
      }
    } catch (err) {
      setActionError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete Resource
  const handleDeleteResource = async (resourceId: number) => {
    if (!confirm('Are you sure you want to delete this resource?')) return

    try {
      const res = await fetch(`/api/resources/${resourceId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        fetchMyResources()
        fetchMarketplace()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete resource')
      }
    } catch (err) {
      console.error('Error deleting resource:', err)
    }
  }

  // Request Access
  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionError('')
    setActionSuccess('')
    setSubmitting(true)

    const { purpose, requestedDate, startTime, endTime, studentCount } = requestForm

    if (!purpose || !requestedDate || !startTime || !endTime || !studentCount) {
      setActionError('Please fill out all required fields')
      setSubmitting(false)
      return
    }

    // Compose full DateTimes
    const startDateTime = new Date(`${requestedDate}T${startTime}:00`).toISOString()
    const endDateTime = new Date(`${requestedDate}T${endTime}:00`).toISOString()

    try {
      const res = await fetch('/api/resources/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId: selectedResource.id,
          purpose,
          requestedDate: new Date(requestedDate).toISOString(),
          startTime: startDateTime,
          endTime: endDateTime,
          studentCount: parseInt(studentCount, 10),
          additionalRequirements: requestForm.additionalRequirements
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setActionSuccess('Request Sent Successfully')
        setRequestForm({
          purpose: '',
          requestedDate: '',
          startTime: '',
          endTime: '',
          studentCount: '',
          additionalRequirements: ''
        })
        setTimeout(() => {
          setShowRequestModal(false)
          setActionSuccess('')
        }, 1500)
        fetchRequests()
      } else {
        setActionError(data.error || 'Failed to send request')
      }
    } catch (err) {
      setActionError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Action Request (Approve/Cancel)
  const handleActionRequest = async (requestId: number, action: 'approve' | 'cancel') => {
    if (action === 'cancel' && !confirm('Are you sure you want to cancel this request?')) return
    if (action === 'approve' && !confirm('Are you sure you want to approve this request?')) return

    try {
      const res = await fetch(`/api/resources/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        alert(data.message)
        fetchRequests()
        fetchAgreements()
        fetchMyResources()
        fetchNotifications()
      } else {
        alert(data.error || 'Failed to complete action')
      }
    } catch (err) {
      console.error('Error actioning request:', err)
    }
  }

  // Reject Request (Open Modal)
  const handleRejectRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectionReason.trim()) {
      alert('Please enter a rejection reason')
      return
    }

    try {
      const res = await fetch(`/api/resources/requests/${selectedRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', rejectionReason })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        alert('Request rejected successfully')
        setShowRejectModal(false)
        setRejectionReason('')
        fetchRequests()
        fetchNotifications()
      } else {
        alert(data.error || 'Failed to reject request')
      }
    } catch (err) {
      console.error('Error rejecting request:', err)
    }
  }

  // Clear Notifications
  const handleClearNotifications = async () => {
    try {
      const res = await fetch('/api/resources/notifications', {
        method: 'PUT'
      })
      if (res.ok) {
        fetchNotifications()
      }
    } catch (err) {
      console.error('Error clearing notifications:', err)
    }
  }

  // Open Edit modal with prefilled data
  const openEditModal = (resource: any) => {
    setSelectedResource(resource)
    setResourceForm({
      name: resource.name,
      category: resource.category || resource.type || 'Computer Labs',
      description: resource.description || '',
      location: resource.location || '',
      capacity: resource.capacity ? resource.capacity.toString() : '',
      availability: resource.availability || 'Mon-Fri',
      facilities: resource.facilities || '',
      status: resource.status || 'AVAILABLE',
      sharingEnabled: resource.sharingEnabled || false,
      availableToStudents: resource.availableToStudents || false
    })
    setShowEditModal(true)
  }

  // View calendar details for a resource
  const viewCalendar = async (resource: any) => {
    setSelectedResourceForCalendar(resource)
    setResourceBookings([])
    setActiveTab('calendar')
    await fetchBookings(resource.id)
  }

  // Calculate metrics
  const totalRes = myResources.length
  const availableRes = myResources.filter(r => r.status === 'AVAILABLE' || r.status === 'active').length
  const sharedRes = myResources.filter(r => r.sharingEnabled).length
  const pendingRequests = incomingRequests.filter(r => r.status === 'pending').length
  const activeAgreements = agreements.filter(r => r.status === 'active').length

  // Format date helper
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Format time helper
  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  // Mock utilization metrics for chart
  const utilizationData = myResources.map(r => {
    // Generate a pseudo-stable utilization percentage between 40% and 90% based on resource name length
    const percent = 40 + ((r.name.length * 7) % 51)
    return {
      name: r.name,
      utilization: percent
    }
  }).slice(0, 5)

  const emptyChartData = [{ name: 'No Resources', utilization: 0 }]

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Resource Sharing</h1>
          <p className={styles.pageSubtitle}>Manage and share laboratory equipment, system spaces, and training facilities.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span className="badge badge-purple" style={{ padding: '6px 12px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Building2 size={12} strokeWidth={2} />
            <span>{myInstitutionName}</span>
          </span>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setResourceForm({
                name: '',
                category: 'Computer Labs',
                description: '',
                location: '',
                capacity: '',
                availability: 'Mon-Fri',
                facilities: '',
                status: 'AVAILABLE',
                sharingEnabled: false,
                availableToStudents: false
              })
              setShowAddModal(true)
            }}
          >
            <Plus size={14} strokeWidth={2} />
            <span>Add Resource</span>
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Navigation Tabs */}
        <div className="glass" style={{ display: 'flex', padding: '0.375rem', gap: '0.375rem', borderRadius: 'var(--radius-lg)', overflowX: 'auto' }}>
          <button
            className={`btn btn-sm ${activeTab === 'overview' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('overview')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <LayoutDashboard size={14} strokeWidth={2} />
            <span>Overview</span>
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'my-resources' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('my-resources')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <FolderKanban size={14} strokeWidth={2} />
            <span>My Resources ({totalRes})</span>
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'marketplace' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('marketplace')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Globe size={14} strokeWidth={2} />
            <span>Shared Marketplace</span>
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'requests' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('requests')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Inbox size={14} strokeWidth={2} />
            <span>Incoming Requests</span>
            {pendingRequests > 0 && <span className="badge badge-orange" style={{ marginLeft: 4, padding: '1px 6px', fontSize: '10px' }}>{pendingRequests}</span>}
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'agreements' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('agreements')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Handshake size={14} strokeWidth={2} />
            <span>Requests & Agreements</span>
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'student-bookings' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('student-bookings')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <GraduationCap size={14} strokeWidth={2} />
            <span>Student Bookings</span>
            {bookingStats.pendingRequests > 0 && <span className="badge badge-orange" style={{ marginLeft: 4, padding: '1px 6px', fontSize: '10px' }}>{bookingStats.pendingRequests}</span>}
          </button>
          {selectedResourceForCalendar && (
            <button
              className={`btn btn-sm ${activeTab === 'calendar' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('calendar')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Calendar size={14} strokeWidth={2} />
              <span>Schedule: {selectedResourceForCalendar.name}</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="glass" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <MorphingInfinity className="size-16" style={{ width: '64px', height: '64px', color: '#8b5cf6' }} />
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Loading resources and sharing agreements...</p>
          </div>
        ) : (
          <>
            {/* 1. OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Stats Row */}
                <div className={styles.statsRow}>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(124,58,237,0.1)', color: '#a78bfa' }}>
                      <Box size={20} strokeWidth={2} />
                    </div>
                    <div>
                      <div className={styles.statLabel}>Total Resources</div>
                      <div className={styles.statValue}>{totalRes}</div>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399' }}>
                      <CheckCircle2 size={20} strokeWidth={2} />
                    </div>
                    <div>
                      <div className={styles.statLabel}>Available</div>
                      <div className={styles.statValue}>{availableRes}</div>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(6,182,212,0.1)', color: '#06b6d4' }}>
                      <Share2 size={20} strokeWidth={2} />
                    </div>
                    <div>
                      <div className={styles.statLabel}>Shared Enabled</div>
                      <div className={styles.statValue}>{sharedRes}</div>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24' }}>
                      <Inbox size={20} strokeWidth={2} />
                    </div>
                    <div>
                      <div className={styles.statLabel}>Pending Requests</div>
                      <div className={styles.statValue}>{pendingRequests}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
                  {/* Utilization Chart */}
                  <div className="glass" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
                      Resource Utilization Analytics
                    </h3>
                    {utilizationData.length === 0 ? (
                      <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                        No utilization data available. Add resources to view analytics.
                      </div>
                    ) : (
                      <div style={{ width: '100%', height: 240 }}>
                        <ResponsiveContainer>
                          <BarChart data={utilizationData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                            <YAxis stroke="var(--text-secondary)" fontSize={11} domain={[0, 100]} tickLine={false} />
                            <Tooltip
                              contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px' }}
                              itemStyle={{ color: 'var(--text-primary)' }}
                            />
                            <Bar dataKey="utilization" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={36} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Notification Feed */}
                  <div className="glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Bell size={15} strokeWidth={2} color="#8b5cf6" />
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Notifications</h3>
                      </div>
                      {notifications.length > 0 && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '11px', padding: '2px 8px' }}
                          onClick={handleClearNotifications}
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '230px', overflowY: 'auto', paddingRight: '4px' }}>
                      {notifications.length === 0 ? (
                        <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>
                          No recent updates.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            style={{
                              padding: '10px',
                              borderRadius: 'var(--radius-sm)',
                              background: n.read ? 'rgba(255,255,255,0.01)' : 'rgba(124,58,237,0.05)',
                              borderLeft: n.read ? '2px solid transparent' : '2px solid var(--accent-purple)',
                              fontSize: '0.8rem',
                              color: 'var(--text-secondary)'
                            }}
                          >
                            <div style={{ color: 'var(--text-primary)', marginBottom: '3px' }}>{n.message}</div>
                            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{formatDate(n.createdAt)}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. MY RESOURCES TAB */}
            {activeTab === 'my-resources' && (
              <div>
                {myResources.length === 0 ? (
                  <div className="glass" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                      <FolderKanban size={36} strokeWidth={1.5} color="var(--text-muted)" />
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem' }}>No Resources Registered</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                      Register systems, seminar rooms, and labs to schedule them and enable institutional sharing.
                    </p>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
                      <Plus size={14} strokeWidth={2} />
                      <span>Add Your First Resource</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {myResources.map((resource) => (
                      <div key={resource.id} className="glass" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {getCategoryIcon(resource.category || resource.type, 18)}
                          </div>
                          <span className={`badge ${resource.status === 'AVAILABLE' ? 'badge-green' : 'badge-orange'}`} style={{ textTransform: 'capitalize' }}>
                            {resource.status?.toLowerCase()}
                          </span>
                        </div>
                        <div>
                          <h4 style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>{resource.name}</h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{resource.category || resource.type}</span>
                        </div>
                        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', minHeight: '36px', lineBreak: 'anywhere', margin: 0 }}>
                          {resource.description || 'No description provided.'}
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)', padding: '8px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <MapPin size={12} strokeWidth={2} color="var(--text-muted)" />
                            <span>{resource.location || 'N/A'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Users size={12} strokeWidth={2} color="var(--text-muted)" />
                            <span>{resource.capacity ? `${resource.capacity} seats` : 'N/A'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Clock size={12} strokeWidth={2} color="var(--text-muted)" />
                            <span>{resource.availability || 'N/A'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Share2 size={12} strokeWidth={2} color="var(--text-muted)" />
                            <span style={{ color: resource.sharingEnabled ? '#34d399' : '#fbbf24', fontWeight: 500 }}>
                              {resource.sharingEnabled ? 'Sharing' : 'Private'}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn btn-sm btn-ghost" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => openEditModal(resource)}>
                              <Edit2 size={12} strokeWidth={2} />
                              <span>Edit</span>
                            </button>
                            <button className="btn btn-sm btn-ghost" style={{ padding: '5px 10px', fontSize: '12px', color: '#ef4444' }} onClick={() => handleDeleteResource(resource.id)}>
                              <Trash2 size={12} strokeWidth={2} />
                            </button>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn btn-sm btn-secondary" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => viewCalendar(resource)}>
                              <Calendar size={12} strokeWidth={2} />
                              <span>Calendar</span>
                            </button>
                            <button
                              className={`btn btn-sm ${resource.sharingEnabled ? 'btn-ghost' : 'btn-primary'}`}
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                              onClick={() => handleToggleSharing(resource)}
                            >
                              {resource.sharingEnabled ? 'Unshare' : 'Share'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. MARKETPLACE TAB */}
            {activeTab === 'marketplace' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Search & Filters */}
                <div className="glass" style={{ padding: '14px', display: 'grid', gridTemplateColumns: '1fr repeat(3, 160px) 100px', gap: '10px', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Search shared resources, labs, specs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <select
                    className="form-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {CATEGORY_OPTIONS.map(c => (
                      <option key={c.value} value={c.value}>{c.value}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Filter by location"
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                  />
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Min Capacity"
                    value={minCapacity}
                    onChange={(e) => setMinCapacity(e.target.value)}
                  />
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => {
                      setSearchQuery('')
                      setSelectedCategory('all')
                      setSelectedLocation('')
                      setMinCapacity('')
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <RotateCcw size={12} strokeWidth={2} />
                    <span>Reset</span>
                  </button>
                </div>

                {/* Marketplace Items */}
                {marketplaceResources.length === 0 ? (
                  <div className="glass" style={{ padding: '3.5rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                      <Globe size={36} strokeWidth={1.5} color="var(--text-muted)" />
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Marketplace is Empty</h3>
                    <p style={{ fontSize: '0.85rem' }}>No other institutions are sharing resources matching your filters currently.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {marketplaceResources.map((resource) => (
                      <div key={resource.id} className="glass" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {getCategoryIcon(resource.category || resource.type, 18)}
                          </div>
                          <span className="badge badge-purple" style={{ fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Building2 size={10} strokeWidth={2} />
                            <span>{resource.institution?.name || 'Partner Inst'}</span>
                          </span>
                        </div>
                        <div>
                          <h4 style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>{resource.name}</h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{resource.category || resource.type}</span>
                        </div>
                        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', minHeight: '36px', lineBreak: 'anywhere', margin: 0 }}>
                          {resource.description || 'No description provided.'}
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)', padding: '8px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <MapPin size={12} strokeWidth={2} color="var(--text-muted)" />
                            <span>{resource.location || 'N/A'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Users size={12} strokeWidth={2} color="var(--text-muted)" />
                            <span>{resource.capacity ? `${resource.capacity} students` : 'N/A'}</span>
                          </div>
                          <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Clock size={12} strokeWidth={2} color="var(--text-muted)" />
                            <span>{resource.availability || 'N/A'}</span>
                          </div>
                          {resource.facilities && (
                            <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Wrench size={12} strokeWidth={2} color="var(--text-muted)" />
                              <span>{resource.facilities}</span>
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                          <button className="btn btn-sm btn-ghost" onClick={() => viewCalendar(resource)} style={{ padding: '5px 10px', fontSize: '12px' }}>
                            <Calendar size={12} strokeWidth={2} />
                            <span>Schedule</span>
                          </button>
                          <button
                            className="btn btn-sm btn-primary"
                            style={{ padding: '5px 12px', fontSize: '12px' }}
                            onClick={() => {
                              setSelectedResource(resource)
                              setRequestForm({
                                purpose: '',
                                requestedDate: '',
                                startTime: '',
                                endTime: '',
                                studentCount: '',
                                additionalRequirements: ''
                              })
                              setActionError('')
                              setActionSuccess('')
                              setShowRequestModal(true)
                            }}
                          >
                            <span>Request Access</span>
                            <ArrowRight size={12} strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. INCOMING REQUESTS TAB */}
            {activeTab === 'requests' && (
              <div className="glass" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
                  <Inbox size={18} strokeWidth={2} color="#8b5cf6" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Requests Received from Partners</h3>
                </div>
                {incomingRequests.length === 0 ? (
                  <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '3rem 0', fontSize: '0.875rem' }}>
                    No incoming requests found.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '10px 12px' }}>Institution</th>
                          <th style={{ padding: '10px 12px' }}>Resource</th>
                          <th style={{ padding: '10px 12px' }}>Date</th>
                          <th style={{ padding: '10px 12px' }}>Time</th>
                          <th style={{ padding: '10px 12px' }}>Purpose</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}>Students</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center' }}>Status</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incomingRequests.map((req) => (
                          <tr key={req.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '12px 10px', fontWeight: 500 }}>{req.requestingInstitution?.name}</td>
                            <td style={{ padding: '12px 10px' }}>{req.resource?.name}</td>
                            <td style={{ padding: '12px 10px' }}>{formatDate(req.requestedDate)}</td>
                            <td style={{ padding: '12px 10px' }}>{formatTime(req.startTime)} - {formatTime(req.endTime)}</td>
                            <td style={{ padding: '12px 10px' }}>{req.purpose}</td>
                            <td style={{ padding: '12px 10px', textAlign: 'right' }}>{req.studentCount}</td>
                            <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                              <span className={`badge ${
                                req.status === 'approved' ? 'badge-green' :
                                req.status === 'rejected' ? 'badge-orange' :
                                req.status === 'cancelled' ? 'badge-orange' :
                                'badge-blue'
                              }`} style={{ textTransform: 'capitalize' }}>
                                {req.status}
                              </span>
                            </td>
                            <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                              {req.status === 'pending' && (
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                  <button
                                    className="btn btn-sm btn-primary"
                                    style={{ padding: '4px 10px', fontSize: '11px' }}
                                    onClick={() => handleActionRequest(req.id, 'approve')}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    className="btn btn-sm btn-ghost"
                                    style={{ padding: '4px 10px', fontSize: '11px', color: '#ef4444' }}
                                    onClick={() => {
                                      setSelectedRequest(req)
                                      setRejectionReason('')
                                      setShowRejectModal(true)
                                    }}
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                              {req.status === 'rejected' && req.rejectionReason && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                  Reason: "{req.rejectionReason}"
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 5. REQUESTS & AGREEMENTS TAB */}
            {activeTab === 'agreements' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Outgoing requests */}
                <div className="glass" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
                    <Share2 size={18} strokeWidth={2} color="#8b5cf6" />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Requests Sent to Partners</h3>
                  </div>
                  {outgoingRequests.length === 0 ? (
                    <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0', fontSize: '0.875rem' }}>
                      No sent requests found. Explore the Marketplace to request resources.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                            <th style={{ padding: '10px 12px' }}>Owner Institution</th>
                            <th style={{ padding: '10px 12px' }}>Resource</th>
                            <th style={{ padding: '10px 12px' }}>Date</th>
                            <th style={{ padding: '10px 12px' }}>Time</th>
                            <th style={{ padding: '10px 12px' }}>Purpose</th>
                            <th style={{ padding: '10px 12px', textAlign: 'right' }}>Students</th>
                            <th style={{ padding: '10px 12px', textAlign: 'center' }}>Status</th>
                            <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {outgoingRequests.map((req) => (
                            <tr key={req.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '12px 10px', fontWeight: 500 }}>{req.resource?.institution?.name}</td>
                              <td style={{ padding: '12px 10px' }}>{req.resource?.name}</td>
                              <td style={{ padding: '12px 10px' }}>{formatDate(req.requestedDate)}</td>
                              <td style={{ padding: '12px 10px' }}>{formatTime(req.startTime)} - {formatTime(req.endTime)}</td>
                              <td style={{ padding: '12px 10px' }}>{req.purpose}</td>
                              <td style={{ padding: '12px 10px', textAlign: 'right' }}>{req.studentCount}</td>
                              <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                                <span className={`badge ${
                                  req.status === 'approved' ? 'badge-green' :
                                  req.status === 'rejected' ? 'badge-orange' :
                                  req.status === 'cancelled' ? 'badge-orange' :
                                  'badge-blue'
                                }`} style={{ textTransform: 'capitalize' }}>
                                  {req.status}
                                </span>
                              </td>
                              <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                                {(req.status === 'pending' || req.status === 'approved') && (
                                  <button
                                    className="btn btn-sm btn-ghost"
                                    style={{ padding: '4px 10px', fontSize: '11px', color: '#ef4444' }}
                                    onClick={() => handleActionRequest(req.id, 'cancel')}
                                  >
                                    Cancel
                                  </button>
                                )}
                                {req.status === 'rejected' && req.rejectionReason && (
                                  <div style={{ fontSize: '0.75rem', color: '#fbbf24' }}>
                                    Reason: "{req.rejectionReason}"
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Sharing Agreements */}
                <div className="glass" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
                    <Handshake size={18} strokeWidth={2} color="#8b5cf6" />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Active Sharing Agreements</h3>
                  </div>
                  {agreements.length === 0 ? (
                    <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0', fontSize: '0.875rem' }}>
                      No active sharing agreements currently.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                      {agreements.map((agr) => {
                        const isOwner = agr.ownerInstitutionId === myInstitutionId
                        return (
                          <div key={agr.id} className="glass" style={{ padding: '18px', borderLeft: '3px solid var(--accent-primary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <h4 style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>{agr.resource?.name}</h4>
                              <span className={`badge ${agr.status === 'active' ? 'badge-green' : 'badge-orange'}`} style={{ textTransform: 'capitalize' }}>
                                {agr.status}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div><strong>Owner:</strong> {agr.ownerInstitution?.name}</div>
                              <div><strong>Requestor:</strong> {agr.requestingInstitution?.name}</div>
                              <div style={{ margin: '4px 0', borderTop: '1px solid var(--border)', paddingTop: '6px' }}>
                                <strong>Usage Period:</strong> {formatDate(agr.startDate)}
                              </div>
                              <div><strong>Usage Time:</strong> {formatTime(agr.startDate)} – {formatTime(agr.endDate)}</div>
                              <div><strong>Capacity:</strong> {agr.request?.studentCount || agr.resource?.capacity} students</div>
                              <div><strong>Purpose:</strong> {agr.request?.purpose || 'Institutional sharing'}</div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              <span>Agreement #{agr.id}</span>
                              <span className="badge badge-purple" style={{ fontSize: '10px' }}>
                                {isOwner ? 'Hosting' : 'Visiting'}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 6. CALENDAR VIEW */}
            {activeTab === 'calendar' && selectedResourceForCalendar && (
              <div className="glass" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={18} strokeWidth={2} color="#8b5cf6" />
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Schedule: {selectedResourceForCalendar.name}</h3>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Category: {selectedResourceForCalendar.category || selectedResourceForCalendar.type} | Location: {selectedResourceForCalendar.location}</p>
                  </div>
                  <button className="btn btn-sm btn-secondary" onClick={() => {
                    const isMine = myResources.some(r => r.id === selectedResourceForCalendar.id)
                    setActiveTab(isMine ? 'my-resources' : 'marketplace')
                  }}>
                    Back
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' }}>
                  {/* Left Column: Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="glass" style={{ padding: '16px', fontSize: '0.825rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>About the asset</h4>
                      <div><strong>Capacity:</strong> {selectedResourceForCalendar.capacity || 'N/A'}</div>
                      <div><strong>Location:</strong> {selectedResourceForCalendar.location || 'N/A'}</div>
                      <div><strong>Availability:</strong> {selectedResourceForCalendar.availability || 'N/A'}</div>
                      {selectedResourceForCalendar.facilities && (
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '6px', marginTop: '4px' }}>
                          <strong>Specifications:</strong>
                          <p style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{selectedResourceForCalendar.facilities}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Bookings Timeline */}
                  <div className="glass" style={{ padding: '18px' }}>
                    <h4 style={{ fontWeight: 600, marginBottom: '0.875rem', color: 'var(--text-primary)', fontSize: '0.95rem' }}>Confirmed Bookings</h4>
                    {resourceBookings.filter(b => b.status !== 'cancelled').length === 0 ? (
                      <div style={{ color: 'var(--text-secondary)', padding: '2rem', textAlign: 'center', fontSize: '0.85rem' }}>
                        No active bookings scheduled for this resource. It is fully available!
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {resourceBookings.filter(b => b.status !== 'cancelled').map((booking) => (
                          <div
                            key={booking.id}
                            style={{
                              padding: '12px 14px',
                              borderRadius: 'var(--radius-md)',
                              background: 'var(--bg-secondary)',
                              borderLeft: '3px solid var(--accent-primary)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                                {booking.purpose || 'Institutional Booking'}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                {formatDate(booking.startTime)} | {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
                              </div>
                            </div>
                            <span className="badge badge-purple" style={{ fontSize: '10px' }}>
                              Booked by {booking.booked_by_name || 'Admin'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 7. STUDENT BOOKINGS VIEW */}
            {activeTab === 'student-bookings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Stats Row */}
                <div className={styles.statsRow}>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>
                      <Clock size={20} strokeWidth={2} />
                    </div>
                    <div>
                      <div className={styles.statLabel}>Pending Requests</div>
                      <div className={styles.statValue}>{bookingStats.pendingRequests}</div>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399' }}>
                      <CheckCircle2 size={20} strokeWidth={2} />
                    </div>
                    <div>
                      <div className={styles.statLabel}>Approved Today</div>
                      <div className={styles.statValue}>{bookingStats.approvedToday}</div>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(124,58,237,0.1)', color: '#a78bfa' }}>
                      <Calendar size={20} strokeWidth={2} />
                    </div>
                    <div>
                      <div className={styles.statLabel}>Upcoming Bookings</div>
                      <div className={styles.statValue}>{bookingStats.upcomingBookings}</div>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(6,182,212,0.1)', color: '#06b6d4' }}>
                      <Building2 size={20} strokeWidth={2} />
                    </div>
                    <div>
                      <div className={styles.statLabel}>Active Resources</div>
                      <div className={styles.statValue}>{bookingStats.activeResources}</div>
                    </div>
                  </div>
                </div>

                <div className="glass" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
                    <GraduationCap size={18} strokeWidth={2} color="#8b5cf6" />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      Student Reservation Requests
                    </h3>
                  </div>

                  {actionSuccess && (
                    <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={15} strokeWidth={2} />
                      <span>{actionSuccess}</span>
                    </div>
                  )}

                  {actionError && (
                    <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle size={15} strokeWidth={2} />
                      <span>{actionError}</span>
                    </div>
                  )}

                  {studentBookings.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      No student booking requests found.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '10px 14px' }}>Student</th>
                            <th style={{ padding: '10px 14px' }}>Resource</th>
                            <th style={{ padding: '10px 14px' }}>Schedule</th>
                            <th style={{ padding: '10px 14px' }}>Purpose</th>
                            <th style={{ padding: '10px 14px' }}>Status</th>
                            <th style={{ padding: '10px 14px' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentBookings.map((b: any) => (
                            <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '12px 14px' }}>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.requester.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.requester.email}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.requester.college || 'Host Institution'}</div>
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.resourceName}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.category} | {b.location}</div>
                              </td>
                              <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                                <div>{formatDate(b.startTime)}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatTime(b.startTime)} - {formatTime(b.endTime)}</div>
                              </td>
                              <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', maxWidth: '200px', wordWrap: 'break-word' }}>
                                {b.purpose}
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <span className={`badge ${
                                  b.status === 'pending' ? 'badge-orange' :
                                  b.status === 'rejected' ? 'badge-orange' :
                                  b.status === 'cancelled' ? 'badge-orange' :
                                  'badge-green'
                                }`} style={{ fontSize: '10px' }}>
                                  {b.status === 'pending' ? 'Pending' :
                                   b.status === 'rejected' ? 'Rejected' :
                                   b.status === 'cancelled' ? 'Cancelled' :
                                   'Approved'}
                                </span>
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                {b.status === 'pending' ? (
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                      className="btn btn-sm btn-primary"
                                      disabled={actionSubmitting}
                                      onClick={() => handleApproveBooking(b.id)}
                                      style={{ padding: '4px 8px', fontSize: '11px' }}
                                    >
                                      Approve
                                    </button>
                                    <button
                                      className="btn btn-sm btn-ghost"
                                      disabled={actionSubmitting}
                                      onClick={() => setSelectedBookingForRejection(b)}
                                      style={{ padding: '4px 8px', fontSize: '11px', color: '#ef4444' }}
                                    >
                                      Reject
                                    </button>
                                  </div>
                                ) : b.status === 'rejected' ? (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Reason: {b.rejectionReason}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    —
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── MODALS ── */}

      {/* A. Add Resource Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', padding: '1rem' }} onClick={() => setShowAddModal(false)}>
          <div className="glass" style={{ width: '100%', maxWidth: '560px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '90vh', overflowY: 'auto', borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} strokeWidth={2} color="#8b5cf6" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Register New Resource</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {actionError && (
              <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} strokeWidth={2} />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleAddResource} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Resource Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Computer Lab A / Advanced Robotics Lab"
                  value={resourceForm.name}
                  onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    className="form-select"
                    value={resourceForm.category}
                    onChange={(e) => setResourceForm({ ...resourceForm, category: e.target.value })}
                  >
                    {CATEGORY_OPTIONS.map(c => (
                      <option key={c.value} value={c.value}>{c.value}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Student Capacity</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 60"
                    value={resourceForm.capacity}
                    onChange={(e) => setResourceForm({ ...resourceForm, capacity: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Block A, Room 302"
                    value={resourceForm.location}
                    onChange={(e) => setResourceForm({ ...resourceForm, location: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Availability Schedule</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Mon-Fri, 9AM-5PM"
                    value={resourceForm.availability}
                    onChange={(e) => setResourceForm({ ...resourceForm, availability: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '60px', resize: 'vertical' }}
                  placeholder="Provide details about the equipment, systems, configurations..."
                  value={resourceForm.description}
                  onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Facilities / Specifications</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '60px', resize: 'vertical' }}
                  placeholder="e.g. Core i7 12th Gen, 16GB RAM, RTX 3060 Graphics, Projector installed..."
                  value={resourceForm.facilities}
                  onChange={(e) => setResourceForm({ ...resourceForm, facilities: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '4px 0' }}>
                <input
                  type="checkbox"
                  id="availableToStudents"
                  checked={resourceForm.availableToStudents}
                  onChange={(e) => setResourceForm({ ...resourceForm, availableToStudents: e.target.checked })}
                  style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                />
                <label htmlFor="availableToStudents" style={{ fontSize: '13px', cursor: 'pointer', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Make this resource available to students of my institution
                </label>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '4px 0' }}>
                <input
                  type="checkbox"
                  id="sharingEnabled"
                  checked={resourceForm.sharingEnabled}
                  onChange={(e) => setResourceForm({ ...resourceForm, sharingEnabled: e.target.checked })}
                  style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                />
                <label htmlFor="sharingEnabled" style={{ fontSize: '13px', cursor: 'pointer', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Enable sharing with other institutions in the marketplace immediately
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* B. Edit Resource Modal */}
      {showEditModal && selectedResource && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', padding: '1rem' }} onClick={() => setShowEditModal(false)}>
          <div className="glass" style={{ width: '100%', maxWidth: '560px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '90vh', overflowY: 'auto', borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={18} strokeWidth={2} color="#8b5cf6" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Edit Resource Details</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {actionError && (
              <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} strokeWidth={2} />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleEditResource} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Resource Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={resourceForm.name}
                  onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    className="form-select"
                    value={resourceForm.category}
                    onChange={(e) => setResourceForm({ ...resourceForm, category: e.target.value })}
                  >
                    {CATEGORY_OPTIONS.map(c => (
                      <option key={c.value} value={c.value}>{c.value}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Student Capacity</label>
                  <input
                    type="number"
                    className="form-input"
                    value={resourceForm.capacity}
                    onChange={(e) => setResourceForm({ ...resourceForm, capacity: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-input"
                    value={resourceForm.location}
                    onChange={(e) => setResourceForm({ ...resourceForm, location: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Availability Schedule</label>
                  <input
                    type="text"
                    className="form-input"
                    value={resourceForm.availability}
                    onChange={(e) => setResourceForm({ ...resourceForm, availability: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '60px', resize: 'vertical' }}
                  value={resourceForm.description}
                  onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Facilities / Specifications</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '60px', resize: 'vertical' }}
                  value={resourceForm.facilities}
                  onChange={(e) => setResourceForm({ ...resourceForm, facilities: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '4px 0' }}>
                <input
                  type="checkbox"
                  id="availableToStudentsEdit"
                  checked={resourceForm.availableToStudents}
                  onChange={(e) => setResourceForm({ ...resourceForm, availableToStudents: e.target.checked })}
                  style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                />
                <label htmlFor="availableToStudentsEdit" style={{ fontSize: '13px', cursor: 'pointer', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Make this resource available to students of my institution
                </label>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '4px 0' }}>
                <input
                  type="checkbox"
                  id="sharingEnabledEdit"
                  checked={resourceForm.sharingEnabled}
                  onChange={(e) => setResourceForm({ ...resourceForm, sharingEnabled: e.target.checked })}
                  style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                />
                <label htmlFor="sharingEnabledEdit" style={{ fontSize: '13px', cursor: 'pointer', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Enable sharing with other institutions in the marketplace
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* C. Request Access Modal */}
      {showRequestModal && selectedResource && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', padding: '1rem' }} onClick={() => setShowRequestModal(false)}>
          <div className="glass" style={{ width: '100%', maxWidth: '500px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Request Resource Access</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{selectedResource.name} • {selectedResource.institution?.name}</p>
              </div>
              <button onClick={() => setShowRequestModal(false)} className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {actionError && (
              <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} strokeWidth={2} />
                <span>{actionError}</span>
              </div>
            )}

            {actionSuccess && (
              <div style={{ padding: '8px 12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} strokeWidth={2} />
                <span>{actionSuccess}</span>
              </div>
            )}

            <form onSubmit={handleRequestAccess} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Purpose of Usage *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Semester training session / Lab exam"
                  value={requestForm.purpose}
                  onChange={(e) => setRequestForm({ ...requestForm, purpose: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Required Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={requestForm.requestedDate}
                    onChange={(e) => setRequestForm({ ...requestForm, requestedDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Number of Students *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 45"
                    value={requestForm.studentCount}
                    onChange={(e) => setRequestForm({ ...requestForm, studentCount: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Start Time *</label>
                  <input
                    type="time"
                    className="form-input"
                    value={requestForm.startTime}
                    onChange={(e) => setRequestForm({ ...requestForm, startTime: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time *</label>
                  <input
                    type="time"
                    className="form-input"
                    value={requestForm.endTime}
                    onChange={(e) => setRequestForm({ ...requestForm, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Additional Requirements / Notes</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '50px', resize: 'vertical' }}
                  placeholder="e.g. Special compilers pre-installed, whiteboards..."
                  value={requestForm.additionalRequirements}
                  onChange={(e) => setRequestForm({ ...requestForm, additionalRequirements: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowRequestModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* D. Reject Request Modal */}
      {showRejectModal && selectedRequest && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', padding: '1rem' }} onClick={() => setShowRejectModal(false)}>
          <div className="glass" style={{ width: '100%', maxWidth: '420px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Reject Access Request</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Request from: {selectedRequest.requestingInstitution?.name}</p>
              </div>
              <button onClick={() => setShowRejectModal(false)} className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleRejectRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Reason for Rejection *</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  placeholder="Please state why this request cannot be approved (e.g. maintenance work, prior internal booking)..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
                  setShowRejectModal(false)
                  setRejectionReason('')
                }}>Cancel</button>
                <button type="submit" className="btn btn-sm" style={{ background: '#ef4444', color: 'white', border: 'none' }}>
                  Reject Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Booking Rejection Modal */}
      {selectedBookingForRejection && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', padding: '1rem' }} onClick={() => setSelectedBookingForRejection(null)}>
          <div className="glass" style={{ width: '100%', maxWidth: '420px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Reject Booking Request</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {selectedBookingForRejection.resourceName} • {selectedBookingForRejection.requester.name}
                </p>
              </div>
              <button onClick={() => setSelectedBookingForRejection(null)} className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Reason for Rejection *</label>
              <textarea
                className="form-input"
                style={{ minHeight: '80px', resize: 'vertical' }}
                placeholder="e.g. Schedule conflicts with internal lecture, facility maintenance during this period..."
                value={bookingRejectionReason}
                onChange={(e) => setBookingRejectionReason(e.target.value)}
                required
              />
            </div>
            {actionError && (
              <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} strokeWidth={2} />
                <span>{actionError}</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => {
                setSelectedBookingForRejection(null)
                setBookingRejectionReason('')
              }} disabled={actionSubmitting}>Cancel</button>
              <button
                className="btn btn-sm"
                onClick={handleRejectBookingSubmit}
                disabled={actionSubmitting || !bookingRejectionReason.trim()}
                style={{ background: '#ef4444', color: 'white', border: 'none' }}
              >
                {actionSubmitting ? 'Rejecting...' : 'Reject Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
