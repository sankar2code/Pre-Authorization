import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import PACKET_INDEX from './data/packetIndex.json'

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

function sectionFor(n) {
  return PACKET_INDEX.sections.find((s) => n >= s.start && n <= s.end)
}

async function main() {
  const doc = await pdfjs.getDocument({ url: `${import.meta.env.BASE_URL}packet.pdf` }).promise
  const total = doc.numPages
  const sub = document.getElementById('sub')
  const pageInput = document.getElementById('pageInput')
  const sectionSelect = document.getElementById('sections')
  document.getElementById('pageTotal').textContent = `of ${total}`
  pageInput.max = total

  const targetSection = sectionFor(targetPage)
  sub.textContent = label
    ? `${label} — page ${targetPage} of ${total}${targetSection ? ` · ${targetSection.title}` : ''}`
    : `${total} pages`

  for (const s of PACKET_INDEX.sections) {
    const opt = document.createElement('option')
    opt.value = s.start
    opt.textContent = `${s.title} (${s.start === s.end ? `p. ${s.start}` : `pp. ${s.start}–${s.end}`})`
    sectionSelect.appendChild(opt)
  }

  // Every page of the packet is letter size, so page 1's viewport sizes all
  // the placeholders up front and scroll positions are right before any
  // page has rendered.
  const first = await doc.getPage(1)
  const scale = Math.min(1.4, (window.innerWidth - 32) / first.getViewport({ scale: 1 }).width)
  const base = first.getViewport({ scale })
  const container = document.getElementById('pages')
  const holders = []
  for (let n = 1; n <= total; n++) {
    const div = document.createElement('div')
    div.className = 'page'
    div.dataset.page = n
    div.style.width = `${base.width}px`
    div.style.height = `${base.height}px`
    div.innerHTML = `<span class="num">Page ${n}</span>`
    container.appendChild(div)
    holders.push(div)
  }

  // Render on demand and release canvases far off-screen: drawing all 100+
  // pages at once would hold well over a gigabyte of canvas memory.
  const rendered = new Map() // page number -> render promise
  async function renderPage(n) {
    if (rendered.has(n)) return rendered.get(n)
    const job = (async () => {
      const page = await doc.getPage(n)
      const viewport = page.getViewport({ scale })
      const div = holders[n - 1]
      const canvas = document.createElement('canvas')
      const dpr = window.devicePixelRatio || 1
      canvas.width = viewport.width * dpr
      canvas.height = viewport.height * dpr
      canvas.style.width = `${viewport.width}px`
      canvas.style.height = `${viewport.height}px`
      await page.render({
        canvasContext: canvas.getContext('2d'),
        viewport,
        transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
      }).promise
      div.replaceChildren(canvas)

      let firstHit = null
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
      return firstHit
    })()
    rendered.set(n, job)
    return job
  }

  function release(n) {
    if (!rendered.has(n) || n === targetPage) return
    rendered.delete(n)
    holders[n - 1].innerHTML = `<span class="num">Page ${n}</span>`
  }

  // Target page first, so the cited sentence is on screen as fast as possible.
  const firstHit = await renderPage(targetPage)
  ;(firstHit ?? holders[targetPage - 1]).scrollIntoView({ block: firstHit ? 'center' : 'start' })

  const near = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const n = Number(e.target.dataset.page)
        if (e.isIntersecting) renderPage(n)
        else release(n)
      }
    },
    { rootMargin: '1200px 0px' },
  )
  holders.forEach((h) => near.observe(h))

  // Keep the page box in step with whatever page fills the middle of the view.
  const current = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting && document.activeElement !== pageInput) pageInput.value = e.target.dataset.page
      }
    },
    { rootMargin: '-50% 0px -50% 0px' },
  )
  holders.forEach((h) => current.observe(h))
  pageInput.value = targetPage

  function goTo(n) {
    const page = Math.min(Math.max(1, Math.round(n)), total)
    holders[page - 1].scrollIntoView({ block: 'start' })
    pageInput.value = page
  }
  pageInput.addEventListener('change', () => goTo(Number(pageInput.value) || 1))
  pageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      goTo(Number(pageInput.value) || 1)
      pageInput.blur()
    }
  })
  sectionSelect.addEventListener('change', () => {
    if (sectionSelect.value) goTo(Number(sectionSelect.value))
    sectionSelect.value = ''
  })

  document.body.dataset.ready = 'true'
}

main()
