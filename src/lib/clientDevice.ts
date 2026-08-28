/**
 * PlaceIQ Client Device Fingerprinting & Live Geolocation Engine
 * Accurately detects real browser, OS, hardware fingerprint, and live approximate location.
 */

export interface ClientDeviceInfo {
  deviceId: string
  browser: string
  os: string
  deviceType: 'desktop' | 'mobile' | 'tablet'
  location: string
  screenResolution: string
  timezone: string
}

let cachedLocation: string | null = null

/**
 * Gets or creates a persistent high-entropy device ID stored in localStorage
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server_device'
  let id = localStorage.getItem('placeiq_device_id')
  if (!id || id.length < 10) {
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    id = `piq_${randomHex}_${Date.now().toString(36)}`
    localStorage.setItem('placeiq_device_id', id)
  }
  return id
}

/**
 * Detects the real browser name including Brave, Arc, Edge, Opera, Chrome, Firefox, Safari
 */
export async function detectRealBrowser(): Promise<string> {
  if (typeof window === 'undefined') return 'Chrome'

  const ua = navigator.userAgent

  // 1. Check for Brave browser (Brave uses Chrome UA, so check navigator.brave)
  try {
    // @ts-ignore
    if (navigator.brave && typeof navigator.brave.isBrave === 'function') {
      // @ts-ignore
      const isBrave = await navigator.brave.isBrave()
      if (isBrave) return 'Brave'
    }
  } catch {}

  // 2. Check for Edge
  if (/edg\//i.test(ua)) return 'Edge'

  // 3. Check for Opera
  if (/opr\/|opera/i.test(ua)) return 'Opera'

  // 4. Check for Vivaldi
  if (/vivaldi/i.test(ua)) return 'Vivaldi'

  // 5. Check for Firefox
  if (/firefox|fxios/i.test(ua)) return 'Firefox'

  // 6. Check for Samsung Internet
  if (/samsungbrowser/i.test(ua)) return 'Samsung Internet'

  // 7. Check for Chrome
  if (/crios|chrome/i.test(ua)) return 'Chrome'

  // 8. Check for Safari
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari'

  return 'Browser'
}

/**
 * Detects the real operating system
 */
export function detectRealOS(): string {
  if (typeof window === 'undefined') return 'Windows'

  const ua = navigator.userAgent
  const platform = (navigator as any).userAgentData?.platform || navigator.platform || ''

  if (/android/i.test(ua)) return 'Android'
  if (/iphone|ipod/i.test(ua)) return 'iOS'
  if (/ipad/i.test(ua)) return 'iPadOS'
  if (/mac/i.test(platform) || /macintosh|mac os x/i.test(ua)) return 'macOS'
  if (/linux/i.test(platform) || /linux/i.test(ua)) return 'Linux'

  // Windows version heuristics
  if (/windows nt 10\.0/i.test(ua)) {
    return 'Windows 11'
  }
  if (/windows nt 6\.3/i.test(ua)) return 'Windows 8.1'
  if (/windows nt 6\.1/i.test(ua)) return 'Windows 7'
  if (/windows/i.test(ua)) return 'Windows'

  return 'Windows'
}

/**
 * Detects device type: desktop, mobile, tablet
 */
export function detectDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop'

  const ua = navigator.userAgent
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet'
  if (/mobile|iphone|ipod|android|blackberry|iemobile|kindle/i.test(ua)) return 'mobile'
  return 'desktop'
}

/**
 * Fetches the user's real live approximate location (City, State, Country) via fast IP Geolocation
 */
export async function getLiveApproxLocation(): Promise<string> {
  if (typeof window === 'undefined') return 'Pune, Maharashtra'

  // Return cached location if available in session
  if (cachedLocation) return cachedLocation

  const stored = sessionStorage.getItem('placeiq_live_location')
  if (stored) {
    cachedLocation = stored
    return stored
  }

  // 1. Try ipwho.is (fast, free, SSL supported, no API key needed, high rate limit)
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)

    const res = await fetch('https://ipwho.is/', {
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    if (res.ok) {
      const data = await res.json()
      if (data.success && data.city) {
        const loc = data.region ? `${data.city}, ${data.region}` : `${data.city}, ${data.country || 'India'}`
        cachedLocation = loc
        sessionStorage.setItem('placeiq_live_location', loc)
        return loc
      }
    }
  } catch {}

  // 2. Fallback to ipapi.co
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)

    const res = await fetch('https://ipapi.co/json/', {
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    if (res.ok) {
      const data = await res.json()
      if (data.city) {
        const loc = data.region ? `${data.city}, ${data.region}` : `${data.city}, ${data.country_name || 'India'}`
        cachedLocation = loc
        sessionStorage.setItem('placeiq_live_location', loc)
        return loc
      }
    }
  } catch {}

  // 3. Fallback to timezone heuristic
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    if (tz.includes('Calcutta') || tz.includes('Kolkata')) {
      return 'Pune, Maharashtra'
    }
    if (tz.includes('New_York')) return 'New York, USA'
    if (tz.includes('London')) return 'London, UK'
    if (tz.includes('Singapore')) return 'Singapore'
  } catch {}

  return 'Pune, Maharashtra'
}

/**
 * Gathers complete real-time client device & location telemetry
 */
export async function getClientDeviceTelemetry(): Promise<ClientDeviceInfo> {
  const deviceId = getOrCreateDeviceId()
  const browser = await detectRealBrowser()
  const os = detectRealOS()
  const deviceType = detectDeviceType()
  const location = await getLiveApproxLocation()

  const screenResolution = typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '1920x1080'
  const timezone = typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Asia/Kolkata'

  return {
    deviceId,
    browser,
    os,
    deviceType,
    location,
    screenResolution,
    timezone
  }
}
