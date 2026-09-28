import { useState, useEffect } from 'react'
import SemesterRow from './SemesterRow'
import { calculateCGPA } from '../utils/calculations'

let nextId = 3
const createSemester = (id) => ({ id, name: '', gpa: '', credits: '' })

export default function CgpaCalculator({ initialSemesters }) {
  const [semesters, setSemesters] = useState(() => [
    createSemester(1),
    createSemester(2),
  ])
  const [result, setResult] = useState({ totalCredits: 0, weightedPoints: 0, cgpa: 0 })
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialSemesters && initialSemesters.length > 0) {
      setSemesters(initialSemesters.map((s, i) => ({ ...s, id: i + 1 })))
      setResult({ totalCredits: 0, weightedPoints: 0, cgpa: 0 })
      setError('')
    }
  }, [initialSemesters])

  const updateSemester = (id, field, value) => {
    setSemesters((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  const addSemester = () => {
    setSemesters((prev) => [...prev, createSemester(nextId++)])
  }

  const removeSemester = (id) => {
    setSemesters((prev) => prev.filter((s) => s.id !== id))
  }

  const clearAll = () => {
    setSemesters([createSemester(nextId++)])
    setResult({ totalCredits: 0, weightedPoints: 0, cgpa: 0 })
    setError('')
  }

  const handleCalculate = () => {
    for (const s of semesters) {
      const gpa = parseFloat(s.gpa)
      if (s.gpa !== '' && (isNaN(gpa) || gpa < 0 || gpa > 10)) {
        setError('GPA must be between 0 and 10.')
        return
      }
      const credits = parseFloat(s.credits)
      if (s.credits !== '' && (isNaN(credits) || credits <= 0)) {
        setError('Credits must be greater than 0.')
        return
      }
    }
    setError('')
    setResult(calculateCGPA(semesters))
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
        CGPA Calculator
      </h2>

      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        <table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 pr-3 font-medium text-gray-600 dark:text-gray-300">Semester</th>
              <th className="text-left py-2 pr-3 font-medium text-gray-600 dark:text-gray-300">GPA</th>
              <th className="text-left py-2 pr-3 font-medium text-gray-600 dark:text-gray-300">Credits</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {semesters.map((semester) => (
              <SemesterRow
                key={semester.id}
                semester={semester}
                onUpdate={updateSemester}
                onRemove={removeSemester}
              />
            ))}
          </tbody>
        </table>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}

      <div className="flex flex-wrap gap-x-6 gap-y-1 mt-4 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Total Credits: </span>
          <span className="font-semibold text-gray-900 dark:text-white">{result.totalCredits}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Weighted GPA Points: </span>
          <span className="font-semibold text-gray-900 dark:text-white">{result.weightedPoints}</span>
        </div>
      </div>

      <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-center">
        <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-1">CGPA</p>
        <p className="text-3xl sm:text-4xl font-bold text-indigo-700 dark:text-indigo-300">
          {result.cgpa.toFixed(2)}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <button
          onClick={addSemester}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Semester
        </button>
        <button
          onClick={handleCalculate}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          Calculate CGPA
        </button>
        <button
          onClick={clearAll}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          Clear All
        </button>
      </div>
    </section>
  )
}
