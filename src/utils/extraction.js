import { GRADE_POINTS } from './calculations.js'
import { normalizeGrade, getGradePoint, validateCreditPoint, isZeroCredit, getStatus } from './validators.js'
import { detectColumns, parseTableRows } from './pdfExtractor.js'

const SEMESTER_PATTERNS = [
  { pattern: /first\s*semester|1st\s*semester|semester\s*1|sem\s*1/i, semester: 1 },
  { pattern: /second\s*semester|2nd\s*semester|semester\s*2|sem\s*2/i, semester: 2 },
  { pattern: /third\s*semester|3rd\s*semester|semester\s*3|sem\s*3/i, semester: 3 },
  { pattern: /fourth\s*semester|4th\s*semester|semester\s*4|sem\s*4/i, semester: 4 },
  { pattern: /fifth\s*semester|5th\s*semester|semester\s*5|sem\s*5/i, semester: 5 },
  { pattern: /sixth\s*semester|6th\s*semester|semester\s*6|sem\s*6/i, semester: 6 },
  { pattern: /seventh\s*semester|7th\s*semester|semester\s*7|sem\s*7/i, semester: 7 },
  { pattern: /eighth\s*semester|8th\s*semester|semester\s*8|sem\s*8/i, semester: 8 },
]

export function detectSemester(text) {
  for (const { pattern, semester } of SEMESTER_PATTERNS) {
    if (pattern.test(text)) return semester
  }
  return null
}

export function detectFormat(text) {
  const lower = text.toLowerCase()
  if (
    lower.includes('student grade report') ||
    (lower.includes('subject') && lower.includes('credit') && lower.includes('grade') && !lower.includes('grade point'))
  ) {
    return 'format1'
  }
  if (
    lower.includes('grade point') ||
    lower.includes('credit point') ||
    lower.includes('credit hour')
  ) {
    return 'format2'
  }
  return 'unknown'
}

export function detectStudentInfo(text) {
  const info = { name: '', registerNumber: '', printedGpa: null, printedCgpa: null, totalCredits: null }

  const nameMatch = text.match(/(?:student\s*name|name)\s*[:\-]?\s*([A-Za-z\s]+)/i)
  if (nameMatch) info.name = nameMatch[1].trim()

  const regMatch = text.match(/(?:register\s*(?:no|number|#)|reg\s*(?:no|number|#))\s*[:\-]?\s*(\w+)/i)
  if (regMatch) info.registerNumber = regMatch[1].trim()

  const gpaMatch = text.match(/(?:gpa)\s*[:\-]?\s*(\d+\.?\d*)/i)
  if (gpaMatch) info.printedGpa = parseFloat(gpaMatch[1])

  const cgpaMatch = text.match(/(?:cgpa)\s*[:\-]?\s*(\d+\.?\d*)/i)
  if (cgpaMatch) info.printedCgpa = parseFloat(cgpaMatch[1])

  const totalMatch = text.match(/(?:total\s*credits)\s*[:\-]?\s*(\d+\.?\d*)/i)
  if (totalMatch) info.totalCredits = parseFloat(totalMatch[1])

  return info
}

export function parseMarksheetText(text, format = 'format2') {
  const normalized = text
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/O\.00/g, '0.00')
    .replace(/l\.00/g, '1.00')
    .replace(/S\.00/g, '5.00')
    .replace(/A \+/g, 'A+')
    .replace(/B \+/g, 'B+')
    .replace(/C \+/g, 'C+')

  const lines = normalized.split('\n').map((l) => l.trim()).filter(Boolean)

  if (format === 'format1') {
    return parseFormat1(lines)
  }
  return parseFormat2(lines)
}

function parseFormat1(lines) {
  const subjects = []
  let inTheory = false
  let inPractical = false

  for (const line of lines) {
    const lower = line.toLowerCase()
    if (lower.includes('theory')) { inTheory = true; inPractical = false; continue }
    if (lower.includes('practical')) { inPractical = true; inTheory = false; continue }
    if (lower.includes('total') || lower.includes('gpa') || lower.includes('cgpa')) { inTheory = false; inPractical = false; continue }

    const words = line.split(/\s+/)
    const grade = findGrade(words)
    if (!grade) continue

    // Find credits (number before grade)
    const gradeIdx = words.findIndex((w) => normalizeGrade(w) === grade)
    if (gradeIdx === -1) continue

    let credits = ''
    let name = ''
    for (let i = 0; i < gradeIdx; i++) {
      const num = parseFloat(words[i])
      if (!isNaN(num) && Number.isInteger(num) && num > 0 && num <= 10 && credits === '') {
        credits = String(num)
      } else if (credits === '') {
        name = (name + ' ' + words[i]).trim()
      }
    }

    const type = inPractical ? 'Practical' : 'Theory'
    const gradePoint = getGradePoint(grade)
    const creditPoint = gradePoint !== null && credits !== '' ? parseFloat(credits) * gradePoint : null

    if (name.length >= 2) {
      subjects.push({
        name: cleanName(name),
        type,
        credits,
        gradePoint,
        creditPoint,
        grade,
        validation: validateCreditPoint(credits, gradePoint, creditPoint),
        status: getStatus({ name, credits, gradePoint, creditPoint, grade }),
      })
    }
  }
  return subjects
}

function parseFormat2(lines) {
  const subjects = []
  for (const line of lines) {
    const parsed = parseFormat2Line(line)
    if (parsed && parsed.name) {
      subjects.push(parsed)
    }
  }
  return subjects
}

function parseFormat2Line(line) {
  const words = line.split(/\s+/)

  let grade = null
  let gradeIdx = -1
  for (let i = words.length - 1; i >= Math.max(0, words.length - 4); i--) {
    const w = words[i].replace(/[^A-Za-z+]/g, '')
    const n = normalizeGrade(w)
    if (n && n !== 'Pass') { grade = n; gradeIdx = i; break }
  }
  if (!grade) return null

  const before = words.slice(0, gradeIdx)
  const numbers = []
  for (let i = 0; i < before.length; i++) {
    const cleaned = before[i].replace(/[^0-9.]/g, '')
    const num = parseFloat(cleaned)
    if (!isNaN(num) && cleaned !== '') numbers.push({ value: num, index: i })
  }

  let credits = ''
  let gradePoint = null
  let creditPoint = null

  // Skip serial number if present (small integer at start)
  let start = 0
  if (numbers.length >= 3 && numbers[0].value <= 10 && Number.isInteger(numbers[0].value) && numbers[0].index === 0) {
    start = 1
  }
  const dataNums = numbers.slice(start)

  if (dataNums.length >= 3) {
    credits = String(dataNums[0].value)
    gradePoint = dataNums[1].value
    creditPoint = dataNums[2].value
  } else if (dataNums.length === 2) {
    if (dataNums[0].value <= 10 && Number.isInteger(dataNums[0].value)) {
      credits = String(dataNums[0].value)
      gradePoint = dataNums[1].value
    } else {
      gradePoint = dataNums[0].value
      creditPoint = dataNums[1].value
    }
  } else if (dataNums.length === 1) {
    if (dataNums[0].value <= 10 && Number.isInteger(dataNums[0].value)) credits = String(dataNums[0].value)
    else gradePoint = dataNums[0].value
  }

  if (gradePoint === null) gradePoint = getGradePoint(grade)
  if (creditPoint === null && credits !== '' && gradePoint !== null) {
    creditPoint = Math.round(parseFloat(credits) * gradePoint * 100) / 100
  }

  const subjectStart = start > 0 ? 1 : 0
  const subjectEnd = dataNums.length > 0 ? dataNums[0].index : before.length
  const name = cleanName(before.slice(subjectStart, subjectEnd).join(' '))

  if (!name || name.length < 2) return null

  const validation = validateCreditPoint(credits, gradePoint, creditPoint)
  const status = getStatus({ name, credits, gradePoint, creditPoint, grade })

  return { name, type: 'Theory', credits, gradePoint, creditPoint, grade, validation, status }
}

function findGrade(words) {
  for (let i = words.length - 1; i >= Math.max(0, words.length - 4); i--) {
    const w = words[i].replace(/[^A-Za-z+]/g, '')
    const n = normalizeGrade(w)
    if (n && n !== 'Pass') return n
  }
  return null
}

function cleanName(name) {
  return name
    .replace(/[^a-zA-Z0-9\s\-&]/g, '')
    .replace(/\b(Th|Pr)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function parsePdfRows(rows) {
  const columnInfo = detectColumns(rows)
  const subjects = parseTableRows(rows, columnInfo)
  return subjects.map((s) => {
    const gradePoint = s.gradePoint !== null ? s.gradePoint : getGradePoint(s.grade)
    const creditPoint = s.creditPoint !== null ? s.creditPoint : (s.credits !== '' && gradePoint !== null ? Math.round(parseFloat(s.credits) * gradePoint * 100) / 100 : null)
    const validation = validateCreditPoint(s.credits, gradePoint, creditPoint)
    const status = getStatus({ name: s.name, credits: s.credits, gradePoint, creditPoint, grade: s.grade })
    return { ...s, gradePoint, creditPoint, validation, status }
  })
}

export { isZeroCredit }
