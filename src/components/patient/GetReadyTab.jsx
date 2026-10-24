import { Card, LockedPanel, SecondaryButton } from './PortalBits'
import { CalendarPlusIcon, CheckIcon, ClockIcon } from './PatientIcons'
import { CHECKLIST_GROUPS, daysFromToday } from '../../data/patientPortal'
import { derivePatientStatus } from '../../data/patientDomain'

// "5:30 AM" -> { h: 5, m: 30 }
function parseTime(s) {
  const [, hh, mm, ap] = s.match(/(\d+):(\d+)\s*(AM|PM)/i)
  let h = Number(hh) % 12
  if (ap.toUpperCase() === 'PM') h += 12
  return { h, m: Number(mm) }
}

const pad = (n) => String(n).padStart(2, '0')
const icsLocal = (d) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
const icsText = (s) => s.replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n')

// Builds a one-event .ics file and hands it to the browser as a download.
function downloadIcs({ start, hours, title, location, description, uid }) {
  const end = new Date(start.getTime() + hours * 60 * 60 * 1000)
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pre-Auth Demo//Patient Portal//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}@pre-auth-demo`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${icsLocal(start)}`,
    `DTEND:${icsLocal(end)}`,
    `SUMMARY:${icsText(title)}`,
    `LOCATION:${icsText(location)}`,
    `DESCRIPTION:${icsText(description)}`,
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsText(title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'procedure-appointment.ics'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function Checklist({ fmt, portal, done, onToggle }) {
  const total = portal.checklist.length
  const doneCount = portal.checklist.filter((i) => done[i.id]).length
  const groups = [...new Set(portal.checklist.map((i) => i.group))]
  return (
    <Card title={fmt.t('readyTitle')}>
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper">
          <div className="h-full rounded-full bg-met transition-all" style={{ width: `${(doneCount / total) * 100}%` }} />
        </div>
        <span className="shrink-0 text-xs font-medium text-ink-soft">{fmt.t('readyProgress', { done: doneCount, total })}</span>
      </div>
      <div className="mt-4 space-y-4">
        {groups.map((g) => (
          <div key={g}>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">{fmt.L(CHECKLIST_GROUPS[g])}</p>
            <ul className="mt-1.5 space-y-1">
              {portal.checklist
                .filter((i) => i.group === g)
                .map((item) => {
                  const checked = Boolean(done[item.id])
                  return (
                    <li key={item.id}>
                      <label className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-1.5 transition hover:bg-paper">
                        <input type="checkbox" checked={checked} onChange={() => onToggle(item.id)} className="sr-only" />
                        <span
                          aria-hidden
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
                            checked ? 'border-met bg-met text-white' : 'border-line bg-surface'
                          }`}
                        >
                          {checked && <CheckIcon className="h-3 w-3" />}
                        </span>
                        <span className={`text-sm ${checked ? 'text-ink-faint line-through' : 'text-ink'}`}>{fmt.L(item)}</span>
                      </label>
                    </li>
                  )
                })}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-4 border-t border-line pt-3 text-xs text-ink-faint">{fmt.t('readyDisclaimer')}</p>
    </Card>
  )
}

function Appointment({ fmt, portal }) {
  const a = portal.appointment
  const start = portal.admitted ? null : daysFromToday(a.offset)
  if (start) {
    const { h, m } = parseTime(a.arrive)
    start.setHours(h, m)
  }
  const rows = [
    start && [fmt.t('apptDate'), fmt.date(start, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })],
    start && [fmt.t('apptArrive'), a.arrive],
    [fmt.t('apptWhere'), `${a.facility} · ${a.address}`],
    [fmt.t('apptPhone'), a.phone],
  ].filter(Boolean)
  return (
    <Card title={fmt.t('apptTitle')}>
      <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[120px_1fr]">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-ink-faint">{k}</dt>
            <dd className="text-ink">{v}</dd>
          </div>
        ))}
        <dt className="text-ink-faint">{fmt.t('apptBring')}</dt>
        <dd>
          <ul className="list-disc space-y-0.5 pl-4 text-ink">
            {fmt.L(a.bring).map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </dd>
      </dl>
      {start && (
        <SecondaryButton
          className="mt-4 inline-flex items-center gap-2"
          onClick={() =>
            downloadIcs({
              start,
              hours: a.durationHours + 1,
              title: `${fmt.L(portal.procedure)} — ${a.facility}`,
              location: `${a.facility}, ${a.address}`,
              description: `${fmt.t('apptArrive')} ${a.arrive}. ${fmt.t('apptPhone')}: ${a.phone}.`,
              uid: `${portal.contact.email}-${a.offset}`,
            })
          }
        >
          <CalendarPlusIcon className="h-4 w-4" />
          {fmt.t('apptCalendar')}
        </SecondaryButton>
      )}
    </Card>
  )
}

export default function GetReadyTab({ fmt, rt, portal, actions }) {
  if (derivePatientStatus(rt) !== 'approved') return <LockedPanel text={fmt.t('lockedTab')} />
  const days = portal.admitted ? null : portal.appointment.offset
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-nurse/30 bg-nurse-tint px-4 py-3">
        <ClockIcon className="h-5 w-5 shrink-0 text-nurse-dark" />
        <p className="text-sm font-medium text-nurse-dark">
          {days === null ? fmt.t('readyAdmitted') : days === 1 ? fmt.t('readyCountdownOne') : fmt.t('readyCountdown', { n: days })}
        </p>
      </div>
      <Checklist fmt={fmt} portal={portal} done={rt.patient.checklist} onToggle={actions.toggleChecklist} />
      <Appointment fmt={fmt} portal={portal} />
    </div>
  )
}
