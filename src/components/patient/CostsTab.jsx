import { useState } from 'react'
import { Card, LockedPanel, OptionCard, PrimaryButton, SecondaryButton, Select, TermHelp } from './PortalBits'
import { CheckIcon } from './PatientIcons'
import { planLabel } from '../../data/patientI18n'
import { PAYMENT_PLAN_MONTHS, costTotal, monthlyAmount } from '../../data/patientPortal'
import { derivePatientStatus } from '../../data/patientDomain'

const DECLINE_REASONS = ['cost', 'opinion', 'timing', 'other']
const INCOME_MID = { 1: 20000, 2: 45000, 3: 75000, 4: 110000 }

// Demo-only screening: compares the income bracket's midpoint with an
// illustrative poverty-line figure for the household size. Real hospital
// financial-assistance policies vary; the result is labeled as a demo.
function screenAssistance(household, income) {
  const line = 15650 + 5500 * (household - 1)
  const ratio = INCOME_MID[income] / line
  if (ratio <= 2) return 'full'
  if (ratio <= 4) return 'partial'
  return 'none'
}

function Estimate({ fmt, portal }) {
  const { costs } = portal
  const total = costTotal(costs)
  return (
    <Card title={fmt.t('costsTitle')}>
      <p className="text-xs text-ink-faint">
        {fmt.t('costsPlan')}: <span className="font-medium text-ink-soft">{costs.plan}</span>
      </p>
      <ul className="mt-3 divide-y divide-line">
        {costs.lines.map((l, i) => (
          <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
            <span className="flex items-center gap-1 text-ink">
              {fmt.L(l)}
              <TermHelp text={fmt.t(`term_${l.term}`)} label={`${fmt.t('whatIsThis')} ${fmt.L(l)}`} />
            </span>
            <span className="shrink-0 tabular-nums text-ink">{fmt.money(l.amount)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-1 flex items-center justify-between gap-3 border-t-2 border-ink/10 pt-3">
        <span className="text-sm font-semibold text-ink">{fmt.t('costsTotal')}</span>
        <span className="text-xl font-semibold tabular-nums text-ink">{fmt.money(total)}</span>
      </div>
      <p className="mt-3 flex items-start gap-1 text-xs text-ink-soft">
        <span>
          {fmt.t('costsOopNote', {
            met: fmt.money(costs.oopMet),
            max: fmt.money(costs.oopMax),
            left: fmt.money(costs.oopMax - costs.oopMet),
          })}
        </span>
        <TermHelp text={fmt.t('term_oop')} label={fmt.t('whatIsThis')} />
      </p>
      <p className="mt-1 text-xs text-ink-faint">{fmt.t('costsEstimate')}</p>
    </Card>
  )
}

function channelWord(fmt, notify) {
  if (notify.sms) return fmt.t('channelSms')
  if (notify.email) return fmt.t('channelEmail')
  return fmt.t('channelPortal')
}

function Outcome({ fmt, rt, portal, actions }) {
  const p = rt.patient
  if (p.decision === 'accepted') {
    const pay = p.payment
    return (
      <Card tone="good">
        <p className="flex items-center gap-2 text-sm font-semibold text-met">
          <CheckIcon className="h-4 w-4" />
          {pay.when === 'now' ? fmt.t('paidTitle') : fmt.t('planTitle')}
        </p>
        {pay.when === 'now' ? (
          <div className="mt-2 text-sm text-ink">
            <p>{fmt.t('paidDetail', { amount: fmt.money(pay.amount), method: pay.method === 'hsa' ? fmt.t('payHsa') : fmt.t('payCard') })}</p>
            <p className="mt-2 text-xs text-ink-soft">
              {fmt.t('paidConfirmation')}: <span className="font-mono font-medium text-ink">{pay.ref}</span>
            </p>
          </div>
        ) : (
          <div className="mt-2 space-y-1 text-sm text-ink">
            <p>{fmt.t('planDetail', { plan: planLabel(fmt, pay) })}</p>
            <p className="text-xs text-ink-soft">{fmt.t('payLaterLink', { channel: channelWord(fmt, p.notify) })}</p>
          </div>
        )}
      </Card>
    )
  }
  return (
    <Card tone="info">
      <p className="text-sm font-semibold text-nurse-dark">{fmt.t('declinedTitle')}</p>
      <p className="mt-1 text-sm text-ink">{fmt.t('declinedDetail', { office: fmt.L(portal.provider.office) })}</p>
      {p.assistance && <p className="mt-2 text-xs text-ink-soft">{fmt.t(`assist_${p.assistance.result}`)}</p>}
      <SecondaryButton className="mt-4" onClick={actions.reopen}>
        {fmt.t('reopen')}
      </SecondaryButton>
    </Card>
  )
}

export default function CostsTab({ fmt, rt, portal, actions }) {
  const [step, setStep] = useState('estimate')
  const [when, setWhen] = useState('later')
  const [method, setMethod] = useState('card')
  const [option, setOption] = useState(6)
  const [reason, setReason] = useState('cost')
  const [note, setNote] = useState('')
  const [household, setHousehold] = useState('2')
  const [income, setIncome] = useState('2')
  const [assistResult, setAssistResult] = useState(null)

  if (derivePatientStatus(rt) !== 'approved') return <LockedPanel text={fmt.t('lockedTab')} />

  const total = costTotal(portal.costs)
  const decided = rt.patient.decision

  function confirmPay() {
    if (when === 'now') actions.accept({ when: 'now', method, amount: total })
    else
      actions.accept({
        when: 'later',
        option,
        monthly: option === 'service' ? null : monthlyAmount(total, option),
        amount: total,
      })
    setStep('estimate')
  }

  function confirmDecline() {
    if (reason === 'cost' && step === 'decline') {
      setAssistResult(null)
      setStep('assist')
      return
    }
    actions.decline({ reason, note: note.trim() })
    setStep('estimate')
  }

  function runAssist() {
    const result = screenAssistance(Number(household), Number(income))
    setAssistResult(result)
    actions.assistance({ household: Number(household), income: Number(income), result })
  }

  return (
    <div className="space-y-4">
      <Estimate fmt={fmt} portal={portal} />

      {decided && step === 'estimate' && <Outcome fmt={fmt} rt={rt} portal={portal} actions={actions} />}

      {!decided && step === 'estimate' && (
        <div className="flex flex-wrap gap-3">
          <PrimaryButton onClick={() => setStep('how')}>{fmt.t('accept')}</PrimaryButton>
          <SecondaryButton onClick={() => setStep('decline')}>{fmt.t('decline')}</SecondaryButton>
        </div>
      )}

      {step === 'how' && (
        <Card title={fmt.t('payHowTitle')}>
          <div className="grid gap-2 sm:grid-cols-2">
            <OptionCard name="when" selected={when === 'now'} onSelect={() => setWhen('now')} title={fmt.t('payNow')} detail={fmt.t('payNowDetail')} />
            <OptionCard name="when" selected={when === 'later'} onSelect={() => setWhen('later')} title={fmt.t('payLater')} detail={fmt.t('payLaterDetail')} />
          </div>

          {when === 'now' ? (
            <div className="mt-4">
              <p className="text-xs font-medium text-ink-soft">{fmt.t('payMethod')}</p>
              <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                <OptionCard name="method" selected={method === 'card'} onSelect={() => setMethod('card')} title={fmt.t('payCard')} />
                <OptionCard name="method" selected={method === 'hsa'} onSelect={() => setMethod('hsa')} title={fmt.t('payHsa')} />
              </div>
              <p className="mt-3 rounded-md border border-dashed border-line bg-paper px-3 py-2 text-xs text-ink-soft">{fmt.t('payDemo')}</p>
            </div>
          ) : (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <OptionCard name="plan" selected={option === 'service'} onSelect={() => setOption('service')} title={fmt.t('payLaterAtService')} detail={fmt.money(total)} />
              {PAYMENT_PLAN_MONTHS.map((m) => (
                <OptionCard
                  key={m}
                  name="plan"
                  selected={option === m}
                  onSelect={() => setOption(m)}
                  title={fmt.t('payLaterMonths', { n: m, amount: fmt.money(monthlyAmount(total, m)) })}
                />
              ))}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <PrimaryButton onClick={confirmPay}>
              {when === 'now' ? fmt.t('payConfirm', { amount: fmt.money(total) }) : fmt.t('payLaterConfirm')}
            </PrimaryButton>
            <SecondaryButton onClick={() => setStep('estimate')}>{fmt.t('cancel')}</SecondaryButton>
          </div>
        </Card>
      )}

      {step === 'decline' && (
        <Card title={fmt.t('declineTitle')}>
          <p className="text-sm text-ink-soft">{fmt.t('declineIntro')}</p>
          <p className="mt-3 text-xs font-medium text-ink-soft">{fmt.t('declineReason')}</p>
          <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
            {DECLINE_REASONS.map((r) => (
              <OptionCard key={r} name="reason" selected={reason === r} onSelect={() => setReason(r)} title={fmt.t(`reason_${r}`)} />
            ))}
          </div>
          <label className="mt-3 block">
            <span className="text-xs font-medium text-ink-soft">{fmt.t('declineNote')}</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-nurse focus:outline-none"
            />
          </label>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={confirmDecline}
              className="rounded-md bg-notmet px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              {fmt.t('declineConfirm')}
            </button>
            <SecondaryButton onClick={() => setStep('estimate')}>{fmt.t('cancel')}</SecondaryButton>
          </div>
        </Card>
      )}

      {step === 'assist' && (
        <Card title={fmt.t('assistTitle')} tone="info">
          <p className="text-sm text-ink-soft">{fmt.t('assistIntro')}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Select
              label={fmt.t('assistHousehold')}
              value={household}
              onChange={setHousehold}
              options={[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: String(n) }))}
            />
            <Select
              label={fmt.t('assistIncome')}
              value={income}
              onChange={setIncome}
              options={[1, 2, 3, 4].map((n) => ({ value: String(n), label: fmt.t(`income_${n}`) }))}
            />
          </div>
          {assistResult ? (
            <>
              <p className="mt-4 rounded-md border border-line bg-surface px-3 py-2.5 text-sm font-medium text-ink">{fmt.t(`assist_${assistResult}`)}</p>
              <p className="mt-1.5 text-xs text-ink-faint">{fmt.t('assistDemo')}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <PrimaryButton onClick={() => setStep('how')}>{fmt.t('assistContinue')}</PrimaryButton>
                <SecondaryButton
                  onClick={() => {
                    actions.decline({ reason, note: note.trim() })
                    setStep('estimate')
                  }}
                >
                  {fmt.t('assistDeclineAnyway')}
                </SecondaryButton>
              </div>
            </>
          ) : (
            <div className="mt-4 flex flex-wrap gap-3">
              <PrimaryButton onClick={runAssist}>{fmt.t('assistCheck')}</PrimaryButton>
              <SecondaryButton
                onClick={() => {
                  actions.decline({ reason, note: note.trim() })
                  setStep('estimate')
                }}
              >
                {fmt.t('assistSkip')}
              </SecondaryButton>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
