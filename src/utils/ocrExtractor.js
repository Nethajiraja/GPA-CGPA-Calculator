// OCR extraction with image preprocessing

export async function extractImageText(file, onProgress) {
  // Preprocess image
  const processedBlob = await preprocessImage(file)

  // Run OCR
  const Tesseract = (await import('tesseract.js')).default
  const result = await Tesseract.recognize(processedBlob, 'eng', {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100))
      }
    },
  })

  return {
    text: result.data.text,
    confidence: result.data.confidence,
    words: result.data.words || [],
  }
}

async function preprocessImage(file) {
  // Load image
  const img = await loadImage(file)

  // Get dimensions
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  // Resize if too large (max 2000px width)
  const maxWidth = 2000
  let { width, height } = img
  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width)
    width = maxWidth
  }

  canvas.width = width
  canvas.height = height

  // Draw and get image data
  ctx.drawImage(img, 0, 0, width, height)
  const imageData = ctx.getImageData(0, 0, width, height)

  // Apply preprocessing: grayscale + contrast enhancement
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    // Grayscale
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]

    // Contrast enhancement (simple threshold)
    const threshold = 128
    const enhanced = gray > threshold ? 255 : 0

    data[i] = enhanced
    data[i + 1] = enhanced
    data[i + 2] = enhanced
  }

  ctx.putImageData(imageData, 0, 0)

  // Convert to blob
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png')
  })
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export function parseOcrText(text) {
  // Normalize OCR text
  const normalized = text
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/O\.00/g, '0.00')
    .replace(/l\.00/g, '1.00')
    .replace(/S\.00/g, '5.00')
    .replace(/A \+/g, 'A+')
    .replace(/B \+/g, 'B+')
    .replace(/C \+/g, 'C+')

  const lines = normalized.split('\n').map((l) => l.trim()).filter(Boolean)

  return lines
}
