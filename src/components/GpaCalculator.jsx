import { useState, useEffect } from 'react'
import SubjectRow from './SubjectRow'
import { calculateGPA } from '../utils/calculations'

let nextId = 4
const createSubject = (id) => ({ id, name: '', credits: '', grade: '' })

export default function GpaCalculator({ initialSubjects }) {
  const [subjects, setSubjects] = useState(() => [
    createSubject(1),
    createSubject(2),
    createSubject(3),
  ])
  const [result, setResult] = useState({ totalCredits: 0, totalCreditPoints: 0, gpa: 0 })
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialSubjects && initialSubjects.length > 0) {
      setSubjects(initialSubjects.map((s, i) => ({ ...s, id: i + 1 })))
      setResult({ totalCredits: 0, totalCreditPoints: 0, gpa: 0 })
      setError('')
    }
  }, [initialSubjects])

  const updateSubject = (id, field, value) => {
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  const addSubject = () => {
    setSubjects((prev) => [...prev, createSubject(nextId++)])
  }

  const removeSubject = (id) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id))
  }

  const clearAll = () => {
    setSubjects([createSubject(nextId++)])
    setResult({ totalCredits: 0, totalCreditPoints: 0, gpa: 0 })
    setError('')
  }

  const handleCalculate = () => {
    for (const s of subjects) {
      if (s.credits !== '' && (isNaN(parseFloat(s.credits)) || parseFloat(s.credits) < 0)) {
        setError('Credits must be a non-negative number.')
        return
      }
    }
    setError('')
    setResult(calculateGPA(subjects))
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
        GPA Calculator
      </h2>

      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 pr-3 font-medium text-gray-600 dark:text-gray-300">Subject</th>
              <th className="text-left py-2 pr-3 font-medium text-gray-600 dark:text-gray-300">Credits</th>
              <th className="text-left py-2 pr-3 font-medium text-gray-600 dark:text-gray-300">Grade</th>
              <th className="text-left py-2 pr-3 font-medium text-gray-600 dark:text-gray-300">Grade Point</th>
              <th className="text-left py-2 pr-3 font-medium text-gray-600 dark:text-gray-300">Credit Points</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject) => (
              <SubjectRow
                key={subject.id}
                subject={subject}
                onUpdate={updateSubject}
                onRemove={removeSubject}
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
          <span className="text-gray-500 dark:text-gray-400">Total Credit Points: </span>
          <span className="font-semibold text-gray-900 dark:text-white">{result.totalCreditPoints}</span>
        </div>
      </div>

      <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-center">
        <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-1">GPA</p>
        <p className="text-3xl sm:text-4xl font-bold text-indigo-700 dark:text-indigo-300">
          {result.gpa.toFixed(2)}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <button
          onClick={addSubject}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Subject
        </button>
        <button
          onClick={handleCalculate}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          Calculate GPA
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
