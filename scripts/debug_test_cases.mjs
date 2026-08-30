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

async function debug() {
  const baseUrl = 'http://localhost:3000'
  const cookieS1 = await createAuthCookie(1, 'Soham Ramshette', 'student1@placeiq.com')
  const cookieS2 = await createAuthCookie(2, 'Rahul Patil', 'student2@placeiq.com')

  console.log('--- DEBUGGING TEST CASE 5 (Upload 12th in 10th slot) ---')
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

  const formMismatch = new FormData()
  formMismatch.append('file', new Blob([mock12th], { type: 'text/plain' }), '12th_in_10th.png')
  formMismatch.append('educationLevel', 'TENTH')

  const resMismatch = await fetch(`${baseUrl}/api/student/verify-academics/upload`, {
    method: 'POST',
    headers: { Cookie: cookieS2 },
    body: formMismatch
  })
  console.log('Test 5 Status:', resMismatch.status)
  console.log('Test 5 Body:', await resMismatch.json())

  console.log('\n--- DEBUGGING TEST CASE 1 & STREAM ---')
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

  const form10 = new FormData()
  form10.append('file', new Blob([mock10th], { type: 'text/plain' }), '10th_marksheet.png')
  form10.append('educationLevel', 'TENTH')

  const res10 = await fetch(`${baseUrl}/api/student/verify-academics/upload`, {
    method: 'POST',
    headers: { Cookie: cookieS1 },
    body: form10
  })
  const data10 = await res10.json()
  console.log('Upload 10th result:', data10)

  const docId = data10.marksheet?.documentId
  console.log('Doc ID:', docId)
  if (docId) {
    const streamRes = await fetch(`${baseUrl}/api/documents/${docId}/stream`, {
      headers: { Cookie: cookieS1 }
    })
    console.log('Stream status:', streamRes.status)
    console.log('Stream Content-Type:', streamRes.headers.get('content-type'))
    console.log('Stream Content-Disposition:', streamRes.headers.get('content-disposition'))
  }
}

debug().catch(console.error)
