import { useState, useEffect } from 'react'
import GpaCalculator from './components/GpaCalculator'
import CgpaCalculator from './components/CgpaCalculator'
import GradeScale from './components/GradeScale'
import ThemeToggle from './components/ThemeToggle'

function App() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [dark])

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

        <GpaCalculator />
        <CgpaCalculator />
        <GradeScale />
      </div>
    </div>
  )
}

export default App
