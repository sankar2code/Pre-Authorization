import { useEffect, useRef } from 'react'
import StatusTracker from './StatusTracker'
import { Card, PrimaryButton } from './PortalBits'
import { CheckIcon, DocIcon, PhoneIcon } from './PatientIcons'
import { formatWhen, planLabel } from '../../data/patientI18n'
import { DOC_LABELS } from '../../data/patientPortal'
import { PACKET_PAGES, PACKET_SECTIONS } from '../../data/packet'
import {
  denialReasonIds,
  derivePatientStatus,
  patientActivity,
  patientSteps,
  waitingOnItems,
} from '../../data/patientDomain'

const DAY = 24 * 60 * 60 * 1000

function StatusCard({ fmt, rt, portal }) {
  const status = derivePatientStatus(rt)
  const tone = { approved: 'good', denied: 'bad', info_needed: 'warn' }[status]
  return (
    <Card>
      <div className={`-mx-4 -mt-4 mb-4 rounded-t-xl border-b px-4 py-3 sm:-mx-5 sm:px-5 ${
        tone === 'good' ? 'border-met-border bg-met-bg' : tone === 'bad' ? 'border-notmet-border bg-notmet-bg' : tone === 'warn' ? 'border-ambiguous-border bg-ambiguous-bg' : 'border-nurse/20 bg-nurse-tint'
      }`}>
        <p className={`text-base font-semibold ${tone === 'good' ? 'text-met' : tone === 'bad' ? 'text-notmet' : tone === 'warn' ? 'text-ambiguous' : 'text-nurse-dark'}`}>
          {fmt.t(`headline_${status}`)}
        </p>
        <p className="mt-0.5 text-sm text-ink-soft">{fmt.t(`sub_${status}`, { office: fmt.cap(fmt.L(portal.provider.office)) })}</p>
      </div>
      <StatusTracker steps={patientSteps(rt)} fmt={fmt} />
      {rt.clarification?.status === 'responded' && status !== 'approved' && status !== 'denied' && (
        <p className="mt-4 flex items-start gap-2 rounded-md border border-met-border bg-met-bg px-3 py-2 text-xs text-met">
          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {fmt.t('waitingResolved')}
        </p>
      )}
    </Card>
  )
}

function WaitingOn({ fmt, caseData, rt, portal }) {
  const items = waitingOnItems(caseData, rt)
  if (items.length === 0) return null
  const failed = items[0].failed
  const stamps = rt.clarification?.stageTimestamps
  return (
    <Card title={fmt.t('waitingTitle')} tone="warn">
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">{fmt.t('waitingOwner')}</dt>
          <dd className="mt-0.5 text-ink">
            <span className="font-medium">{fmt.cap(fmt.L(portal.provider.office))}</span> · {portal.provider.officeShort}
            <span className="mt-0.5 block text-xs text-ink-soft">{fmt.t('waitingNotYou')}</span>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">{fmt.t('waitingAsked')}</dt>
          {failed ? (
            <dd className="mt-0.5 text-ink">
              {fmt.lang === 'es'
                ? `Algunas páginas de los expedientes que envió por fax su consultorio no se pudieron leer (${caseData.unreadablePages.replace('Pages', 'páginas')}). El consultorio debe reenviarlas con mejor calidad.`
                : `Some pages of the records your doctor’s office faxed couldn’t be read (${caseData.unreadablePages.toLowerCase()}). The office needs to resend them as a clearer copy.`}
            </dd>
          ) : (
            <dd className="mt-1">
              <ul className="space-y-1.5">
                {items.map((i) => (
                  <li key={i.id} className="flex gap-2 text-ink">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ambiguous" />
                    {fmt.L(i.text)}
                  </li>
                ))}
              </ul>
            </dd>
          )}
        </div>
        {stamps && (
          <ol className="flex flex-wrap gap-x-4 gap-y-1 border-t border-ambiguous-border pt-3 text-xs text-ink-soft">
            {[
              ['waitingSent', stamps.sent],
              ['waitingDelivered', stamps.delivered],
              ['waitingViewed', stamps.viewed],
            ].map(([key, at]) => (
              <li key={key} className={`flex items-center gap-1.5 ${at ? '' : 'opacity-50'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${at ? 'bg-met' : 'bg-line'}`} />
                {fmt.t(key)}
                {at && <span className="text-ink-faint">· {at.split(', ')[1]}</span>}
              </li>
            ))}
          </ol>
        )}
      </dl>
    </Card>
  )
}

// Simulated progression of the doctor-to-doctor call: each stage advances
// on its own after a short pause, as if the provider office and the plan
// were working it in the background.
function PeerToPeer({ fmt, appeal, onAdvance }) {
  // The latest callback, without restarting the timer on every re-render.
  const advance = useRef(onAdvance)
  useEffect(() => {
    advance.current = onAdvance
  })
  useEffect(() => {
    if (appeal.stage === 'completed') return
    const next = appeal.stage === 'requested' ? 'scheduled' : 'completed'
    const id = setTimeout(() => advance.current(next), appeal.stage === 'requested' ? 5000 : 7000)
    return () => clearTimeout(id)
  }, [appeal.stage])

  const order = ['requested', 'scheduled', 'completed']
  const at = order.indexOf(appeal.stage)
  return (
    <div className="mt-4 border-t border-line pt-4">
      <p className="text-sm font-medium text-ink">{fmt.t('p2pTitle')}</p>
      <p className="mt-0.5 text-xs text-ink-soft">{fmt.t('p2pIntro')}</p>
      <ol className="mt-3 flex items-center gap-2 text-xs">
        {order.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${
              i <= at ? 'border-met-border bg-met-bg text-met' : 'border-line text-ink-faint'
            }`}>
              {i <= at && <CheckIcon className="h-3 w-3" />}
              {fmt.t(`p2p${s[0].toUpperCase()}${s.slice(1)}`)}
            </span>
            {i < order.length - 1 && <span className="h-px w-4 bg-line" />}
          </li>
        ))}
      </ol>
      {appeal.stage === 'scheduled' && (
        <p className="mt-2 text-xs text-ink-soft">
          {fmt.t('p2pScheduledDetail', { date: fmt.date(new Date(appeal.scheduledForMs), { weekday: 'long', month: 'long', day: 'numeric' }) })}
        </p>
      )}
      {appeal.stage === 'completed' && <p className="mt-2 text-xs text-ink-soft">{fmt.t('p2pCompletedDetail')}</p>}
    </div>
  )
}

function Denial({ fmt, rt, portal, actions }) {
  const reasons = denialReasonIds(rt)
  // Every logged entry carries atMs, so the decision time is always known.
  const decidedAt = [...rt.audit].reverse().find((e) => e.group === 'determined').atMs
  const deadline = new Date(decidedAt + 65 * DAY)
  return (
    <>
      <Card title={fmt.t('denialTitle')} tone="bad">
        {reasons.length > 0 ? (
          <>
            <p className="text-sm text-ink-soft">{fmt.t('denialIntro')}</p>
            <ul className="mt-2 space-y-1.5">
              {reasons.map((id) => (
                <li key={id} className="flex gap-2 text-sm text-ink">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-notmet" />
                  {fmt.t(`reason_${id}`)}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-ink">{fmt.t('denialFallback')}</p>
        )}
        <p className="mt-3 text-xs text-ink-soft">{fmt.t('denialNote')}</p>
      </Card>
      <Card title={fmt.t('appealTitle')}>
        <ul className="space-y-1.5 text-sm text-ink">
          <li className="font-medium">{fmt.t('appealDeadline', { date: fmt.date(deadline, { month: 'long', day: 'numeric', year: 'numeric' }) })}</li>
          <li className="text-ink-soft">{fmt.t('appealTimes')}</li>
          <li className="text-ink-soft">{fmt.t('appealWho')}</li>
        </ul>
        {rt.patient.appeal ? (
          <>
            <p className="mt-4 flex items-start gap-2 rounded-md border border-met-border bg-met-bg px-3 py-2 text-xs text-met">
              <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {fmt.t('appealSent', {
                office: fmt.L(portal.provider.office),
                officeCap: fmt.cap(fmt.L(portal.provider.office)),
                date: fmt.date(new Date(rt.patient.appeal.requestedAtMs), { month: 'long', day: 'numeric' }),
              })}
            </p>
            <PeerToPeer fmt={fmt} appeal={rt.patient.appeal} onAdvance={actions.advancePeerToPeer} />
          </>
        ) : (
          <PrimaryButton className="mt-4" onClick={actions.requestAppeal}>
            {fmt.t('appealButton')}
          </PrimaryButton>
        )}
      </Card>
    </>
  )
}

function activityText(fmt, e, portal) {
  const vars = { office: fmt.L(portal.provider.office), plan: fmt.t('planName') }
  if (e.key === 'act_initiated') vars.office = portal.provider.officeShort
  if (e.data?.type === 'accepted_now') vars.amount = fmt.money(e.data.amount)
  if (e.data?.type === 'accepted_later') vars.plan = planLabel(fmt, e.data)
  if (e.data?.type === 'callback') vars.who = fmt.t(e.data.who === 'office' ? 'who_office_3p' : 'who_plan_3p')
  return fmt.t(e.key, vars)
}

export function Activity({ fmt, caseData, rt, portal }) {
  const events = patientActivity(caseData, rt)
  return (
    <Card title={fmt.t('activityTitle')}>
      <ol className="space-y-3 border-l border-line pl-4">
        {events.map((e) => (
          <li key={e.id} className="relative">
            <span
              className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-surface ${
                e.tone === 'approved' ? 'bg-met' : e.tone === 'denied' ? 'bg-notmet' : e.kind === 'patient' ? 'bg-brand' : 'bg-nurse'
              }`}
            />
            <p className="text-sm text-ink">{activityText(fmt, e, portal)}</p>
            <p className="text-xs text-ink-faint">{formatWhen(fmt, e.atMs, e.at)}</p>
          </li>
        ))}
      </ol>
    </Card>
  )
}

function DocsSent({ fmt }) {
  return (
    <Card>
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-ink">
            <DocIcon className="h-4 w-4 text-ink-faint" />
            {fmt.t('docsTitle')}
          </span>
          <span className="text-xs text-ink-faint transition group-open:rotate-180">▾</span>
        </summary>
        <p className="mt-3 text-sm text-ink-soft">{fmt.t('docsIntro', { pages: PACKET_PAGES })}</p>
        <ul className="mt-2 divide-y divide-line rounded-md border border-line">
          {PACKET_SECTIONS.map((s) => {
            const n = s.end - s.start + 1
            return (
              <li key={s.key} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="text-ink">{fmt.L(DOC_LABELS[s.key])}</span>
                <span className="shrink-0 text-xs text-ink-faint">{n === 1 ? fmt.t('docsPage') : fmt.t('docsPages', { n })}</span>
              </li>
            )
          })}
        </ul>
        <p className="mt-2 text-xs text-ink-faint">{fmt.t('docsPrivacy')}</p>
      </details>
    </Card>
  )
}

export default function RequestTab({ fmt, caseData, rt, portal, actions }) {
  const status = derivePatientStatus(rt)
  return (
    <div className="space-y-4">
      <StatusCard fmt={fmt} rt={rt} portal={portal} />
      <WaitingOn fmt={fmt} caseData={caseData} rt={rt} portal={portal} />
      {status === 'denied' && <Denial fmt={fmt} rt={rt} portal={portal} actions={actions} />}
      <Activity fmt={fmt} caseData={caseData} rt={rt} portal={portal} />
      <DocsSent fmt={fmt} />
      <p className="flex items-center gap-2 px-1 text-xs text-ink-faint">
        <PhoneIcon className="h-3.5 w-3.5" />
        {fmt.cap(fmt.L(portal.provider.office))} · {portal.provider.phone}
      </p>
    </div>
  )
}
