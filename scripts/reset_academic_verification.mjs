import { PrismaClient } from '../src/generated/prisma-client-v5/index.js'

const prisma = new PrismaClient()

async function resetAllMarksheetData() {
  console.log('--- RESETTING ALL PREVIOUS MARKSHEET DATA ---')

  // 1. Delete all AcademicMarksheet records
  const deletedMarksheets = await prisma.academicMarksheet.deleteMany({})
  console.log(`✓ Deleted ${deletedMarksheets.count} AcademicMarksheet records.`)

  // 2. Delete all 10th and 12th Document records
  const deletedDocs = await prisma.document.deleteMany({
    where: {
      OR: [
        { documentType: { in: ['10th Marksheet', '12th Marksheet'] } },
        { category: 'Academic' }
      ]
    }
  })
  console.log(`✓ Deleted ${deletedDocs.count} Academic Document records.`)

  // 3. Reset academic marks, verification status, and lock flags for all students
  const updatedStudents = await prisma.student.updateMany({
    data: {
      tenthMarks: null,
      twelfthMarks: null,
      tenthBoard: null,
      tenthPassingYear: null,
      tenthDocumentId: null,
      tenthPercentageSource: null,
      twelfthBoard: null,
      twelfthPassingYear: null,
      twelfthDocumentId: null,
      twelfthPercentageSource: null,
      academicVerificationStatus: 'NOT_STARTED',
      academicVerifiedAt: null,
      academicVerificationData: null,
      isAcademicLocked: false
    }
  })
  console.log(`✓ Reset academic verification status and marks for ${updatedStudents.count} student accounts.`)

  console.log('\nAll student accounts are now fresh with academicVerificationStatus: NOT_STARTED.')
  await prisma.$disconnect()
}

resetAllMarksheetData().catch(async (e) => {
  console.error('Reset failed:', e)
  await prisma.$disconnect()
  process.exit(1)
})
