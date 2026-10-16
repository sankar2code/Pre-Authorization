// One shared packet PDF (public/packet.pdf) backs every case, so the exact
// line to highlight is fixed per criterion type rather than per case. The
// phrase must match the packet's text (case/whitespace-insensitive); it may
// wrap across lines.
const PACKET_TARGETS = {
  procedure: {
    page: 4,
    q: 'Recommend open lumbar spinal fusion, L4-L5, with posterior instrumentation.',
  },
  comorbidities: {
    page: 6,
    q: 'Congestive heart failure, HFrEF, EF 40% (echo 07/2026)',
  },
  clearance: {
    page: 10,
    q: 'Patient is cleared for surgery from a cardiac standpoint.',
  },
  los: {
    page: 12,
    q: 'Patient anticipated to require inpatient admission post-operatively for pain control, mobilization, and cardiac monitoring',
  },
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
  const target = PACKET_TARGETS[criterionId]
  const query = target
    ? `?${new URLSearchParams({ page: target.page, q: target.q, label })}`
    : ''
  openViewer(query)
}

// Same viewer, but for an arbitrary page/phrase rather than a known
// criterion — used by the document chat's "view on page" citations.
export function openPacketWindowAt(page, quote, label) {
  const query = `?${new URLSearchParams({ page, q: quote ?? '', label: label ?? '' })}`
  openViewer(query)
}
