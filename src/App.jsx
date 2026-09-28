import { useState, useEffect, useCallback } from 'react'
import MarksheetUpload from './components/MarksheetUpload'
import ExtractionReview from './components/ExtractionReview'
import GpaCalculator from './components/GpaCalculator'
import CgpaCalculator from './components/CgpaCalculator'
import GradeScale from './components/GradeScale'
import ThemeToggle from './components/ThemeToggle'

function App() {
  const [dark, setDark] = useState(false)
  const [extractedSemesters, setExtractedSemesters] = useState(null)
  const [gpaSubjects, setGpaSubjects] = useState(null)
  const [cgpaSemesters, setCgpaSemesters] = useState(null)

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [dark])

  const handleExtracted = useCallback((semesters) => {
    setExtractedSemesters(semesters)
  }, [])

  const handleConfirm = useCallback((confirmedSemesters) => {
    if (confirmedSemesters.length > 0) {
      // Populate GPA calculator with first semester's subjects
      const firstSem = confirmedSemesters[0]
      const subjects = firstSem.subjects.map((s, i) => ({
        id: i + 1,
        name: s.name,
        credits: s.credits,
        grade: s.grade,
      }))
      setGpaSubjects(subjects)

      // Populate CGPA calculator with all semesters
      const semData = confirmedSemesters.map((sem, i) => {
        let totalCredits = 0
        let totalCreditPoints = 0
        for (const s of sem.subjects) {
          const credits = parseFloat(s.credits)
          const gp = s.gradePoint !== null ? s.gradePoint : 0
          if (!isNaN(credits) && credits > 0) {
            totalCredits += credits
            totalCreditPoints += credits * gp
          }
        }
        const gpa = totalCredits > 0 ? Math.round((totalCreditPoints / totalCredits) * 100) / 100 : 0
        return {
          id: i + 1,
          name: sem.semester ? `Semester ${sem.semester}` : `Semester ${i + 1}`,
          gpa: String(gpa),
          credits: String(totalCredits),
        }
      })
      setCgpaSemesters(semData)
    }

    setExtractedSemesters(null)
  }, [])

  const handleCancelReview = useCallback(() => {
    setExtractedSemesters(null)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <header className="flex items-start justify-between mb-8 sm:mb-10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              GPA & CGPA Calculator
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm sm:text-base">
              Calculate your semester GPA and overall CGPA easily.
            </p>
          </div>
          <ThemeToggle dark={dark} onToggle={() => setDark(!dark)} />
        </header>

        <MarksheetUpload onExtracted={handleExtracted} />

        {extractedSemesters && (
          <ExtractionReview
            semesters={extractedSemesters}
            onConfirm={handleConfirm}
            onCancel={handleCancelReview}
          />
        )}

        <GpaCalculator
          key={gpaSubjects ? `gpa-${gpaSubjects.length}-${Date.now()}` : 'gpa-default'}
          initialSubjects={gpaSubjects}
        />
        <CgpaCalculator
          key={cgpaSemesters ? `cgpa-${cgpaSemesters.length}-${Date.now()}` : 'cgpa-default'}
          initialSemesters={cgpaSemesters}
        />
        <GradeScale />
      </div>
    </div>
  )
}

export default App
