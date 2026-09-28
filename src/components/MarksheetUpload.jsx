import { useState, useRef, useCallback, useEffect } from 'react'
import { detectSemester, detectFormat, detectStudentInfo, parseMarksheetText, parsePdfRows, isZeroCredit } from '../utils/extraction.js'
import { extractPdfText } from '../utils/pdfExtractor.js'
import { extractImageText } from '../utils/ocrExtractor.js'

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
const ACCEPTED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

let tesseractWorker = null

async function getTesseractWorker(onProgress) {
  if (tesseractWorker) return tesseractWorker
  const Tesseract = (await import('tesseract.js')).default
  tesseractWorker = await Tesseract.createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100))
      }
    },
  })
  return tesseractWorker
}

export default function MarksheetUpload({ onExtracted }) {
  const [files, setFiles] = useState([])
  const [status, setStatus] = useState('')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [debugInfo, setDebugInfo] = useState(null)
  const [showDebug, setShowDebug] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    getTesseractWorker().catch(() => {})
    return () => {
      if (tesseractWorker) {
        tesseractWorker.terminate()
        tesseractWorker = null
      }
    }
  }, [])

  const handleFiles = useCallback(
    (fileList) => {
      setError('')
      const valid = []
      for (const file of fileList) {
        const ext = '.' + file.name.split('.').pop().toLowerCase()
        if (ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(ext)) {
          valid.push(file)
        }
      }
      if (valid.length === 0) {
        setError('Please upload a PDF, JPG, JPEG, or PNG file.')
        return
      }
      setFiles(valid)
      setStatus('')
      setDebugInfo(null)
    },
    []
  )

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragOver(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleInputChange = useCallback(
    (e) => {
      handleFiles(e.target.files)
      e.target.value = ''
    },
    [handleFiles]
  )

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const clearAll = () => {
    setFiles([])
    setStatus('')
    setError('')
    setProgress(0)
    setDebugInfo(null)
  }

  const processPdf = async (file) => {
    const pages = await extractPdfText(file)
    const results = []

    for (const page of pages) {
      const format = detectFormat(page.rawText)
      const semester = detectSemester(page.rawText)
      const studentInfo = detectStudentInfo(page.rawText)

      let subjects = []
      if (format === 'format2') {
        subjects = parsePdfRows(page.rows)
      } else {
        const lines = page.rows.map((r) => r.text)
        subjects = parseMarksheetText(lines.join('\n'), format)
      }

      if (subjects.length > 0) {
        results.push({ semester, subjects, pageNum: page.pageNum, format, studentInfo })
      }
    }

    return results
  }

  const processImage = async (file) => {
    setStatus('Processing image...')
    const result = await extractImageText(file, setProgress)
    const text = result.text
    const format = detectFormat(text)
    const semester = detectSemester(text)
    const studentInfo = detectStudentInfo(text)
    const subjects = parseMarksheetText(text, format)

    if (subjects.length > 0) {
      return [{ semester, subjects, pageNum: 1, format, studentInfo, rawText: text, confidence: result.confidence }]
    }
    return []
  }

  const processFiles = async () => {
    setError('')
    setStatus('Reading marksheet...')
    setProgress(0)

    try {
      const filePromises = files.map(async (file) => {
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
        if (isPdf) return processPdf(file)
        return processImage(file)
      })

      const results = await Promise.all(filePromises)
      const allSemesters = results.flat()

      if (allSemesters.length === 0) {
        setError("We couldn't reliably detect the marksheet table. Please enter the subjects manually.")
        setStatus('')
        setProgress(0)
        return
      }

      // Deduplicate subjects within each semester
      for (const sem of allSemesters) {
        const seen = new Set()
        sem.subjects = sem.subjects.filter((s) => {
          const key = s.name.toLowerCase()
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
      }

      // Calculate GPA for each semester
      setStatus('Calculating...')
      for (const sem of allSemesters) {
        let totalCredits = 0
        let totalCreditPoints = 0
        for (const s of sem.subjects) {
          const credits = parseFloat(s.credits)
          if (!isNaN(credits) && credits > 0) {
            const gp = s.gradePoint !== null ? s.gradePoint : 0
            totalCredits += credits
            totalCreditPoints += credits * gp
          }
        }
        sem.gpa = totalCredits > 0 ? Math.round((totalCreditPoints / totalCredits) * 100) / 100 : 0
        sem.totalCredits = totalCredits
      }

      // Collect debug info
      const debug = {
        formats: allSemesters.map((s) => s.format),
        semesters: allSemesters.map((s) => s.semester),
        studentInfo: allSemesters[0]?.studentInfo,
        rawTexts: allSemesters.map((s) => s.rawText || ''),
        totalSubjects: allSemesters.reduce((sum, s) => sum + s.subjects.length, 0),
      }
      setDebugInfo(debug)

      setStatus('Extraction completed.')
      setProgress(100)
      onExtracted(allSemesters)
    } catch (err) {
      console.error('Extraction error:', err)
      setError('Unable to read this file. Please try another PDF or image.')
      setStatus('')
      setProgress(0)
    }
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1">
        Upload Marksheet
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Upload your Pondicherry University marksheet and automatically extract grades.
      </p>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
        }`}
      >
        <svg className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Drag & Drop Marksheet</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">PDF, JPG, JPEG or PNG</p>
        <span className="inline-flex items-center px-4 py-2.5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
          Choose File
        </span>
        <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" multiple onChange={handleInputChange} className="hidden" />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3 min-w-0">
                <svg className="h-5 w-5 text-gray-400 dark:text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{file.type || 'Unknown'} &middot; {formatFileSize(file.size)}</p>
                </div>
              </div>
              <button onClick={() => removeFile(index)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0" aria-label="Remove file">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Status */}
      {status && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {status}
          </div>
          {progress > 0 && progress < 100 && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && <p className="mt-3 text-sm text-red-500 dark:text-red-400">{error}</p>}

      {/* Actions */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          <button onClick={processFiles} disabled={status !== ''} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Extract Marks
          </button>
          <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
            Clear
          </button>
        </div>
      )}

      {/* Debug toggle */}
      {debugInfo && (
        <div className="mt-4">
          <button onClick={() => setShowDebug(!showDebug)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            {showDebug ? 'Hide' : 'View'} Extraction Details
          </button>
          {showDebug && (
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-xs text-gray-600 dark:text-gray-300 space-y-1">
              <p><strong>Formats detected:</strong> {debugInfo.formats.join(', ')}</p>
              <p><strong>Semesters detected:</strong> {debugInfo.semesters.join(', ')}</p>
              <p><strong>Total subjects:</strong> {debugInfo.totalSubjects}</p>
              {debugInfo.studentInfo?.name && <p><strong>Student:</strong> {debugInfo.studentInfo.name}</p>}
              {debugInfo.studentInfo?.registerNumber && <p><strong>Register No:</strong> {debugInfo.studentInfo.registerNumber}</p>}
              {debugInfo.studentInfo?.printedGpa && <p><strong>Printed GPA:</strong> {debugInfo.studentInfo.printedGpa}</p>}
              {debugInfo.studentInfo?.printedCgpa && <p><strong>Printed CGPA:</strong> {debugInfo.studentInfo.printedCgpa}</p>}
            </div>
          )}
        </div>
      )}

      {/* Privacy note */}
      <p className="mt-4 text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
        Your marksheet is processed locally in your browser. No data is sent to any server.
      </p>
    </section>
  )
}
