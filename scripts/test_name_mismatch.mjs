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

async function testNameMismatch() {
  const baseUrl = 'http://localhost:3000'
  console.log('=== TESTING NAME MISMATCH EDGE CASE ===\n')

  const testStudentId = 2 // Student 2
  const cookie = await createAuthCookie(testStudentId, 'Rahul Sharma', 'rahul@test.com')

  // 1. Upload 10th Marksheet with Name "Rahul Sharma"
  console.log('1. Uploading 10th marksheet for candidate "Rahul Sharma"...')
  const mock10thText = `CENTRAL BOARD OF SECONDARY EDUCATION
SECONDARY SCHOOL EXAMINATION 2023
CANDIDATE NAME: RAHUL SHARMA
ROLL NO: 15129115   SCHOOL: DELHI PUBLIC SCHOOL
ENGLISH: 91
MATHEMATICS: 89
SCIENCE: 92
SOCIAL SCIENCE: 90
HINDI: 88
TOTAL: 450 OUT OF 500
PERCENTAGE: 90.00%
RESULT: PASS`

  const form10 = new FormData()
  form10.append('file', new Blob([mock10thText], { type: 'text/plain' }), '10th_marksheet.png')
  form10.append('educationLevel', 'TENTH')

  const up10 = await fetch(`${baseUrl}/api/student/verify-academics/upload`, {
    method: 'POST',
    headers: { Cookie: cookie },
    body: form10
  })
  const up10Data = await up10.json()
  console.log(' - 10th Name Extracted:', up10Data.marksheet?.studentName)

  // 2. Upload 12th Marksheet with a completely different Name "Soham Ramshette"
  console.log('\n2. Uploading 12th marksheet with mismatched name "Soham Ramshette"...')
  const mock12thText = `MAHARASHTRA STATE BOARD OF HIGHER SECONDARY EDUCATION
HIGHER SECONDARY CERTIFICATE EXAMINATION
STATEMENT OF MARKS
CANDIDATE'S FULL NAME (SURNAME FIRST): SOHAM BALAJI RAMSHETTE
STREAM: SCIENCE   SEAT NO: W054415
FEBRUARY 2025
01 ENGLISH: 78
40 MATHEMATICS: 85
54 PHYSICS: 82
55 CHEMISTRY: 80
TOTAL: 500 OUT OF 600
PERCENTAGE: 83.33%
RESULT: PASS`

  const form12 = new FormData()
  form12.append('file', new Blob([mock12thText], { type: 'text/plain' }), '12th_marksheet.png')
  form12.append('educationLevel', 'TWELFTH')

  const up12 = await fetch(`${baseUrl}/api/student/verify-academics/upload`, {
    method: 'POST',
    headers: { Cookie: cookie },
    body: form12
  })
  const up12Data = await up12.json()
  console.log(' - 12th Name Extracted:', up12Data.marksheet?.studentName)

  // 3. Attempt Complete Verification
  console.log('\n3. Attempting to complete verification with mismatched documents...')
  const completeRes = await fetch(`${baseUrl}/api/student/verify-academics/complete`, {
    method: 'POST',
    headers: { Cookie: cookie, 'Content-Type': 'application/json' }
  })
  const completeData = await completeRes.json()
  console.log(' - Response Status Code:', completeRes.status, '(Expected: 422)')
  console.log(' - Error Message:', completeData.error)
  console.log(' - Assigned Verification Status:', completeData.status, '(Expected: REVIEW_REQUIRED)')

  const mismatchFlagged =
    completeRes.status === 422 &&
    completeData.status === 'REVIEW_REQUIRED' &&
    completeData.error.includes('Name mismatch detected between your documents')

  console.log('\nResult of Name Mismatch Test:', mismatchFlagged ? '✓ PASSED PERFECTLY' : '❌ FAILED')
}

testNameMismatch().catch(console.error)
