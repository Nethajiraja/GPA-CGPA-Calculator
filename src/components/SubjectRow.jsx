import { GRADE_POINTS, GRADES } from '../utils/calculations'

export default function SubjectRow({ subject, onUpdate, onRemove }) {
  const gradePoint = GRADE_POINTS[subject.grade]
  const credits = parseFloat(subject.credits)
  const creditPoints =
    !isNaN(credits) && credits > 0 && gradePoint !== undefined
      ? Math.round(credits * gradePoint * 100) / 100
      : null

  return (
    <tr className="border-b border-gray-100 dark:border-gray-700/50">
      <td className="py-2 pr-3">
        <input
          type="text"
          placeholder="Subject name"
          value={subject.name}
          onChange={(e) => onUpdate(subject.id, 'name', e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
        />
      </td>
      <td className="py-2 pr-3">
        <input
          type="number"
          min="0"
          step="0.5"
          placeholder="0"
          value={subject.credits}
          onChange={(e) => onUpdate(subject.id, 'credits', e.target.value)}
          className="w-20 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
        />
      </td>
      <td className="py-2 pr-3">
        <select
          value={subject.grade}
          onChange={(e) => onUpdate(subject.id, 'grade', e.target.value)}
          className="w-20 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
        >
          <option value="">Grade</option>
          {GRADES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </td>
      <td className="py-2 pr-3">
        <span className="inline-block w-12 text-center px-2 py-1.5 text-sm rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 font-medium">
          {gradePoint !== undefined ? gradePoint : '—'}
        </span>
      </td>
      <td className="py-2 pr-3">
        <span className="inline-block w-16 text-center px-2 py-1.5 text-sm rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium">
          {creditPoints !== null ? creditPoints : '—'}
        </span>
      </td>
      <td className="py-2">
        <button
          onClick={() => onRemove(subject.id)}
          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          aria-label="Remove subject"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </td>
    </tr>
  )
}
