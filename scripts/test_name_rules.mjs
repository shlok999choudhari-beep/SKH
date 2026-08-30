function normalizeStudentName(rawName) {
  if (!rawName) return undefined
  let name = rawName
    .replace(/(?:Candidate(?:'s)?\s*Full\s*Name|Candidate(?:'s)?\s*Name|Student(?:'s)?\s*Name|Name\s*of\s*Candidate|Name\s*of\s*Student|Candidate|Student|Name)[:\s]+/i, '')
    .replace(/\b(?:SHRI|SMT|KUMARI|MR|MS|MRS|DR|MAST|SURNAME|FIRST)\.?\s+/gi, '')
    .replace(/[^a-zA-Z\s\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  name = name.replace(/\bBalaj[tl]\b/i, 'Balaji')
  if (name.length < 3 || name.length > 60) return undefined

  const parts = name.split(/\s+/).filter(p => p.length >= 2)
  if (parts.length < 2 || parts.length > 4) return undefined

  return parts
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function compareStudentDocumentNames(name1, name2) {
  if (!name1 || !name2) {
    return {
      isMatch: false,
      similarity: 0,
      reason: 'One or both documents are missing a recognizable student name.'
    }
  }

  const cleanTokens = (raw) => {
    return raw
      .toLowerCase()
      .replace(/\b(?:candidate|student|name|shri|smt|mr|ms|mrs|dr|kumari|master|surname|first)\b\.?/gi, '')
      .replace(/[^a-z\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(t => t.length >= 2)
  }

  const tokens1 = cleanTokens(name1)
  const tokens2 = cleanTokens(name2)

  if (tokens1.length === 0 || tokens2.length === 0) {
    return {
      isMatch: false,
      similarity: 0,
      reason: 'One or both documents are missing a recognizable student name.'
    }
  }

  const sorted1 = [...tokens1].sort().join(' ')
  const sorted2 = [...tokens2].sort().join(' ')

  // 1. Exact match or Exact First Name <-> Surname permutation
  if (sorted1 === sorted2) {
    return {
      isMatch: true,
      similarity: 1.0,
      unifiedName: normalizeStudentName(name1) || normalizeStudentName(name2)
    }
  }

  const commonTokens = tokens1.filter(t => tokens2.includes(t))

  // 2. Middle Name / Father Name inclusion (2 tokens vs 3 tokens where all 2 tokens are present)
  if (
    (tokens1.length === 2 && tokens2.length === 3 && commonTokens.length === 2) ||
    (tokens2.length === 2 && tokens1.length === 3 && commonTokens.length === 2)
  ) {
    const longerName = tokens1.length >= tokens2.length ? name1 : name2
    return {
      isMatch: true,
      similarity: 0.95,
      unifiedName: normalizeStudentName(longerName)
    }
  }

  // 3. Genuine Mismatch
  const overlapRatio = (commonTokens.length * 2) / (tokens1.length + tokens2.length)
  return {
    isMatch: false,
    similarity: parseFloat(overlapRatio.toFixed(2)),
    reason: 'Name mismatch detected between your documents. Your documents require verification by the institution.'
  }
}

const testCases = [
  { n1: 'Soham Ramshette', n2: 'Ramshette Soham', expected: true, desc: 'First Name <-> Surname Swap' },
  { n1: 'Soham Balaji Ramshette', n2: 'Ramshette Soham Balaji', expected: true, desc: '3-Part Name Permutation' },
  { n1: 'Soham Ramshette', n2: 'Soham Balaji Ramshette', expected: true, desc: 'Middle Name Inclusion' },
  { n1: 'Soham Balaji Ramshette', n2: 'Rahul Balaji Patil', expected: false, desc: 'Different First & Last Name' },
  { n1: 'Soham Ramshette', n2: 'Rahul Patil', expected: false, desc: 'Completely Different Person' },
  { n1: 'MR. SOHAM BALAJI RAMSHETTE', n2: 'RAMSHETTE SOHAM BALAJI', expected: true, desc: 'Honorifics + Permutation' }
]

console.log('=== RUNNING NAME COMPARISON RULE TESTS ===\n')
let passedAll = true
testCases.forEach(({ n1, n2, expected, desc }) => {
  const res = compareStudentDocumentNames(n1, n2)
  const passed = res.isMatch === expected
  if (!passed) passedAll = false
  console.log(`${passed ? '✓ PASS' : '❌ FAIL'}: ${desc}`)
  console.log(`  "${n1}" vs "${n2}" => isMatch: ${res.isMatch} (Expected: ${expected}), Unified: "${res.unifiedName || 'N/A'}"`)
  if (!res.isMatch) console.log(`  Reason: ${res.reason}`)
})

console.log(`\nOverall Result: ${passedAll ? 'ALL TEST CASES PASSED ✓' : 'SOME TESTS FAILED ❌'}`)
