export const GRADE_POINTS = {
  'A+': 10,
  'A': 9,
  'B+': 8,
  'B': 7,
  'C+': 6,
  'C': 5,
  'D': 4,
  'F': 0,
}

export const GRADES = Object.keys(GRADE_POINTS)

function round(value) {
  return Math.round(value * 100) / 100
}

export function calculateGPA(subjects) {
  let totalCredits = 0
  let totalCreditPoints = 0

  for (const s of subjects) {
    const credits = parseFloat(s.credits)
    const gradePoint = GRADE_POINTS[s.grade]

    if (!isNaN(credits) && credits > 0 && gradePoint !== undefined) {
      totalCredits += credits
      totalCreditPoints += credits * gradePoint
    }
  }

  const gpa = totalCredits > 0 ? totalCreditPoints / totalCredits : 0

  return {
    totalCredits: round(totalCredits),
    totalCreditPoints: round(totalCreditPoints),
    gpa: round(gpa),
  }
}

export function calculateCGPA(semesters) {
  let totalCredits = 0
  let weightedPoints = 0

  for (const s of semesters) {
    const gpa = parseFloat(s.gpa)
    const credits = parseFloat(s.credits)

    if (!isNaN(gpa) && gpa >= 0 && gpa <= 10 && !isNaN(credits) && credits > 0) {
      totalCredits += credits
      weightedPoints += gpa * credits
    }
  }

  const cgpa = totalCredits > 0 ? weightedPoints / totalCredits : 0

  return {
    totalCredits: round(totalCredits),
    weightedPoints: round(weightedPoints),
    cgpa: round(cgpa),
  }
}
