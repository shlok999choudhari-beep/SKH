console.log('🧪 Testing Redesigned Skill Gap Analysis Page and APIs...\n')

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

  // 1. Fetch Skill Gap page from running dev server
  const pageRes = await fetch('http://localhost:3000/student/skill-gap')
  assert(pageRes.status === 200 || pageRes.status === 307 || pageRes.status === 302, 'Skill Gap page routes successfully', `Status: ${pageRes.status}`)

  // 2. Fetch Skill Gap list API endpoint
  const listRes = await fetch('http://localhost:3000/api/skill-gap/list')
  assert(listRes.status === 200 || listRes.status === 401, 'Skill gap list API endpoint reachable', `Status: ${listRes.status}`)

  console.log(`\n==========================================`)
  console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`)
  if (failed === 0) {
    console.log('🎉 SKILL GAP PAGE TEST PASSED!')
  } else {
    process.exit(1)
  }
}

runTest().catch(err => {
  console.error('Test error:', err)
  process.exit(1)
})
