import { useState } from 'react'
import { GRADE_POINTS, GRADES } from '../utils/calculations.js'
import { normalizeGrade, getGradePoint, validateCreditPoint, getStatus } from '../utils/validators.js'

export default function ExtractionReview({ semesters, onConfirm, onCancel }) {
  const [data, setData] = useState(() =>
    semesters.map((sem, si) => ({
      semester: sem.semester,
      subjects: sem.subjects.map((sub) => ({ ...sub })),
      studentInfo: sem.studentInfo || {},
      format: sem.format || 'unknown',
      _key: si,
    }))
  )

  const [manualSemester, setManualSemester] = useState({})

  const updateSubject = (semIdx, subIdx, field, value) => {
    setData((prev) =>
      prev.map((sem, i) =>
        i === semIdx
          ? {
              ...sem,
              subjects: sem.subjects.map((sub, j) => {
                if (j !== subIdx) return sub
                const updated = { ...sub, [field]: value }
                // Recalculate grade point if grade changed
                if (field === 'grade') {
                  updated.gradePoint = getGradePoint(value)
                }
                // Recalculate credit point if credits or grade point changed
                if (field === 'credits' || field === 'gradePoint' || field === 'grade') {
                  const cp = parseFloat(updated.credits) * (updated.gradePoint || 0)
                  updated.creditPoint = updated.credits !== '' && updated.gradePoint !== null ? Math.round(cp * 100) / 100 : null
                }
                // Update validation
                updated.validation = validateCreditPoint(updated.credits, updated.gradePoint, updated.creditPoint)
                updated.status = getStatus(updated)
                return updated
              }),
            }
          : sem
      )
    )
  }

  const updateSemester = (semIdx, value) => {
    setData((prev) =>
      prev.map((sem, i) => (i === semIdx ? { ...sem, semester: value } : sem))
    )
  }

  const handleConfirm = () => {
    const result = data.map((sem) => ({
      semester: sem.semester,
      subjects: sem.subjects,
      studentInfo: sem.studentInfo,
      format: sem.format,
    }))
    onConfirm(result)
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1">
        Extracted Marksheet Data
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Please review and edit the extracted data before calculating.
      </p>

      {data.map((sem, semIdx) => (
        <div key={sem._key} className="mb-6 last:mb-0">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {sem.semester ? `Semester ${sem.semester}` : 'Semester not detected'}
            </h3>
            {!sem.semester && (
              <select
                value={manualSemester[semIdx] || ''}
                onChange={(e) => updateSemester(semIdx, parseInt(e.target.value))}
                className="px-2 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select semester</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>Semester {n}</option>
                ))}
              </select>
            )}
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {sem.subjects.length} subjects
            </span>
          </div>

          {/* Student info */}
          {sem.studentInfo?.name && (
            <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-xs text-gray-600 dark:text-gray-300">
              {sem.studentInfo.name && <span className="mr-4">Student: {sem.studentInfo.name}</span>}
              {sem.studentInfo.registerNumber && <span className="mr-4">Reg: {sem.studentInfo.registerNumber}</span>}
              {sem.studentInfo.printedGpa && <span className="mr-4">Printed GPA: {sem.studentInfo.printedGpa}</span>}
              {sem.studentInfo.printedCgpa && <span>Printed CGPA: {sem.studentInfo.printedCgpa}</span>}
            </div>
          )}

          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 pr-3 font-medium text-gray-600 dark:text-gray-300">Subject</th>
                  <th className="text-left py-2 pr-3 font-medium text-gray-600 dark:text-gray-300">Credits</th>
                  <th className="text-left py-2 pr-3 font-medium text-gray-600 dark:text-gray-300">Grade Point</th>
                  <th className="text-left py-2 pr-3 font-medium text-gray-600 dark:text-gray-300">Credit Point</th>
                  <th className="text-left py-2 pr-3 font-medium text-gray-600 dark:text-gray-300">Grade</th>
                  <th className="text-left py-2 font-medium text-gray-600 dark:text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {sem.subjects.map((sub, subIdx) => (
                  <tr key={subIdx} className={`border-b border-gray-100 dark:border-gray-700/50 ${sub.status?.icon === '⚠' ? 'bg-amber-50 dark:bg-amber-900/10' : sub.status?.icon === '✗' ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                    <td className="py-2 pr-3">
                      <input
                        type="text"
                        value={sub.name}
                        onChange={(e) => updateSubject(semIdx, subIdx, 'name', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={sub.credits}
                        onChange={(e) => updateSubject(semIdx, subIdx, 'credits', e.target.value)}
                        className={`w-20 px-3 py-1.5 text-sm rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${sub.credits === '' ? 'border-amber-400 dark:border-amber-500' : 'border-gray-200 dark:border-gray-600'}`}
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.01"
                        value={sub.gradePoint !== null ? sub.gradePoint : ''}
                        onChange={(e) => updateSubject(semIdx, subIdx, 'gradePoint', e.target.value)}
                        className="w-20 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={sub.creditPoint !== null ? sub.creditPoint : ''}
                        onChange={(e) => updateSubject(semIdx, subIdx, 'creditPoint', e.target.value)}
                        className="w-20 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <select
                        value={sub.grade || ''}
                        onChange={(e) => updateSubject(semIdx, subIdx, 'grade', e.target.value)}
                        className="w-20 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="">Grade</option>
                        {GRADES.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                        <option value="Pass">Pass</option>
                      </select>
                    </td>
                    <td className="py-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${sub.status?.class || 'text-gray-400'}`}>
                        {sub.status?.icon} {sub.status?.label}
                      </span>
                      {sub.validation && !sub.validation.valid && (
                        <p className="text-xs text-red-500 mt-0.5">{sub.validation.message}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-2 mt-4">
        <button
          onClick={handleConfirm}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          Confirm & Calculate
        </button>
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </section>
  )
}
