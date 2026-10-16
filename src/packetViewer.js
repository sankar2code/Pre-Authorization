import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

// Query: ?page=N&q=<phrase to highlight>&label=<what it evidences>
const params = new URLSearchParams(location.search)
const targetPage = Number(params.get('page')) || 1
const phrase = params.get('q') || ''
const label = params.get('label') || ''

const norm = (s) => s.replace(/\s+/g, ' ').toLowerCase()

// Find `phrase` in the page's text and return one viewport rect per line it
// spans. Text items are joined with single spaces; each match is mapped back
// to items, and a partially-covered item is cut proportionally by character.
function highlightRects(items, viewport) {
  const parts = items.filter((i) => i.str.trim())
  let joined = ''
  const spans = parts.map((item) => {
    const start = joined.length
    joined += norm(item.str) + ' '
    return { item, start, end: joined.length - 1 }
  })
  const at = joined.indexOf(norm(phrase).trim())
  if (at < 0) return []
  const to = at + norm(phrase).trim().length

  return spans
    .filter((s) => s.end > at && s.start < to)
    .map(({ item, start, end }) => {
      const len = Math.max(end - start, 1)
      const from = Math.max(at - start, 0) / len
      const upto = Math.min(to - start, len) / len
      // PDF user space -> viewport pixels via the viewport's affine transform.
      const [a, b, c, d, e, f] = viewport.transform
      const toView = (x, y) => [a * x + c * y + e, b * x + d * y + f]
      const [x1, y1] = toView(item.transform[4] + item.width * from, item.transform[5] - item.height * 0.2)
      const [x2, y2] = toView(item.transform[4] + item.width * upto, item.transform[5] + item.height * 0.85)
      return { left: Math.min(x1, x2), top: Math.min(y1, y2), width: Math.abs(x2 - x1), height: Math.abs(y2 - y1) }
    })
}

async function main() {
  const doc = await pdfjs.getDocument({ url: '/packet.pdf' }).promise
  document.getElementById('sub').textContent = label
    ? `${label} — page ${targetPage} of ${doc.numPages}`
    : `${doc.numPages} pages`

  const container = document.getElementById('pages')
  const scale = Math.min(1.4, (window.innerWidth - 32) / 612)
  const holders = []
  for (let n = 1; n <= doc.numPages; n++) {
    const div = document.createElement('div')
    div.className = 'page'
    div.dataset.page = n
    container.appendChild(div)
    holders.push(div)
  }

  let firstHit = null
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n)
    const viewport = page.getViewport({ scale })
    const div = holders[n - 1]
    div.style.width = `${viewport.width}px`
    div.style.height = `${viewport.height}px`
    const canvas = document.createElement('canvas')
    const dpr = window.devicePixelRatio || 1
    canvas.width = viewport.width * dpr
    canvas.height = viewport.height * dpr
    canvas.style.width = `${viewport.width}px`
    canvas.style.height = `${viewport.height}px`
    div.appendChild(canvas)
    await page.render({
      canvasContext: canvas.getContext('2d'),
      viewport,
      transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
    }).promise

    if (n === targetPage && phrase) {
      const { items } = await page.getTextContent()
      for (const r of highlightRects(items, viewport)) {
        const hl = document.createElement('div')
        hl.className = 'hl'
        Object.assign(hl.style, {
          left: `${r.left - 2}px`, top: `${r.top - 1}px`,
          width: `${r.width + 4}px`, height: `${r.height + 2}px`,
        })
        div.appendChild(hl)
        firstHit ??= hl
      }
      div.dataset.highlighted = firstHit ? 'true' : 'false'
    }
    if (n === targetPage) {
      ;(firstHit ?? div).scrollIntoView({ block: firstHit ? 'center' : 'start' })
    }
  }
  document.body.dataset.ready = 'true'
}

main()
