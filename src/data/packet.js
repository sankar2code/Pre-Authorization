import PACKET_INDEX from './packetIndex.json'

// One shared packet PDF (public/packet.pdf) backs every case. Its page
// numbers come from packetIndex.json, which scripts/generate-packet.py
// writes alongside the PDF, so a regenerated packet can never leave a
// citation pointing at the wrong page. Each anchor's quote must match the
// packet's text (case/whitespace-insensitive); it may wrap across lines.
// scripts/check-packet.py verifies every anchor against the PDF.
export const PACKET_PAGES = PACKET_INDEX.totalPages
export const PACKET_SECTIONS = PACKET_INDEX.sections

export function anchor(key) {
  const a = PACKET_INDEX.anchors[key]
  if (!a) throw new Error(`Unknown packet anchor: ${key}`)
  return a
}

// "Surgical Consult, p. 16" — the label a criterion or extracted fact
// shows, with the page the viewer will actually open to.
export function pageRef(label, key) {
  return `${label}, p. ${anchor(key).page}`
}

// The packet evidence behind each inpatient criterion.
const CRITERION_ANCHOR = {
  procedure: 'procedure',
  comorbidities: 'comorbidities',
  clearance: 'clearance',
  los: 'los',
}

const VIEWER_URL = `${import.meta.env.BASE_URL}packet-viewer.html`

function openViewer(query) {
  const width = Math.min(900, window.screen.availWidth - 80)
  const height = Math.min(1000, window.screen.availHeight - 80)
  window.open(
    `${VIEWER_URL}${query}`,
    'packet-viewer',
    `popup=yes,width=${width},height=${height},left=${window.screenX + 60},top=${window.screenY + 40},resizable=yes,scrollbars=yes`,
  )
}

// With a criterion id, opens the packet scrolled to and highlighting that
// criterion's evidence; without one, opens it from the top.
export function openPacketWindow(criterionId, label) {
  const key = CRITERION_ANCHOR[criterionId]
  const target = key ? anchor(key) : null
  const query = target
    ? `?${new URLSearchParams({ page: target.page, q: target.quote, label })}`
    : ''
  openViewer(query)
}

// Same viewer, but for an arbitrary page/phrase rather than a known
// criterion — used by the document chat's "view on page" citations.
export function openPacketWindowAt(page, quote, label) {
  const query = `?${new URLSearchParams({ page, q: quote ?? '', label: label ?? '' })}`
  openViewer(query)
}
