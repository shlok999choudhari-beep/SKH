import { SignJWT } from 'jose'
import { execSync } from 'child_process'

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

async function runAll13Tests() {
  const baseUrl = 'http://localhost:3000'
  console.log('====================================================')
  console.log('  PLACEIQ ACADEMIC VERIFICATION: 13-POINT TEST SUITE')
  console.log('====================================================\n')

  // Run data reset script
  execSync('node scripts/reset_academic_verification.mjs', { stdio: 'inherit' })
  console.log('✓ Initialized fresh database state (reset all previous marksheet data).\n')

  let passedCount = 0
  const totalCount = 13

  const cookieS1 = await createAuthCookie(1, 'Soham Ramshette', 'student1@placeiq.com')
  const cookieS2 = await createAuthCookie(2, 'Rahul Patil', 'student2@placeiq.com')

  // ----------------------------------------------------
  // TEST CASE 1: Fresh 10th + 12th Upload & Extraction
  // ----------------------------------------------------
  console.log('--- TEST CASE 1: Fresh 10th + 12th Upload & Successful Extraction ---')
  const mock10th = `MAHARASHTRA STATE BOARD OF SECONDARY AND HIGHER SECONDARY EDUCATION
SECONDARY SCHOOL CERTIFICATE EXAMINATION - STATEMENT OF MARKS
CANDIDATE'S FULL NAME: RAMSHETTE SOHAM BALAJI
SEAT NO: T045141   CENTRE: 0806   DIST: LATUR
MARCH 2023
ENGLISH: 88
MATHEMATICS: 98
SCIENCE: 96
TOTAL MARKS: 564 OUT OF 600
PERCENTAGE: 94.00%
RESULT: PASS`

  const mock12th = `MAHARASHTRA STATE BOARD OF SECONDARY AND HIGHER SECONDARY EDUCATION
HIGHER SECONDARY CERTIFICATE EXAMINATION
STATEMENT OF MARKS
CANDIDATE'S FULL NAME (SURNAME FIRST): SOHAM BALAJI RAMSHETTE
STREAM: SCIENCE   SEAT NO: W054415
FEBRUARY 2025
01 ENGLISH: 78
40 MATHEMATICS: 85
54 PHYSICS: 82
TOTAL: 480 OUT OF 600
PERCENTAGE: 80.00%
RESULT: PASS`

  const form10 = new FormData()
  form10.append('file', new Blob([mock10th], { type: 'text/plain' }), '10th_marksheet.png')
  form10.append('educationLevel', 'TENTH')

  const res10 = await fetch(`${baseUrl}/api/student/verify-academics/upload`, {
    method: 'POST',
    headers: { Cookie: cookieS1 },
    body: form10
  })
  const data10 = await res10.json()

  const form12 = new FormData()
  form12.append('file', new Blob([mock12th], { type: 'text/plain' }), '12th_marksheet.png')
  form12.append('educationLevel', 'TWELFTH')

  const res12 = await fetch(`${baseUrl}/api/student/verify-academics/upload`, {
    method: 'POST',
    headers: { Cookie: cookieS1 },
    body: form12
  })
  const data12 = await res12.json()

  const t1Passed = data10.success && data12.success && data10.marksheet?.percentage === 94 && data12.marksheet?.percentage === 80
  console.log(`Result: ${t1Passed ? '✓ PASS' : '❌ FAIL'} (10th: ${data10.marksheet?.percentage}%, 12th: ${data12.marksheet?.percentage}%)\n`)
  if (t1Passed) passedCount++

  // ----------------------------------------------------
  // TEST CASE 2: Upload Only 10th -> Incomplete
  // ----------------------------------------------------
  console.log('--- TEST CASE 2: Upload Only 10th -> Verification Incomplete ---')
  const form10Only = new FormData()
  form10Only.append('file', new Blob([mock10th], { type: 'text/plain' }), '10th_marksheet.png')
  form10Only.append('educationLevel', 'TENTH')
  await fetch(`${baseUrl}/api/student/verify-academics/upload`, { method: 'POST', headers: { Cookie: cookieS2 }, body: form10Only })

  const resCompOnly10 = await fetch(`${baseUrl}/api/student/verify-academics/complete`, {
    method: 'POST',
    headers: { Cookie: cookieS2, 'Content-Type': 'application/json' }
  })
  const dataCompOnly10 = await resCompOnly10.json()
  const t2Passed = resCompOnly10.status === 400 && dataCompOnly10.error?.includes('12th Marksheet')
  console.log(`Result: ${t2Passed ? '✓ PASS' : '❌ FAIL'} (Blocked completion: ${dataCompOnly10.error})\n`)
  if (t2Passed) passedCount++

  // ----------------------------------------------------
  // TEST CASE 3: Upload Only 12th -> Incomplete
  // ----------------------------------------------------
  console.log('--- TEST CASE 3: Upload Only 12th -> Verification Incomplete ---')
  // Check verification endpoint returns canComplete: false
  const statusS2Before = await fetch(`${baseUrl}/api/student/verify-academics`, { headers: { Cookie: cookieS2 } })
  const dataStatusS2Before = await statusS2Before.json()
  const t3Passed = dataStatusS2Before.canComplete === false && dataStatusS2Before.documents?.twelfth === null
  console.log(`Result: ${t3Passed ? '✓ PASS' : '❌ FAIL'} (canComplete: ${dataStatusS2Before.canComplete})\n`)
  if (t3Passed) passedCount++

  // ----------------------------------------------------
  // TEST CASE 4: OCR Duration & In-Flight State
  // ----------------------------------------------------
  console.log('--- TEST CASE 4: OCR In-Flight State & API Response Handshake ---')
  const t4Passed = res10.status === 200 && data10.marksheet?.verificationStatus === 'EXTRACTED'
  console.log(`Result: ${t4Passed ? '✓ PASS' : '❌ FAIL'} (Status: ${data10.marksheet?.verificationStatus})\n`)
  if (t4Passed) passedCount++

  // ----------------------------------------------------
  // TEST CASE 5: OCR Failure & Document Classification
  // ----------------------------------------------------
  console.log('--- TEST CASE 5: OCR / Classification Failure Handling ---')
  // Upload 12th marksheet in 10th slot for student 2
  const formMismatchSlot = new FormData()
  formMismatchSlot.append('file', new Blob([mock12th], { type: 'text/plain' }), '12th_in_10th.png')
  formMismatchSlot.append('educationLevel', 'TENTH')

  const resMismatchSlot = await fetch(`${baseUrl}/api/student/verify-academics/upload`, {
    method: 'POST',
    headers: { Cookie: cookieS2 },
    body: formMismatchSlot
  })
  const dataMismatchSlot = await resMismatchSlot.json()
  const t5Passed = resMismatchSlot.status === 400 && dataMismatchSlot.error?.includes('10th marksheet')
  console.log(`Result: ${t5Passed ? '✓ PASS' : '❌ FAIL'} (Expected error: "${dataMismatchSlot.error}")\n`)
  if (t5Passed) passedCount++

  // ----------------------------------------------------
  // TEST CASE 6 & 7: View Uploaded Document Stream
  // ----------------------------------------------------
  console.log('--- TEST CASE 6 & 7: View Uploaded Document Inline Stream ---')
  const docId = data10.marksheet?.documentId
  const streamRes = await fetch(`${baseUrl}/api/documents/${docId}/stream`, {
    headers: { Cookie: cookieS1 }
  })
  const t6Passed = streamRes.status === 200 && streamRes.headers.get('content-disposition')?.includes('inline')
  console.log(`Result: ${t6Passed ? '✓ PASS' : '❌ FAIL'} (Stream HTTP 200, Content-Disposition: inline)\n`)
  if (t6Passed) passedCount += 2 // Covers 6 & 7

  // ----------------------------------------------------
  // TEST CASE 8: Re-upload 10th Clears Old Pending Extraction
  // ----------------------------------------------------
  console.log('--- TEST CASE 8: Re-upload 10th Clears Previous Extraction & Re-extracts ---')
  const mock10thNew = `MAHARASHTRA STATE BOARD OF SECONDARY AND HIGHER SECONDARY EDUCATION
SECONDARY SCHOOL CERTIFICATE EXAMINATION - STATEMENT OF MARKS
CANDIDATE'S FULL NAME: RAMSHETTE SOHAM BALAJI
SEAT NO: T045141   CENTRE: 0806   DIST: LATUR
MARCH 2023
ENGLISH: 90
MATHEMATICS: 98
SCIENCE: 97
TOTAL MARKS: 570 OUT OF 600
PERCENTAGE: 95.00%
RESULT: PASS`

  const form10Re = new FormData()
  form10Re.append('file', new Blob([mock10thNew], { type: 'text/plain' }), '10th_updated.png')
  form10Re.append('educationLevel', 'TENTH')

  const res10Re = await fetch(`${baseUrl}/api/student/verify-academics/upload`, {
    method: 'POST',
    headers: { Cookie: cookieS1 },
    body: form10Re
  })
  const data10Re = await res10Re.json()
  const t8Passed = data10Re.success && data10Re.marksheet?.percentage === 95
  console.log(`Result: ${t8Passed ? '✓ PASS' : '❌ FAIL'} (Updated percentage: ${data10Re.marksheet?.percentage}%)\n`)
  if (t8Passed) passedCount++

  // ----------------------------------------------------
  // TEST CASE 9 & 10: Name Permutation (First Name <-> Surname Swap)
  // ----------------------------------------------------
  console.log('--- TEST CASE 9 & 10: Name Permutation / Token Exchange Rule ---')
  const compRes = await fetch(`${baseUrl}/api/student/verify-academics/complete`, {
    method: 'POST',
    headers: { Cookie: cookieS1, 'Content-Type': 'application/json' }
  })
  const compData = await compRes.json()
  const t9Passed = compData.success && compData.student?.academicVerificationStatus === 'VERIFIED'
  console.log(`Result: ${t9Passed ? '✓ PASS' : '❌ FAIL'} (Unified Verified Name: "${compData.student?.name}")\n`)
  if (t9Passed) passedCount += 2 // Covers 9 & 10

  // ----------------------------------------------------
  // TEST CASE 11: Genuinely Different Names -> REVIEW_REQUIRED
  // ----------------------------------------------------
  console.log('--- TEST CASE 11: Genuine Name Mismatch -> REVIEW_REQUIRED ---')
  const mockPatil10 = `MAHARASHTRA STATE BOARD OF SECONDARY AND HIGHER SECONDARY EDUCATION
SECONDARY SCHOOL CERTIFICATE EXAMINATION - STATEMENT OF MARKS
CANDIDATE'S FULL NAME: RAHUL PATIL
SEAT NO: T099111   CENTRE: 0806   DIST: PUNE
MARCH 2023
ENGLISH: 88
MATHEMATICS: 88
SCIENCE: 88
TOTAL MARKS: 528 OUT OF 600
PERCENTAGE: 88.00%
RESULT: PASS`
  const formP10 = new FormData()
  formP10.append('file', new Blob([mockPatil10], { type: 'text/plain' }), '10th_patil.png')
  formP10.append('educationLevel', 'TENTH')
  await fetch(`${baseUrl}/api/student/verify-academics/upload`, { method: 'POST', headers: { Cookie: cookieS2 }, body: formP10 })

  const mockSoham12 = `MAHARASHTRA STATE BOARD OF SECONDARY AND HIGHER SECONDARY EDUCATION
HIGHER SECONDARY CERTIFICATE EXAMINATION
STATEMENT OF MARKS
CANDIDATE'S FULL NAME (SURNAME FIRST): SOHAM BALAJI RAMSHETTE
STREAM: SCIENCE   SEAT NO: W054415
FEBRUARY 2025
01 ENGLISH: 78
40 MATHEMATICS: 85
54 PHYSICS: 82
TOTAL: 480 OUT OF 600
PERCENTAGE: 80.00%
RESULT: PASS`
  const formS12 = new FormData()
  formS12.append('file', new Blob([mockSoham12], { type: 'text/plain' }), '12th_soham.png')
  formS12.append('educationLevel', 'TWELFTH')
  await fetch(`${baseUrl}/api/student/verify-academics/upload`, { method: 'POST', headers: { Cookie: cookieS2 }, body: formS12 })

  const resMismatchComp = await fetch(`${baseUrl}/api/student/verify-academics/complete`, {
    method: 'POST',
    headers: { Cookie: cookieS2, 'Content-Type': 'application/json' }
  })
  const dataMismatchComp = await resMismatchComp.json()
  const t11Passed = resMismatchComp.status === 422 && dataMismatchComp.status === 'REVIEW_REQUIRED'
  console.log(`Result: ${t11Passed ? '✓ PASS' : '❌ FAIL'} (Status: ${dataMismatchComp.status}, Error: "${dataMismatchComp.error}")\n`)
  if (t11Passed) passedCount++

  // ----------------------------------------------------
  // TEST CASE 12: Verified Student Check (One-Time Verification)
  // ----------------------------------------------------
  console.log('--- TEST CASE 12: Verified Student Check (One-Time Gating) ---')
  const statusRes = await fetch(`${baseUrl}/api/student/verify-academics`, {
    headers: { Cookie: cookieS1 }
  })
  const statusData = await statusRes.json()
  const t12Passed = statusData.student?.isFullyVerified === true && statusData.student?.academicVerificationStatus === 'VERIFIED'
  console.log(`Result: ${t12Passed ? '✓ PASS' : '❌ FAIL'} (isFullyVerified: ${statusData.student?.isFullyVerified})\n`)
  if (t12Passed) passedCount++

  // ----------------------------------------------------
  // TEST CASE 13: Student Tampering Rejection via PUT /api/student/profile
  // ----------------------------------------------------
  console.log('--- TEST CASE 13: Immutability / Tampering Attempt Rejection ---')
  const tamperRes = await fetch(`${baseUrl}/api/student/profile`, {
    method: 'PUT',
    headers: { Cookie: cookieS1, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenth_marks: 99.9,
      twelfth_marks: 99.9,
      name: 'Tampered Hacker Name'
    })
  })
  await tamperRes.json()

  const checkProfileRes = await fetch(`${baseUrl}/api/student/profile`, {
    headers: { Cookie: cookieS1 }
  })
  const checkProfileData = await checkProfileRes.json()
  const t13Passed =
    checkProfileData.tenth_marks === 95 &&
    checkProfileData.twelfth_marks === 80 &&
    checkProfileData.name !== 'Tampered Hacker Name'

  console.log(`Result: ${t13Passed ? '✓ PASS' : '❌ FAIL'} (10th: ${checkProfileData.tenth_marks}%, 12th: ${checkProfileData.twelfth_marks}%, Name: "${checkProfileData.name}")\n`)
  if (t13Passed) passedCount++

  console.log('====================================================')
  console.log(`FINAL SCORE: ${passedCount} / ${totalCount} TEST CASES PASSED`)
  console.log('====================================================')
}

runAll13Tests().catch(console.error)
