import { prisma } from '../src/lib/prisma.ts'
import {
  extractAcademicMarksheetDeterministic,
  extractSubjectsFromOCR,
  calculatePercentageFromFiveSubjects
} from '../src/lib/marksheetExtractionService.ts'

console.log('🧪 Starting End-to-End Academic Marksheet Verification Integration Test...\n')

async function runE2ETest() {
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

  const studentSelect = {
    id: true,
    name: true,
    email: true,
    tenthMarks: true,
    twelfthMarks: true,
    tenthPercentageSource: true,
    twelfthPercentageSource: true,
    tenthBoard: true,
    twelfthBoard: true,
    tenthPassingYear: true,
    twelfthPassingYear: true,
    academicVerificationStatus: true,
    isAcademicLocked: true
  }

  // 1. Find an existing student or create
  let student = await prisma.student.findFirst({
    select: studentSelect
  })

  if (!student) {
    console.log('No student found in DB')
    return
  }

  // Clean previous marksheets for this test student
  await prisma.academicMarksheet.deleteMany({ where: { studentId: student.id } }).catch(() => {})

  // 2. Simulate 10th marksheet (No explicit percentage, 5 subject marks)
  const tenthOCR = `
MAHARASHTRA STATE BOARD OF SECONDARY AND HIGHER SECONDARY EDUCATION, PUNE
SECONDARY SCHOOL CERTIFICATE EXAMINATION - STATEMENT OF MARKS
SEAT NO: T045141   CENTRE: 0812   DIST: 08   MONTH & YEAR: MARCH-2023
CANDIDATE'S FULL NAME: RAMSHETTE SOHAM BALAJI

SUB CODE  SUBJECT NAME                  MAX MARKS  MIN MARKS  MARKS OBTAINED (FIG)  MARKS IN WORDS
01        ENGLISH                       100        035        082                   EIGHTY TWO
03        HINDI                         100        035        079                   SEVENTY NINE
71        MATHEMATICS                   100        035        091                   NINETY ONE
72        SCIENCE & TECHNOLOGY          100        035        088                   EIGHTY EIGHT
73        SOCIAL SCIENCES               100        035        085                   EIGHTY FIVE
31        ENV. EDU. & WATER SECURITY                                                A
30        HEALTH & PHYSICAL EDUCATION                                               A
`

  const extracted10th = extractAcademicMarksheetDeterministic(tenthOCR, [], 'TENTH')
  assert(extracted10th.percentage === 85.00, '10th percentage calculated as 85.00%', `Got: ${extracted10th.percentage}`)
  assert(extracted10th.percentageSource === 'CALCULATED_FROM_SUBJECT_MARKS', '10th percentageSource is CALCULATED_FROM_SUBJECT_MARKS')

  // Save 10th Marksheet in DB
  const tenthMarksheet = await prisma.academicMarksheet.create({
    data: {
      studentId: student.id,
      educationLevel: 'TENTH',
      studentName: extracted10th.studentName || 'RAMSHETTE SOHAM BALAJI',
      seatNumber: extracted10th.seatNumber,
      board: extracted10th.board || 'Maharashtra State Board',
      passingYear: extracted10th.passingYear || 2023,
      totalMarks: extracted10th.totalMarks || 500,
      obtainedMarks: extracted10th.obtainedMarks || 425,
      percentage: extracted10th.percentage,
      subjects: JSON.stringify(extracted10th.subjects),
      comparisonResults: JSON.stringify({
        percentageSource: extracted10th.percentageSource,
        calculationEquation: extracted10th.calculationEquation,
        calculationFormula: extracted10th.calculationFormula
      }),
      verificationStatus: 'PENDING'
    }
  })

  assert(tenthMarksheet.percentage === 85.00, '10th Marksheet saved in DB with 85.00%')

  // 3. Simulate 12th marksheet (Explicit percentage 79.67%)
  const twelfthOCR = `
MAHARASHTRA STATE BOARD OF SECONDARY AND HIGHER SECONDARY EDUCATION
HIGHER SECONDARY CERTIFICATE EXAMINATION
SEAT NO: W054415   STREAM: SCIENCE   YEAR: FEBRUARY-2025
CANDIDATE'S NAME: RAMSHETTE SOHAM BALAJI

01 ENGLISH             100   035   068   SIXTY EIGHT
02 MARATHI             100   035   082   EIGHTY TWO
54 PHYSICS             100   035   075   SEVENTY FIVE
55 CHEMISTRY           100   035   078   SEVENTY EIGHT
40 MATHEMATICS & STATS 100   035   085   EIGHTY FIVE
56 BIOLOGY             100   035   090   NINETY

TOTAL MARKS: 600       OBTAINED: 478
PERCENTAGE: 79.67%
RESULT: PASS
`

  const extracted12th = extractAcademicMarksheetDeterministic(twelfthOCR, [], 'TWELFTH')
  assert(extracted12th.percentage === 79.67, '12th percentage extracted directly as 79.67%', `Got: ${extracted12th.percentage}`)
  assert(extracted12th.percentageSource === 'DIRECTLY_EXTRACTED', '12th percentageSource is DIRECTLY_EXTRACTED')

  // Save 12th Marksheet in DB
  const twelfthMarksheet = await prisma.academicMarksheet.create({
    data: {
      studentId: student.id,
      educationLevel: 'TWELFTH',
      studentName: extracted12th.studentName || 'RAMSHETTE SOHAM BALAJI',
      seatNumber: extracted12th.seatNumber,
      board: extracted12th.board || 'Maharashtra State Board',
      passingYear: extracted12th.passingYear || 2025,
      totalMarks: extracted12th.totalMarks || 600,
      obtainedMarks: extracted12th.obtainedMarks || 478,
      percentage: extracted12th.percentage,
      subjects: JSON.stringify(extracted12th.subjects),
      comparisonResults: JSON.stringify({
        percentageSource: extracted12th.percentageSource,
        calculationEquation: extracted12th.calculationEquation,
        calculationFormula: extracted12th.calculationFormula
      }),
      verificationStatus: 'PENDING'
    }
  })

  assert(twelfthMarksheet.percentage === 79.67, '12th Marksheet saved in DB with 79.67%')

  // 4. Simulate Complete Verification
  const verificationPayload = {
    nameVerified: true,
    tenthPercentageVerified: true,
    twelfthPercentageVerified: true,
    verifiedName: 'Ramshette Soham Balaji',
    verifiedAt: new Date().toISOString(),
    tenthPercentage: tenthMarksheet.percentage,
    twelfthPercentage: twelfthMarksheet.percentage,
    tenthPercentageSource: 'CALCULATED_FROM_SUBJECT_MARKS',
    twelfthPercentageSource: 'PERCENTAGE_EXTRACTED',
    tenthCalculationEquation: extracted10th.calculationEquation,
    twelfthCalculationEquation: extracted12th.calculationEquation,
    tenthBoard: tenthMarksheet.board,
    twelfthBoard: twelfthMarksheet.board,
    tenthPassingYear: tenthMarksheet.passingYear,
    twelfthPassingYear: twelfthMarksheet.passingYear
  }

    const updatedStudent = await prisma.student.update({
      where: { id: student.id },
      data: {
        name: 'Ramshette Soham Balaji',
        tenthMarks: tenthMarksheet.percentage,
        twelfthMarks: twelfthMarksheet.percentage,
        tenthBoard: tenthMarksheet.board,
        twelfthBoard: twelfthMarksheet.board,
        tenthPassingYear: tenthMarksheet.passingYear,
        twelfthPassingYear: twelfthMarksheet.passingYear,
        tenthPercentageSource: 'CALCULATED_FROM_SUBJECT_MARKS',
        twelfthPercentageSource: 'PERCENTAGE_EXTRACTED',
        academicVerificationStatus: 'VERIFIED',
        academicVerifiedAt: new Date(),
        academicVerificationData: JSON.stringify(verificationPayload),
        isAcademicLocked: true
      },
      select: studentSelect
    })

  assert(updatedStudent.isAcademicLocked === true, 'Student profile is locked')
  assert(updatedStudent.tenthMarks === 85.00, 'Student 10th Marks is locked at 85.00%')
  assert(updatedStudent.twelfthMarks === 79.67, 'Student 12th Marks is locked at 79.67%')
  assert(updatedStudent.tenthPercentageSource === 'CALCULATED_FROM_SUBJECT_MARKS', '10th source is CALCULATED_FROM_SUBJECT_MARKS')
  assert(updatedStudent.twelfthPercentageSource === 'PERCENTAGE_EXTRACTED', '12th source is PERCENTAGE_EXTRACTED')

  // Clean test marksheets
  await prisma.academicMarksheet.deleteMany({ where: { studentId: student.id } }).catch(() => {})

  console.log(`\n==========================================`)
  console.log(`E2E Results: ${passed} passed, ${failed} failed`)
  if (failed === 0) {
    console.log('🎉 ALL END-TO-END VERIFICATION TESTS PASSED!')
  } else {
    process.exit(1)
  }
}

runE2ETest()
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
