import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: any }

const rawPrisma = globalForPrisma.prisma || new PrismaClient()

// Common relation and model mapping
const MODEL_MAPPING: Record<string, string> = {
  student: 'students',
  institution: 'institutions',
  company: 'companies',
  trainer: 'trainers',
  user: 'users',
  resume: 'resumes',
  application: 'applications',
  certification: 'certifications',
  codingSession: 'coding_sessions',
  cohort: 'cohorts',
  dreamCompany: 'dream_companies',
  interview: 'interviews',
  jobPosting: 'job_postings',
  learningPath: 'learning_paths',
  message: 'messages',
  mockInterview: 'mock_interviews',
  placementDrive: 'placement_drives',
  placementRound: 'placement_rounds',
  resource: 'resources',
  resourceBooking: 'resource_bookings',
  resourceRequest: 'resource_requests',
  resourceSharingNotification: 'resource_sharing_notifications',
  sharingAgreement: 'sharing_agreements',
  skillAssessment: 'skill_assessments',
  skillGapAnalysis: 'skill_gap_analyses',
  trainerSession: 'trainer_sessions',
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
    if (key.startsWith('$')) {
      newObj[key] = transformKeys(value)
      continue
    }
    const mapped = MODEL_MAPPING[key] || toSnakeCase(key)
    newObj[mapped] = transformKeys(value)
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
      const snakeKey = toSnakeCase(prop)
      if (snakeKey in target) return wrapResultWithCamelGetters(target[snakeKey])
      const mapped = MODEL_MAPPING[prop]
      if (mapped && mapped in target) return wrapResultWithCamelGetters(target[mapped])
      return (target as any)[prop]
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
            if (k === 'where' || k === 'data' || k === 'orderBy' || k === 'select' || k === 'include') {
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

