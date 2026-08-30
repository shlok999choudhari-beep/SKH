console.log('🧪 Testing Authentic Progress-Based Notifications Engine...\n')

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

  // 1. Test Student Notifications
  const studentRes = await fetch('http://localhost:3000/api/notifications?role=student')
  const studentData = await studentRes.json()

  assert(studentRes.status === 200, 'Student notifications endpoint returns 200 OK')
  assert(Array.isArray(studentData.notifications), 'Student notifications is an array')
  assert(studentData.notifications.length >= 3, 'Student has authentic progress notifications', `Count: ${studentData.notifications?.length}`)

  // Check specific authentic categories
  const studentCategories = (studentData.notifications || []).map(n => n.category)
  assert(studentCategories.some(c => c.includes('Academic') || c.includes('Verification')), 'Includes Authentic Academic Verification Progress')
  assert(studentCategories.some(c => c.includes('Career') || c.includes('Readiness')), 'Includes Authentic Career/Readiness Benchmark')
  assert(studentCategories.some(c => c.includes('Coding')), 'Includes Authentic Coding Judge Benchmark')

  // Verify all action URLs are valid active routes
  const validStudentRoutes = ['/student/documents', '/student/roadmap', '/student/coding-judge', '/student/courses', '/student/internships', '/student/placements', '/student/profile']
  const allStudentUrlsValid = (studentData.notifications || []).every(n => validStudentRoutes.some(r => n.actionUrl.startsWith(r)))
  assert(allStudentUrlsValid, 'Every student notification has an authentic, active action URL')

  // Verify no fake dummy text remains
  const studentJson = JSON.stringify(studentData)
  assert(!studentJson.includes('Microsoft SWE Drive'), 'No dummy "Microsoft SWE Drive" placeholder')
  assert(!studentJson.includes('Uber Frontend Internship'), 'No dummy "Uber Frontend" placeholder')
  assert(!studentJson.includes('Trainer Alex confirmed'), 'No dummy "Trainer Alex" placeholder')

  // 2. Test Company Notifications
  const companyRes = await fetch('http://localhost:3000/api/notifications?role=company')
  const companyData = await companyRes.json()

  assert(companyRes.status === 200, 'Company notifications endpoint returns 200 OK')
  assert(companyData.notifications.length >= 3, 'Company has authentic recruitment notifications', `Count: ${companyData.notifications?.length}`)
  const validCompanyRoutes = ['/company/candidates', '/company/coding-judge', '/company/profile', '/company/internships', '/company/dashboard']
  const allCompanyUrlsValid = (companyData.notifications || []).every(n => validCompanyRoutes.some(r => n.actionUrl.startsWith(r)))
  assert(allCompanyUrlsValid, 'Every company notification has an authentic, active action URL')

  // 3. Test Institution Notifications
  const instRes = await fetch('http://localhost:3000/api/notifications?role=institution')
  const instData = await instRes.json()

  assert(instRes.status === 200, 'Institution notifications endpoint returns 200 OK')
  assert(instData.notifications.length >= 3, 'Institution has authentic cohort & placement notifications', `Count: ${instData.notifications?.length}`)
  const validInstRoutes = ['/institution/students', '/institution/analytics', '/institution/resources', '/institution/documents']
  const allInstUrlsValid = (instData.notifications || []).every(n => validInstRoutes.some(r => n.actionUrl.startsWith(r)))
  assert(allInstUrlsValid, 'Every institution notification has an authentic, active action URL')

  console.log(`\n==========================================`)
  console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`)
  if (failed === 0) {
    console.log('🎉 ALL AUTHENTIC NOTIFICATION TESTS PASSED!')
  } else {
    process.exit(1)
  }
}

runTest()
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
