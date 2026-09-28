import { GRADE_POINTS } from './calculations.js'

export function validateCreditPoint(credits, gradePoint, creditPoint) {
  if (credits === '' || gradePoint === null || creditPoint === null) {
    return { valid: true, message: '' }
  }
  const expected = parseFloat(credits) * gradePoint
  const actual = parseFloat(creditPoint)
  if (Math.abs(expected - actual) > 0.01) {
    return { valid: false, message: `Expected ${expected.toFixed(2)}, got ${actual.toFixed(2)}` }
  }
  return { valid: true, message: '' }
}

export function normalizeGrade(grade) {
  if (!grade) return null
  let g = grade.trim().toUpperCase()
  // Normalize "A +" → "A+", "B +" → "B+", etc.
  g = g.replace(/\s*\+\s*/, '+')
  // Remove any non-grade characters
  g = g.replace(/[^A-Z+]/g, '')
  if (GRADE_POINTS[g] !== undefined) return g
  if (g === 'PASS' || g === 'P') return 'Pass'
  if (g === 'E') return 'E'
  return null
}

export function getGradePoint(grade) {
  if (!grade) return null
  const normalized = normalizeGrade(grade)
  if (normalized === 'Pass') return null
  if (normalized === 'E') return null
  return GRADE_POINTS[normalized] !== undefined ? GRADE_POINTS[normalized] : null
}

export function calculateCreditPoint(credits, gradePoint) {
  if (credits === '' || gradePoint === null) return null
  const c = parseFloat(credits)
  if (isNaN(c) || c <= 0) return null
  return Math.round(c * gradePoint * 100) / 100
}

export function isZeroCredit(credits) {
  const c = parseFloat(credits)
  return !isNaN(c) && c === 0
}

export function getConfidence(subject) {
  let score = 100
  if (!subject.name || subject.name.length < 2) score -= 30
  if (subject.credits === '') score -= 20
  if (!subject.grade) score -= 30
  if (subject.gradePoint === null) score -= 10
  if (subject.creditPoint === null) score -= 10
  const validation = validateCreditPoint(subject.credits, subject.gradePoint, subject.creditPoint)
  if (!validation.valid) score -= 20
  return Math.max(0, score)
}

export function getStatus(subject) {
  const confidence = getConfidence(subject)
  if (confidence >= 80) return { icon: '✓', label: 'Valid', class: 'text-green-600' }
  if (confidence >= 50) return { icon: '⚠', label: 'Please verify', class: 'text-amber-600' }
  return { icon: '✗', label: 'Needs review', class: 'text-red-600' }
}
