import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

// Texto de cada página. Los títulos con letterspacing salen con espacios entre letras,
// así que los tests buscan sobre `compact` (sin espacios) cuando hace falta.
export const extractPdfText = async (buffer: Buffer) => {
  const pdf = await getDocument({ data: new Uint8Array(buffer), isEvalSupported: false, verbosity: 0 }).promise
  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '))
  }
  const text = pages.join('\n')
  return { pages, text, compact: text.replace(/\s+/g, ''), numPages: pdf.numPages }
}
