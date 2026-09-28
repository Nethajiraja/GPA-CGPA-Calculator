export default function SemesterRow({ semester, onUpdate, onRemove }) {
  return (
    <tr className="border-b border-gray-100 dark:border-gray-700/50">
      <td className="py-2 pr-3">
        <input
          type="text"
          placeholder="Semester name"
          value={semester.name}
          onChange={(e) => onUpdate(semester.id, 'name', e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
        />
      </td>
      <td className="py-2 pr-3">
        <input
          type="number"
          min="0"
          max="10"
          step="0.01"
          placeholder="0.00"
          value={semester.gpa}
          onChange={(e) => onUpdate(semester.id, 'gpa', e.target.value)}
          className="w-24 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
        />
      </td>
      <td className="py-2 pr-3">
        <input
          type="number"
          min="0"
          step="0.5"
          placeholder="0"
          value={semester.credits}
          onChange={(e) => onUpdate(semester.id, 'credits', e.target.value)}
          className="w-20 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
        />
      </td>
      <td className="py-2">
        <button
          onClick={() => onRemove(semester.id)}
          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          aria-label="Remove semester"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </td>
    </tr>
  )
}
