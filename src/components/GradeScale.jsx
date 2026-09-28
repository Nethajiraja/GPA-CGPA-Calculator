import { GRADE_POINTS, GRADES } from '../utils/calculations'

export default function GradeScale() {
  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 shadow-sm">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Grade Scale
      </h2>

      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        <table className="w-full text-sm max-w-xs">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 pr-4 font-medium text-gray-600 dark:text-gray-300">Grade</th>
              <th className="text-left py-2 font-medium text-gray-600 dark:text-gray-300">Grade Point</th>
            </tr>
          </thead>
          <tbody>
            {GRADES.map((grade) => (
              <tr key={grade} className="border-b border-gray-100 dark:border-gray-700/50">
                <td className="py-2 pr-4 font-medium text-gray-900 dark:text-white">{grade}</td>
                <td className="py-2 text-gray-600 dark:text-gray-300">{GRADE_POINTS[grade]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
        Grade points can vary by university. Verify your university's grading regulations before using the result.
      </p>
    </section>
  )
}
