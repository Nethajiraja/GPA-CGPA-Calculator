// PDF text extraction with X/Y coordinate table reconstruction

export async function extractPdfText(file) {
  const pdfjsLib = await import('pdfjs-dist')
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const pages = []
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()
    const viewport = page.getViewport({ scale: 1 })

    // Extract items with position info
    const items = textContent.items.map((item) => ({
      str: item.str,
      x: item.transform[4],
      y: item.transform[5],
      width: item.width,
      height: item.height,
    }))

    // Reconstruct table rows from Y coordinates
    const rows = reconstructTableRows(items)

    // Also get raw text for format detection
    const rawText = items.map((i) => i.str).join(' ')

    pages.push({
      pageNum,
      items,
      rows,
      rawText,
      width: viewport.width,
      height: viewport.height,
    })
  }

  return pages
}

function reconstructTableRows(items) {
  if (!items || items.length === 0) return []

  const tolerance = 3
  const rowMap = new Map()

  for (const item of items) {
    const y = Math.round(item.y / tolerance) * tolerance
    if (!rowMap.has(y)) {
      rowMap.set(y, [])
    }
    rowMap.get(y).push(item)
  }

  // Sort rows by Y (top to bottom, so higher Y first)
  const sortedYs = Array.from(rowMap.keys()).sort((a, b) => b - a)

  const rows = []
  for (const y of sortedYs) {
    const rowItems = rowMap.get(y)
    // Sort items within row by X (left to right)
    rowItems.sort((a, b) => a.x - b.x)
    rows.push({
      y,
      items: rowItems.map((i) => ({ text: i.str, x: i.x, width: i.width })),
      text: rowItems.map((i) => i.str).join(' '),
    })
  }

  return rows
}

export function detectColumns(rows) {
  if (rows.length === 0) return []

  // Find header row (contains column names)
  const headerKeywords = ['subject', 'credit', 'grade', 'sl', 'no', 'th', 'pr', 'point']
  let headerRow = null
  let headerIndex = -1

  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const text = rows[i].text.toLowerCase()
    const matches = headerKeywords.filter((kw) => text.includes(kw)).length
    if (matches >= 2) {
      headerRow = rows[i]
      headerIndex = i
      break
    }
  }

  if (!headerRow) {
    // Try to detect columns from data rows
    return detectColumnsFromData(rows)
  }

  // Detect column boundaries from header item positions
  const columns = []
  for (const item of headerRow.items) {
    const text = item.text.toLowerCase().trim()
    let type = 'unknown'

    if (text.includes('sl') || text === 'no' || text === 'no.') type = 'serial'
    else if (text.includes('subject') || text.includes('title')) type = 'subject'
    else if (text.includes('th') || text.includes('pr')) type = 'type'
    else if (text.includes('credit') && text.includes('hour')) type = 'credits'
    else if (text.includes('credit') && !text.includes('point')) type = 'credits'
    else if (text.includes('grade') && text.includes('point')) type = 'gradePoint'
    else if (text.includes('credit') && text.includes('point')) type = 'creditPoint'
    else if (text.includes('grade')) type = 'grade'

    columns.push({
      type,
      x: item.x,
      width: item.width,
      header: item.text,
    })
  }

  return { columns, headerIndex, headerRow }
}

function detectColumnsFromData(rows) {
  // Fallback: assume standard column order
  return {
    columns: [
      { type: 'serial', x: 0, width: 30 },
      { type: 'subject', x: 30, width: 200 },
      { type: 'type', x: 230, width: 30 },
      { type: 'credits', x: 260, width: 50 },
      { type: 'gradePoint', x: 310, width: 60 },
      { type: 'creditPoint', x: 370, width: 60 },
      { type: 'grade', x: 430, width: 40 },
    ],
    headerIndex: -1,
    headerRow: null,
  }
}

export function parseTableRows(rows, columnInfo) {
  const { columns, headerIndex } = columnInfo
  const subjects = []

  // Skip header rows
  const dataRows = headerIndex >= 0 ? rows.slice(headerIndex + 1) : rows

  for (const row of dataRows) {
    const subject = parseRowByColumns(row, columns)
    if (subject && subject.name) {
      subjects.push(subject)
    }
  }

  return subjects
}

function parseRowByColumns(row, columns) {
  const result = {
    name: '',
    type: '',
    credits: '',
    gradePoint: null,
    creditPoint: null,
    grade: null,
  }

  for (const item of row.items) {
    const col = findColumn(item.x, columns)
    if (!col) continue

    const text = item.text.trim()

    switch (col.type) {
      case 'serial':
        break // Ignore serial numbers
      case 'subject':
        result.name = (result.name + ' ' + text).trim()
        break
      case 'type':
        result.type = text
        break
      case 'credits':
        if (text && !isNaN(parseFloat(text))) {
          result.credits = text
        }
        break
      case 'gradePoint':
        if (text && !isNaN(parseFloat(text))) {
          result.gradePoint = parseFloat(text)
        }
        break
      case 'creditPoint':
        if (text && !isNaN(parseFloat(text))) {
          result.creditPoint = parseFloat(text)
        }
        break
      case 'grade':
        result.grade = text
        break
    }
  }

  return result
}

function findColumn(x, columns) {
  for (const col of columns) {
    if (x >= col.x - 5 && x <= col.x + col.width + 5) {
      return col
    }
  }
  return null
}
