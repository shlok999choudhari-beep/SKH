/**
 * PlaceIQ Adaptive Login Risk Engine
 * Intelligent multi-factor risk evaluator analyzing device trust, location anomalies,
 * impossible travel velocity, and brute-force patterns.
 */

import { prisma } from '@/lib/prisma'
import { parseUserAgent } from '@/lib/securityService'

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface RiskEvaluationResult {
  riskLevel: RiskLevel
  riskScore: number
  riskReasons: string[]
  isNewDevice: boolean
  isUnusualLocation: boolean
  isImpossibleTravel: boolean
  requiresChallenge: boolean
  isRestricted: boolean
  lockRemainingSeconds?: number
  deviceSummary: {
    browser: string
    os: string
    deviceType: string
    ip: string
    location: string
  }
}

// In-memory attack tracker for fast brute-force mitigations
interface FailedAttemptRecord {
  count: number
  firstAttemptAt: number
  lastAttemptAt: number
  lockedUntil?: number
}

const failedAttemptsByTarget = new Map<string, FailedAttemptRecord>()

// City distance coordinates lookup (in km) for Indian & global tech hubs
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  pune: { lat: 18.5204, lng: 73.8567 },
  mumbai: { lat: 19.0760, lng: 72.8777 },
  delhi: { lat: 28.7041, lng: 77.1025 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  hyderabad: { lat: 17.3850, lng: 78.4867 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  jaipur: { lat: 26.9124, lng: 75.7873 }
}

function calculateDistanceKm(city1: string, city2: string): number {
  const c1 = city1.toLowerCase().split(',')[0].trim()
  const c2 = city2.toLowerCase().split(',')[0].trim()

  if (c1 === c2) return 0

  const coord1 = CITY_COORDINATES[c1]
  const coord2 = CITY_COORDINATES[c2]

  if (!coord1 || !coord2) {
    // Default fallback distance if cities are different
    return 600
  }

  const R = 6371 // Earth radius in km
  const dLat = (coord2.lat - coord1.lat) * (Math.PI / 180)
  const dLng = (coord2.lng - coord1.lng) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * (Math.PI / 180)) *
      Math.cos(coord2.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Derives approximate location from IP or headers
 */
export function resolveLocationFromIp(ip: string, headerLocation?: string | null): string {
  if (headerLocation && headerLocation.trim().length > 0) {
    return headerLocation
  }

  // IP Geolocation heuristics for development and production telemetry
  if (ip.startsWith('185.') || ip.startsWith('194.') || ip.startsWith('45.')) {
    return 'Delhi, India'
  }
  if (ip.startsWith('49.36.') || ip.startsWith('49.37.')) {
    return 'Mumbai, Maharashtra'
  }
  if (ip.startsWith('157.48.') || ip.startsWith('106.51.')) {
    return 'Bangalore, Karnataka'
  }
  if (ip.startsWith('182.73.')) {
    return 'Hyderabad, Telangana'
  }

  return 'Pune, Maharashtra'
}

/**
 * Evaluates login security risk for an incoming authentication request
 */
export async function evaluateLoginRisk({
  userId,
  userRole,
  email,
  userAgent,
  ip,
  clientDeviceId,
  clientLocation
}: {
  userId: number
  userRole: string
  email: string
  userAgent: string
  ip: string
  clientDeviceId?: string
  clientLocation?: string
}): Promise<RiskEvaluationResult> {
  const { browser, os, deviceType } = parseUserAgent(userAgent)
  const location = resolveLocationFromIp(ip, clientLocation)
  const now = Date.now()

  const riskReasons: string[] = []
  let riskScore = 0

  // 1. Check Brute-Force Rate Limiting Lock
  const targetKey = `${email.toLowerCase()}_${ip}`
  const attemptRecord = failedAttemptsByTarget.get(targetKey)

  if (attemptRecord && attemptRecord.lockedUntil && attemptRecord.lockedUntil > now) {
    const lockRemainingSeconds = Math.ceil((attemptRecord.lockedUntil - now) / 1000)
    return {
      riskLevel: 'CRITICAL',
      riskScore: 95,
      riskReasons: ['BRUTE_FORCE_LOCK_ACTIVE', 'TOO_MANY_FAILED_ATTEMPTS'],
      isNewDevice: true,
      isUnusualLocation: false,
      isImpossibleTravel: false,
      requiresChallenge: false,
      isRestricted: true,
      lockRemainingSeconds,
      deviceSummary: { browser, os, deviceType, ip, location }
    }
  }

  // 2. Device Recognition & Server-Side Trust Check
  let isNewDevice = true
  try {
    const orConditions: any[] = [{ browser, os }]
    if (clientDeviceId) {
      orConditions.push({ deviceId: clientDeviceId })
    }

    const trustedDevice = await (prisma as any).trustedDevice.findFirst({
      where: {
        userId,
        userRole,
        isTrusted: true,
        OR: orConditions
      }
    })

    if (trustedDevice) {
      isNewDevice = false
      // Update lastUsedAt timestamp
      await (prisma as any).trustedDevice.update({
        where: { id: trustedDevice.id },
        data: { lastUsedAt: new Date() }
      }).catch(() => {})
    }
  } catch (err) {
    console.warn('[RiskEngine] TrustedDevice lookup warning:', err)
  }

  if (isNewDevice) {
    riskScore += 35
    riskReasons.push('NEW_DEVICE_DETECTED')
  }

  // 3. Location Anomaly Check
  let isUnusualLocation = false
  try {
    const historicalLocations = await (prisma as any).loginAudit.findMany({
      where: { userId, userRole, status: 'SUCCESS' },
      select: { location: true, timestamp: true },
      orderBy: { timestamp: 'desc' },
      take: 10
    })

    if (historicalLocations.length > 0) {
      const knownCities = historicalLocations
        .map((h: any) => h.location?.split(',')[0].trim().toLowerCase())
        .filter(Boolean)
      const currentCity = location.split(',')[0].trim().toLowerCase()

      if (knownCities.length > 0 && !knownCities.includes(currentCity)) {
        isUnusualLocation = true
        riskScore += 25
        riskReasons.push('UNUSUAL_LOGIN_LOCATION')
      }
    }
  } catch (err) {
    console.warn('[RiskEngine] Location history lookup warning:', err)
  }

  // 4. Impossible Travel Velocity Check
  let isImpossibleTravel = false
  try {
    const lastLogin = await (prisma as any).loginAudit.findFirst({
      where: { userId, userRole, status: 'SUCCESS' },
      orderBy: { timestamp: 'desc' },
      select: { location: true, timestamp: true }
    })

    if (lastLogin && lastLogin.location) {
      const lastLoginTime = new Date(lastLogin.timestamp).getTime()
      const timeDiffHours = (now - lastLoginTime) / (1000 * 60 * 60)

      if (timeDiffHours < 2.0) {
        // Logged in recently: check distance
        const distanceKm = calculateDistanceKm(lastLogin.location, location)
        // If speed required > 600 km/h
        if (distanceKm > 300 && (distanceKm / Math.max(0.1, timeDiffHours)) > 500) {
          isImpossibleTravel = true
          riskScore += 35
          riskReasons.push('IMPOSSIBLE_TRAVEL_VELOCITY')
        }
      }
    }
  } catch (err) {
    console.warn('[RiskEngine] Impossible travel lookup warning:', err)
  }

  // 5. Check Recent Failed Attempts Penalty
  if (attemptRecord && attemptRecord.count >= 3) {
    riskScore += 20
    riskReasons.push('RECENT_FAILED_LOGIN_ATTEMPTS')
  }

  // Determine Final Risk Level
  let riskLevel: RiskLevel = 'LOW'
  let requiresChallenge = false
  let isRestricted = false

  if (riskScore >= 75 || isImpossibleTravel) {
    riskLevel = 'HIGH'
    requiresChallenge = true
  } else if (riskScore >= 30 || isNewDevice || isUnusualLocation) {
    riskLevel = 'MEDIUM'
    requiresChallenge = true
  } else {
    riskLevel = 'LOW'
    requiresChallenge = false
  }

  return {
    riskLevel,
    riskScore,
    riskReasons,
    isNewDevice,
    isUnusualLocation,
    isImpossibleTravel,
    requiresChallenge,
    isRestricted,
    deviceSummary: {
      browser,
      os,
      deviceType,
      ip,
      location
    }
  }
}

/**
 * Records a failed password attempt and enforces adaptive rate-limiting
 */
export function recordFailedLoginAttempt(email: string, ip: string): {
  count: number
  isLocked: boolean
  lockRemainingSeconds?: number
} {
  const now = Date.now()
  const key = `${email.toLowerCase()}_${ip}`
  const existing = failedAttemptsByTarget.get(key) || {
    count: 0,
    firstAttemptAt: now,
    lastAttemptAt: now
  }

  existing.count += 1
  existing.lastAttemptAt = now

  // If 7 or more consecutive failures: 15-minute attack lock
  if (existing.count >= 7) {
    existing.lockedUntil = now + 15 * 60 * 1000
    failedAttemptsByTarget.set(key, existing)
    return { count: existing.count, isLocked: true, lockRemainingSeconds: 15 * 60 }
  }

  failedAttemptsByTarget.set(key, existing)
  return { count: existing.count, isLocked: false }
}

/**
 * Resets failed attempt counter upon successful authentication
 */
export function resetFailedLoginAttempts(email: string, ip: string) {
  const key = `${email.toLowerCase()}_${ip}`
  failedAttemptsByTarget.delete(key)
}
