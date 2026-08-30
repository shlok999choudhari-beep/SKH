import {
  extractSubjectsFromOCR,
  calculatePercentageFromFiveSubjects,
  extractAcademicMarksheetDeterministic,
  normalizeSubjectName
} from '../src/lib/marksheetExtractionService.ts'

console.log('🧪 Starting Marksheet Percentage Calculation Test Suite...\n')

let passed = 0
let failed = 0

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`)
    passed++
  } else {
    console.error(`  ❌ FAIL: ${testName}`)
    if (details) console.error(`     Details: ${details}`)
    failed++
  }
}

// ==========================================
// TEST 1: Subject extraction and 5-subject calculation (User Example)
// ==========================================
console.log('--- Test 1: User Example (5 subjects: English 82, Maths 91, Science 88, Social Science 85, Hindi 79) ---')
const sample10thOCR = `
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

const extracted10th = extractAcademicMarksheetDeterministic(sample10thOCR, [], 'TENTH')

assert(extracted10th.studentName?.toUpperCase().includes('RAMSHETTE SOHAM BALAJI'), 'Candidate name correctly extracted', `Extracted: ${extracted10th.studentName}`)
assert(extracted10th.seatNumber === 'T045141', 'Seat number extracted', `Extracted: ${extracted10th.seatNumber}`)
assert(extracted10th.percentage === 85.00, 'Calculated percentage is 85.00%', `Extracted percentage: ${extracted10th.percentage}`)
assert(extracted10th.percentageSource === 'CALCULATED_FROM_SUBJECT_MARKS', 'Percentage source is CALCULATED_FROM_SUBJECT_MARKS', `Source: ${extracted10th.percentageSource}`)
assert(extracted10th.obtainedMarks === 425, 'Total obtained marks is 425', `Obtained: ${extracted10th.obtainedMarks}`)
assert(extracted10th.totalMarks === 500, 'Total max marks is 500', `Total: ${extracted10th.totalMarks}`)
assert(extracted10th.calculationEquation?.includes('82') && extracted10th.calculationEquation?.includes('91'), 'Calculation equation contains marks breakdown', `Equation: ${extracted10th.calculationEquation}`)

// ==========================================
// TEST 2: Explicit percentage takes priority over calculated
// ==========================================
console.log('\n--- Test 2: Explicit percentage (79.67%) takes precedence ---')
const sample12thWithExplicitPerc = `
MAHARASHTRA STATE BOARD OF SECONDARY AND HIGHER SECONDARY EDUCATION
HIGHER SECONDARY CERTIFICATE EXAMINATION
SEAT NO: W054415   STREAM: SCIENCE   YEAR: FEBRUARY-2025
CANDIDATE'S NAME: KALAMBE NISHANT SUNIL

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

const extracted12thExplicit = extractAcademicMarksheetDeterministic(sample12thWithExplicitPerc, [], 'TWELFTH')

assert(extracted12thExplicit.percentage === 79.67, 'Explicit percentage 79.67% extracted directly', `Extracted: ${extracted12thExplicit.percentage}`)
assert(extracted12thExplicit.percentageSource === 'DIRECTLY_EXTRACTED', 'Percentage source is DIRECTLY_EXTRACTED', `Source: ${extracted12thExplicit.percentageSource}`)
assert(extracted12thExplicit.studentName?.toUpperCase().includes('KALAMBE NISHANT SUNIL'), 'Candidate name correctly extracted', `Extracted: ${extracted12thExplicit.studentName}`)

// ==========================================
// TEST 3: Subject with Theory + Practical + Total (e.g. 55 + 20 = 75)
// ==========================================
console.log('\n--- Test 3: Avoid double-counting Theory + Practical + Total ---')
const theoryPracticalOCR = `
CENTRAL BOARD OF SECONDARY EDUCATION
ROLL NO: 15129115   YEAR: 2024
NAME: ANANYA SHARMA

SUB CODE  SUB NAME        TH   PR   TOT  GRADE
086       SCIENCE         055  020  075  B1
041       MATHEMATICS     060  020  080  A2
184       ENGLISH LNG     065  020  085  A1
085       HINDI COURSE-A  062  020  082  A2
087       SOCIAL SCIENCE  058  020  078  B1
`

const extractedCBSE = extractAcademicMarksheetDeterministic(theoryPracticalOCR, [], 'TENTH')

// Sum of totals: 75 + 80 + 85 + 82 + 78 = 400. Percentage: 400 / 5 = 80.00%
assert(extractedCBSE.percentage === 80.00, 'Calculated percentage is 80.00% (not inflated by sub-components)', `Extracted percentage: ${extractedCBSE.percentage}`)
assert(extractedCBSE.obtainedMarks === 400, 'Obtained marks total is 400', `Obtained: ${extractedCBSE.obtainedMarks}`)
assert(extractedCBSE.percentageSource === 'CALCULATED_FROM_SUBJECT_MARKS', 'Source is CALCULATED_FROM_SUBJECT_MARKS', `Source: ${extractedCBSE.percentageSource}`)

// ==========================================
// TEST 4: Missing percentage and fewer than 5 subjects -> graceful rejection
// ==========================================
console.log('\n--- Test 4: Insufficient subject count (< 5 subjects) fails gracefully ---')
const insufficientOCR = `
UNKNOWN BOARD RESULT
ROLL NO: 998877
NAME: TEST STUDENT
01 ENGLISH 100 035 080
71 MATHEMATICS 100 035 085
`

const extractedInsufficient = extractAcademicMarksheetDeterministic(insufficientOCR, [], 'TENTH')

assert(extractedInsufficient.percentage === undefined, 'Percentage is undefined when subjects < 5 and no total', `Percentage: ${extractedInsufficient.percentage}`)

// ==========================================
// TEST 5: Deduplication and Grade-Only Subjects Filter
// ==========================================
console.log('\n--- Test 5: Deduplication & Filter Grade-Only Subjects ---')
const mockSubjects = [
  { name: 'ENGLISH', obtainedMarks: 82 },
  { name: '01 ENGLISH', obtainedMarks: 80 }, // Duplicate English, should keep 82
  { name: 'MATHEMATICS', obtainedMarks: 91 },
  { name: 'SCIENCE & TECHNOLOGY', obtainedMarks: 88 },
  { name: 'SOCIAL SCIENCES', obtainedMarks: 85 },
  { name: 'HINDI', obtainedMarks: 79 },
  { name: 'HEALTH & PHYSICAL EDUCATION', grade: 'A' }, // Grade only, exclude
  { name: 'ENV. EDU. & WATER SECURITY', grade: 'A' } // Grade only, exclude
]

const calcRes = calculatePercentageFromFiveSubjects(mockSubjects, 'TENTH')
assert(calcRes !== null, 'Calculation succeeded', `Result: ${JSON.stringify(calcRes)}`)
assert(calcRes.percentage === 85.00, 'Percentage is 85.00% after deduplication', `Percentage: ${calcRes?.percentage}`)
assert(calcRes.selectedSubjects.length === 5, 'Exactly 5 subjects selected', `Count: ${calcRes?.selectedSubjects.length}`)

// Summary
console.log(`\n==========================================`)
console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`)
if (failed === 0) {
  console.log('🎉 ALL MARKSHEET PERCENTAGE CALCULATION TESTS PASSED!')
} else {
  console.error(`💥 ${failed} tests failed!`)
  process.exit(1)
}
