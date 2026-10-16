import { useState } from 'react'
import Badge from './Badge'
import CriterionFeedback from './CriterionFeedback'
import CitationViewerModal from './CitationViewerModal'
import { openPacketWindow } from '../data/packet'
import {
  criterionLabel,
  criterionPolicyRef,
  criterionPolicyUrl,
  criterionHierarchyTier,
  isExternalHierarchyTier,
} from '../data/domain'

const EXPANSION_STYLES = {
  met: 'bg-met-bg/40 border-met-border',
  ambiguous: 'bg-ambiguous-bg/60 border-ambiguous-border',
  missing: 'bg-missing-bg/60 border-missing-border',
  'not-met': 'bg-notmet-bg/60 border-notmet-border',
}

const LINK_CLASS = 'inline-flex items-center gap-1 text-brand-dark hover:underline'

function FileTextIcon(props) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" {...props}>
      <path d="M4 1.5h5.5L12.5 4.5V14.5H4z" strokeLinejoin="round" />
      <path d="M9.5 1.5V4.5h3" strokeLinejoin="round" />
      <path d="M5.8 8h4.4M5.8 10.2h4.4M5.8 12.4h2.8" strokeLinecap="round" />
    </svg>
  )
}

function ExternalLinkIcon(props) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" {...props}>
      <path d="M6.5 3H3.6A1.1 1.1 0 0 0 2.5 4.1v8.3A1.1 1.1 0 0 0 3.6 13.5h8.3a1.1 1.1 0 0 0 1.1-1.1V9.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 2.5h4v4M13.3 2.7 8 8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Tabler's ti-chevron-down glyph.
function ChevronDownIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M6 9l6 6l6 -6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function CriterionRow({ criterion, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const [policyModalOpen, setPolicyModalOpen] = useState(false)
  const isAmbiguous = criterion.status === 'ambiguous'

  const tier = criterionHierarchyTier(criterion.id)
  const policyRef = criterionPolicyRef(criterion.id)
  const externalPolicy = isExternalHierarchyTier(tier)

  return (
    <div className="border border-line rounded-lg overflow-hidden bg-surface">
      <button
        onClick={() => setOpen((o) => !o)}
        className="group flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-paper"
      >
        <div className="flex items-center gap-3">
          {criterion.justResolved && (
            <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-white">
              UPDATED
            </span>
          )}
          <span className="text-sm text-ink">{criterionLabel(criterion.id)}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Badge status={criterion.status} />
          <span
            className={`flex h-[26px] w-[26px] items-center justify-center rounded-full border border-line text-ink-faint transition-colors duration-200 group-hover:bg-line/50 group-active:bg-line/80`}
          >
            <ChevronDownIcon
              className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            />
          </span>
        </div>
      </button>

      {open && (
        <div className={`border-t px-4 py-3 text-sm ${EXPANSION_STYLES[criterion.status]}`}>
          {/* Evidence: what was found in the source document */}
          <p className="italic text-ink">&ldquo;{criterion.quote}&rdquo;</p>
          <button onClick={() => openPacketWindow(criterion.id, criterionLabel(criterion.id))} className={`mt-1 text-xs ${LINK_CLASS}`}>
            <FileTextIcon className="h-3 w-3 shrink-0" />
            Source: {criterion.source} — view in document
          </button>

          <div className="my-3 border-t border-line/60" />

          {/* Policy basis: why that evidence does (or doesn't) satisfy the criterion */}
          <p className="text-ink-soft">
            {isAmbiguous ? (
              <>
                <span className="font-medium">Why this isn't clearly satisfied: </span>
                {criterion.reasoning}
              </>
            ) : (
              criterion.reasoning
            )}
          </p>
          <p className="mt-2 text-xs text-ink-faint">
            Tier {tier} — Governing policy:{' '}
            {externalPolicy ? (
              <a
                href={criterionPolicyUrl(criterion.id)}
                target="_blank"
                rel="noopener noreferrer"
                className={LINK_CLASS}
              >
                {policyRef}
                <ExternalLinkIcon className="h-3 w-3 shrink-0" />
              </a>
            ) : (
              <button onClick={() => setPolicyModalOpen(true)} className={LINK_CLASS}>
                <FileTextIcon className="h-3 w-3 shrink-0" />
                {policyRef}
              </button>
            )}
          </p>

          <CriterionFeedback />
        </div>
      )}

      <CitationViewerModal
        open={policyModalOpen}
        onClose={() => setPolicyModalOpen(false)}
        title={policyRef}
        sublabel="Mock policy excerpt"
        highlightCaption="Relevant policy basis"
        highlightText={criterion.reasoning}
      />
    </div>
  )
}
