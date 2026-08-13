import { writeFile, readFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Private directory outside public folder to ensure files are never publicly accessible
const VAULT_DIR = join(process.cwd(), 'storage/vault')

async function ensureVaultDir() {
  if (!existsSync(VAULT_DIR)) {
    await mkdir(VAULT_DIR, { recursive: true })
  }
}

/**
 * Save file to private vault storage
 */
export async function saveToVault(studentId: number, fileName: string, buffer: Buffer): Promise<string> {
  await ensureVaultDir()
  const studentDir = join(VAULT_DIR, `student_${studentId}`)
  if (!existsSync(studentDir)) {
    await mkdir(studentDir, { recursive: true })
  }

  const safeFileName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9_.-]/g, '_')}`
  const fullPath = join(studentDir, safeFileName)
  await writeFile(fullPath, buffer)

  // Store relative vault path in database
  return `vault/student_${studentId}/${safeFileName}`
}

/**
 * Read file from private vault storage
 */
export async function readFromVault(relativePath: string): Promise<Buffer> {
  const fullPath = join(process.cwd(), 'storage', relativePath)
  if (!existsSync(fullPath)) {
    throw new Error('File not found in storage')
  }
  return await readFile(fullPath)
}

/**
 * Delete file from private vault storage
 */
export async function deleteFromVault(relativePath: string): Promise<void> {
  const fullPath = join(process.cwd(), 'storage', relativePath)
  if (existsSync(fullPath)) {
    await unlink(fullPath)
  }
}
