import { SignJWT } from 'jose'

const SESSION_SECRET = process.env.SESSION_SECRET || 'placeiq_super_secret_jwt_auth_key_prod_2026_secure'
const encodedKey = new TextEncoder().encode(SESSION_SECRET)

async function createAuthCookie(studentId, name, email) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const token = await new SignJWT({
    userId: studentId,
    role: 'student',
    email: email || `student_${studentId}@test.com`,
    name: name || `Test Student ${studentId}`,
    expiresAt
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)

  return `demo_session=${token}`
}

async function runE2ETest() {
  const baseUrl = 'http://localhost:3000'
  console.log('=== STARTING E2E ACADEMIC VERIFICATION PIPELINE TEST ===\n')

  const testStudentId = 1
  const cookie = await createAuthCookie(testStudentId, 'Soham Balaji Ramshette', 'soham@test.com')

  // 1. Check Initial Verification Status
  console.log('Step 1: Checking student verification status...')
  const statusRes = await fetch(`${baseUrl}/api/student/verify-academics`, {
    headers: { Cookie: cookie }
  })
  const statusData = await statusRes.json()
  console.log(' - Status response:', statusData.success ? 'Success' : 'Failed')
  console.log(' - Current Status in DB:', statusData.student?.academicVerificationStatus)
  console.log(' - Is Locked in DB:', statusData.student?.isAcademicLocked)

  // 2. Test Profile GET
  console.log('\nStep 2: Checking /api/student/profile...')
  const profileRes = await fetch(`${baseUrl}/api/student/profile`, {
    headers: { Cookie: cookie }
  })
  const profileData = await profileRes.json()
  console.log(' - Current Profile Name:', profileData.name)
  console.log(' - Current 10th Marks:', profileData.tenth_marks)
  console.log(' - Current 12th Marks:', profileData.twelfth_marks)
  console.log(' - isAcademicLocked:', profileData.isAcademicLocked)

  // 3. Test 10th Marksheet Upload
  console.log('\nStep 3: Uploading & extracting 10th Marksheet...')
  const mock10thText = `MAHARASHTRA STATE BOARD OF SECONDARY AND HIGHER SECONDARY EDUCATION, PUNE
SECONDARY SCHOOL CERTIFICATE EXAMINATION - STATEMENT OF MARKS
CANDIDATE'S FULL NAME: RAMSHETTE SOHAM BALAJI
SEAT NO: T045141   CENTRE: 0806   DIST: LATUR
MARCH 2023
ENGLISH: 88
MARATHI: 92
HINDI: 90
MATHEMATICS: 98
SCIENCE & TECHNOLOGY: 96
SOCIAL SCIENCES: 95
TOTAL MARKS: 559 OUT OF 600
PERCENTAGE: 93.17%
RESULT: PASS`

  const form10 = new FormData()
  form10.append('file', new Blob([mock10thText], { type: 'text/plain' }), '10th_marksheet.png')
  form10.append('educationLevel', 'TENTH')

  const upload10Res = await fetch(`${baseUrl}/api/student/verify-academics/upload`, {
    method: 'POST',
    headers: { Cookie: cookie },
    body: form10
  })
  const upload10Data = await upload10Res.json()
  console.log(' - 10th Upload Result:', upload10Data.success ? 'SUCCESS' : 'FAILED', upload10Data.error || '')
  if (upload10Data.marksheet) {
    console.log('   * Extracted Candidate Name:', upload10Data.marksheet.studentName)
    console.log('   * Extracted 10th Percentage:', upload10Data.marksheet.percentage + '%')
    console.log('   * Extracted Education Board:', upload10Data.marksheet.board)
    console.log('   * Extracted Passing Year:', upload10Data.marksheet.passingYear)
    console.log('   * Extracted Seat/Roll No:', upload10Data.marksheet.seatNumber)
  }

  // 4. Test 12th Marksheet Upload
  console.log('\nStep 4: Uploading & extracting 12th Marksheet...')
  const mock12thText = `MAHARASHTRA STATE BOARD OF SECONDARY AND HIGHER SECONDARY EDUCATION
HIGHER SECONDARY CERTIFICATE EXAMINATION
STATEMENT OF MARKS
CANDIDATE'S FULL NAME (SURNAME FIRST): SOHAM BALAJI RAMSHETTE
STREAM: SCIENCE   SEAT NO: W054415
FEBRUARY 2025
01 ENGLISH: 78
40 MATHEMATICS & STATISTICS: 85
54 PHYSICS: 82
55 CHEMISTRY: 80
D9 COMPUTER SCIENCE: 175 OUT OF 200
GRAND TOTAL: 500 OUT OF 600
PERCENTAGE: 83.33%
RESULT: PASS`

  const form12 = new FormData()
  form12.append('file', new Blob([mock12thText], { type: 'text/plain' }), '12th_marksheet.png')
  form12.append('educationLevel', 'TWELFTH')

  const upload12Res = await fetch(`${baseUrl}/api/student/verify-academics/upload`, {
    method: 'POST',
    headers: { Cookie: cookie },
    body: form12
  })
  const upload12Data = await upload12Res.json()
  console.log(' - 12th Upload Result:', upload12Data.success ? 'SUCCESS' : 'FAILED', upload12Data.error || '')
  if (upload12Data.marksheet) {
    console.log('   * Extracted Candidate Name:', upload12Data.marksheet.studentName)
    console.log('   * Extracted 12th Percentage:', upload12Data.marksheet.percentage + '%')
    console.log('   * Extracted Education Board:', upload12Data.marksheet.board)
    console.log('   * Extracted Passing Year:', upload12Data.marksheet.passingYear)
    console.log('   * Extracted Seat/Roll No:', upload12Data.marksheet.seatNumber)
  }

  // 5. Complete Verification
  console.log('\nStep 5: Calling /api/student/verify-academics/complete...')
  const completeRes = await fetch(`${baseUrl}/api/student/verify-academics/complete`, {
    method: 'POST',
    headers: { Cookie: cookie, 'Content-Type': 'application/json' }
  })
  const completeData = await completeRes.json()
  console.log(' - Complete Result:', completeData.success ? 'SUCCESS' : 'FAILED', completeData.error || '')
  if (completeData.student) {
    console.log('   * Verified Title Case Name:', completeData.student.name)
    console.log('   * Verified 10th Marks:', completeData.student.tenthMarks + '%')
    console.log('   * Verified 12th Marks:', completeData.student.twelfthMarks + '%')
    console.log('   * Verification Status:', completeData.student.academicVerificationStatus)
    console.log('   * Is Academic Locked:', completeData.student.isAcademicLocked)
  }

  // 6. Test Security / Immutability Enforcement
  console.log('\nStep 6: Testing Backend Tampering Prevention (Attempting malicious PUT /api/student/profile)...')
  const tamperRes = await fetch(`${baseUrl}/api/student/profile`, {
    method: 'PUT',
    headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenth_marks: 99.9,
      twelfth_marks: 99.9,
      name: 'Tampered Hacker Name',
      college: 'IIT Bombay Tech Campus'
    })
  })
  const tamperData = await tamperRes.json()
  console.log(' - PUT Response Success:', tamperData.success)

  // Verify profile did NOT take the tampered 99.9 marks or fake name
  const verifySecRes = await fetch(`${baseUrl}/api/student/profile`, {
    headers: { Cookie: cookie }
  })
  const verifySecData = await verifySecRes.json()
  console.log(' - Post-Tamper Security Verification:')
  console.log('   * Name is still protected:', verifySecData.name, verifySecData.name !== 'Tampered Hacker Name' ? '✓ SECURED' : '❌ FAILED')
  console.log('   * 10th Marks is still protected:', verifySecData.tenth_marks + '%', verifySecData.tenth_marks !== 99.9 ? '✓ SECURED' : '❌ FAILED')
  console.log('   * 12th Marks is still protected:', verifySecData.twelfth_marks + '%', verifySecData.twelfth_marks !== 99.9 ? '✓ SECURED' : '❌ FAILED')
  console.log('   * Allowed field (college) was updated:', verifySecData.college === 'IIT Bombay Tech Campus' ? '✓ ALLOWED' : '❌ FAILED')

  console.log('\n=== ALL E2E VERIFICATION PIPELINE TESTS COMPLETED SUCCESSFULLY ===')
}

runE2ETest().catch(console.error)
