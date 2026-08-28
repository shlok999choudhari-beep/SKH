import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jfkfvpnsddcbyxvpbywn.supabase.co'
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''

export const BUCKETS = {
  DOCUMENTS: 'placeiq-documents',
  RESUMES: 'placeiq-resumes',
  ASSIGNMENTS: 'placeiq-assignments',
} as const

let supabaseAdmin: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!SUPABASE_KEY) {
    console.warn('Supabase key (SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY) is not configured in .env')
    return null
  }
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }
  return supabaseAdmin
}

const provisionedBuckets = new Set<string>()

/**
 * Ensure bucket exists in Supabase Storage. Creates it if missing.
 */
export async function ensureBucketExists(
  bucketName: string,
  isPublic: boolean = false
): Promise<boolean> {
  if (provisionedBuckets.has(bucketName)) return true

  const supabase = getSupabaseAdmin()
  if (!supabase) return false

  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    if (!listError && buckets) {
      const exists = buckets.some((b: any) => b.name === bucketName)
      if (exists) {
        provisionedBuckets.add(bucketName)
        return true
      }
    }

    // Try creating the bucket
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: isPublic,
      fileSizeLimit: 52428800, // 50MB
    })

    if (!createError || createError.message?.includes('already exists')) {
      provisionedBuckets.add(bucketName)
      return true
    } else {
      console.warn(`Could not create bucket '${bucketName}':`, createError.message)
      return false
    }
  } catch (err) {
    console.error(`Bucket check exception for '${bucketName}':`, err)
    return false
  }
}

/**
 * Upload a file buffer to Supabase Storage
 */
export async function uploadToSupabaseStorage(
  bucketName: string,
  storagePath: string,
  buffer: Buffer,
  contentType: string = 'application/octet-stream'
): Promise<{ path: string; fullPath: string } | null> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return null

  await ensureBucketExists(bucketName, false)

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, buffer, {
      contentType,
      upsert: true,
    })

  if (error) {
    console.error(`Supabase upload error to '${bucketName}/${storagePath}':`, error)
    throw new Error(`Supabase upload failed: ${error.message}`)
  }

  return {
    path: storagePath,
    fullPath: data.fullPath,
  }
}

/**
 * Download a file buffer from Supabase Storage
 */
export async function downloadFromSupabaseStorage(
  bucketName: string,
  storagePath: string
): Promise<Buffer | null> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return null

  const { data, error } = await supabase.storage
    .from(bucketName)
    .download(storagePath)

  if (error || !data) {
    console.error(`Supabase download error from '${bucketName}/${storagePath}':`, error)
    return null
  }

  const arrayBuffer = await data.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Generate a signed URL for secure, temporary browser access
 */
export async function createSupabaseSignedUrl(
  bucketName: string,
  storagePath: string,
  expiresInSeconds: number = 3600
): Promise<string | null> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return null

  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(storagePath, expiresInSeconds)

  if (error || !data?.signedUrl) {
    console.error(`Supabase signed URL error for '${bucketName}/${storagePath}':`, error)
    return null
  }

  return data.signedUrl
}

/**
 * Get public URL (if bucket is public)
 */
export function getSupabasePublicUrl(bucketName: string, storagePath: string): string | null {
  const supabase = getSupabaseAdmin()
  if (!supabase) return null

  const { data } = supabase.storage.from(bucketName).getPublicUrl(storagePath)
  return data.publicUrl || null
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFromSupabaseStorage(
  bucketName: string,
  storagePath: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return false

  const { error } = await supabase.storage.from(bucketName).remove([storagePath])
  if (error) {
    console.error(`Supabase delete error for '${bucketName}/${storagePath}':`, error)
    return false
  }

  return true
}
