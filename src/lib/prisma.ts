import { PrismaClient } from '@/generated/prisma-client-v5'

const globalForPrisma = globalThis as unknown as { prisma: any }

function getRawPrisma() {
  if (
    !globalForPrisma.prisma ||
    typeof globalForPrisma.prisma.courseAnnouncement === 'undefined' ||
    typeof globalForPrisma.prisma.certificate === 'undefined' ||
    typeof globalForPrisma.prisma.courseKnowledgeChunk === 'undefined' ||
    typeof globalForPrisma.prisma.aIConversation === 'undefined' ||
    typeof globalForPrisma.prisma.studyPlan === 'undefined' ||
    typeof globalForPrisma.prisma.learningInsight === 'undefined' ||
    typeof globalForPrisma.prisma.skillProfile === 'undefined' ||
    typeof globalForPrisma.prisma.skillEvidence === 'undefined' ||
    typeof globalForPrisma.prisma.placementReadiness === 'undefined' ||
    typeof globalForPrisma.prisma.studentRiskAssessment === 'undefined'
  ) {
    globalForPrisma.prisma = new PrismaClient()
  }
  return globalForPrisma.prisma
}

const rawPrisma = getRawPrisma()

// Map all potential model names/aliases (snake_case, plural, camelCase) to the raw Prisma delegate name
const MODEL_MAPPING: Record<string, string> = {
  student: 'student',
  students: 'student',
  institution: 'institution',
  institutions: 'institution',
  company: 'company',
  companies: 'company',
  trainer: 'trainer',
  trainers: 'trainer',
  user: 'user',
  users: 'user',
  resume: 'resume',
  resumes: 'resume',
  application: 'application',
  applications: 'application',
  certification: 'certification',
  certifications: 'certification',
  codingSession: 'codingSession',
  codingSessions: 'codingSession',
  coding_session: 'codingSession',
  coding_sessions: 'codingSession',
  cohort: 'cohort',
  cohorts: 'cohort',
  dreamCompany: 'dreamCompany',
  dreamCompanies: 'dreamCompany',
  dream_company: 'dreamCompany',
  dream_companies: 'dreamCompany',
  interview: 'interview',
  interviews: 'interview',
  jobPosting: 'jobPosting',
  jobPostings: 'jobPosting',
  job_posting: 'jobPosting',
  job_postings: 'jobPosting',
  learningPath: 'learningPath',
  learningPaths: 'learningPath',
  learning_path: 'learningPath',
  learning_paths: 'learningPath',
  message: 'message',
  messages: 'message',
  mockInterview: 'mockInterview',
  mockInterviews: 'mockInterview',
  mock_interview: 'mock_interviews',
  placementDrive: 'placementDrive',
  placementDrives: 'placementDrive',
  placement_drive: 'placementDrive',
  placement_drives: 'placementDrive',
  placementRound: 'placementRound',
  placementRounds: 'placementRound',
  placement_round: 'placementRound',
  placement_rounds: 'placementRound',
  placementApplication: 'placementApplication',
  placementApplications: 'placementApplication',
  placementApps: 'placementApplication',
  placement_application: 'placementApplication',
  placement_applications: 'placementApplication',
  placement_apps: 'placementApplication',
  resource: 'resource',
  resources: 'resource',
  resourceBooking: 'resourceBooking',
  resourceBookings: 'resourceBooking',
  resource_booking: 'resourceBooking',
  resource_bookings: 'resourceBooking',
  resourceRequest: 'resourceRequest',
  resourceRequests: 'resourceRequest',
  resource_request: 'resourceRequest',
  resource_requests: 'resourceRequest',
  resourceSharingNotification: 'resourceSharingNotification',
  resourceSharingNotifications: 'resourceSharingNotification',
  resource_sharing_notification: 'resourceSharingNotification',
  resource_sharing_notifications: 'resourceSharingNotification',
  sharingAgreement: 'sharingAgreement',
  sharingAgreements: 'sharingAgreement',
  sharing_agreement: 'sharingAgreement',
  sharing_agreements: 'sharingAgreement',
  skillAssessment: 'skillAssessment',
  skillAssessments: 'skillAssessment',
  skill_assessment: 'skillAssessment',
  skill_assessments: 'skillAssessment',
  skillGapAnalysis: 'skillGapAnalysis',
  skillGapAnalyses: 'skillGapAnalysis',
  skill_gap_analysis: 'skillGapAnalysis',
  skill_gap_analyses: 'skillGapAnalysis',
  trainerSession: 'trainerSession',
  trainerSessions: 'trainerSession',
  trainer_session: 'trainerSession',
  trainer_sessions: 'trainerSession',
  internship: 'internship',
  internships: 'internship',
  internshipApplication: 'internshipApplication',
  internshipApplications: 'internshipApplication',
  internshipApps: 'internshipApplication',
  internship_application: 'internshipApplication',
  internship_applications: 'internshipApplication',
  internship_apps: 'internshipApplication',
  document: 'document',
  documents: 'document',
  documentRequest: 'documentRequest',
  documentRequests: 'documentRequest',
  document_request: 'documentRequest',
  document_requests: 'documentRequest',
  documentActivity: 'documentActivity',
  documentActivities: 'documentActivity',
  document_activity: 'documentActivity',
  document_activities: 'documentActivity',
  documentShare: 'documentShare',
  documentShares: 'documentShare',
  document_share: 'documentShare',
  document_shares: 'documentShare',
  auditLog: 'auditLog',
  auditLogs: 'auditLog',
  audit_log: 'auditLog',
  audit_logs: 'auditLog',
  trustedDevice: 'trustedDevice',
  trustedDevices: 'trustedDevice',
  trusted_device: 'trustedDevice',
  trusted_devices: 'trustedDevice',
  loginOtp: 'loginOtp',
  loginOtps: 'loginOtp',
  login_otp: 'loginOtp',
  login_otps: 'loginOtp',
  loginAudit: 'loginAudit',
  loginAudits: 'loginAudit',
  login_audit: 'loginAudit',
  login_audits: 'loginAudit',
  course: 'course',
  courses: 'course',
  courseCategory: 'courseCategory',
  courseCategories: 'courseCategory',
  course_category: 'courseCategory',
  course_categories: 'courseCategory',
  courseModule: 'courseModule',
  courseModules: 'courseModule',
  course_module: 'courseModule',
  course_modules: 'courseModule',
  courseLesson: 'courseLesson',
  courseLessons: 'courseLesson',
  course_lesson: 'courseLesson',
  course_lessons: 'courseLesson',
  courseResource: 'courseResource',
  courseResources: 'courseResource',
  course_resource: 'courseResource',
  course_resources: 'courseResource',
  courseEnrollment: 'courseEnrollment',
  courseEnrollments: 'courseEnrollment',
  course_enrollment: 'courseEnrollment',
  course_enrollments: 'courseEnrollment',
  learningProgress: 'learningProgress',
  learning_progress: 'learningProgress',
  assignment: 'assignment',
  assignments: 'assignment',
  assignmentSubmission: 'assignmentSubmission',
  assignmentSubmissions: 'assignmentSubmission',
  assignment_submission: 'assignmentSubmission',
  assignment_submissions: 'assignmentSubmission',
  assignmentGrade: 'assignmentGrade',
  assignmentGrades: 'assignmentGrade',
  assignment_grade: 'assignmentGrade',
  assignment_grades: 'assignmentGrade',
  quiz: 'quiz',
  quizzes: 'quiz',
  quizQuestion: 'quizQuestion',
  quizQuestions: 'quizQuestion',
  quiz_question: 'quizQuestion',
  quiz_questions: 'quizQuestion',
  quizOption: 'quizOption',
  quizOptions: 'quizOption',
  quiz_option: 'quizOption',
  quiz_options: 'quizOption',
  quizAttempt: 'quizAttempt',
  quizAttempts: 'quizAttempt',
  quiz_attempt: 'quizAttempt',
  quiz_attempts: 'quizAttempt',
  quizAnswer: 'quizAnswer',
  quizAnswers: 'quizAnswer',
  quiz_answer: 'quizAnswer',
  quiz_answers: 'quizAnswer',
  courseAnnouncement: 'courseAnnouncement',
  courseAnnouncements: 'courseAnnouncement',
  course_announcement: 'courseAnnouncement',
  course_announcements: 'courseAnnouncement',
  announcement: 'courseAnnouncement',
  announcements: 'courseAnnouncement',
  courseDiscussion: 'courseDiscussion',
  courseDiscussions: 'courseDiscussion',
  course_discussion: 'courseDiscussion',
  course_discussions: 'courseDiscussion',
  discussion: 'courseDiscussion',
  discussions: 'courseDiscussion',
  discussionReply: 'discussionReply',
  discussionReplies: 'discussionReply',
  discussion_reply: 'discussionReply',
  discussion_replies: 'discussionReply',
  courseCompletion: 'courseCompletion',
  courseCompletions: 'courseCompletion',
  course_completion: 'courseCompletion',
  course_completions: 'courseCompletion',
  completion: 'courseCompletion',
  completions: 'courseCompletion',
  certificate: 'certificate',
  certificates: 'certificate',
  courseKnowledgeChunk: 'courseKnowledgeChunk',
  courseKnowledgeChunks: 'courseKnowledgeChunk',
  course_knowledge_chunk: 'courseKnowledgeChunk',
  course_knowledge_chunks: 'courseKnowledgeChunk',
  knowledgeChunk: 'courseKnowledgeChunk',
  knowledgeChunks: 'courseKnowledgeChunk',
  aiConversation: 'aIConversation',
  aiConversations: 'aIConversation',
  aIConversation: 'aIConversation',
  aIConversations: 'aIConversation',
  ai_conversation: 'aIConversation',
  ai_conversations: 'aIConversation',
  aiMessage: 'aIMessage',
  aiMessages: 'aIMessage',
  aIMessage: 'aIMessage',
  aIMessages: 'aIMessage',
  ai_message: 'aIMessage',
  ai_messages: 'aIMessage',
  studyPlan: 'studyPlan',
  studyPlans: 'studyPlan',
  study_plan: 'studyPlan',
  study_plans: 'studyPlan',
  learningInsight: 'learningInsight',
  learningInsights: 'learningInsight',
  learning_insight: 'learningInsight',
  learning_insights: 'learningInsight',
  aiUsage: 'aIUsage',
  aiUsages: 'aIUsage',
  aIUsage: 'aIUsage',
  aIUsages: 'aIUsage',
  ai_usage: 'aIUsage',
  ai_usages: 'aIUsage',
  skillProfile: 'skillProfile',
  skillProfiles: 'skillProfile',
  skill_profile: 'skillProfile',
  skill_profiles: 'skillProfile',
  skillEvidence: 'skillEvidence',
  skillEvidences: 'skillEvidence',
  skill_evidence: 'skillEvidence',
  skill_evidences: 'skillEvidence',
  placementReadiness: 'placementReadiness',
  placement_readiness: 'placementReadiness',
  studentRiskAssessment: 'studentRiskAssessment',
  studentRiskAssessments: 'studentRiskAssessment',
  student_risk_assessment: 'studentRiskAssessment',
  student_risk_assessments: 'studentRiskAssessment',
  riskAssessment: 'studentRiskAssessment',
  riskAssessments: 'studentRiskAssessment',
  risk_assessment: 'studentRiskAssessment',
  risk_assessments: 'studentRiskAssessment',
}


// Map custom relation names used in include/select
const RELATION_MAP: Record<string, string> = {
  internship_applications: 'internshipApps',
  internshipApplications: 'internshipApps',
  internship_apps: 'internshipApps',
  placement_applications: 'placementApps',
  placementApplications: 'placementApps',
  placement_apps: 'placementApps',
  course_modules: 'modules',
  courseModules: 'modules',
  course_lessons: 'lessons',
  courseLessons: 'lessons',
  course_resources: 'resources',
  courseResources: 'resources',
  quiz_questions: 'questions',
  quizQuestions: 'questions',
  quiz_options: 'options',
  quizOptions: 'options',
  quiz_answers: 'answers',
  quizAnswers: 'answers',
  course_announcements: 'announcements',
  courseAnnouncements: 'announcements',
  course_discussions: 'discussions',
  courseDiscussions: 'discussions',
  discussion_replies: 'replies',
  discussionReplies: 'replies',
  resource_sharing_notifications: 'sharingNotifications',
  resourceSharingNotifications: 'sharingNotifications',
  course_knowledge_chunks: 'knowledgeChunks',
  knowledge_chunks: 'knowledgeChunks',
  knowledgeChunks: 'knowledgeChunks',
  ai_conversations: 'aiConversations',
  aiConversations: 'aiConversations',
  ai_messages: 'messages',
  aiMessages: 'messages',
  messages: 'messages',
  study_plans: 'studyPlans',
  studyPlans: 'studyPlans',
  learning_insights: 'learningInsights',
  learningInsights: 'learningInsights',
  ai_usages: 'aiUsages',
  aiUsages: 'aiUsages',
  skill_profiles: 'skillProfiles',
  skillProfiles: 'skillProfiles',
  skill_evidences: 'skillEvidences',
  skillEvidences: 'skillEvidences',
  placement_readiness: 'placementReadiness',
  placementReadiness: 'placementReadiness',
  student_risk_assessment: 'riskAssessment',
  studentRiskAssessment: 'riskAssessment',
  risk_assessment: 'riskAssessment',
  riskAssessment: 'riskAssessment',
}

function toCamelCase(str: string): string {
  if (RELATION_MAP[str]) return RELATION_MAP[str]
  if (str.startsWith('$') || str.startsWith('_')) return str
  // Preserve compound unique keys like courseId_studentId
  if (str.includes('_') && /[A-Z]/.test(str)) return str
  return str.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase())
}

function toSnakeCase(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase()
}

function transformKeys(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj
  if (obj instanceof Date || obj instanceof Uint8Array) return obj
  if (Array.isArray(obj)) {
    return obj.map(transformKeys)
  }
  const newObj: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$') || key.startsWith('_')) {
      newObj[key] = transformKeys(value)
      continue
    }
    const camelKey = toCamelCase(key)
    newObj[camelKey] = transformKeys(value)
  }
  return newObj
}

function wrapResultWithCamelGetters(result: any): any {
  if (!result || typeof result !== 'object') return result
  if (result instanceof Date || result instanceof Uint8Array) return result
  if (Array.isArray(result)) {
    return result.map(wrapResultWithCamelGetters)
  }
  return new Proxy(result, {
    get(target, prop: string | symbol) {
      if (typeof prop === 'symbol') return target[prop]
      if (prop in target) return wrapResultWithCamelGetters(target[prop])

      const camelKey = toCamelCase(prop)
      if (camelKey in target) return wrapResultWithCamelGetters(target[camelKey])

      const snakeKey = toSnakeCase(prop)
      if (snakeKey in target) return wrapResultWithCamelGetters(target[snakeKey])

      if (prop === 'internship_applications' || prop === 'internshipApplications') {
        if ('internshipApps' in target) return wrapResultWithCamelGetters(target['internshipApps'])
      }
      if (prop === 'placement_applications' || prop === 'placementApplications') {
        if ('placementApps' in target) return wrapResultWithCamelGetters(target['placementApps'])
      }
      if (prop === 'resource_sharing_notifications' || prop === 'resourceSharingNotifications') {
        if ('sharingNotifications' in target) return wrapResultWithCamelGetters(target['sharingNotifications'])
      }

      return (target as any)[prop]
    },
    has(target, prop: string | symbol) {
      if (typeof prop === 'symbol') return prop in target
      if (prop in target) return true
      const camelKey = toCamelCase(prop)
      if (camelKey in target) return true
      const snakeKey = toSnakeCase(prop)
      if (snakeKey in target) return true
      return false
    }
  })
}

function wrapModelDelegate(delegate: any) {
  return new Proxy(delegate, {
    get(target, method: string) {
      const originalMethod = target[method]
      if (typeof originalMethod !== 'function') {
        return originalMethod
      }
      return async (...args: any[]) => {
        const transformedArgs = args.map((arg) => {
          if (!arg || typeof arg !== 'object' || Array.isArray(arg) || arg instanceof Date) {
            return arg
          }
          const newArg: Record<string, any> = {}
          for (const [k, v] of Object.entries(arg)) {
            if (k === 'where' || k === 'data' || k === 'orderBy' || k === 'select' || k === 'include' || k === 'create' || k === 'update' || k === 'set') {
              newArg[k] = transformKeys(v)
            } else {
              newArg[k] = v
            }
          }
          return newArg
        })
        const result = await originalMethod.apply(target, transformedArgs)
        return wrapResultWithCamelGetters(result)
      }
    }
  })
}

function createPrismaProxy(client: any): any {
  return new Proxy(client, {
    get(target, prop: string | symbol) {
      if (typeof prop === 'symbol') {
        return target[prop]
      }
      if (typeof prop === 'string' && (prop.startsWith('$') || prop.startsWith('_'))) {
        if (prop === '$transaction') {
          return async (arg: any, ...rest: any[]) => {
            if (typeof arg === 'function') {
              return target.$transaction((tx: any) => arg(createPrismaProxy(tx)), ...rest)
            }
            return target.$transaction(arg, ...rest)
          }
        }
        return target[prop]
      }
      let delegate = undefined
      if (prop in target) {
        delegate = target[prop]
      } else {
        const mapped = MODEL_MAPPING[prop]
        if (mapped && mapped in target) {
          delegate = target[mapped]
        }
      }
      if (delegate && typeof delegate === 'object' && !Array.isArray(delegate) && !(delegate instanceof Date)) {
        return wrapModelDelegate(delegate)
      }
      return delegate || target[prop]
    }
  })
}

export const prisma = createPrismaProxy(rawPrisma) as PrismaClient & Record<string, any>

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = rawPrisma


