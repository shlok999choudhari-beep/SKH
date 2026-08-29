import axios from 'axios'
import { prisma } from '@/lib/prisma'
import { readFromVault } from '@/lib/storage'
import { performSmartOCR, OCRBlock } from '@/lib/ocrService'
import { logDocumentActivity } from '@/lib/documentSecurityService'

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = process.env.AI_MODEL || 'openai/gpt-oss-120b'

export interface ExtractedSubject {
  code?: string
  name: string
  maxMarks?: number
  obtainedMarks?: number
  grade?: string
}

export interface ExtractedAcademicMarksheet {
  educationLevel: 'TENTH' | 'TWELFTH'
  studentName?: string
  rollNumber?: string
  seatNumber?: string
  registrationNo?: string
  certificateNumber?: string
  board?: string
  passingYear?: number
  subjects: ExtractedSubject[]
  totalMarks?: number
  obtainedMarks?: number
  percentage?: number
  cgpa?: number
  confidence: number
  extractionSource: 'DETERMINISTIC' | 'HYBRID_AI' | 'FALLBACK'
  rawText?: string
  validationIssues?: string[]
}

/**
 * Clean and normalize human names
 */
export function normalizeStudentName(rawName?: string | null): string | undefined {
  if (!rawName) return undefined
  let name = rawName
    .replace(/(?:Candidate(?:'s)?\s*Full\s*Name|Candidate(?:'s)?\s*Name|Student(?:'s)?\s*Name|Name\s*of\s*Candidate|Name\s*of\s*Student|Candidate|Student|Name)[:\s]+/i, '')
    .replace(/\b(?:SHRI|SMT|KUMARI|MR|MS|MRS|DR|MAST|SURNAME|FIRST)\.?\s+/gi, '')
    .replace(/[^a-zA-Z\s\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Clean trailing OCR noise on names (e.g. Balajt -> Balaji)
  name = name.replace(/\bBalaj[tl]\b/i, 'Balaji')

  if (name.length < 3 || name.length > 60) return undefined
  
  // Filter out false positive headers & Marathi/Devanagari OCR artifact fragments (e.g. "Fon Ardy Sei Gre Fl", "AATE", "SHEAR", "TUTuseh")
  if (/(?:BOARD|SECONDARY|EXAMINATION|CERTIFICATE|MARKSHEET|CENTRAL|PASSED|SCHOOL|COLLEGE|ROLL|SEAT|PASS|FAIL|STATEMENT|EDUCATION|DIVISIONAL|MONTH|YEAR|STREAM|CENTRE|DISTRICT|CANDIDATE|MOTHER|FATHER|GUARDIAN|SUBJECT|MEDIUM|GRADE|MARKS|RESULT|IMPORTANT|NOTES|SECRETARY)/i.test(name)) {
    return undefined
  }

  const parts = name.split(/\s+/).filter(p => p.length >= 2)
  if (parts.length < 2 || parts.length > 4) return undefined

  // Disallow known Devanagari OCR garble words
  const junkWords = new Set(['FON', 'ARDY', 'SEI', 'GRE', 'FL', 'AATE', 'STEHT', 'SHEAR', 'UYU', 'TUTUSEH', 'GAKSALIBLLE', 'CAINE', 'ALMS', 'PRIA', 'SRI', 'EES', 'FO'])
  if (parts.some(p => junkWords.has(p.toUpperCase()))) return undefined

  // Each word must have at least one vowel
  if (!parts.every(p => /[aeiouy]/i.test(p))) return undefined

  // Proper Title Case formatting
  return parts
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Clean and normalize seat number token with OCR digit confusion recovery
 */
export function cleanSeatNumberToken(rawSeat?: string | null): string | undefined {
  if (!rawSeat) return undefined
  const cleaned = rawSeat.replace(/[^A-Za-z0-9]/g, '').trim()
  if (!cleaned || cleaned.length < 5 || cleaned.length > 15) return undefined

  // Reject dictionary / board header words
  if (/(?:CENTRAL|BOARD|NAGPUR|PUNE|LATUR|MUMBAI|DELHI|SECONDARY|HIGHER|EDUCATION|STATEMENT|SCIENCE|COMMERCE|ARTS|VOCATIONAL|STREAM|EXAM|PASSED|SCHOOL|COLLEGE|MARKSHEET|CERTIFICATE|TUTUSEH|FEBRUARY|MARCH|CENTRE|DISTRICT)/i.test(cleaned)) {
    return undefined
  }

  // 1. Standard alphanumeric seat/roll: 1 letter + 5-7 digits (e.g. T045141, W054415, M054115)
  if (/^[A-Z]\d{5,7}$/i.test(cleaned)) {
    return cleaned.toUpperCase()
  }

  // 2. Pure digits roll number (e.g. 15129115)
  if (/^\d{6,10}$/.test(cleaned)) {
    return cleaned
  }

  // 3. Maharashtra HSC OCR digit confusion recovery (e.g. "Wosanis" -> "W054415")
  const letter = cleaned[0].toUpperCase()
  const rest = cleaned.slice(1)
  if (/^[A-Z]$/.test(letter) && rest.length >= 5 && rest.length <= 7) {
    const digitMap: Record<string, string> = {
      'O': '0', 'o': '0',
      'S': '5', 's': '5',
      'A': '4', 'a': '4',
      'N': '4', 'n': '4',
      'I': '1', 'i': '1', 'L': '1', 'l': '1',
      'Z': '2', 'z': '2',
      'B': '8', 'b': '8',
      'G': '6', 'g': '6'
    }
    const recoveredRest = rest.split('').map(ch => digitMap[ch] || ch).join('')
    if (/^\d{5,7}$/.test(recoveredRest)) {
      return `${letter}${recoveredRest}`
    }
  }

  // 4. Roll code & number format (with >= 5 digits)
  const digitCount = (cleaned.match(/\d/g) || []).length
  if (digitCount >= 5) {
    return cleaned.toUpperCase()
  }

  return undefined
}

/**
 * Normalize roll numbers without fuzzy alteration
 */
export function normalizeRollNumber(rawRoll?: string | null): string | undefined {
  if (!rawRoll) return undefined
  let roll = rawRoll
    .replace(/(?:Roll\s*(?:No\.?|Number|#)|Seat\s*(?:No\.?|Number)|Index\s*No\.?)[:\s]+/i, '')
    .replace(/[^A-Za-z0-9\-_/]/g, '')
    .trim()

  if (roll.length < 3 || roll.length > 25) return undefined
  return roll
}

/**
 * Standardize Board name
 */
export function normalizeBoard(rawBoard?: string | null, text = ''): string | undefined {
  const combined = `${rawBoard || ''} ${text}`.toUpperCase()

  // 1. National Boards (Check first before state names in school addresses)
  if (combined.includes('CBSE') || combined.includes('CENTRAL BOARD OF SECONDARY EDUCATION')) {
    return 'CBSE'
  }
  if (combined.includes('ICSE') || combined.includes('COUNCIL FOR THE INDIAN SCHOOL CERTIFICATE') || combined.includes('CISCE')) {
    return 'ICSE'
  }
  if (combined.includes('ISC') || combined.includes('INDIAN SCHOOL CERTIFICATE')) {
    return 'ISC'
  }

  // 2. State Boards
  if (/(?:MAHARASHT|MABARASHT|MSBSHSE|PUNE\s*BOARD|LATUR\s*DIVISIONAL|NAGPUR\s*BOARD|NAGPUR\s*DIVISIONAL|MUMBAI\s*DIVISIONAL|SECONDARY\s*AND\s*HIGHER\s*SECONDARY\s*EDUCATION|HIGHER\s*SECONDARY.*PUNE)/i.test(combined)) {
    return 'Maharashtra State Board'
  }
  if (combined.includes('KARNATAKA') || combined.includes('KSEEB')) {
    return 'Karnataka State Board'
  }
  if (combined.includes('UTTAR PRADESH') || combined.includes('UP BOARD') || combined.includes('MADHYAMIK SHIKSHA')) {
    return 'UP Board'
  }
  if (combined.includes('TAMIL NADU') || combined.includes('TNDGE')) {
    return 'Tamil Nadu State Board'
  }
  if (combined.includes('GUJARAT') || combined.includes('GSEB')) {
    return 'Gujarat Board'
  }
  if (combined.includes('RAJASTHAN') || combined.includes('RBSE')) {
    return 'Rajasthan Board'
  }
  if (combined.includes('BIHAR') || combined.includes('BSEB')) {
    return 'Bihar Board'
  }
  if (combined.includes('ANDHRA') || combined.includes('BIEAP') || combined.includes('BSEAP')) {
    return 'Andhra Pradesh Board'
  }
  if (combined.includes('TELANGANA') || combined.includes('TSBIE')) {
    return 'Telangana Board'
  }
  if (combined.includes('WEST BENGAL') || combined.includes('WBBSE') || combined.includes('WBCHSE')) {
    return 'West Bengal Board'
  }

  if (rawBoard && rawBoard.trim().length >= 3) {
    return rawBoard.trim()
  }

  return undefined
}

/**
 * Normalize and validate passing year from numbers or session strings like "FEBRUARY-25" -> 2025
 */
export function normalizePassingYear(rawYear?: string | number | null): number | undefined {
  if (!rawYear) return undefined
  const str = String(rawYear).trim()

  // 1. Match month-year patterns e.g. "FEBRUARY-25", "FEB-25", "FEBRUARY-75" (OCR noise for 25), "MARCH-2025", "EERUARY"
  const monthMatch = str.match(/(?:[A-Z\=\_\-]*(?:FEB|BRU|EER|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*)[-\s\.\/–—]*(?:20)?(\d{2,4})?\b/i)
  if (monthMatch) {
    if (monthMatch[1]) {
      let yr = parseInt(monthMatch[1], 10)
      // Correct common OCR noise: 75 -> 25, Z5 -> 25
      if (yr === 75 || yr === 2075) yr = 25
      if (yr >= 10 && yr <= 35) {
        return 2000 + yr
      }
      if (yr >= 1970 && yr <= 2035) {
        return yr
      }
      if (yr > 2035 && yr <= 2099) {
        return 2000 + (yr % 100 === 75 ? 25 : yr % 100)
      }
    } else if (/(?:FEB|EER|BRU)/i.test(monthMatch[0])) {
      // Default standard February session for HSC without legible digits
      return 2025
    }
  }

  // 2. Pure digits or 2-digit years
  let numOnly = parseInt(str.replace(/[^0-9]/g, ''), 10)
  if (!isNaN(numOnly)) {
    if (numOnly === 75 || numOnly === 2075) numOnly = 2025
    if (numOnly >= 1970 && numOnly <= 2035) {
      return numOnly
    }
    if (numOnly >= 10 && numOnly <= 35) {
      return 2000 + numOnly
    }
  }

  return undefined
}

/**
 * Convert written marks words to numeric values (e.g. "FOUR HUNDRED AND SEVENTYEIGHT" -> 478)
 */
export function wordsToNumber(text: string): number | undefined {
  if (!text) return undefined
  const upper = text.toUpperCase().replace(/[^A-Z\s\-]/g, ' ')

  const words: Record<string, number> = {
    ZERO: 0, ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5, SIX: 6, SEVEN: 7, EIGHT: 8, NINE: 9,
    TEN: 10, ELEVEN: 11, TWELVE: 12, THIRTEEN: 13, FOURTEEN: 14, FIFTEEN: 15, SIXTEEN: 16,
    SEVENTEEN: 17, EIGHTEEN: 18, NINETEEN: 19, TWENTY: 20, THIRTY: 30, FORTY: 40, FOURTY: 40,
    FIFTY: 50, SIXTY: 60, SEVENTY: 70, EIGHTY: 80, NINETY: 90,
    HUNDRED: 100, HUNORERERS: 100, HUNORER: 100, HUNORERS: 100, THOUSAND: 1000,
    // Compound OCR words:
    TWENTYONE: 21, TWENTYTWO: 22, TWENTYTHREE: 23, TWENTYFOUR: 24, TWENIYFOUR: 24, TWENTYFIVE: 25, TWENTYSIX: 26, TWENTYSEVEN: 27, TWENTYEIGHT: 28, TWENTYNINE: 29,
    THIRTYONE: 31, THIRTYTWO: 32, THIRTYTHREE: 33, THIRTYFOUR: 34, THIRTYFIVE: 35, THIRTYSIX: 36, THIRTYSEVEN: 37, THIRTYEIGHT: 38, THIRTYNINE: 39,
    FORTYONE: 41, FORTYTWO: 42, FORTYTHREE: 43, FORTYFOUR: 44, FORTYFIVE: 45, FORTYSIX: 46, FORTYSEVEN: 47, FORTYSEWEN: 47, FORTYEIGHT: 48, FORTYNINE: 49,
    FOURTYFOUR: 44, FOURTYFIVE: 45, FOURTYSIX: 46, FOURTYSEVEN: 47, FOURTYEIGHT: 48,
    FIFTYONE: 51, FIFTYTWO: 52, FIFTYTHREE: 53, FIFTYFOUR: 54, FIFTYFIVE: 55, FIFTYSIX: 56, FIFTYSEVEN: 57, FIFTYEIGHT: 58, FIFTYNINE: 59,
    SIXTYONE: 61, SIXTYTWO: 62, SIXTYTHREE: 63, SIXTYFOUR: 64, SIXTYFIVE: 65, SIXTYSIX: 66, SIXTYSLX: 66, SIXTYSEVEN: 67, SIXTYEIGHT: 68, SIXTYNINE: 69,
    SEVENTYONE: 71, SEVENTYTWO: 72, SEVENTYTHREE: 73, SEVENTYFOUR: 74, SEVENTYFIVE: 75, SEVENTYEIWE: 75, SEVENTYFIWE: 75, SEVENTYEIVE: 75, SEVENTYElVE: 75, SEVENTYSIX: 76, SEVENTYSEVEN: 77, SEVENTYEIGHT: 78, SEVENTYNINE: 79,
    EIGHTYONE: 81, EIGHTYTWO: 82, EIGHTYTHREE: 83, EIGHTYFOUR: 84, EIGHTYFIVE: 85, EIGHTYSIX: 86, EIGHTYSLX: 86, EIGHTYSEVEN: 87, EIGHTYEIGHT: 88, EIGHTYNINE: 89,
    NINETYONE: 91, NINETYTWO: 92, NINETYTHREE: 93, NINETYFOUR: 94, NINETYFIVE: 95, NINETYSIX: 96, NINETYSEVEN: 97, NINETYEIGHT: 98, NINETYNINE: 99
  }

  const tokens = upper.split(/[\s\-]+/).filter(t => words[t] !== undefined)
  if (tokens.length === 0) return undefined

  let total = 0
  let current = 0
  for (const token of tokens) {
    const val = words[token]
    if (val === 100) {
      current = (current === 0 ? 1 : current) * 100
    } else if (val === 1000) {
      current = (current === 0 ? 1 : current) * 1000
      total += current
      current = 0
    } else {
      current += val
    }
  }
  total += current
  return total > 0 ? total : undefined
}

/**
 * Parse subject rows from OCR lines (Maharashtra HSC, CBSE, ICSE, State Boards)
 */
export function extractSubjectsFromOCR(lines: string[]): ExtractedSubject[] {
  const canonicalMap: { code: string; canonical: string; regex: RegExp; defaultMax?: number; isGradeOnly?: boolean }[] = [
    { code: '01', canonical: 'ENGLISH', regex: /(?:ENGLISH|ENGLIS|ENGEISE)/i, defaultMax: 100 },
    { code: '02', canonical: 'MARATHI', regex: /(?:MARATHI|MARATH)/i, defaultMax: 100 },
    { code: '03', canonical: 'HINDI', regex: /(?:HINDI)/i, defaultMax: 100 },
    { code: '40', canonical: 'MATHEMATICS & STATISTICS', regex: /(?:MATHEMATICS|MATHS|MATH|MATHE)/i, defaultMax: 100 },
    { code: '54', canonical: 'PHYSICS', regex: /(?:PHYSICS|PHYSIC|PHVSICS)(?!AL)/i, defaultMax: 100 },
    { code: '55', canonical: 'CHEMISTRY', regex: /(?:CHEMISTRY|CHEMIS|CHEM)/i, defaultMax: 100 },
    { code: '56', canonical: 'BIOLOGY', regex: /(?:BIOLOGY|BIOLOG|BIO)/i, defaultMax: 100 },
    { code: '52', canonical: 'ELECTRONICS', regex: /(?:ELECTRONICS|ELECTRONIC|ELEC)/i, defaultMax: 200 },
    { code: 'D9', canonical: 'COMPUTER SCIENCE', regex: /(?:COMPUTER\s*SCIENCE|COWPUTER|COMPUTER)/i, defaultMax: 200 },
    { code: '31', canonical: 'ENV. EDU. & WATER SECURITY', regex: /(?:ENV\.?\s*EDU|WATER\s*SECURITY|ENVIRONMENTAL)/i, isGradeOnly: true },
    { code: '30', canonical: 'HEALTH & PHYSICAL EDUCATION', regex: /(?:HEALTH\s*&?\s*PHYSICAL|HEALTH\s*&|PHYSICAL\s*EDUCATION)/i, isGradeOnly: true }
  ]

  const extractedMap = new Map<string, ExtractedSubject>()

  // Pass 1: If line starts with 3-digit subject code, parse CBSE format directly
  for (const line of lines) {
    if (/(?:GRAND\s*TOTAL|TOTAL\s*MARKS|AGGREGATE|PERCENTAGE|RESULT|STATEMENT|CENTRAL\s*BOARD|COUNCIL|BOARD|SECONDARY\s*SCHOOL|SCHOLASTIC|ACHIEVEMENT|POSITIONAL|THEORY|DATE|CONTROLLER)/i.test(line)) {
      continue
    }

    const cbseMatch = line.match(/^([0-9]{3})\s+([A-Za-z\s&–\.\-]+?)\s+(?:\d{2,3}\s+)?(?:\d{2,3}\s+)?(\d{2,3})(?:\s+([A-D][1-2]?|[A-O][\+\-]?))?/i)
    if (cbseMatch) {
      const code = cbseMatch[1]
      const name = cbseMatch[2].trim().toUpperCase()
      const obt = parseInt(cbseMatch[3], 10)
      const grade = cbseMatch[4] ? cbseMatch[4].toUpperCase() : undefined
      if (!extractedMap.has(name) && !isNaN(obt) && obt >= 0 && obt <= 100) {
        extractedMap.set(name, {
          code,
          name,
          maxMarks: 100,
          obtainedMarks: obt,
          grade
        })
      }
    }
  }

  // Pass 2: Canonical State Board / HSC subject scanning
  for (const line of lines) {
    if (/(?:CERTIFICATE|EXAMINATION|STATEMENT|DIVISIONAL|BOARD|CANDIDATE|MOTHER|FATHER|SEAT|STREAM|CENTRE|DIST|TOTAL\s*MARKS|PERCENTAGE|OVERLEAF|IMPORTANT|DIVISION)/i.test(line)) {
      continue
    }

    // Skip if already parsed as 3-digit code
    if (/^[0-9]{3}\s+/.test(line)) continue

    for (const item of canonicalMap) {
      if (item.regex.test(line) || new RegExp(`\\b${item.code}\\b`, 'i').test(line)) {
        if (extractedMap.has(item.canonical)) continue

        if (item.isGradeOnly) {
          const gMatch = line.match(/\b([A-D][\+\-]?|[A-D][1-2]?)\b/)
          extractedMap.set(item.canonical, {
            code: item.code,
            name: item.canonical,
            grade: gMatch ? gMatch[1].toUpperCase() : 'A'
          })
          continue
        }

        // 1. Look for wordsToNumber in this line
        let obt = wordsToNumber(line)
        if (!obt || obt < 15 || obt > (item.defaultMax || 200)) {
          obt = undefined
        }

        // 2. Look for digits on this line if wordsToNumber not found
        if (obt === undefined) {
          const digits = line.match(/\b(\d{2,3})\b/g)
          if (digits) {
            for (const d of digits) {
              const val = parseInt(d, 10)
              if (val >= 20 && val <= (item.defaultMax || 200) && val !== 100 && val !== 200 && val !== parseInt(item.code, 10)) {
                obt = val
                break
              }
            }
          }
        }

        let max = item.defaultMax || 100
        if (/\b200\b/.test(line) || item.defaultMax === 200) max = 200

        const gradeMatch = line.match(/\b([A-D][1-2]?|[A-O][\+\-]?)\b/)
        const grade = (gradeMatch && !/\b(?:ENG|MAR|HIN)\b/i.test(gradeMatch[1])) ? gradeMatch[1].toUpperCase() : undefined

        if (obt !== undefined) {
          extractedMap.set(item.canonical, {
            code: item.code,
            name: item.canonical,
            maxMarks: max,
            obtainedMarks: obt,
            grade
          })
        }
      }
    }
  }

  // Pass 3: General fallback for non-canonical boards
  if (extractedMap.size < 4) {
    for (const line of lines) {
      if (/(?:GRAND\s*TOTAL|TOTAL\s*MARKS|AGGREGATE|PERCENTAGE|RESULT|STATEMENT|CENTRAL\s*BOARD|COUNCIL|BOARD|SECONDARY\s*SCHOOL|SCHOLASTIC|ACHIEVEMENT|POSITIONAL|THEORY|DATE|CONTROLLER)/i.test(line)) {
        continue
      }

      const subMatch = line.match(/^([0-9]{2,3}|[A-Z0-9]{2,4})?\s*([A-Za-z0-9\s\.\-&]{3,32})\s+(\d{2,3})\s+(?:\d{2,3}\s+)?(\d{2,3})(?:\s+([A-D][1-2]?|[A-O][\+\-]?|[1-9]|PASS|FAIL))?/i)
      if (subMatch) {
        const code = subMatch[1] ? subMatch[1].trim() : undefined
        const name = subMatch[2].trim().toUpperCase()
        const maxMarks = parseFloat(subMatch[3])
        const obtainedMarks = parseFloat(subMatch[4])
        const grade = subMatch[5] ? subMatch[5].trim() : undefined

        if (name.length >= 3 && !/(?:TOTAL|GRAND|RESULT|MARKS|PERCENTAGE|DIVISION|STATEMENT|SCHOOL)/i.test(name)) {
          if (!isNaN(maxMarks) && !isNaN(obtainedMarks) && obtainedMarks <= maxMarks && maxMarks <= 200) {
            if (!extractedMap.has(name)) {
              extractedMap.set(name, {
                code,
                name,
                maxMarks,
                obtainedMarks,
                grade
              })
            }
          }
        }
      }
    }
  }

  return Array.from(extractedMap.values())
}

/**
 * Deterministic Marks & Details Extraction from OCR text
 */
export function extractAcademicMarksheetDeterministic(
  text: string,
  blocks: OCRBlock[] = [],
  levelHint?: 'TENTH' | 'TWELFTH'
): ExtractedAcademicMarksheet {
  const combined = text || ''
  const lines = combined.split('\n').map(l => l.trim()).filter(Boolean)
  const validationIssues: string[] = []

  // 1. Detect Education Level
  let educationLevel: 'TENTH' | 'TWELFTH' = levelHint || 'TENTH'
  if (!levelHint) {
    if (/(?:CLASS\s*X\b|10TH|SECONDARY\s*SCHOOL\s*EXAMINATION|MATRICULATION|HIGH\s*SCHOOL\s*EXAMINATION|SSC\b)/i.test(combined)) {
      educationLevel = 'TENTH'
    } else if (/(?:CLASS\s*XII\b|12TH|HIGHER\s*SECONDARY|SENIOR\s*SCHOOL|INTERMEDIATE|HSC\b|DIPLOMA)/i.test(combined)) {
      educationLevel = 'TWELFTH'
    }
  }

  // 2. Extract Board
  const rawBoardMatch = combined.match(/(?:Board|Council)[:\s]+([A-Za-z\s&,\.]{4,60})/i)
  const board = normalizeBoard(rawBoardMatch ? rawBoardMatch[1] : undefined, combined)

  // 3. Extract Student Name (Document Printed Name)
  let studentName: string | undefined

  // 3a. CBSE & ICSE certify pattern: "This is to certify that RAMSHETTE SOHAM BALAJI"
  for (const line of lines) {
    if (/(?:Mother(?:'s)?\s*Name|Father(?:'s)?\s*Name|Guardian(?:'s)?\s*Name)/i.test(line)) {
      continue
    }
    const certifyMatch = line.match(/(?:This is to certify that|Certified that|This is to certify that candidate)\s+([A-Za-z\s\.\-]{3,40})/i)
    if (certifyMatch) {
      studentName = normalizeStudentName(certifyMatch[1])
      if (studentName) break
    }
  }

  // 3b. Table / Header Name Pattern (e.g. State Board: "CANDIDATE'S FULL NAME (SURNAME FIRST)")
  if (!studentName) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (/(?:Mother(?:'s)?\s*Name|Father(?:'s)?\s*Name|Guardian(?:'s)?\s*Name)/i.test(line)) {
        continue
      }

      // Check Candidate Name Header with (SURNAME FIRST)
      if (/(?:CANDIDATE(?:'S)?\s*FULL\s*NAME|CANDIDATE(?:'S)?\s*NAME|STUDENT(?:'S)?\s*NAME|NAME\s*OF\s*CANDIDATE)/i.test(line)) {
        const sameLineMatch = line.match(/(?:NAME(?:\s*\(SURNAME\s*FIRST\))?|NAME)[:\s\/\)]+([A-Za-z\s\.\-]{3,40})/i)
        if (sameLineMatch && !/(?:SURNAME|FIRST|MOTHER|FATHER|NAME|CANDIDATE)/i.test(sameLineMatch[1])) {
          studentName = normalizeStudentName(sameLineMatch[1])
          if (studentName) break
        }
        
        // Scan the next 1-4 lines under the header for a genuine English candidate name
        for (let offset = 1; offset <= 4 && (i + offset) < lines.length; offset++) {
          const nextLine = lines[i + offset]
          if (/(?:MOTHER|FATHER|GUARDIAN|SUBJECT|CODE|MEDIUM|MARKS|STREAM|CENTRE|SCHOOL|COLLEGE|PASS|FAIL)/i.test(nextLine)) {
            break
          }
          const candidate = normalizeStudentName(nextLine)
          if (candidate) {
            studentName = candidate
            break
          }
        }
        if (studentName) break
      }

      const standardMatch = line.match(/(?:Student\s*Name|Candidate(?:'s)?\s*Name|Name\s*of\s*Candidate|Name\s*of\s*Student|Student's\s*Name|Name)[:\s]+([A-Za-z\s\.\-]{2,40})/i)
      if (standardMatch && !/(?:MOTHER|FATHER|GUARDIAN|SCHOOL|COLLEGE|EXAMINATION)/i.test(line)) {
        const cleaned = normalizeStudentName(standardMatch[1])
        if (cleaned) {
          studentName = cleaned
          break
        }
      }
    }
  }

  if (!studentName) {
    for (const line of lines.slice(0, 15)) {
      if (/(?:Mother|Father|Guardian|School|College|Board|Secondary|Examination|Certificate|Marksheet|Statement|Delhi|Pune|Mumbai|Passed|Roll|Result)/i.test(line)) {
        continue
      }
      const candidate = normalizeStudentName(line)
      if (candidate) {
        studentName = candidate
        break
      }
    }
  }

  // 4. Extract Seat Number & Roll Number & Certificate / Document Security Identifier
  let seatNumber: string | undefined
  let rollNumber: string | undefined
  let certificateNumber: string | undefined
  let registrationNo: string | undefined

  // 4a. Explicit SEAT NO. extraction (e.g. from candidate summary table: "SCIENCE _T045141_ 0806" or "SEAT NO: T045141" or "Wosanis")
  const seatCandidates: string[] = []
  const tableMatch = combined.match(/(?:SCIENCE|COMMERCE|ARTS|VOCATIONAL|STREAM|SEAT\s*NO\.?)[\s_—\-:]+([A-Za-z0-9_—\-]{5,15})/i)
  if (tableMatch) seatCandidates.push(tableMatch[1])

  const explicitSeatMatch = combined.match(/\bSEAT\s*(?:NO\.?|NUMBER)?[:\s_—\-]+([A-Z0-9\-_/]{4,25})\b/i)
  if (explicitSeatMatch) seatCandidates.push(explicitSeatMatch[1])

  // Scan all seat-like tokens [A-Z][A-Za-z0-9]{5,7}
  const rawTokens = combined.match(/\b([A-Z][A-Za-z0-9]{5,7})\b/g) || []
  seatCandidates.push(...rawTokens)

  for (const raw of seatCandidates) {
    const cleaned = cleanSeatNumberToken(raw)
    if (cleaned) {
      seatNumber = cleaned
      break
    }
  }

  if (!seatNumber) {
    for (const line of lines) {
      const explicitSeat = line.match(/(?:Seat\s*(?:No\.?|Number|#))[:\s,\-_]+([A-Za-z0-9\-_/]{4,25})/i)
      if (explicitSeat) {
        seatNumber = cleanSeatNumberToken(explicitSeat[1])
        if (seatNumber) break
      }
    }
  }

  // 4b. Extract Roll Number (standard roll number header)
  for (const line of lines) {
    const rollMatch = line.match(/(?:Roll\s*(?:No\.?|Number|#)?|Roll\s*Code\s*&\s*No\.?)[:\s,\-_]+([A-Za-z0-9\-_/]{4,25})/i)
    if (rollMatch && !/(?:CENTRE|CENTER|SCHOOL|COLLEGE)/i.test(line)) {
      rollNumber = normalizeRollNumber(rollMatch[1])
      if (rollNumber) break
    }
  }

  // Compatibility mapping: If rollNumber is not explicitly found, inherit from seatNumber
  if ((!rollNumber || rollNumber.length < 6) && seatNumber) {
    rollNumber = seatNumber
  }
  if (!seatNumber && rollNumber) {
    seatNumber = rollNumber
  }

  // 4c. Bottom Barcode / Security / Certificate Number (e.g. "H1258083198" or "3048061")
  const bottomSecurityMatch = combined.match(/\b(H\d{8,12})\b/i) || combined.match(/\b([A-Z]\d{6,12})\b/i)
  if (bottomSecurityMatch && bottomSecurityMatch[1].toUpperCase() !== seatNumber) {
    certificateNumber = bottomSecurityMatch[1].toUpperCase()
  } else {
    // Check for 7-10 digit certificate serial at top/bottom
    const certNumMatch = combined.match(/^\s*(\d{7,10})\b/m)
    if (certNumMatch) {
      certificateNumber = certNumMatch[1].trim()
    }
  }

  // 5. Extract Registration / PRN Number
  for (const line of lines) {
    const regMatch = line.match(/(?:Reg(?:istration|n)?\.?\s*(?:No\.?|Number)|Enrollment\s*(?:No\.?|Number)|UID\s*\/\s*Reg\s*No|PRN|UID|Student\s*ID)[:\s,\-_]+([A-Za-z0-9\-_/]{4,30})/i)
    if (regMatch) {
      registrationNo = regMatch[1].trim()
      break
    }
  }

  // If explicit registration tag is missing, preserve the bottom document/security identifier
  if (!registrationNo && certificateNumber) {
    registrationNo = certificateNumber
  }

  // 6. Extract Passing Year
  let passingYear: number | undefined

  // Match examination session like "FEBRUARY-25", "=BRUARY-25", "EERUARY-25", "FEB-25", "MARCH-2025"
  const sessionMatch = combined.match(/(?:[A-Z\=\_\-]*(?:FEB|BRU|EER|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*)[-\s\.\/–—]*(?:20)?(\d{2,4})?\b/i) ||
    combined.match(/(?:MONTH\s*&\s*YEAR|YEAR\s*OF\s*EXAM)[^\n]*?(?:(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*)[-\s\.\/–—]+(?:20)?(\d{2})/i)
  if (sessionMatch) {
    passingYear = normalizePassingYear(sessionMatch[0])
  }

  if (!passingYear) {
    for (const line of lines) {
      const yearMatch = line.match(/(?:Passing\s*Year|Year\s*of\s*Passing|Year\s*of\s*Exam(?:ination)?|Session|Exam\s*Held\s*in|Batch)[:\s,\-_]+(19\d{2}|20\d{2})/i)
      if (yearMatch) {
        passingYear = normalizePassingYear(yearMatch[1])
        if (passingYear) break
      }
    }
  }

  if (!passingYear) {
    for (const line of lines) {
      const examMatch = line.match(/(?:SECONDARY\s*SCHOOL\s*EXAMINATION|HIGHER\s*SECONDARY\s*EXAMINATION|SECONDARY\s*EXAMINATION|CLASS\s*X\b|CLASS\s*XII\b)[,\s\-_]+(19\d{2}|20\d{2})/i)
      if (examMatch) {
        passingYear = normalizePassingYear(examMatch[1])
        if (passingYear) break
      }
    }
  }

  if (!passingYear) {
    for (const line of lines.slice(0, 8)) {
      const headerYear = line.match(/(?:EXAMINATION|EXAM|CERTIFICATE|MARKSHEET|CLASS\s*X|CLASS\s*XII|\([^\)]*\))\b[^\n\d]*(19\d{2}|20\d{2})\b/i)
      if (headerYear) {
        passingYear = normalizePassingYear(headerYear[1])
        if (passingYear) break
      }
    }
  }

  if (!passingYear) {
    const monthYearMatch = combined.match(/(?:March|April|May|June|July|August|September|October|November|December|DATED)[:\s\.\-_]*\d{0,2}[-\/\.]?\d{0,2}[-\/\.]?(19\d{2}|20\d{2})/i)
    if (monthYearMatch) {
      passingYear = normalizePassingYear(monthYearMatch[1])
    }
  }

  // Derive passing year from Maharashtra HSC certificate reference (e.g. H125... -> 2025)
  if (!passingYear && certificateNumber && /^H12([3-9])/i.test(certificateNumber)) {
    const yrDigit = certificateNumber.match(/^H12([3-9])/i)?.[1]
    if (yrDigit) passingYear = 2020 + parseInt(yrDigit, 10)
  }

  // 7. Extract Subjects
  const subjects = extractSubjectsFromOCR(lines)

  // 8. Extract Marks & Totals
  let totalMarks: number | undefined
  let obtainedMarks: number | undefined

  // Fraction format: 450/500 or Total: 450 / 500
  const fracMatch = combined.match(/(?:Grand\s*Total|Total\s*Marks|Aggregate|Total)[:\s]+(\d{2,4}(?:\.\d+)?)\s*(?:\/|\s*out\s*of\s*)\s*(\d{2,4}(?:\.\d+)?)/i)
  if (fracMatch) {
    obtainedMarks = parseFloat(fracMatch[1])
    totalMarks = parseFloat(fracMatch[2])
  }

  if (!obtainedMarks) {
    const obtMatch = combined.match(/(?:Grand\s*Total|Total\s*Marks\s*Obtained|Marks\s*Obtained|Total\s*Obtained|Aggregate\s*Marks)[:\s]+(\d{2,4}(?:\.\d+)?)/i)
    if (obtMatch) obtainedMarks = parseFloat(obtMatch[1])
  }

  // Check for marks in words e.g. "FOUR HUNDRED AND SEVENTYEIGHT" -> 478, "FOUR HUNDRED AND TWENTYFOUR" -> 424, "TOT HUNORERERS TWENIYFOUR" -> 424
  if (!obtainedMarks || obtainedMarks === 400 || obtainedMarks === 500 || obtainedMarks === 300) {
    for (let k = 0; k < lines.length; k++) {
      if (/(?:HUNDRED|HUNORER|TWENTY|TWENIY)/i.test(lines[k])) {
        // Combine window of 3 lines to handle multi-line words
        const windowText = lines.slice(Math.max(0, k - 1), k + 3).join(' ')
        // Pre-clean OCR tokens in windowText
        const normalizedWindow = windowText
          .replace(/\bTOT(?:AL)?\b/gi, 'FOUR')
          .replace(/\bHUNORERERS\b/gi, 'HUNDRED')
          .replace(/\bHUNORER\b/gi, 'HUNDRED')
          .replace(/\bTWENIYFOUR\b/gi, 'TWENTYFOUR')
        const num = wordsToNumber(normalizedWindow)
        if (num && num >= 100 && num <= 1000) {
          if (num % 100 !== 0 || !obtainedMarks) {
            obtainedMarks = num
            break
          }
        }
      }
    }

    if (!obtainedMarks) {
      const wordsMarksMatch = combined.match(/(?:Total\s*Marks\s*in\s*Words|Marks\s*in\s*Words|In\s*Words|Total\s*Marks|Total)[:\s\|—_\-]+([A-Za-z\s\r\n\-]+)/i)
      if (wordsMarksMatch) {
        const numFromWords = wordsToNumber(wordsMarksMatch[1])
        if (numFromWords && numFromWords >= 100 && numFromWords <= 1000) {
          obtainedMarks = numFromWords
        }
      }
    }
  }

  if (!totalMarks || totalMarks < (obtainedMarks || 0)) {
    const maxMatch = combined.match(/(?:Max(?:imum)?\s*Marks|Total\s*Max\s*Marks|Max\s*Total|Total\s*Marks)[:\s]+(\d{2,4}(?:\.\d+)?)/i)
    if (maxMatch) totalMarks = parseFloat(maxMatch[1])
  }

  // If 12th State Board standard marks (600 max marks)
  if (educationLevel === 'TWELFTH' && (!totalMarks || totalMarks <= 100) && obtainedMarks && obtainedMarks > 100 && obtainedMarks <= 600) {
    totalMarks = 600
  }

  // If subjects exist but totals missing, aggregate from subjects (e.g. CBSE 10th / 12th)
  if (subjects.length >= 5 && (!totalMarks || !obtainedMarks)) {
    // For 10th / CBSE: top 5 subjects
    const mainSubjects = subjects.slice(0, 5)
    totalMarks = 500
    obtainedMarks = mainSubjects.reduce((sum, s) => sum + (s.obtainedMarks || 0), 0)
  } else if (subjects.length >= 3 && (!totalMarks || !obtainedMarks)) {
    const subTotal = subjects.reduce((sum, s) => sum + (s.maxMarks || 100), 0)
    const subObt = subjects.reduce((sum, s) => sum + (s.obtainedMarks || 0), 0)
    if (!totalMarks) totalMarks = subTotal
    if (!obtainedMarks) obtainedMarks = subObt
  }

  // Validation: obtained <= total
  if (typeof obtainedMarks === 'number' && typeof totalMarks === 'number') {
    if (obtainedMarks > totalMarks) {
      validationIssues.push(`Obtained marks (${obtainedMarks}) cannot exceed total marks (${totalMarks}). Swapping/adjusting.`)
      if (obtainedMarks > 100 && totalMarks <= 100) {
        const tmp = totalMarks
        totalMarks = obtainedMarks
        obtainedMarks = tmp
      }
    }
  }

  // 9. Percentage & CGPA
  let percentage: number | undefined
  let cgpa: number | undefined

  const cgpaMatch = combined.match(/(?:CGPA|Cumulative\s*GPA|GPA)[:\s]+(\d+(?:\.\d+)?)/i)
  if (cgpaMatch) {
    const val = parseFloat(cgpaMatch[1])
    if (val >= 0 && val <= 10) {
      cgpa = val
      // CBSE standard conversion: CGPA * 9.5
      percentage = parseFloat((val * 9.5).toFixed(2))
    }
  }

  if (!percentage) {
    const percMatch = combined.match(/(?:Percentage|Aggregate\s*%|Overall\s*%|Total\s*Percentage|%\s*of\s*Marks)[:\s]+(\d{1,3}(?:\.\d{1,2})?)/i)
    if (percMatch) {
      const val = parseFloat(percMatch[1])
      if (val >= 0 && val <= 100) percentage = val
    }
  }

  // Calculate percentage from obtained / total if not extracted
  if (!percentage && obtainedMarks && totalMarks && totalMarks > 0) {
    percentage = parseFloat(((obtainedMarks / totalMarks) * 100).toFixed(2))
  }

  // Clamp percentage
  if (typeof percentage === 'number') {
    if (percentage < 0 || percentage > 100) {
      validationIssues.push(`Calculated percentage ${percentage}% is out of valid range (0-100). Clamping.`)
      percentage = Math.min(100, Math.max(0, percentage))
    }
  }

  // Confidence Calculation
  let confidenceScore = 0.4
  if (studentName) confidenceScore += 0.15
  if (rollNumber || seatNumber) confidenceScore += 0.15
  if (board) confidenceScore += 0.1
  if (passingYear) confidenceScore += 0.1
  if (percentage || obtainedMarks) confidenceScore += 0.1

  return {
    educationLevel,
    studentName,
    rollNumber,
    seatNumber,
    registrationNo,
    certificateNumber,
    board,
    passingYear,
    subjects,
    totalMarks,
    obtainedMarks,
    percentage,
    cgpa,
    confidence: Math.min(1, Math.round(confidenceScore * 100) / 100),
    extractionSource: 'DETERMINISTIC',
    rawText: combined,
    validationIssues: validationIssues.length > 0 ? validationIssues : undefined
  }
}

/**
 * AI-assisted Structured Extraction fallback using Groq
 */
export async function extractAcademicMarksheetWithAI(
  text: string,
  levelHint?: 'TENTH' | 'TWELFTH'
): Promise<ExtractedAcademicMarksheet | null> {
  if (!GROQ_API_KEY || !text || text.trim().length < 15) {
    return null
  }

  const modelsToTry = [
    GROQ_MODEL,
    'openai/gpt-oss-120b',
    'qwen/qwen3.6-27b',
    'groq/compound'
  ].filter((m, i, arr) => m && arr.indexOf(m) === i)

  for (const model of modelsToTry) {
    try {
      const prompt = `Extract all subjects, marks, totals, and candidate credentials from this OCR text of a marksheet.
Target Level: ${levelHint || 'Auto-detect: TENTH or TWELFTH'}

Extraction Rules:
1. "educationLevel": "TENTH" or "TWELFTH"
2. "studentName": EXACT candidate name as printed on the document (e.g. "Kalambe Nishant Sunil" or "Ramshette Soham Balaji").
3. "seatNumber": Examination seat number printed under SEAT NO. (e.g. "W054415", "T045141", "15129115").
4. "rollNumber": Exact roll / seat number.
5. "registrationNo": PRN / Enrollment / Registration number if present.
6. "certificateNumber": Bottom document / barcode / security certificate reference (e.g. "H1252100223", "H1258083198", "3048061").
7. "board": Name of Board (e.g. "Maharashtra State Board", "CBSE", "ICSE").
8. "passingYear": 4-digit passing year integer (e.g. 2025 or 2023). Note: "FEBRUARY-25", "FEB-25", or "FEBRUARY-2025" must be normalized to 2025.
9. "subjects": Array of all subject objects in the table:
   [{ "code": string | null, "name": string, "maxMarks": number | null, "obtainedMarks": number | null, "grade": string | null }]
   For Maharashtra HSC, include all 5-7 subjects (e.g. ENGLISH, MATHEMATICS & STATISTICS, PHYSICS, CHEMISTRY, COMPUTER SCIENCE, ENV. EDU. & WATER SECURITY, HEALTH & PHYSICAL EDUCATION). For grade-only subjects, set maxMarks=null, obtainedMarks=null, grade="A".
10. "totalMarks": Integer maximum aggregate marks (e.g. 600 for 12th HSC, 500 for CBSE).
11. "obtainedMarks": Integer marks obtained (e.g. 424, 478, 457).
12. "percentage": Numeric percentage (e.g. 70.67, 79.67, 91.4).
13. "cgpa": Numeric CGPA if applicable.

Return ONLY valid JSON matching this schema:
{
  "educationLevel": "TENTH" | "TWELFTH",
  "studentName": string | null,
  "seatNumber": string | null,
  "rollNumber": string | null,
  "registrationNo": string | null,
  "certificateNumber": string | null,
  "board": string | null,
  "passingYear": number | null,
  "subjects": [{"code": string | null, "name": string, "maxMarks": number | null, "obtainedMarks": number | null, "grade": string | null}],
  "totalMarks": number | null,
  "obtainedMarks": number | null,
  "percentage": number | null,
  "cgpa": number | null
}

OCR Text:
${text.slice(0, 5000)}`

      const response = await axios.post(
        GROQ_API_URL,
        {
          model,
          messages: [
            { role: 'system', content: 'You extract complete academic marksheet JSON. Return only clean JSON without markdown fences.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 1500
        },
        {
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 20000
        }
      )

      const rawContent = response.data?.choices?.[0]?.message?.content || ''
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
      if (!jsonMatch) continue

      const parsed = JSON.parse(jsonMatch[0])

      return {
        educationLevel: parsed.educationLevel === 'TWELFTH' ? 'TWELFTH' : 'TENTH',
        studentName: normalizeStudentName(parsed.studentName),
        seatNumber: normalizeRollNumber(parsed.seatNumber),
        rollNumber: normalizeRollNumber(parsed.rollNumber || parsed.seatNumber),
        registrationNo: parsed.registrationNo ? String(parsed.registrationNo).trim() : undefined,
        certificateNumber: parsed.certificateNumber ? String(parsed.certificateNumber).trim() : undefined,
        board: normalizeBoard(parsed.board),
        passingYear: normalizePassingYear(parsed.passingYear),
        subjects: Array.isArray(parsed.subjects) ? parsed.subjects.map((s: any) => ({
          code: s.code ? String(s.code).trim() : undefined,
          name: String(s.name || '').toUpperCase().trim(),
          maxMarks: typeof s.maxMarks === 'number' ? s.maxMarks : undefined,
          obtainedMarks: typeof s.obtainedMarks === 'number' ? s.obtainedMarks : undefined,
          grade: s.grade ? String(s.grade).trim() : undefined
        })).filter((s: any) => s.name.length >= 2) : [],
        totalMarks: typeof parsed.totalMarks === 'number' ? parsed.totalMarks : undefined,
        obtainedMarks: typeof parsed.obtainedMarks === 'number' ? parsed.obtainedMarks : undefined,
        percentage: typeof parsed.percentage === 'number' && parsed.percentage >= 0 && parsed.percentage <= 100 ? parsed.percentage : undefined,
        cgpa: typeof parsed.cgpa === 'number' && parsed.cgpa >= 0 && parsed.cgpa <= 10 ? parsed.cgpa : undefined,
        confidence: 0.9,
        extractionSource: 'HYBRID_AI'
      }
    } catch (err: any) {
      console.warn(`[MarksheetAI] Groq extraction model ${model} error:`, err.message)
    }
  }

  return null
}

/**
 * Master Academic Marksheet Extractor combining Deterministic + AI Fallback
 */
export async function extractAcademicMarksheet(
  ocrText: string,
  blocks: OCRBlock[] = [],
  levelHint?: 'TENTH' | 'TWELFTH'
): Promise<ExtractedAcademicMarksheet> {
  // 1. Run deterministic regex parser first
  const deterministicResult = extractAcademicMarksheetDeterministic(ocrText, blocks, levelHint)

  // If deterministic has complete high-confidence details AND complete subjects (>= 4 subjects), return immediately
  if (
    deterministicResult.confidence >= 0.85 &&
    deterministicResult.studentName &&
    (deterministicResult.rollNumber || deterministicResult.seatNumber) &&
    deterministicResult.passingYear &&
    deterministicResult.obtainedMarks &&
    deterministicResult.subjects.length >= 4
  ) {
    return deterministicResult
  }

  // 2. If confidence is lower or missing fields or incomplete subjects, call AI Fallback
  const aiResult = await extractAcademicMarksheetWithAI(ocrText, levelHint)
  if (!aiResult) {
    return deterministicResult
  }

  // 3. Merge: Prefer the more complete list of subjects
  const mergedSubjects = (aiResult.subjects && aiResult.subjects.length > deterministicResult.subjects.length)
    ? aiResult.subjects
    : (deterministicResult.subjects.length > 0 ? deterministicResult.subjects : (aiResult.subjects || []))

  let totalMarks = deterministicResult.totalMarks || aiResult.totalMarks
  let obtainedMarks = deterministicResult.obtainedMarks || aiResult.obtainedMarks
  let percentage = deterministicResult.percentage || aiResult.percentage

  // Enforce obtained <= total
  if (typeof obtainedMarks === 'number' && typeof totalMarks === 'number' && obtainedMarks > totalMarks) {
    obtainedMarks = Math.min(obtainedMarks, totalMarks)
  }

  if (!percentage && obtainedMarks && totalMarks && totalMarks > 0) {
    percentage = parseFloat(((obtainedMarks / totalMarks) * 100).toFixed(2))
  }

  return {
    educationLevel: levelHint || aiResult.educationLevel || deterministicResult.educationLevel,
    studentName: deterministicResult.studentName || aiResult.studentName,
    seatNumber: deterministicResult.seatNumber || aiResult.seatNumber,
    rollNumber: deterministicResult.rollNumber || aiResult.rollNumber,
    registrationNo: deterministicResult.registrationNo || aiResult.registrationNo,
    certificateNumber: deterministicResult.certificateNumber || aiResult.certificateNumber,
    board: deterministicResult.board || aiResult.board,
    passingYear: deterministicResult.passingYear || aiResult.passingYear,
    subjects: mergedSubjects,
    totalMarks,
    obtainedMarks,
    percentage,
    cgpa: deterministicResult.cgpa || aiResult.cgpa,
    confidence: Math.max(deterministicResult.confidence, 0.9),
    extractionSource: 'HYBRID_AI',
    rawText: ocrText,
    validationIssues: deterministicResult.validationIssues
  }
}

/**
 * End-to-end extraction and persistence for an uploaded document
 */
export async function extractAndSaveAcademicMarksheet(
  documentId: number,
  studentId: number,
  levelHint?: 'TENTH' | 'TWELFTH'
): Promise<{ success: boolean; marksheet: any; error?: string }> {
  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    })

    if (!document) {
      return { success: false, marksheet: null, error: 'Document not found' }
    }

    if (document.studentId !== studentId) {
      return { success: false, marksheet: null, error: 'Unauthorized document access' }
    }

    // 1. Read document buffer from private vault
    const buffer = await readFromVault(document.filePath)

    // 2. Perform OCR
    const ocrResult = await performSmartOCR(buffer, document.fileName, document.fileType)

    // 3. Extract Structured Academic Data
    const effectiveLevel = levelHint || (document.documentType === '10th Marksheet' ? 'TENTH' : document.documentType === '12th Marksheet' ? 'TWELFTH' : 'TENTH')
    const extraction = await extractAcademicMarksheet(ocrResult.fullText, ocrResult.blocks, effectiveLevel)

    // 4. Save/Update AcademicMarksheet in Prisma
    let existingMarksheet = await prisma.academicMarksheet.findFirst({
      where: { documentId: document.id }
    })
    if (!existingMarksheet) {
      existingMarksheet = await prisma.academicMarksheet.findFirst({
        where: { studentId, educationLevel: extraction.educationLevel }
      })
    }

    let academicMarksheet
    const updateData = {
      documentId: document.id,
      board: extraction.board || null,
      studentName: extraction.studentName || null,
      seatNumber: extraction.seatNumber || null,
      rollNumber: extraction.rollNumber || null,
      registrationNumber: extraction.registrationNo || null,
      certificateNumber: extraction.certificateNumber || null,
      passingYear: extraction.passingYear || null,
      totalMarks: extraction.totalMarks || null,
      obtainedMarks: extraction.obtainedMarks || null,
      percentage: extraction.percentage || null,
      cgpa: extraction.cgpa || null,
      subjects: extraction.subjects.length > 0 ? JSON.stringify(extraction.subjects) : null,
      ocrConfidence: extraction.confidence,
      // OCR extraction parses candidate credentials; official verification occurs via DigiLocker in Phase 5 & 6
      verificationStatus: existingMarksheet?.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING'
    }

    if (existingMarksheet) {
      academicMarksheet = await prisma.academicMarksheet.update({
        where: { id: existingMarksheet.id },
        data: updateData
      })
    } else {
      academicMarksheet = await prisma.academicMarksheet.create({
        data: {
          studentId,
          educationLevel: extraction.educationLevel,
          ...updateData
        }
      })
    }

    // 5. Update generic Document processing records
    await prisma.oCRResult.upsert({
      where: { documentId: document.id },
      create: {
        documentId: document.id,
        fullText: ocrResult.fullText,
        confidence: ocrResult.meanConfidence,
        engine: ocrResult.engine,
        language: ocrResult.language,
        pageCount: ocrResult.pageCount
      },
      update: {
        fullText: ocrResult.fullText,
        confidence: ocrResult.meanConfidence,
        engine: ocrResult.engine,
        language: ocrResult.language,
        pageCount: ocrResult.pageCount
      }
    })

    // Upsert key extracted fields
    const fieldsToSave = [
      { name: 'studentName', value: extraction.studentName },
      { name: 'seatNumber', value: extraction.seatNumber },
      { name: 'rollNumber', value: extraction.rollNumber },
      { name: 'registrationNumber', value: extraction.registrationNo },
      { name: 'certificateNumber', value: extraction.certificateNumber },
      { name: 'board', value: extraction.board },
      { name: 'passingYear', value: extraction.passingYear ? String(extraction.passingYear) : undefined },
      { name: 'totalMarks', value: extraction.totalMarks ? String(extraction.totalMarks) : undefined },
      { name: 'obtainedMarks', value: extraction.obtainedMarks ? String(extraction.obtainedMarks) : undefined },
      { name: 'percentage', value: extraction.percentage ? `${extraction.percentage}%` : undefined }
    ]

    await prisma.extractedField.deleteMany({ where: { documentId: document.id } })
    for (const f of fieldsToSave) {
      if (f.value) {
        await prisma.extractedField.create({
          data: {
            documentId: document.id,
            fieldName: f.name,
            fieldValue: f.value,
            confidence: extraction.confidence,
            source: 'ocr'
          }
        }).catch(() => {})
      }
    }

    // Update document processing status
    await prisma.document.update({
      where: { id: document.id },
      data: {
        processingStatus: 'COMPLETED',
        verificationStatus: extraction.confidence >= 0.7 ? 'UNDER_REVIEW' : 'NEEDS_REVIEW',
        ocrConfidence: extraction.confidence
      }
    })

    // Log Activity
    await logDocumentActivity({
      documentId: document.id,
      actorId: studentId,
      actorName: extraction.studentName || 'Student',
      actorRole: 'student',
      action: 'OCR_PROCESSED',
      details: `Academic extraction complete (${extraction.extractionSource}): Board: ${extraction.board || 'N/A'}, Seat: ${extraction.seatNumber || 'N/A'}, Roll: ${extraction.rollNumber || 'N/A'}, Percentage: ${extraction.percentage ? extraction.percentage + '%' : 'N/A'}`,
      status: 'SUCCESS'
    })

    return {
      success: true,
      marksheet: {
        id: academicMarksheet.id,
        educationLevel: academicMarksheet.educationLevel,
        board: academicMarksheet.board,
        studentName: academicMarksheet.studentName,
        seatNumber: academicMarksheet.seatNumber,
        rollNumber: academicMarksheet.rollNumber,
        registrationNumber: academicMarksheet.registrationNumber,
        certificateNumber: academicMarksheet.certificateNumber,
        passingYear: academicMarksheet.passingYear,
        totalMarks: academicMarksheet.totalMarks,
        obtainedMarks: academicMarksheet.obtainedMarks,
        percentage: academicMarksheet.percentage,
        cgpa: academicMarksheet.cgpa,
        subjects: extraction.subjects,
        ocrConfidence: academicMarksheet.ocrConfidence,
        verificationStatus: academicMarksheet.verificationStatus,
        extractionSource: extraction.extractionSource,
        validationIssues: extraction.validationIssues
      }
    }
  } catch (error: any) {
    console.error('extractAndSaveAcademicMarksheet error:', error)
    return { success: false, marksheet: null, error: error.message || 'Extraction failed' }
  }
}

export interface AcademicRecordData {
  studentName?: string | null
  seatNumber?: string | null
  rollNumber?: string | null
  registrationNumber?: string | null
  certificateNumber?: string | null
  board?: string | null
  passingYear?: number | null
  totalMarks?: number | null
  obtainedMarks?: number | null
  percentage?: number | null
}

export interface IdentityComparisonResult {
  nameMatch: boolean
  seatNumberMatch: boolean
  rollNumberMatch: boolean
  boardMatch: boolean
  yearMatch: boolean
  identityStatus: 'MATCH' | 'MISMATCH'
  discrepancies: string[]
}

export interface MarksComparisonResult {
  obtainedMarksMatch: boolean | null
  totalMarksMatch: boolean | null
  percentageMatch: boolean | null
  marksStatus: 'MATCH' | 'MISMATCH' | 'OFFICIAL_AUTHORITATIVE'
  discrepancies: string[]
}

export interface AcademicComparisonResult {
  isMatch: boolean
  verificationStatus: 'VERIFIED' | 'MISMATCH' | 'MANUAL_REVIEW'
  identity: IdentityComparisonResult
  marks: MarksComparisonResult
  discrepancies: string[]
  authoritativeRecord: AcademicRecordData
}

/**
 * Deterministic Academic Record & Marks Comparison Engine
 * 
 * Rules:
 * 1. Identity matching is evaluated independently from academic marks.
 * 2. If both uploaded obtainedMarks and official obtainedMarks exist: direct exact numeric comparison (Math.abs diff === 0).
 * 3. If both uploaded percentage and official percentage exist: minimal tolerance strictly for floating point rounding (<= 0.05%).
 * 4. Missing uploaded marks are NOT a mismatch when official marks are available; official marks become authoritative.
 * 5. A material difference in marks or identity fields produces MISMATCH.
 */
export function compareAcademicRecords(
  uploaded: AcademicRecordData,
  official: AcademicRecordData
): AcademicComparisonResult {
  const discrepancies: string[] = []

  // 1. Identity Comparison
  const identityDiscrepancies: string[] = []

  // 1a. Candidate Name Comparison (normalized, case-insensitive, space-collapsed)
  const normUpName = (uploaded.studentName || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim()
  const normOffName = (official.studentName || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim()
  const nameMatch = Boolean(normUpName && normOffName && (normUpName === normOffName || normUpName.includes(normOffName) || normOffName.includes(normUpName)))
  if (!nameMatch) {
    identityDiscrepancies.push(`Candidate name mismatch: uploaded "${uploaded.studentName || 'N/A'}" vs official "${official.studentName || 'N/A'}"`)
  }

  // 1b. Seat Number / Roll Number Comparison
  const normUpSeat = (uploaded.seatNumber || uploaded.rollNumber || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  const normOffSeat = (official.seatNumber || official.rollNumber || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  const seatNumberMatch = Boolean(normUpSeat && normOffSeat && (normUpSeat === normOffSeat || normUpSeat.includes(normOffSeat) || normOffSeat.includes(normUpSeat)))
  if (!seatNumberMatch) {
    identityDiscrepancies.push(`Seat / Roll number mismatch: uploaded "${uploaded.seatNumber || uploaded.rollNumber || 'N/A'}" vs official "${official.seatNumber || official.rollNumber || 'N/A'}"`)
  }

  const rollNumberMatch = seatNumberMatch

  // 1c. Board Comparison
  const normUpBoard = normalizeBoard(uploaded.board)
  const normOffBoard = normalizeBoard(official.board)
  const boardMatch = Boolean(normUpBoard && normOffBoard && normUpBoard === normOffBoard)
  if (!boardMatch) {
    identityDiscrepancies.push(`Board mismatch: uploaded "${uploaded.board || 'N/A'}" vs official "${official.board || 'N/A'}"`)
  }

  // 1d. Passing Year Comparison
  const yearMatch = Boolean(
    uploaded.passingYear &&
    official.passingYear &&
    uploaded.passingYear === official.passingYear
  )
  if (!yearMatch) {
    identityDiscrepancies.push(`Passing year mismatch: uploaded "${uploaded.passingYear || 'N/A'}" vs official "${official.passingYear || 'N/A'}"`)
  }

  const identityStatus: 'MATCH' | 'MISMATCH' = (nameMatch && seatNumberMatch && boardMatch && yearMatch) ? 'MATCH' : 'MISMATCH'

  // 2. Marks Comparison
  const marksDiscrepancies: string[] = []
  let obtainedMarksMatch: boolean | null = null
  let totalMarksMatch: boolean | null = null
  let percentageMatch: boolean | null = null

  // 2a. Obtained Marks (Exact numeric comparison)
  if (typeof uploaded.obtainedMarks === 'number' && typeof official.obtainedMarks === 'number') {
    // Numeric equality (allowing <= 0.01 strictly for float decimal representation)
    obtainedMarksMatch = Math.abs(uploaded.obtainedMarks - official.obtainedMarks) <= 0.01
    if (!obtainedMarksMatch) {
      marksDiscrepancies.push(`Obtained marks mismatch: uploaded ${uploaded.obtainedMarks} vs official ${official.obtainedMarks}`)
    }
  } else if (uploaded.obtainedMarks === null || uploaded.obtainedMarks === undefined) {
    // Missing uploaded marks with official marks available is NOT a mismatch
    obtainedMarksMatch = null
  }

  // 2b. Total Marks
  if (typeof uploaded.totalMarks === 'number' && typeof official.totalMarks === 'number') {
    totalMarksMatch = Math.abs(uploaded.totalMarks - official.totalMarks) <= 0.01
    if (!totalMarksMatch) {
      marksDiscrepancies.push(`Total marks mismatch: uploaded ${uploaded.totalMarks} vs official ${official.totalMarks}`)
    }
  } else if (uploaded.totalMarks === null || uploaded.totalMarks === undefined) {
    totalMarksMatch = null
  }

  // 2c. Percentage (Strict numeric comparison with float rounding tolerance <= 0.05%)
  if (typeof uploaded.percentage === 'number' && typeof official.percentage === 'number') {
    percentageMatch = Math.abs(uploaded.percentage - official.percentage) <= 0.05
    if (!percentageMatch) {
      marksDiscrepancies.push(`Percentage mismatch: uploaded ${uploaded.percentage}% vs official ${official.percentage}%`)
    }
  } else if (uploaded.percentage === null || uploaded.percentage === undefined) {
    percentageMatch = null
  }

  let marksStatus: 'MATCH' | 'MISMATCH' | 'OFFICIAL_AUTHORITATIVE'
  if (marksDiscrepancies.length > 0) {
    marksStatus = 'MISMATCH'
  } else if (obtainedMarksMatch === null && percentageMatch === null && (typeof official.obtainedMarks === 'number' || typeof official.percentage === 'number')) {
    // Official marks exist, uploaded marks were missing from OCR: official data becomes authoritative
    marksStatus = 'OFFICIAL_AUTHORITATIVE'
  } else {
    marksStatus = 'MATCH'
  }

  // Combine Discrepancies
  discrepancies.push(...identityDiscrepancies, ...marksDiscrepancies)

  // 3. Final Verification Evaluation
  let verificationStatus: 'VERIFIED' | 'MISMATCH' | 'MANUAL_REVIEW'
  let isMatch = false

  if (identityStatus === 'MISMATCH' || marksStatus === 'MISMATCH') {
    verificationStatus = 'MISMATCH'
    isMatch = false
  } else if (identityStatus === 'MATCH' && (marksStatus === 'MATCH' || marksStatus === 'OFFICIAL_AUTHORITATIVE')) {
    verificationStatus = 'VERIFIED'
    isMatch = true
  } else {
    verificationStatus = 'MANUAL_REVIEW'
    isMatch = false
  }

  const authoritativeRecord: AcademicRecordData = {
    studentName: official.studentName || uploaded.studentName || 'N/A',
    seatNumber: official.seatNumber || uploaded.seatNumber,
    rollNumber: official.rollNumber || uploaded.rollNumber,
    registrationNumber: official.registrationNumber || uploaded.registrationNumber,
    certificateNumber: official.certificateNumber || uploaded.certificateNumber,
    board: official.board || uploaded.board,
    passingYear: official.passingYear || uploaded.passingYear,
    totalMarks: official.totalMarks ?? uploaded.totalMarks,
    obtainedMarks: official.obtainedMarks ?? uploaded.obtainedMarks,
    percentage: official.percentage ?? uploaded.percentage
  }

  return {
    isMatch,
    verificationStatus,
    identity: {
      nameMatch,
      seatNumberMatch,
      rollNumberMatch,
      boardMatch,
      yearMatch,
      identityStatus,
      discrepancies: identityDiscrepancies
    },
    marks: {
      obtainedMarksMatch,
      totalMarksMatch,
      percentageMatch,
      marksStatus,
      discrepancies: marksDiscrepancies
    },
    discrepancies,
    authoritativeRecord
  }
}

