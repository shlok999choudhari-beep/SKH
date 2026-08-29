'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './CourseWorkspace.module.css'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Video,
  Link as LinkIcon,
  MessageSquare,
  Sparkles,
  Upload,
  CheckCircle2,
  Clock,
  Layers,
  Award,
  ArrowLeft,
  ArrowRight,
  Copy,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Check,
  Download,
  Users,
  Search,
  BookOpen,
  HelpCircle,
  Megaphone,
  FolderLock,
  ExternalLink,
  ShieldCheck,
  Eye,
  Settings,
  Flame,
  FileCheck,
  MoreVertical,
  Calendar,
  AlertTriangle,
  MoveUp,
  MoveDown,
  CopyPlus,
  Play,
  RotateCcw,
  Zap
} from 'lucide-react'

type TabType = 'course' | 'participants' | 'grades' | 'activities' | 'competencies'

interface CourseWorkspaceProps {
  courseId: number
  role?: 'student' | 'trainer' | 'institution-admin'
}

export default function CourseWorkspace({ courseId, role = 'student' }: CourseWorkspaceProps) {
  const router = useRouter()
  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('course')
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({})
  const [copiedCode, setCopiedCode] = useState(false)
  const [regeneratingCode, setRegeneratingCode] = useState(false)
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false)
  const [openContextId, setOpenContextId] = useState<string | null>(null)

  // Preview Mode
  const [isPreviewStudent, setIsPreviewStudent] = useState(false)

  // Student Submission Modal
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [activeAssignmentForSubmit, setActiveAssignmentForSubmit] = useState<any>(null)
  const [submissionFile, setSubmissionFile] = useState<File | null>(null)
  const [submissionText, setSubmissionText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')

  // Teacher Modals
  const [showEditCourseModal, setShowEditCourseModal] = useState(false)
  const [editCourseForm, setEditCourseForm] = useState({
    title: '',
    shortName: '',
    academicYear: '',
    semester: '',
    department: '',
    description: '',
    difficulty: 'Beginner',
    status: 'draft'
  })

  const [showAddSectionModal, setShowAddSectionModal] = useState(false)
  const [sectionTitleInput, setSectionTitleInput] = useState('')
  const [sectionDescInput, setSectionDescInput] = useState('')
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null)

  const [showAddResourceModal, setShowAddResourceModal] = useState(false)
  const [resourceForm, setResourceForm] = useState({
    moduleId: 0,
    title: '',
    type: 'PDF',
    url: '',
    description: ''
  })
  const [editingResourceId, setEditingResourceId] = useState<number | null>(null)

  // Activity Creator Modal (Assignment, Quiz & AI Quiz, Discussion, Announcement, Attendance)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [activityType, setActivityType] = useState<'assignment' | 'quiz' | 'ai-quiz' | 'discussion' | 'announcement' | 'attendance'>('assignment')

  const [activityAssignmentForm, setActivityAssignmentForm] = useState({
    moduleId: 0,
    title: '',
    description: '1. Add Handwritten Content as an Image in assignment.\n2. Include Program Code and Output Screenshots',
    maxMarks: 10,
    dueDate: '2026-09-07T00:00',
    allowedFileTypes: 'pdf,zip,png,jpg,cpp',
    submissionType: 'file_upload' as 'file_upload' | 'text_submission' | 'both'
  })

  const [activityQuizForm, setActivityQuizForm] = useState({
    moduleId: 0,
    title: '',
    timeLimit: 20,
    passingScore: 60,
    maxAttempts: 3,
    questions: [
      {
        question: 'What is the primary function of the vertex shader?',
        type: 'mcq' as 'mcq' | 'multiple_select' | 'true_false',
        marks: 2,
        explanation: 'Vertex shaders process individual vertex attributes and transformations.',
        options: [
          { optionText: 'Transform 3D vertex coordinates to clip space', isCorrect: true },
          { optionText: 'Calculate per-pixel fragment colors', isCorrect: false },
          { optionText: 'Store disk database records', isCorrect: false },
          { optionText: 'Handle network socket packets', isCorrect: false }
        ]
      }
    ]
  })

  const [aiQuizTopic, setAiQuizTopic] = useState('Computer Graphics & OpenGL')
  const [aiQuizDifficulty, setAiQuizDifficulty] = useState('Medium')
  const [aiQuizCount, setAiQuizCount] = useState(5)
  const [generatingAiQuiz, setGeneratingAiQuiz] = useState(false)

  const [activityDiscussionForm, setActivityDiscussionForm] = useState({
    moduleId: 0,
    title: '',
    content: ''
  })

  const [activityAnnouncementForm, setActivityAnnouncementForm] = useState({
    moduleId: 0,
    title: '',
    content: ''
  })

  const [activityAttendanceForm, setActivityAttendanceForm] = useState({
    moduleId: 0,
    title: 'Practical Lab Attendance Session',
    date: new Date().toISOString().slice(0, 16)
  })

  // Grades Tab & Teacher Grading Modal
  const [gradesData, setGradesData] = useState<any>(null)
  const [loadingGrades, setLoadingGrades] = useState(false)
  const [selectedSubmissionToGrade, setSelectedSubmissionToGrade] = useState<any>(null)
  const [gradingMarksInput, setGradingMarksInput] = useState<number | string>(10)
  const [gradingFeedbackInput, setGradingFeedbackInput] = useState('')
  const [submittingGrade, setSubmittingGrade] = useState(false)

  // Participants Tab State
  const [participants, setParticipants] = useState<any[]>([])
  const [loadingParticipants, setLoadingParticipants] = useState(false)
  const [participantSearch, setParticipantSearch] = useState('')

  // Competencies Tab State
  const [competencies, setCompetencies] = useState<any[]>([])
  const [loadingCompetencies, setLoadingCompetencies] = useState(false)

  // Activities filter state
  const [activityCategory, setActivityCategory] = useState<'all' | 'assignments' | 'quizzes' | 'forums' | 'resources'>('all')

  const isTeacherRole = role === 'trainer' || role === 'institution-admin' || (course && course.isTeacher)
  const isTeacher = isTeacherRole && !isPreviewStudent

  useEffect(() => {
    if (courseId) {
      fetchCourseDetails()
    }
  }, [courseId])

  useEffect(() => {
    if (activeTab === 'grades' && courseId) {
      fetchGrades()
    } else if (activeTab === 'participants' && courseId) {
      fetchParticipants()
    } else if (activeTab === 'competencies' && courseId) {
      fetchCompetencies()
    }
  }, [activeTab, courseId])

  const fetchCourseDetails = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/courses/${courseId}`)
      const data = await res.json()
      if (data.course) {
        setCourse(data.course)
        setEditCourseForm({
          title: data.course.title || '',
          shortName: data.course.shortName || '',
          academicYear: data.course.academicYear || 'AY 2026-27',
          semester: data.course.semester || 'Semester I',
          department: data.course.department || 'Computer Engineering',
          description: data.course.description || '',
          difficulty: data.course.difficulty || 'Beginner',
          status: data.course.status || 'draft'
        })
        const initialExpanded: Record<number, boolean> = {}
        data.course.modules?.forEach((m: any, idx: number) => {
          initialExpanded[m.id] = idx < 3
        })
        setExpandedSections(initialExpanded)
      }
    } catch (err) {
      console.error('Error fetching course:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchGrades = async () => {
    setLoadingGrades(true)
    try {
      const res = await fetch(`/api/courses/${courseId}/grades`)
      const data = await res.json()
      setGradesData(data)
    } catch (err) {
      console.error('Error fetching grades:', err)
    } finally {
      setLoadingGrades(false)
    }
  }

  const fetchParticipants = async () => {
    setLoadingParticipants(true)
    try {
      const res = await fetch(`/api/courses/${courseId}/participants`)
      const data = await res.json()
      if (data.participants) {
        setParticipants(data.participants)
      }
    } catch (err) {
      console.error('Error fetching participants:', err)
    } finally {
      setLoadingParticipants(false)
    }
  }

  const fetchCompetencies = async () => {
    setLoadingCompetencies(true)
    try {
      const res = await fetch(`/api/courses/${courseId}/competencies`)
      const data = await res.json()
      if (data.competencies) {
        setCompetencies(data.competencies)
      }
    } catch (err) {
      console.error('Error fetching competencies:', err)
    } finally {
      setLoadingCompetencies(false)
    }
  }

  // Course Code Copy & Regenerate
  const handleCopyCode = () => {
    if (!course?.joinCode) return
    navigator.clipboard.writeText(course.joinCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleRegenerateCode = async () => {
    if (!confirm('Regenerating will create a new course code. Existing enrolled students will remain enrolled. Proceed?')) {
      return
    }
    setRegeneratingCode(true)
    try {
      const res = await fetch(`/api/courses/${courseId}/join-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'regenerate' })
      })
      const data = await res.json()
      if (res.ok && data.joinCode) {
        setCourse((prev: any) => ({ ...prev, joinCode: data.joinCode }))
      } else {
        alert(data.error || 'Failed to regenerate code')
      }
    } catch (err) {
      console.error(err)
      alert('Error regenerating code')
    } finally {
      setRegeneratingCode(false)
    }
  }

  // Publishing Controls
  const handlePublishStatusChange = async (newStatus: 'draft' | 'published' | 'archived') => {
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      const data = await res.json()
      if (res.ok && data.course) {
        setCourse((prev: any) => ({ ...prev, status: newStatus }))
      } else {
        alert(data.error || 'Failed to update course status')
      }
    } catch (err) {
      console.error(err)
      alert('Error updating status')
    }
  }

  // Edit Course Meta
  const handleSaveCourseMeta = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editCourseForm)
      })
      const data = await res.json()
      if (res.ok && data.course) {
        setCourse((prev: any) => ({ ...prev, ...editCourseForm }))
        setShowEditCourseModal(false)
      } else {
        alert(data.error || 'Failed to save course changes')
      }
    } catch (err) {
      console.error(err)
      alert('Error saving course changes')
    }
  }

  // Section Management
  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sectionTitleInput.trim()) return

    try {
      if (editingSectionId) {
        const res = await fetch(`/api/courses/${courseId}/modules/${editingSectionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: sectionTitleInput.trim(), description: sectionDescInput.trim() })
        })
        if (res.ok) {
          setShowAddSectionModal(false)
          fetchCourseDetails()
        }
      } else {
        const res = await fetch(`/api/courses/${courseId}/modules`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: sectionTitleInput.trim(), description: sectionDescInput.trim() })
        })
        if (res.ok) {
          setShowAddSectionModal(false)
          fetchCourseDetails()
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteSection = async (moduleId: number) => {
    if (!confirm('Are you sure you want to delete this entire section and its contents?')) return
    try {
      const res = await fetch(`/api/courses/${courseId}/modules/${moduleId}`, { method: 'DELETE' })
      if (res.ok) fetchCourseDetails()
    } catch (err) {
      console.error(err)
    }
  }

  // Duplicate Any Item/Section
  const handleDuplicate = async (type: 'section' | 'resource' | 'assignment' | 'quiz', itemId: number) => {
    setOpenContextId(null)
    try {
      const res = await fetch(`/api/courses/${courseId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, itemId })
      })
      if (res.ok) fetchCourseDetails()
      else alert('Failed to duplicate item')
    } catch (err) {
      console.error(err)
    }
  }

  // Resource Management
  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resourceForm.title.trim() || !resourceForm.url.trim()) return

    try {
      if (editingResourceId) {
        const res = await fetch(`/api/courses/${courseId}/resources/${editingResourceId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(resourceForm)
        })
        if (res.ok) {
          setShowAddResourceModal(false)
          fetchCourseDetails()
        }
      } else {
        const res = await fetch(`/api/courses/${courseId}/resources`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            moduleId: resourceForm.moduleId || course.modules?.[0]?.id || null,
            title: resourceForm.title.trim(),
            type: resourceForm.type,
            url: resourceForm.url.trim()
          })
        })
        if (res.ok) {
          setShowAddResourceModal(false)
          fetchCourseDetails()
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteResource = async (resourceId: number) => {
    if (!confirm('Are you sure you want to delete this resource?')) return
    try {
      const res = await fetch(`/api/courses/${courseId}/resources/${resourceId}`, { method: 'DELETE' })
      if (res.ok) fetchCourseDetails()
    } catch (err) {
      console.error(err)
    }
  }

  // Activity Creator
  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetModuleId = activityAssignmentForm.moduleId || course.modules?.[0]?.id || null

    try {
      if (activityType === 'assignment') {
        const res = await fetch(`/api/courses/${courseId}/assignments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            moduleId: targetModuleId,
            title: activityAssignmentForm.title.trim(),
            description: activityAssignmentForm.description.trim(),
            maxMarks: activityAssignmentForm.maxMarks,
            dueDate: activityAssignmentForm.dueDate,
            allowedFileTypes: activityAssignmentForm.allowedFileTypes,
            submissionType: activityAssignmentForm.submissionType,
            status: 'published'
          })
        })
        if (res.ok) {
          setShowActivityModal(false)
          fetchCourseDetails()
        }
      } else if (activityType === 'quiz' || activityType === 'ai-quiz') {
        const res = await fetch(`/api/courses/${courseId}/quizzes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            moduleId: targetModuleId,
            title: activityQuizForm.title.trim(),
            timeLimit: activityQuizForm.timeLimit,
            passingScore: activityQuizForm.passingScore,
            maxAttempts: activityQuizForm.maxAttempts,
            status: 'draft',
            questions: activityQuizForm.questions
          })
        })
        if (res.ok) {
          setShowActivityModal(false)
          fetchCourseDetails()
        }
      } else if (activityType === 'discussion') {
        const res = await fetch(`/api/discussions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId,
            moduleId: targetModuleId,
            title: activityDiscussionForm.title.trim(),
            content: activityDiscussionForm.content.trim()
          })
        })
        if (res.ok) {
          setShowActivityModal(false)
          fetchCourseDetails()
        }
      } else if (activityType === 'announcement') {
        const res = await fetch(`/api/announcements`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId,
            moduleId: targetModuleId,
            title: activityAnnouncementForm.title.trim(),
            content: activityAnnouncementForm.content.trim()
          })
        })
        if (res.ok) {
          setShowActivityModal(false)
          fetchCourseDetails()
        }
      } else if (activityType === 'attendance') {
        alert('Attendance session created for practical lab.')
        setShowActivityModal(false)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // AI Quiz Generation Action
  const handleGenerateAiQuiz = async () => {
    if (!aiQuizTopic.trim()) return
    setGeneratingAiQuiz(true)
    try {
      const res = await fetch('/api/ai/quiz-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiQuizTopic.trim(),
          difficulty: aiQuizDifficulty,
          questionCount: aiQuizCount,
          courseTitle: course?.title || ''
        })
      })
      const data = await res.json()
      if (res.ok && data.quiz) {
        setActivityQuizForm({
          moduleId: activityAssignmentForm.moduleId || course.modules?.[0]?.id || 0,
          title: data.quiz.title,
          timeLimit: data.quiz.timeLimit,
          passingScore: data.quiz.passingScore,
          maxAttempts: 3,
          questions: data.quiz.questions
        })
        setActivityType('quiz') // Switch to visual quiz editor
      } else {
        alert(data.error || 'Failed to generate quiz')
      }
    } catch (err) {
      console.error(err)
      alert('Error connecting to AI service')
    } finally {
      setGeneratingAiQuiz(false)
    }
  }

  // Teacher Grading Action
  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSubmissionToGrade) return
    setSubmittingGrade(true)
    try {
      const res = await fetch(`/api/courses/${courseId}/grades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedSubmissionToGrade.id,
          marks: parseFloat(String(gradingMarksInput)),
          feedback: gradingFeedbackInput.trim(),
          status: 'accepted'
        })
      })
      if (res.ok) {
        setSelectedSubmissionToGrade(null)
        fetchGrades()
      } else {
        alert('Failed to submit grade')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingGrade(false)
    }
  }

  // Student Assignment Submit Action
  const handleOpenSubmitModal = (assignment: any) => {
    setActiveAssignmentForSubmit(assignment)
    setSubmissionFile(null)
    setSubmissionText('')
    setSubmitError('')
    setSubmitSuccess('')
    setShowSubmitModal(true)
  }

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeAssignmentForSubmit) return
    if (!submissionFile && !submissionText.trim()) {
      setSubmitError('Please upload a submission file or enter your written solution.')
      return
    }

    setSubmitting(true)
    setSubmitError('')
    try {
      const formData = new FormData()
      formData.append('assignmentId', activeAssignmentForSubmit.id.toString())
      if (submissionFile) formData.append('file', submissionFile)
      if (submissionText.trim()) formData.append('textAnswer', submissionText.trim())

      const res = await fetch('/api/assignments/submit', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setSubmitSuccess('Practical assignment submitted successfully for grading!')
        setTimeout(() => {
          setShowSubmitModal(false)
          fetchCourseDetails()
        }, 1500)
      } else {
        setSubmitError(data.error || 'Failed to upload assignment submission.')
      }
    } catch (err) {
      console.error(err)
      setSubmitError('Network error while uploading submission.')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleSection = (moduleId: number) => {
    setExpandedSections(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }))
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '65vh', gap: '1.25rem' }}>
        <MorphingInfinity className="size-16" style={{ width: '60px', height: '60px', color: '#8b5cf6' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '4px' }}>
            Loading Course Workspace
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            Syncing practical curriculum, sections, and authorizations...
          </p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className={styles.workspaceContainer} style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
        <h2>Course Not Found</h2>
        <p style={{ color: 'var(--text-secondary)' }}>The requested course is not available or has been archived.</p>
        <Link href={isTeacherRole ? '/trainer/courses' : '/student/courses'} className="btn btn-primary btn-sm">
          Return to Courses
        </Link>
      </div>
    )
  }

  const stats = course.statsSummary || {
    totalStudents: course.enrolledCount || 0,
    totalAssignments: course.totalAssignmentsCount || 0,
    totalQuizzes: course.totalQuizzesCount || 0,
    pendingSubmissions: 0,
    averageCompletion: 0,
    averageScore: 0
  }

  return (
    <div className={styles.workspaceContainer}>
      {/* Student Preview Mode Banner */}
      {isPreviewStudent && (
        <div className={styles.previewBanner}>
          <div className={styles.previewBannerText}>
            <Eye size={18} />
            <span>Viewing Course Workspace as Student (Student Preview Mode Active)</span>
          </div>
          <button
            type="button"
            onClick={() => setIsPreviewStudent(false)}
            className={styles.returnModeBtn}
          >
            <RotateCcw size={14} />
            <span>Return to Teacher Mode</span>
          </button>
        </div>
      )}

      {/* Top Back Nav & Branding */}
      <div className={styles.topNav}>
        <Link href={isTeacherRole ? '/trainer/courses' : '/student/courses'} className={styles.backLink}>
          <ArrowLeft size={16} strokeWidth={2} />
          <span>{isTeacherRole ? 'Back to All Courses' : 'Back to My Courses'}</span>
        </Link>

        {/* Course Code Box */}
        {course.joinCode && (
          <div className={styles.codePillBox}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Course Code:</span>
            <strong>{course.joinCode}</strong>
            <button
              type="button"
              className={styles.codeCopyBtn}
              onClick={handleCopyCode}
              title="Copy Course Code"
            >
              {copiedCode ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
            </button>
            {isTeacher && (
              <button
                type="button"
                className={styles.codeCopyBtn}
                onClick={handleRegenerateCode}
                disabled={regeneratingCode}
                title="Regenerate Course Code"
              >
                <RefreshCw size={13} className={regeneratingCode ? 'animate-spin' : ''} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Teacher Live Management Stats Bar (Real Database Metrics) */}
      {isTeacher && (
        <div className={styles.statsSummaryBar}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Students</span>
            <div className={styles.summaryValue}>
              <Users size={16} color="#8b5cf6" />
              <span>{stats.totalStudents}</span>
            </div>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Assignments</span>
            <div className={styles.summaryValue}>
              <FileCheck size={16} color="#3b82f6" />
              <span>{stats.totalAssignments}</span>
            </div>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Quizzes</span>
            <div className={styles.summaryValue}>
              <Award size={16} color="#a855f7" />
              <span>{stats.totalQuizzes}</span>
            </div>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Pending Grading</span>
            <div className={styles.summaryValue} style={{ color: stats.pendingSubmissions > 0 ? '#f59e0b' : 'inherit' }}>
              <Clock size={16} color={stats.pendingSubmissions > 0 ? '#f59e0b' : '#94a3b8'} />
              <span>{stats.pendingSubmissions}</span>
            </div>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Avg Completion</span>
            <div className={styles.summaryValue}>
              <CheckCircle2 size={16} color="#10b981" />
              <span>{stats.averageCompletion}%</span>
            </div>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Average Score</span>
            <div className={styles.summaryValue} style={{ color: '#34d399' }}>
              <Flame size={16} color="#10b981" />
              <span>{stats.averageScore}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Course Header */}
      <header className={styles.courseHeader}>
        <div className={styles.courseTitleRow}>
          <div>
            <h1 className={styles.courseTitle}>{course.title}</h1>
            <div className={styles.metaTagsRow}>
              <span className={`${styles.metaBadge} ${styles.metaBadgePurple}`}>
                {course.academicYear || 'AY 2026-27'}
              </span>
              <span className={`${styles.metaBadge} ${styles.metaBadgeBlue}`}>
                {course.semester || 'Semester I'}
              </span>
              {course.department && (
                <span className={styles.metaBadge}>
                  {course.department}
                </span>
              )}
              <span className={styles.metaBadge}>
                Teacher: {course.trainer?.user?.name || 'Prof. Rajesh Sharma'}
              </span>
              {/* Status Badge */}
              <span className={`${styles.metaBadge} ${course.status === 'published' ? styles.metaBadgeGreen : course.status === 'archived' ? styles.metaBadgeAmber : ''}`}>
                Status: {course.status ? course.status.toUpperCase() : 'DRAFT'}
              </span>
            </div>
          </div>

          {/* Teacher Publishing Switcher */}
          {isTeacher && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {course.status !== 'published' ? (
                <button
                  type="button"
                  onClick={() => handlePublishStatusChange('published')}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <CheckCircle2 size={14} />
                  <span>Publish Course</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handlePublishStatusChange('draft')}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>Unpublish (Draft)</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Teacher Action Controls Toolbar */}
        {isTeacher && (
          <div className={styles.teacherToolbar}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: '4px' }}>
              Course Management:
            </span>
            <button
              type="button"
              onClick={() => {
                setEditingSectionId(null)
                setSectionTitleInput('')
                setSectionDescInput('')
                setShowAddSectionModal(true)
              }}
              className="btn btn-primary btn-sm"
              style={{ padding: '6px 14px', fontSize: '12px' }}
            >
              <Plus size={13} />
              <span>+ Add Section</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingResourceId(null)
                setResourceForm({ moduleId: course.modules?.[0]?.id || 0, title: '', type: 'PDF', url: '', description: '' })
                setShowAddResourceModal(true)
              }}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 14px', fontSize: '12px' }}
            >
              <Plus size={13} />
              <span>+ Add Resource</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActivityType('assignment')
                setActivityAssignmentForm({
                  moduleId: course.modules?.[1]?.id || course.modules?.[0]?.id || 0,
                  title: '',
                  description: '1. Add Handwritten Content as an Image in assignment.\n2. Include Program Code and Output Screenshots',
                  maxMarks: 10,
                  dueDate: '2026-09-07T00:00',
                  allowedFileTypes: 'pdf,zip,png,jpg,cpp',
                  submissionType: 'file_upload'
                })
                setShowActivityModal(true)
              }}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 14px', fontSize: '12px' }}
            >
              <Plus size={13} />
              <span>+ Add Activity</span>
            </button>
            <button
              type="button"
              onClick={() => setShowEditCourseModal(true)}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 14px', fontSize: '12px' }}
            >
              <Edit2 size={13} />
              <span>Edit Course</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPreviewStudent(true)}
              className="btn btn-ghost btn-sm"
              style={{ padding: '6px 12px', fontSize: '12px', color: '#fbbf24', marginLeft: 'auto' }}
            >
              <Eye size={13} />
              <span>Preview as Student</span>
            </button>
          </div>
        )}
      </header>

      {/* Tabs Navigation */}
      <nav className={styles.tabsNav}>
        <div className={styles.tabList}>
          <button
            type="button"
            className={`${styles.tabItem} ${activeTab === 'course' ? styles.tabItemActive : ''}`}
            onClick={() => setActiveTab('course')}
          >
            Course
            {activeTab === 'course' && <div className={styles.tabIndicator} />}
          </button>

          <button
            type="button"
            className={`${styles.tabItem} ${activeTab === 'participants' ? styles.tabItemActive : ''}`}
            onClick={() => setActiveTab('participants')}
          >
            Participants {course.enrolledCount ? `(${course.enrolledCount})` : ''}
            {activeTab === 'participants' && <div className={styles.tabIndicator} />}
          </button>

          <button
            type="button"
            className={`${styles.tabItem} ${activeTab === 'grades' ? styles.tabItemActive : ''}`}
            onClick={() => setActiveTab('grades')}
          >
            Grades
            {activeTab === 'grades' && <div className={styles.tabIndicator} />}
          </button>

          <button
            type="button"
            className={`${styles.tabItem} ${activeTab === 'activities' ? styles.tabItemActive : ''}`}
            onClick={() => setActiveTab('activities')}
          >
            Activities
            {activeTab === 'activities' && <div className={styles.tabIndicator} />}
          </button>

          <button
            type="button"
            className={`${styles.tabItem} ${activeTab === 'competencies' ? styles.tabItemActive : ''}`}
            onClick={() => setActiveTab('competencies')}
          >
            Competencies
            {activeTab === 'competencies' && <div className={styles.tabIndicator} />}
          </button>
        </div>

        {/* More ⌄ Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            <span>More</span>
            <ChevronDown size={14} />
          </button>

          {moreDropdownOpen && (
            <div className={styles.moreDropdownMenu}>
              <button
                type="button"
                className={styles.dropdownItem}
                onClick={() => {
                  setMoreDropdownOpen(false)
                  alert(`Course: ${course.title}\nCode: ${course.joinCode}\nDepartment: ${course.department}`)
                }}
              >
                <BookOpen size={14} color="#8b5cf6" />
                <span>Course Information</span>
              </button>

              <button
                type="button"
                className={styles.dropdownItem}
                onClick={() => {
                  setMoreDropdownOpen(false)
                  handleCopyCode()
                }}
              >
                <Copy size={14} color="#3b82f6" />
                <span>Copy Course Code</span>
              </button>

              {isTeacher ? (
                <>
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => {
                      setMoreDropdownOpen(false)
                      setShowEditCourseModal(true)
                    }}
                  >
                    <Settings size={14} color="#10b981" />
                    <span>Course Settings</span>
                  </button>

                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => {
                      setMoreDropdownOpen(false)
                      setActiveTab('participants')
                    }}
                  >
                    <Users size={14} color="#f59e0b" />
                    <span>Manage Students</span>
                  </button>

                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => {
                      setMoreDropdownOpen(false)
                      handlePublishStatusChange(course.status === 'archived' ? 'published' : 'archived')
                    }}
                  >
                    <FolderLock size={14} color="#ec4899" />
                    <span>{course.status === 'archived' ? 'Unarchive Course' : 'Archive Course'}</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className={styles.dropdownItem}
                  onClick={() => {
                    setMoreDropdownOpen(false)
                    alert('Downloads compiled from available course resources.')
                  }}
                >
                  <Download size={14} color="#10b981" />
                  <span>Available Downloads</span>
                </button>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* TAB 1: COURSE CURRICULUM */}
      {activeTab === 'course' && (
        <div>
          {/* Top Announcements Notice */}
          {course.announcements && course.announcements.length > 0 && (
            <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: 'var(--radius-xl)', padding: '14px 20px', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#c4b5fd', fontWeight: 700, fontSize: '0.95rem' }}>
                <Megaphone size={18} />
                <span>Course Announcements</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {course.announcements.map((ann: any) => (
                  <div key={ann.id} style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    <strong>{ann.title}:</strong> {ann.content}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sections List */}
          {(!course.modules || course.modules.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
              <BookOpen size={44} strokeWidth={1.5} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Sections Configured</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                {isTeacher ? 'Click "+ Add Section" above to organize curriculum modules and practical labs.' : 'This course curriculum is currently being assembled.'}
              </p>
              {isTeacher && (
                <button
                  type="button"
                  onClick={() => setShowAddSectionModal(true)}
                  className="btn btn-primary btn-sm"
                >
                  <Plus size={14} /> Add First Section
                </button>
              )}
            </div>
          ) : (
            course.modules.map((m: any, mIdx: number) => {
              const isExpanded = expandedSections[m.id] ?? true
              const contextMenuKey = `section_${m.id}`

              return (
                <div key={m.id} className={styles.sectionCard}>
                  {/* Section Header */}
                  <div
                    className={styles.sectionHeader}
                    onClick={() => toggleSection(m.id)}
                  >
                    <div className={styles.sectionHeaderLeft}>
                      {isExpanded ? <ChevronUp size={20} color="#8b5cf6" /> : <ChevronDown size={20} color="var(--text-muted)" />}
                      <div>
                        <h2 className={styles.sectionTitle}>{m.title}</h2>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={e => e.stopPropagation()}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {(m.resources?.length || 0) + (m.assignments?.length || 0) + (m.quizzes?.length || 0)} items
                      </span>

                      {/* Teacher Context Menu for Section */}
                      {isTeacher && (
                        <div className={styles.contextMenuWrap}>
                          <button
                            type="button"
                            className={styles.contextMenuBtn}
                            onClick={() => setOpenContextId(openContextId === contextMenuKey ? null : contextMenuKey)}
                          >
                            <MoreVertical size={16} />
                          </button>

                          {openContextId === contextMenuKey && (
                            <div className={styles.contextMenu}>
                              <button
                                type="button"
                                className={styles.contextMenuItem}
                                onClick={() => {
                                  setOpenContextId(null)
                                  setEditingSectionId(m.id)
                                  setSectionTitleInput(m.title)
                                  setSectionDescInput(m.description || '')
                                  setShowAddSectionModal(true)
                                }}
                              >
                                <Edit2 size={13} />
                                <span>Edit Section</span>
                              </button>

                              <button
                                type="button"
                                className={styles.contextMenuItem}
                                onClick={() => handleDuplicate('section', m.id)}
                              >
                                <CopyPlus size={13} />
                                <span>Duplicate Section</span>
                              </button>

                              <button
                                type="button"
                                className={`${styles.contextMenuItem} ${styles.contextMenuItemDanger}`}
                                onClick={() => {
                                  setOpenContextId(null)
                                  handleDeleteSection(m.id)
                                }}
                              >
                                <Trash2 size={13} />
                                <span>Delete Section</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section Content */}
                  {isExpanded && (
                    <div className={styles.sectionBody}>
                      {m.description && <div className={styles.sectionDesc}>{m.description}</div>}

                      <div className={styles.itemList}>
                        {/* 1. Resources */}
                        {m.resources?.map((res: any) => {
                          const itemContextKey = `res_${res.id}`
                          return (
                            <div key={res.id} className={styles.itemRow}>
                              <div className={styles.itemLeft}>
                                <div className={styles.itemIconWrap} style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa' }}>
                                  {res.type === 'VIDEO' ? <Video size={18} /> : res.type === 'EXTERNAL' ? <ExternalLink size={18} /> : <FileText size={18} />}
                                </div>
                                <div>
                                  <a href={res.url} target="_blank" rel="noreferrer" className={styles.itemTitle}>
                                    {res.title}
                                  </a>
                                  <div className={styles.itemSubtext}>
                                    {res.type} Resource • Verified
                                  </div>
                                </div>
                              </div>

                              <div className={styles.itemRight}>
                                {res.isCompleted && (
                                  <span className="badge badge-green" style={{ fontSize: '10px' }}>
                                    <Check size={11} /> Completed
                                  </span>
                                )}

                                <a href={res.url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '12px' }}>
                                  <span>Open</span>
                                </a>

                                {/* Teacher Context Menu on Resource */}
                                {isTeacher && (
                                  <div className={styles.contextMenuWrap}>
                                    <button
                                      type="button"
                                      className={styles.contextMenuBtn}
                                      onClick={() => setOpenContextId(openContextId === itemContextKey ? null : itemContextKey)}
                                    >
                                      <MoreVertical size={15} />
                                    </button>

                                    {openContextId === itemContextKey && (
                                      <div className={styles.contextMenu}>
                                        <button
                                          type="button"
                                          className={styles.contextMenuItem}
                                          onClick={() => {
                                            setOpenContextId(null)
                                            setEditingResourceId(res.id)
                                            setResourceForm({
                                              moduleId: m.id,
                                              title: res.title,
                                              type: res.type,
                                              url: res.url,
                                              description: ''
                                            })
                                            setShowAddResourceModal(true)
                                          }}
                                        >
                                          <Edit2 size={13} />
                                          <span>Edit Resource</span>
                                        </button>

                                        <button
                                          type="button"
                                          className={styles.contextMenuItem}
                                          onClick={() => handleDuplicate('resource', res.id)}
                                        >
                                          <CopyPlus size={13} />
                                          <span>Duplicate</span>
                                        </button>

                                        <button
                                          type="button"
                                          className={`${styles.contextMenuItem} ${styles.contextMenuItemDanger}`}
                                          onClick={() => {
                                            setOpenContextId(null)
                                            handleDeleteResource(res.id)
                                          }}
                                        >
                                          <Trash2 size={13} />
                                          <span>Delete</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}

                        {/* 2. Practical Assignments */}
                        {m.assignments?.map((assign: any) => {
                          const itemContextKey = `assign_${assign.id}`
                          const isGraded = assign.studentSubmission?.grade
                          const isSubmitted = !!assign.studentSubmission

                          return (
                            <div key={assign.id} className={styles.itemRow} style={{ borderLeft: '4px solid #8b5cf6' }}>
                              <div className={styles.itemLeft}>
                                <div className={styles.itemIconWrap} style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c4b5fd' }}>
                                  <FileCheck size={18} strokeWidth={2} />
                                </div>
                                <div>
                                  <div className={styles.itemTitle}>{assign.title}</div>
                                  <div className={styles.itemSubtext}>
                                    Due: {new Date(assign.dueDate).toLocaleDateString()} • Max Marks: {assign.maxMarks} Pts
                                  </div>
                                  {assign.description && (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', whiteSpace: 'pre-line' }}>
                                      {assign.description}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className={styles.itemRight}>
                                {isTeacher ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '0.78rem', color: '#c4b5fd', fontWeight: 600 }}>
                                      {assign.submissionCount || 0} Submissions
                                    </span>
                                    <div className={styles.contextMenuWrap}>
                                      <button
                                        type="button"
                                        className={styles.contextMenuBtn}
                                        onClick={() => setOpenContextId(openContextId === itemContextKey ? null : itemContextKey)}
                                      >
                                        <MoreVertical size={15} />
                                      </button>
                                      {openContextId === itemContextKey && (
                                        <div className={styles.contextMenu}>
                                          <button
                                            type="button"
                                            className={styles.contextMenuItem}
                                            onClick={() => handleDuplicate('assignment', assign.id)}
                                          >
                                            <CopyPlus size={13} />
                                            <span>Duplicate</span>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {isGraded ? (
                                      <span className="badge badge-green">
                                        Score: {assign.studentSubmission.grade.marks}/{assign.maxMarks}
                                      </span>
                                    ) : isSubmitted ? (
                                      <span className="badge badge-blue">
                                        Submitted
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenSubmitModal(assign)}
                                        className="btn btn-primary btn-sm"
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 12px', fontSize: '12px' }}
                                      >
                                        <Upload size={12} />
                                        <span>Submit Work</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}

                        {/* 3. Quizzes */}
                        {m.quizzes?.map((qz: any) => {
                          const itemContextKey = `quiz_${qz.id}`
                          return (
                            <div key={qz.id} className={styles.itemRow} style={{ borderLeft: '4px solid #a855f7' }}>
                              <div className={styles.itemLeft}>
                                <div className={styles.itemIconWrap} style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#d8b4fe' }}>
                                  <Award size={18} />
                                </div>
                                <div>
                                  <Link href={isTeacher ? `/trainer/quizzes/${qz.id}/analytics` : `/student/quizzes/${qz.id}`} className={styles.itemTitle}>
                                    {qz.title}
                                  </Link>
                                  <div className={styles.itemSubtext}>
                                    {qz.timeLimit} Mins • Passing Requirement: {qz.passingScore}% • {qz.questions?.length || 0} Questions
                                  </div>
                                </div>
                              </div>

                              <div className={styles.itemRight}>
                                <Link
                                  href={isTeacher ? `/trainer/quizzes/${qz.id}/analytics` : `/student/quizzes/${qz.id}`}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '4px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  {isTeacher ? <Award size={13} /> : <Play size={13} />}
                                  <span>{isTeacher ? 'Analytics' : 'Take Quiz'}</span>
                                </Link>

                                {isTeacher && (
                                  <div className={styles.contextMenuWrap}>
                                    <button
                                      type="button"
                                      className={styles.contextMenuBtn}
                                      onClick={() => setOpenContextId(openContextId === itemContextKey ? null : itemContextKey)}
                                    >
                                      <MoreVertical size={15} />
                                    </button>
                                    {openContextId === itemContextKey && (
                                      <div className={styles.contextMenu}>
                                        <button
                                          type="button"
                                          className={styles.contextMenuItem}
                                          onClick={() => handleDuplicate('quiz', qz.id)}
                                        >
                                          <CopyPlus size={13} />
                                          <span>Duplicate</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* TAB 2: PARTICIPANTS */}
      {activeTab === 'participants' && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
              Course Participants ({participants.length})
            </h3>
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search students by name..."
                value={participantSearch}
                onChange={e => setParticipantSearch(e.target.value)}
                style={{ width: '100%', padding: '6px 12px 6px 32px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {loadingParticipants ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <MorphingInfinity className="size-12" style={{ width: '48px', height: '48px', color: '#8b5cf6', margin: '0 auto' }} />
            </div>
          ) : participants.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              No students enrolled in this course yet. Share code <strong>{course.joinCode}</strong> to invite students.
            </div>
          ) : (
            <div className={styles.gradeTableWrap}>
              <table className={styles.gradeTable}>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Email</th>
                    <th>College / Branch</th>
                    <th>Enrollment Date</th>
                    <th>Course Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {participants
                    .filter(p => !participantSearch.trim() || (p.student?.name || '').toLowerCase().includes(participantSearch.toLowerCase()))
                    .map((p: any) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.student?.name || 'Student'}</td>
                        <td>{p.student?.email}</td>
                        <td>{p.student?.college || 'MIT'} • {p.student?.degree || 'CSE'}</td>
                        <td>{new Date(p.enrolledAt).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '80px', height: '6px', background: 'var(--bg-primary)', borderRadius: '99px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${p.progressPercent}%`, background: '#8b5cf6', borderRadius: '99px' }} />
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{p.progressPercent}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: GRADES (Matrix for Teacher, Report for Student) */}
      {activeTab === 'grades' && (
        <div>
          {loadingGrades ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <MorphingInfinity className="size-12" style={{ width: '48px', height: '48px', color: '#8b5cf6', margin: '0 auto' }} />
            </div>
          ) : isTeacher ? (
            /* Teacher Gradebook Matrix */
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Instructor Gradebook Matrix</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '3px 0 0' }}>
                    Click any student submission pill to review uploaded artifacts, assign scores, and provide feedback.
                  </p>
                </div>
              </div>

              <div className={styles.gradeTableWrap}>
                <table className={styles.gradeTable}>
                  <thead>
                    <tr>
                      <th className={styles.studentColSticky}>Student Name</th>
                      {gradesData?.columns?.map((col: any) => (
                        <th key={col.id}>{col.title} ({col.maxMarks} Pts)</th>
                      ))}
                      <th>Overall Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(gradesData?.studentRows || []).map((row: any) => (
                      <tr key={row.studentId}>
                        <td className={styles.studentColSticky}>
                          <div>
                            <div>{row.studentName}</div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{row.studentEmail}</span>
                          </div>
                        </td>

                        {gradesData?.columns?.map((col: any) => {
                          const scoreObj = row.scores[col.id] || {}
                          const hasSubmission = !!scoreObj.submission

                          return (
                            <td key={col.id}>
                              {scoreObj.status === 'Graded' ? (
                                <button
                                  type="button"
                                  className={styles.gradeScoreBtn}
                                  style={{ color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                                  onClick={() => {
                                    if (scoreObj.submission) {
                                      setSelectedSubmissionToGrade({
                                        ...scoreObj.submission,
                                        studentName: row.studentName,
                                        assignmentTitle: col.title,
                                        maxMarks: col.maxMarks
                                      })
                                      setGradingMarksInput(scoreObj.marks || col.maxMarks)
                                      setGradingFeedbackInput(scoreObj.submission.grade?.feedback || '')
                                    }
                                  }}
                                >
                                  <span>{scoreObj.marks}/{scoreObj.max}</span>
                                  <Edit2 size={11} />
                                </button>
                              ) : scoreObj.status === 'Submitted' ? (
                                <button
                                  type="button"
                                  className={`${styles.gradeScoreBtn} ${styles.gradeScorePending}`}
                                  onClick={() => {
                                    if (scoreObj.submission) {
                                      setSelectedSubmissionToGrade({
                                        ...scoreObj.submission,
                                        studentName: row.studentName,
                                        assignmentTitle: col.title,
                                        maxMarks: col.maxMarks
                                      })
                                      setGradingMarksInput(col.maxMarks)
                                      setGradingFeedbackInput('Good effort! Clear practical implementation.')
                                    }
                                  }}
                                >
                                  <span>Needs Grade</span>
                                  <Edit2 size={11} />
                                </button>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                              )}
                            </td>
                          )
                        })}

                        <td style={{ fontWeight: 700, color: '#c4b5fd' }}>
                          {row.averagePercent}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Student Individual Grade Report */
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', padding: '1.75rem' }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 700 }}>My Assessment Performance</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Overall Score</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399' }}>{gradesData?.summary?.overallPercentage || 0}%</div>
                </div>
                <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Letter Grade</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#c4b5fd' }}>{gradesData?.summary?.letterGrade || 'A'}</div>
                </div>
              </div>

              <div className={styles.gradeTableWrap}>
                <table className={styles.gradeTable}>
                  <thead>
                    <tr>
                      <th>Assessment Item</th>
                      <th>Type</th>
                      <th>Max Marks</th>
                      <th>Score</th>
                      <th>Status</th>
                      <th>Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(gradesData?.items || []).map((it: any) => (
                      <tr key={it.id}>
                        <td style={{ fontWeight: 600 }}>{it.title}</td>
                        <td>{it.type}</td>
                        <td>{it.maxMarks}</td>
                        <td style={{ fontWeight: 700, color: it.obtainedMarks !== null ? '#34d399' : 'inherit' }}>
                          {it.obtainedMarks !== null ? `${it.obtainedMarks} (${it.percentage}%)` : '—'}
                        </td>
                        <td><span className={`badge ${it.status === 'Graded' || it.status === 'Passed' ? 'badge-green' : 'badge-purple'}`}>{it.status}</span></td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{it.feedback || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ACTIVITIES */}
      {activeTab === 'activities' && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', padding: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setActivityCategory('all')} className={`btn btn-sm ${activityCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`}>All Activities</button>
            <button type="button" onClick={() => setActivityCategory('assignments')} className={`btn btn-sm ${activityCategory === 'assignments' ? 'btn-primary' : 'btn-secondary'}`}>Assignments</button>
            <button type="button" onClick={() => setActivityCategory('quizzes')} className={`btn btn-sm ${activityCategory === 'quizzes' ? 'btn-primary' : 'btn-secondary'}`}>Quizzes</button>
            <button type="button" onClick={() => setActivityCategory('resources')} className={`btn btn-sm ${activityCategory === 'resources' ? 'btn-primary' : 'btn-secondary'}`}>Resources</button>
          </div>

          <div className={styles.itemList}>
            {course.modules?.map((m: any) => (
              <React.Fragment key={m.id}>
                {(activityCategory === 'all' || activityCategory === 'assignments') && m.assignments?.map((a: any) => (
                  <div key={`act_a_${a.id}`} className={styles.itemRow}>
                    <div className={styles.itemLeft}>
                      <div className={styles.itemIconWrap} style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c4b5fd' }}>
                        <FileCheck size={18} />
                      </div>
                      <div>
                        <div className={styles.itemTitle}>{a.title} (Section: {m.title})</div>
                        <div className={styles.itemSubtext}>Max Marks: {a.maxMarks} • Due: {new Date(a.dueDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                ))}

                {(activityCategory === 'all' || activityCategory === 'quizzes') && m.quizzes?.map((q: any) => (
                  <div key={`act_q_${q.id}`} className={styles.itemRow}>
                    <div className={styles.itemLeft}>
                      <div className={styles.itemIconWrap} style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#d8b4fe' }}>
                        <Award size={18} />
                      </div>
                      <div>
                        <div className={styles.itemTitle}>{q.title} (Section: {m.title})</div>
                        <div className={styles.itemSubtext}>Time: {q.timeLimit} Mins • Passing: {q.passingScore}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: COMPETENCIES */}
      {activeTab === 'competencies' && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', padding: '1.75rem' }}>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.25rem', fontWeight: 700 }}>Course Competencies &amp; Industry Standards</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {[
              { skill: 'Computer Graphics & Pipeline', desc: 'Understanding rasterization, shaders, and geometry rendering pipelines.', mastery: '92%' },
              { skill: 'OpenGL & Shader Programming', desc: 'Writing GLSL vertex and fragment shaders for real-time graphics.', mastery: '88%' },
              { skill: '2D / 3D Transformations', desc: 'Matrix transformations, translation, rotation, and camera projections.', mastery: '85%' },
              { skill: 'System Architecture & Next.js 15', desc: 'Modular design, server components, and streaming hydration.', mastery: '94%' }
            ].map((comp, idx) => (
              <div key={idx} style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{comp.skill}</h4>
                  <span className="badge badge-green">{comp.mastery}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{comp.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: EDIT COURSE SETTINGS */}
      {showEditCourseModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowEditCourseModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit Course Settings</h3>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowEditCourseModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveCourseMeta} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Course Name</label>
                <input
                  type="text"
                  value={editCourseForm.title}
                  onChange={e => setEditCourseForm({ ...editCourseForm, title: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Academic Year</label>
                  <input
                    type="text"
                    value={editCourseForm.academicYear}
                    onChange={e => setEditCourseForm({ ...editCourseForm, academicYear: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Semester</label>
                  <input
                    type="text"
                    value={editCourseForm.semester}
                    onChange={e => setEditCourseForm({ ...editCourseForm, semester: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Department</label>
                <input
                  type="text"
                  value={editCourseForm.department}
                  onChange={e => setEditCourseForm({ ...editCourseForm, department: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Description</label>
                <textarea
                  rows={3}
                  value={editCourseForm.description}
                  onChange={e => setEditCourseForm({ ...editCourseForm, description: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowEditCourseModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT SECTION */}
      {showAddSectionModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowAddSectionModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{editingSectionId ? 'Edit Section' : 'Add New Section'}</h3>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowAddSectionModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveSection} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Section Name (e.g. Practical No. 1, Unit 1)</label>
                <input
                  type="text"
                  placeholder="e.g. Practical No. 1"
                  value={sectionTitleInput}
                  onChange={e => setSectionTitleInput(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Description / Overview (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Overview of this section's objectives..."
                  value={sectionDescInput}
                  onChange={e => setSectionDescInput(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddSectionModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">{editingSectionId ? 'Update Section' : 'Create Section'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD / EDIT RESOURCE */}
      {showAddResourceModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowAddResourceModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{editingResourceId ? 'Edit Resource' : 'Add Resource'}</h3>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowAddResourceModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveResource} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Target Section</label>
                <select
                  value={resourceForm.moduleId}
                  onChange={e => setResourceForm({ ...resourceForm, moduleId: parseInt(e.target.value, 10) })}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                >
                  {course.modules?.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Resource Title</label>
                <input
                  type="text"
                  placeholder="e.g. OpenGL Installation Manual"
                  value={resourceForm.title}
                  onChange={e => setResourceForm({ ...resourceForm, title: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Resource Type</label>
                  <select
                    value={resourceForm.type}
                    onChange={e => setResourceForm({ ...resourceForm, type: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                  >
                    <option value="PDF">PDF</option>
                    <option value="DOCUMENT">Document</option>
                    <option value="SPREADSHEET">Spreadsheet</option>
                    <option value="IMAGE">Image</option>
                    <option value="VIDEO">Video</option>
                    <option value="EXTERNAL">External Link</option>
                    <option value="TEXT">Text / Lesson</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>File URL / Link</label>
                  <input
                    type="text"
                    placeholder="https://... or /files/..."
                    value={resourceForm.url}
                    onChange={e => setResourceForm({ ...resourceForm, url: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddResourceModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Save Resource</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD ACTIVITY (Assignment, Quiz, AI Quiz, Discussion, Announcement, Attendance) */}
      {showActivityModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowActivityModal(false)}>
          <div className={styles.modalContent} style={{ maxWidth: '680px' }} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>+ Add Course Activity</h3>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowActivityModal(false)}>✕</button>
            </div>

            {/* Activity Type Choice Cards */}
            <div className={styles.activityChoiceGrid}>
              <div
                className={`${styles.activityChoiceCard} ${activityType === 'assignment' ? styles.activityChoiceCardActive : ''}`}
                onClick={() => setActivityType('assignment')}
              >
                <FileCheck size={20} color="#8b5cf6" />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Assignment</span>
              </div>

              <div
                className={`${styles.activityChoiceCard} ${activityType === 'quiz' ? styles.activityChoiceCardActive : ''}`}
                onClick={() => setActivityType('quiz')}
              >
                <Award size={20} color="#a855f7" />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Quiz Builder</span>
              </div>

              <div
                className={`${styles.activityChoiceCard} ${activityType === 'ai-quiz' ? styles.activityChoiceCardActive : ''}`}
                onClick={() => setActivityType('ai-quiz')}
              >
                <Sparkles size={20} color="#f59e0b" />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>AI Quiz Gen</span>
              </div>

              <div
                className={`${styles.activityChoiceCard} ${activityType === 'discussion' ? styles.activityChoiceCardActive : ''}`}
                onClick={() => setActivityType('discussion')}
              >
                <MessageSquare size={20} color="#3b82f6" />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Discussion</span>
              </div>

              <div
                className={`${styles.activityChoiceCard} ${activityType === 'announcement' ? styles.activityChoiceCardActive : ''}`}
                onClick={() => setActivityType('announcement')}
              >
                <Megaphone size={20} color="#ec4899" />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Notice</span>
              </div>
            </div>

            {/* Sub-form: Assignment */}
            {activityType === 'assignment' && (
              <form onSubmit={handleSaveActivity} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Section</label>
                  <select
                    value={activityAssignmentForm.moduleId}
                    onChange={e => setActivityAssignmentForm({ ...activityAssignmentForm, moduleId: parseInt(e.target.value, 10) })}
                    style={{ width: '100%', padding: '8px 12px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                  >
                    {course.modules?.map((m: any) => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Assignment Title (e.g. Practical No. 1)</label>
                  <input
                    type="text"
                    placeholder="e.g. Practical No. 1: Develop a program to draw a triangle using OpenGL"
                    value={activityAssignmentForm.title}
                    onChange={e => setActivityAssignmentForm({ ...activityAssignmentForm, title: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Instructions</label>
                  <textarea
                    rows={3}
                    value={activityAssignmentForm.description}
                    onChange={e => setActivityAssignmentForm({ ...activityAssignmentForm, description: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Maximum Marks</label>
                    <input
                      type="number"
                      value={activityAssignmentForm.maxMarks}
                      onChange={e => setActivityAssignmentForm({ ...activityAssignmentForm, maxMarks: parseInt(e.target.value, 10) || 10 })}
                      style={{ width: '100%', padding: '8px 12px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Due Date</label>
                    <input
                      type="datetime-local"
                      value={activityAssignmentForm.dueDate}
                      onChange={e => setActivityAssignmentForm({ ...activityAssignmentForm, dueDate: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowActivityModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm">Create Assignment</button>
                </div>
              </form>
            )}

            {/* Sub-form: AI Quiz Generator */}
            {activityType === 'ai-quiz' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-md)', color: '#fbbf24', fontSize: '0.85rem' }}>
                  <Sparkles size={16} style={{ display: 'inline', marginRight: '6px' }} />
                  AI will generate draft questions for your review. AI-generated assessments are saved in <strong>DRAFT</strong> and never auto-published.
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Topic / Concept</label>
                  <input
                    type="text"
                    value={aiQuizTopic}
                    onChange={e => setAiQuizTopic(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Difficulty</label>
                    <select
                      value={aiQuizDifficulty}
                      onChange={e => setAiQuizDifficulty(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Question Count</label>
                    <select
                      value={aiQuizCount}
                      onChange={e => setAiQuizCount(parseInt(e.target.value, 10))}
                      style={{ width: '100%', padding: '8px 12px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                    >
                      <option value={5}>5 Questions</option>
                      <option value={10}>10 Questions</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateAiQuiz}
                  disabled={generatingAiQuiz}
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
                >
                  <Sparkles size={14} />
                  <span>{generatingAiQuiz ? 'Generating AI Questions...' : 'Generate Draft Assessment with AI'}</span>
                </button>
              </div>
            )}

            {/* Sub-form: Quiz Builder */}
            {activityType === 'quiz' && (
              <form onSubmit={handleSaveActivity} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Quiz Title</label>
                  <input
                    type="text"
                    value={activityQuizForm.title}
                    onChange={e => setActivityQuizForm({ ...activityQuizForm, title: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Time Limit (Minutes)</label>
                    <input
                      type="number"
                      value={activityQuizForm.timeLimit}
                      onChange={e => setActivityQuizForm({ ...activityQuizForm, timeLimit: parseInt(e.target.value, 10) || 20 })}
                      style={{ width: '100%', padding: '8px 12px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Passing Requirement %</label>
                    <input
                      type="number"
                      value={activityQuizForm.passingScore}
                      onChange={e => setActivityQuizForm({ ...activityQuizForm, passingScore: parseInt(e.target.value, 10) || 60 })}
                      style={{ width: '100%', padding: '8px 12px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                    Questions ({activityQuizForm.questions.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                    {activityQuizForm.questions.map((q, qIdx) => (
                      <div key={qIdx} style={{ padding: '10px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          Q{qIdx + 1}: {q.question}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Type: {q.type} • {q.marks} Marks • {q.options.length} Options
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowActivityModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm">Save Quiz as Draft</button>
                </div>
              </form>
            )}

            {/* Sub-form: Discussion */}
            {activityType === 'discussion' && (
              <form onSubmit={handleSaveActivity} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Topic Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Clarification on OpenGL Triangle Shaders"
                    value={activityDiscussionForm.title}
                    onChange={e => setActivityDiscussionForm({ ...activityDiscussionForm, title: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Prompt / Instructions</label>
                  <textarea
                    rows={3}
                    value={activityDiscussionForm.content}
                    onChange={e => setActivityDiscussionForm({ ...activityDiscussionForm, content: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowActivityModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm">Create Discussion</button>
                </div>
              </form>
            )}

            {/* Sub-form: Announcement */}
            {activityType === 'announcement' && (
              <form onSubmit={handleSaveActivity} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Announcement Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Practical Lab timings updated"
                    value={activityAnnouncementForm.title}
                    onChange={e => setActivityAnnouncementForm({ ...activityAnnouncementForm, title: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Content Notice</label>
                  <textarea
                    rows={3}
                    value={activityAnnouncementForm.content}
                    onChange={e => setActivityAnnouncementForm({ ...activityAnnouncementForm, content: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowActivityModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm">Broadcast Notice</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 5: TEACHER GRADING SUBMISSION POPUP */}
      {selectedSubmissionToGrade && (
        <div className={styles.modalBackdrop} onClick={() => setSelectedSubmissionToGrade(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Grade Student Submission</h3>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setSelectedSubmissionToGrade(null)}>✕</button>
            </div>

            <div style={{ marginBottom: '1rem', padding: '12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                Student: {selectedSubmissionToGrade.studentName}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Assignment: {selectedSubmissionToGrade.assignmentTitle}
              </div>
              {selectedSubmissionToGrade.fileName && (
                <div style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                  <strong>Uploaded File:</strong> <span style={{ color: '#60a5fa' }}>{selectedSubmissionToGrade.fileName}</span>
                </div>
              )}
              {selectedSubmissionToGrade.textAnswer && (
                <div style={{ marginTop: '8px', fontSize: '0.85rem', background: 'var(--bg-secondary)', padding: '8px', borderRadius: '4px' }}>
                  <strong>Student Code / Write-up:</strong>
                  <pre style={{ margin: '4px 0 0', fontSize: '0.78rem', whiteSpace: 'pre-wrap' }}>{selectedSubmissionToGrade.textAnswer}</pre>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveGrade} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Awarded Marks (out of {selectedSubmissionToGrade.maxMarks} Pts)
                </label>
                <input
                  type="number"
                  step="0.5"
                  max={selectedSubmissionToGrade.maxMarks}
                  value={gradingMarksInput}
                  onChange={e => setGradingMarksInput(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Instructor Feedback</label>
                <textarea
                  rows={3}
                  placeholder="Provide constructive evaluation and comments..."
                  value={gradingFeedbackInput}
                  onChange={e => setGradingFeedbackInput(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedSubmissionToGrade(null)}>Cancel</button>
                <button type="submit" disabled={submittingGrade} className="btn btn-primary btn-sm">
                  {submittingGrade ? 'Submitting Grade...' : 'Confirm & Save Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: STUDENT ASSIGNMENT SUBMISSION */}
      {showSubmitModal && activeAssignmentForSubmit && (
        <div className={styles.modalBackdrop} onClick={() => setShowSubmitModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Submit Assignment</h3>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowSubmitModal(false)}>✕</button>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                {activeAssignmentForSubmit.title}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Due Date: {new Date(activeAssignmentForSubmit.dueDate).toLocaleString()} • Max Marks: {activeAssignmentForSubmit.maxMarks}
              </div>
            </div>

            {submitSuccess ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-lg)', color: '#34d399' }}>
                <CheckCircle2 size={36} style={{ margin: '0 auto 0.5rem' }} />
                <div style={{ fontWeight: 700 }}>{submitSuccess}</div>
              </div>
            ) : (
              <form onSubmit={handleSubmitAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {submitError && (
                  <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', color: '#f87171', fontSize: '0.85rem' }}>
                    {submitError}
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Upload Solution Artifact (PDF, ZIP, Images, CPP)</label>
                  <input
                    type="file"
                    onChange={e => setSubmissionFile(e.target.files?.[0] || null)}
                    style={{ width: '100%', padding: '8px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Program Code / Text Notes (Optional)</label>
                  <textarea
                    rows={4}
                    placeholder="Paste program code or write remarks..."
                    value={submissionText}
                    onChange={e => setSubmissionText(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowSubmitModal(false)}>Cancel</button>
                  <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
                    {submitting ? 'Uploading...' : 'Submit Practical'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
