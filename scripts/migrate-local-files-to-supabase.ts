import { prisma } from '../src/lib/prisma'
import {
  BUCKETS,
  uploadToSupabaseStorage,
  ensureBucketExists,
} from '../src/lib/supabaseStorage'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

async function migrateFiles() {
  console.log('🚀 Starting migration of local files to Supabase Storage...')

  await ensureBucketExists(BUCKETS.DOCUMENTS, false)
  await ensureBucketExists(BUCKETS.RESUMES, false)

  // 1. Migrate Documents
  const documents = await prisma.document.findMany()
  console.log(`Found ${documents.length} document records in DB.`)

  let docsMigrated = 0
  for (const doc of documents) {
    if (!doc.filePath.startsWith('supabase:')) {
      const localPath = join(process.cwd(), 'storage', doc.filePath)
      if (existsSync(localPath)) {
        try {
          const buffer = await readFile(localPath)
          const fileName = doc.fileName.replace(/[^a-zA-Z0-9_.-]/g, '_')
          const storagePath = `student_${doc.studentId}/${Date.now()}_${fileName}`

          const result = await uploadToSupabaseStorage(
            BUCKETS.DOCUMENTS,
            storagePath,
            buffer,
            doc.fileType || 'application/octet-stream'
          )

          if (result) {
            await prisma.document.update({
              where: { id: doc.id },
              data: { filePath: `supabase:${BUCKETS.DOCUMENTS}/${storagePath}` },
            })
            docsMigrated++
            console.log(`✅ Migrated Document ID ${doc.id} (${doc.fileName}) -> ${storagePath}`)
          }
        } catch (err) {
          console.error(`❌ Failed migrating Document ID ${doc.id}:`, err)
        }
      }
    }
  }

  // 2. Migrate Resumes
  const resumes = await prisma.resume.findMany()
  console.log(`Found ${resumes.length} resume records in DB.`)

  let resumesMigrated = 0
  for (const resume of resumes) {
    if (resume.filePath && !resume.filePath.startsWith('supabase:')) {
      const cleanPath = resume.filePath.startsWith('/') ? resume.filePath.slice(1) : resume.filePath
      const localPath = join(process.cwd(), 'public', cleanPath)
      if (existsSync(localPath)) {
        try {
          const buffer = await readFile(localPath)
          const fileName = resume.filename.replace(/[^a-zA-Z0-9_.-]/g, '_')
          const storagePath = `student_${resume.studentId}/${Date.now()}_${fileName}`

          const result = await uploadToSupabaseStorage(
            BUCKETS.RESUMES,
            storagePath,
            buffer,
            resume.filename.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'
          )

          if (result) {
            await prisma.resume.update({
              where: { id: resume.id },
              data: { filePath: `supabase:${BUCKETS.RESUMES}/${storagePath}` },
            })
            resumesMigrated++
            console.log(`✅ Migrated Resume ID ${resume.id} (${resume.filename}) -> ${storagePath}`)
          }
        } catch (err) {
          console.error(`❌ Failed migrating Resume ID ${resume.id}:`, err)
        }
      }
    }
  }

  console.log('==============================================')
  console.log(`🎉 Migration complete!`)
  console.log(`Documents migrated: ${docsMigrated}`)
  console.log(`Resumes migrated: ${resumesMigrated}`)
  console.log('==============================================')
}

migrateFiles()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
