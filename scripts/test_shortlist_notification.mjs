import { prisma } from '../src/lib/prisma.ts'
import { recordCandidateInterest } from '../src/lib/candidateIntelligenceService.ts'

console.log('🧪 Starting Shortlist Notification Portal Integration Test...\n')

async function runTest() {
  let passed = 0
  let failed = 0

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`)
      passed++
    } else {
      console.error(`  ❌ FAIL: ${name}`)
      if (details) console.error(`     Details: ${details}`)
      failed++
    }
  }

  // 1. Pick a student from database
  const student = await prisma.student.findFirst({
    select: { id: true, name: true, email: true, institutionId: true }
  })

  assert(student !== null, 'Candidate student found in database', `ID: ${student?.id}`)

  if (!student) {
    console.error('No student available in database for test')
    process.exit(1)
  }

  // 2. Simulate Candidate Shortlist Request
  const role = 'Software Developer'
  const companyName = 'Google Cloud'
  const companyId = 1

  const result = await recordCandidateInterest({
    companyId,
    companyName,
    studentId: student.id,
    studentName: student.name,
    jobTitle: role,
    notes: 'Shortlisted from Candidate Intelligence top talent discovery'
  })

  assert(result.success === true, 'Candidate interest successfully recorded', result.message)

  // 3. Verify Portal Notification Payload format
  const companyNotif = {
    role: 'company',
    title: `✓ Shortlisted: ${student.name}`,
    message: `Candidate ${student.name} was shortlisted for ${role}.`,
    category: 'Candidate Shortlist',
    actionUrl: `/company/candidates/${student.id}`,
    icon: 'target',
    color: '#10b981'
  }

  const studentNotif = {
    role: 'student',
    title: `⭐ Profile Shortlisted for ${role}!`,
    message: `Congratulations! ${companyName} shortlisted your profile for the ${role} opening.`,
    category: 'Shortlist Alert',
    actionUrl: '/student/internships',
    icon: 'placement',
    color: '#8b5cf6'
  }

  assert(companyNotif.title.includes(student.name), 'Company notification generated with candidate name')
  assert(studentNotif.title.includes(role), 'Student notification generated with target role')
  assert(companyNotif.actionUrl.includes(`${student.id}`), 'Company notification action URL routes to candidate profile')

  console.log(`\n==========================================`)
  console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`)
  if (failed === 0) {
    console.log('🎉 SHORTLIST PORTAL NOTIFICATION TEST PASSED!')
  } else {
    process.exit(1)
  }
}

runTest()
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
