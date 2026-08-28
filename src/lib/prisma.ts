import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: any }

const rawPrisma = globalForPrisma.prisma || new PrismaClient()

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
}


// Map custom relation names used in include/select
const RELATION_MAP: Record<string, string> = {
  internship_applications: 'internshipApps',
  internshipApplications: 'internshipApps',
  internship_apps: 'internshipApps',
  placement_applications: 'placementApps',
  placementApplications: 'placementApps',
  placement_apps: 'placementApps',
  resource_sharing_notifications: 'sharingNotifications',
  resourceSharingNotifications: 'sharingNotifications',
}

function toCamelCase(str: string): string {
  if (RELATION_MAP[str]) return RELATION_MAP[str]
  if (str.startsWith('$') || str.startsWith('_')) return str
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
    get(target, prop: string) {
      if (prop === '$transaction') {
        return async (arg: any, ...rest: any[]) => {
          if (typeof arg === 'function') {
            return target.$transaction((tx: any) => arg(createPrismaProxy(tx)), ...rest)
          }
          return target.$transaction(arg, ...rest)
        }
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


