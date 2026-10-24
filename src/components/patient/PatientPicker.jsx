import BackButton from '../BackButton'
import { CASES } from '../../data/cases'
import { makeT } from '../../data/patientI18n'
import { portalFor } from '../../data/patientPortal'
import { derivePatientStatus } from '../../data/patientDomain'

const fmt = makeT('en')

const PILL = {
  submitted: 'border-line bg-paper text-ink-soft',
  in_review: 'border-nurse/30 bg-nurse-tint text-nurse-dark',
  info_needed: 'border-ambiguous-border bg-ambiguous-bg text-ambiguous',
  approved: 'border-met-border bg-met-bg text-met',
  denied: 'border-notmet-border bg-notmet-bg text-notmet',
}

const PILL_LABEL = {
  submitted: 'Request sent',
  in_review: 'Review in progress',
  info_needed: 'Information needed',
  approved: 'Approved',
  denied: 'Not approved',
}

export default function PatientPicker({ runtime, onOpen, onBack }) {
  return (
    <div className="min-h-dvh bg-paper">
      <BackButton onClick={onBack} />
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-16 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-nurse-dark">
          {fmt.t('planName')} · {fmt.t('portalName')}
        </p>
        <h1 className="mt-1 text-[26px] font-semibold leading-tight text-ink">{fmt.t('pickerTitle')}</h1>
        <p className="mt-1 text-sm text-ink-soft">{fmt.t('pickerSubtitle')}</p>
        <p className="mt-1 text-xs text-ink-faint">{fmt.t('pickerLive')}</p>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {CASES.map((c) => {
            const portal = portalFor(c.id)
            const status = derivePatientStatus(runtime[c.id])
            return (
              <li key={c.id}>
                <button
                  onClick={() => onOpen(c.id)}
                  className="group flex h-full w-full flex-col rounded-xl border border-line bg-surface px-4 py-4 text-left transition hover:border-nurse/50 hover:shadow-sm"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span>
                      <span className="block text-sm font-semibold text-ink">{c.memberName}</span>
                      <span className="block text-xs text-ink-faint">{c.memberId}</span>
                    </span>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${PILL[status]}`}>
                      {PILL_LABEL[status]}
                    </span>
                  </span>
                  <span className="mt-2 block text-sm text-ink-soft">{portal.procedure.en}</span>
                  <span className="mt-3 flex items-center justify-between text-xs">
                    <span className={c.cmsClock.type === 'expedited' ? 'font-medium text-notmet' : 'text-ink-faint'}>
                      {c.cmsClock.type === 'expedited' ? 'Critical · 72h' : 'Standard · 7 days'}
                    </span>
                    <span className="font-medium text-nurse-dark opacity-70 transition group-hover:opacity-100">
                      {fmt.t('openPortal')} →
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
