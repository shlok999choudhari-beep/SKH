import { writeFile, readFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import {
  BUCKETS,
  uploadToSupabaseStorage,
  downloadFromSupabaseStorage,
  deleteFromSupabaseStorage,
  createSupabaseSignedUrl,
  getSupabaseAdmin,
} from './supabaseStorage'

const VAULT_DIR = join(process.cwd(), 'storage/vault')

async function ensureVaultDir() {
  if (!existsSync(VAULT_DIR)) {
    await mkdir(VAULT_DIR, { recursive: true })
  }
}

/**
 * Save file to Supabase Cloud Vault Storage (with local disk fallback)
 */
export async function saveToVault(
  studentId: number,
  fileName: string,
  buffer: Buffer,
  contentType: string = 'application/octet-stream'
): Promise<string> {
  const safeFileName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9_.-]/g, '_')}`
  const storagePath = `student_${studentId}/${safeFileName}`

  // 1. Attempt upload to Supabase Storage
  try {
    const supabase = getSupabaseAdmin()
    if (supabase) {
      const uploadResult = await uploadToSupabaseStorage(
        BUCKETS.DOCUMENTS,
        storagePath,
        buffer,
        contentType
      )
      if (uploadResult) {
        console.log(`[Supabase Storage] Saved document: ${BUCKETS.DOCUMENTS}/${storagePath}`)
        return `supabase:${BUCKETS.DOCUMENTS}/${storagePath}`
      }
    }
  } catch (supabaseError) {
    console.error('[Supabase Storage] Document upload fallback to local:', supabaseError)
  }

  // 2. Fallback to local storage if Supabase upload failed or not configured
  await ensureVaultDir()
  const studentDir = join(VAULT_DIR, `student_${studentId}`)
  if (!existsSync(studentDir)) {
    await mkdir(studentDir, { recursive: true })
  }

  const fullPath = join(studentDir, safeFileName)
  await writeFile(fullPath, buffer)
  console.log(`[Local Vault Storage] Saved document: ${fullPath}`)

  return `vault/student_${studentId}/${safeFileName}`
}

/**
 * Read file from Supabase Storage or local disk
 */
export async function readFromVault(filePath: string): Promise<Buffer> {
  // Check if path is prefixed with Supabase bucket identifier
  if (filePath.startsWith('supabase:')) {
    const withoutPrefix = filePath.replace(/^supabase:/, '')
    const slashIndex = withoutPrefix.indexOf('/')
    const bucket = withoutPrefix.slice(0, slashIndex)
    const storagePath = withoutPrefix.slice(slashIndex + 1)

    const cloudBuffer = await downloadFromSupabaseStorage(bucket, storagePath)
    if (cloudBuffer) {
      return cloudBuffer
    }
  }

  // If path is a standard vault/student_... relative path, check Supabase first
  if (filePath.startsWith('vault/')) {
    const relativeSubPath = filePath.replace(/^vault\//, '')
    const cloudBuffer = await downloadFromSupabaseStorage(BUCKETS.DOCUMENTS, relativeSubPath)
    if (cloudBuffer) {
      return cloudBuffer
    }

    // Check local disk
    const localFullPath = join(process.cwd(), 'storage', filePath)
    if (existsSync(localFullPath)) {
      return await readFile(localFullPath)
    }
  }

  // Direct local check as fallback
  const directLocalPath = join(process.cwd(), 'storage', filePath)
  if (existsSync(directLocalPath)) {
    return await readFile(directLocalPath)
  }

  throw new Error(`File not found in cloud or local storage: ${filePath}`)
}

/**
 * Generate a signed URL for a vault document (if stored in Supabase)
 */
export async function getVaultSignedUrl(
  filePath: string,
  expiresInSeconds: number = 3600
): Promise<string | null> {
  if (filePath.startsWith('supabase:')) {
    const withoutPrefix = filePath.replace(/^supabase:/, '')
    const slashIndex = withoutPrefix.indexOf('/')
    const bucket = withoutPrefix.slice(0, slashIndex)
    const storagePath = withoutPrefix.slice(slashIndex + 1)
    return await createSupabaseSignedUrl(bucket, storagePath, expiresInSeconds)
  }

  if (filePath.startsWith('vault/')) {
    const relativeSubPath = filePath.replace(/^vault\//, '')
    return await createSupabaseSignedUrl(BUCKETS.DOCUMENTS, relativeSubPath, expiresInSeconds)
  }

  return null
}

/**
 * Delete file from Supabase Storage and local disk
 */
export async function deleteFromVault(filePath: string): Promise<void> {
  if (filePath.startsWith('supabase:')) {
    const withoutPrefix = filePath.replace(/^supabase:/, '')
    const slashIndex = withoutPrefix.indexOf('/')
    const bucket = withoutPrefix.slice(0, slashIndex)
    const storagePath = withoutPrefix.slice(slashIndex + 1)
    await deleteFromSupabaseStorage(bucket, storagePath)
    return
  }

  if (filePath.startsWith('vault/')) {
    const relativeSubPath = filePath.replace(/^vault\//, '')
    await deleteFromSupabaseStorage(BUCKETS.DOCUMENTS, relativeSubPath)

    const localFullPath = join(process.cwd(), 'storage', filePath)
    if (existsSync(localFullPath)) {
      await unlink(localFullPath)
    }
    return
  }

  const directLocalPath = join(process.cwd(), 'storage', filePath)
  if (existsSync(directLocalPath)) {
    await unlink(directLocalPath)
  }
}
