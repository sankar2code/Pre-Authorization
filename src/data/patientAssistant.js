// Scripted "Ask about my authorization" assistant for the patient portal.
// Like the nurse side's document chat, nothing here calls a model: answers
// are written ahead of time and matched by keyword, then filled in from the
// patient's live case state, so the answer always matches what the portal
// shows. Two hard rules: it only covers status, costs and preparation, and
// any medical question is sent to the care team, never answered.
import { costTotal, daysFromToday, PAYMENT_PLAN_MONTHS, monthlyAmount } from './patientPortal'
import { derivePatientStatus, waitingOnItems } from './patientDomain'

// Checked first: anything that sounds like a symptom or a treatment
// decision gets the care-team handoff, whatever else it matches.
const MEDICAL = [
  'pain', 'hurt', 'dose', 'dosage', 'side effect', 'symptom', 'is it safe', 'fever', 'bleeding', 'swelling',
  'should i stop', 'should i take', 'infection', 'dizzy', 'allerg',
  'dolor', 'duele', 'dosis', 'efecto secundario', 'síntoma', 'sintoma', 'es seguro', 'fiebre', 'sangrado',
  'hinchaz', 'debo dejar', 'debo tomar', 'infección', 'infeccion', 'mareo', 'alergia',
]

const INTENTS = [
  { key: 'status', words: ['status', 'where is my', 'approved', 'update', 'progress', 'decision', 'estado', 'aprob', 'decisión', 'decision', 'avance'] },
  { key: 'timeline', words: ['how long', 'when will', 'deadline', '72', 'days', 'hours', 'cuánto tiempo', 'cuanto tiempo', 'cuándo', 'cuando', 'plazo', 'horas', 'días'] },
  { key: 'waiting', words: ['waiting', 'need', 'missing', 'information', 'info', 'asked', 'esperando', 'falta', 'información', 'informacion', 'necesita', 'pidió'] },
  { key: 'cost', words: ['cost', 'owe', 'price', 'bill', 'total', 'how much', 'estimate', 'costo', 'cuánto', 'cuanto', 'factura', 'precio', 'estimado'] },
  { key: 'terms', words: ['copay', 'deductible', 'coinsurance', 'out-of-pocket', 'out of pocket', 'copago', 'deducible', 'coseguro', 'bolsillo'] },
  { key: 'paying', words: ['payment plan', 'monthly', 'hsa', 'fsa', 'pay later', 'installment', 'pay now', 'plan de pago', 'mensual', 'después', 'pagar'] },
  { key: 'prep', words: ['prepare', 'eat', 'drink', 'before surgery', 'night before', 'medication', 'medicine', 'pills', 'ready', 'preparar', 'comer', 'beber', 'noche', 'medicamento', 'pastillas', 'prepar'] },
  { key: 'appointment', words: ['appointment', 'arrive', 'address', 'what time', 'bring', 'where do i go', 'location', 'cita', 'llegar', 'dirección', 'direccion', 'hora', 'traer', 'dónde'] },
  { key: 'appeal', words: ['appeal', 'denied', 'not approved', 'why', 'peer', 'apelar', 'apelación', 'apelacion', 'negad', 'no aprob', 'por qué', 'porque'] },
  { key: 'contact', words: ['call', 'phone', 'talk to', 'contact', 'callback', 'person', 'llamar', 'llamada', 'teléfono', 'telefono', 'hablar', 'contacto', 'persona'] },
]

export function suggestedQuestions(status, lang) {
  const es = lang === 'es'
  const byStatus = {
    submitted: es ? ['¿Cuál es el estado de mi solicitud?', '¿Cuánto tiempo tardará la decisión?'] : ['What’s the status of my request?', 'How long will the decision take?'],
    in_review: es ? ['¿Cuál es el estado de mi solicitud?', '¿Cuánto tiempo tardará la decisión?'] : ['What’s the status of my request?', 'How long will the decision take?'],
    info_needed: es ? ['¿Qué información están esperando?', '¿Tengo que hacer algo?'] : ['What information are you waiting on?', 'Do I need to do anything?'],
    approved: es ? ['¿Cuánto voy a pagar?', '¿Qué es un deducible?', '¿Qué no debo comer antes de la cirugía?'] : ['How much will I owe?', 'What is a deductible?', 'Can I eat before surgery?'],
    denied: es ? ['¿Por qué no fue aprobada?', '¿Cómo apelo?'] : ['Why wasn’t it approved?', 'How do I appeal?'],
  }
  return byStatus[status]
}

// Spanish contracts "a el" to "al": "Llame al consultorio de…"
function toOffice(ctx) {
  const office = ctx.L(ctx.portal.provider.office)
  return ctx.lang === 'es' && office.startsWith('el ') ? `al ${office.slice(3)}` : `a ${office}`
}

const lowerFirst = (s) => s[0].toLowerCase() + s.slice(1)

function score(q, words) {
  return words.reduce((n, w) => (q.includes(w) ? n + 1 : n), 0)
}

// ctx: { t, L, money, date, lang, caseData, rt, portal }
// Returns { text, callback? } — callback offers the request-a-callback form.
export function answerPatientQuestion(question, ctx) {
  const q = question.toLowerCase()
  const es = ctx.lang === 'es'
  if (MEDICAL.some((w) => q.includes(w))) {
    return {
      text: es
        ? `Esa es una pregunta médica, así que no puedo responderla aquí. Llame ${toOffice(ctx)} al ${ctx.portal.provider.phone}, o pida una llamada abajo. Si es una emergencia, llame al 911.`
        : `That’s a medical question, so I can’t answer it here. Please call ${ctx.L(ctx.portal.provider.office)} at ${ctx.portal.provider.phone}, or request a callback below. If this is an emergency, call 911.`,
      callback: true,
    }
  }
  let best = null
  let bestScore = 0
  for (const intent of INTENTS) {
    const s = score(q, intent.words)
    if (s > bestScore) {
      best = intent.key
      bestScore = s
    }
  }
  if (!best) {
    return {
      text: es
        ? 'No estoy seguro de cómo responder eso. Puedo ayudar con el estado de su solicitud, lo que estamos esperando, sus costos, cómo pagar, cómo prepararse y cómo apelar. También puede pedir una llamada.'
        : 'I’m not sure how to answer that. I can help with your request’s status, what we’re waiting on, your costs, how to pay, how to prepare, and how to appeal. You can also request a callback.',
      callback: true,
    }
  }
  return ANSWERS[best](ctx, es, q)
}

const ANSWERS = {
  status(ctx) {
    const status = derivePatientStatus(ctx.rt)
    return { text: `${ctx.t(`headline_${status}`)}. ${ctx.t(`sub_${status}`, { office: ctx.cap(ctx.L(ctx.portal.provider.office)) })}` }
  },

  timeline(ctx, es) {
    const status = derivePatientStatus(ctx.rt)
    if (status === 'approved' || status === 'denied') {
      return { text: es ? 'Su plan ya tomó una decisión. Puede verla en la pestaña Mi solicitud.' : 'Your plan has already made a decision. You can see it on the My request tab.' }
    }
    const clock = ctx.caseData.cmsClock
    const left = clock.type === 'expedited' ? ctx.t('hoursLeft', { n: clock.hoursRemaining }) : ctx.t('daysLeft', { n: clock.daysRemaining })
    return {
      text: es
        ? `Su solicitud es ${clock.type === 'expedited' ? 'urgente, así que su plan debe decidir en 72 horas' : 'estándar, así que su plan debe decidir en 7 días'}. ${left}. Si el plan pide más información a su médico, el tiempo de espera puede depender de cuándo responda el consultorio.`
        : `Your request is ${clock.type === 'expedited' ? 'urgent, so your plan must decide within 72 hours' : 'standard, so your plan must decide within 7 days'}. ${left}. If the plan asks your doctor for more information, timing can depend on how fast the office responds.`,
    }
  },

  waiting(ctx, es) {
    const items = waitingOnItems(ctx.caseData, ctx.rt)
    if (items.length === 0) {
      return { text: es ? 'Ahora mismo no estamos esperando nada. No necesita hacer nada.' : 'We’re not waiting on anything right now. You don’t need to do anything.' }
    }
    if (items[0].failed) {
      return {
        text: es
          ? `Algunas páginas que envió su consultorio no se pudieron leer, así que ${ctx.L(ctx.portal.provider.office)} debe reenviarlas. Usted no tiene que hacer nada.`
          : `Some pages your doctor’s office sent couldn’t be read, so ${ctx.L(ctx.portal.provider.office)} needs to resend them. You don’t need to do anything.`,
      }
    }
    const list = items.map((i) => ctx.L(i.text)).join(' ')
    return {
      text: es
        ? `El plan le pidió ${toOffice(ctx)}: ${list} Usted no tiene que hacer nada; el consultorio responderá directamente.`
        : `The plan asked ${ctx.L(ctx.portal.provider.office)} for: ${list} You don’t need to do anything — the office will respond directly.`,
    }
  },

  cost(ctx, es) {
    if (derivePatientStatus(ctx.rt) !== 'approved') {
      return { text: es ? 'Su costo estimado estará listo cuando se apruebe su solicitud.' : 'Your cost estimate will be ready once your request is approved.' }
    }
    const total = costTotal(ctx.portal.costs)
    const lines = ctx.portal.costs.lines.map((l) => `${ctx.L(l)}: ${ctx.money(l.amount)}`).join('; ')
    return {
      text: es
        ? `Su total estimado es ${ctx.money(total)} (${lines}). Puede pagar ahora o después, incluso en pagos mensuales sin intereses.`
        : `Your estimated total is ${ctx.money(total)} (${lines}). You can pay now or later, including interest-free monthly payments.`,
    }
  },

  // Defines just the term(s) asked about, or all four if none is named.
  terms(ctx, es, question) {
    const named = {
      copay: ['copay', 'copago'],
      deductible: ['deductible', 'deducible'],
      coinsurance: ['coinsurance', 'coseguro'],
      oop: ['out-of-pocket', 'out of pocket', 'bolsillo'],
    }
    const asked = Object.keys(named).filter((k) => named[k].some((w) => question.includes(w)))
    return { text: (asked.length ? asked : Object.keys(named)).map((k) => ctx.t(`term_${k}`)).join(' ') }
  },

  paying(ctx, es) {
    if (derivePatientStatus(ctx.rt) !== 'approved') {
      return { text: es ? 'Las opciones de pago aparecerán cuando se apruebe su solicitud.' : 'Payment options will appear once your request is approved.' }
    }
    const total = costTotal(ctx.portal.costs)
    const plans = PAYMENT_PLAN_MONTHS.map((m) => ctx.t('payLaterMonths', { n: m, amount: ctx.money(monthlyAmount(total, m)) })).join(', ')
    return {
      text: es
        ? `Puede pagar ${ctx.money(total)} ahora con tarjeta o con su tarjeta HSA/FSA, pagar en su cita, o elegir un plan sin intereses: ${plans}. Vaya a la pestaña Costos y pago.`
        : `You can pay ${ctx.money(total)} now by card or HSA/FSA card, pay at your appointment, or choose an interest-free plan: ${plans}. Go to the Costs & payment tab.`,
    }
  },

  prep(ctx, es) {
    if (derivePatientStatus(ctx.rt) !== 'approved') {
      return { text: es ? 'Sus pasos para prepararse aparecerán cuando se apruebe su solicitud. Mientras tanto, siga las indicaciones de su médico.' : 'Your preparation steps will appear once your request is approved. Until then, follow your doctor’s instructions.' }
    }
    const items = ctx.portal.checklist.map((i) => ctx.L(i)).slice(0, 4).join('. ')
    return {
      text: es
        ? `Según las órdenes de su médico: ${items}. Vea la lista completa en la pestaña Prepararme. Si tiene dudas sobre sus medicamentos, pregunte a su equipo de atención.`
        : `From your doctor’s orders: ${items}. See the full checklist on the Get ready tab. If you have questions about your medications, ask your care team.`,
    }
  },

  appointment(ctx, es) {
    const a = ctx.portal.appointment
    if (ctx.portal.admitted) {
      return { text: es ? `Ya está en ${a.facility}. Su equipo de atención le dirá cuándo será su procedimiento.` : `You’re already at ${a.facility}. Your care team will tell you when your procedure is scheduled.` }
    }
    const when = ctx.date(daysFromToday(a.offset), { weekday: 'long', month: 'long', day: 'numeric' })
    return {
      text: es
        ? `Su procedimiento es el ${when}. Llegue antes de las ${a.arrive} a ${a.facility}, ${a.address}. Traiga: ${ctx.L(a.bring).map(lowerFirst).join(', ')}.`
        : `Your procedure is on ${when}. Arrive by ${a.arrive} at ${a.facility}, ${a.address}. Bring: ${ctx.L(a.bring).map(lowerFirst).join(', ')}.`,
    }
  },

  appeal(ctx, es) {
    if (derivePatientStatus(ctx.rt) !== 'denied') {
      return { text: es ? 'Su solicitud no ha sido negada, así que no hay nada que apelar.' : 'Your request hasn’t been denied, so there’s nothing to appeal.' }
    }
    return {
      text: es
        ? `Tiene 65 días para pedir una apelación. Su plan debe decidir en 30 días, o en 72 horas si su médico dice que esperar podría dañar su salud. Use el botón “Pedir a mi médico que apele” en la pestaña Mi solicitud para ver el motivo y empezar.`
        : `You have 65 days to ask for an appeal. Your plan must decide within 30 days, or within 72 hours if your doctor says waiting could harm your health. Use “Ask my doctor to appeal” on the My request tab to see the reason and get started.`,
    }
  },

  contact(ctx, es) {
    return {
      text: es
        ? `Puede llamar ${toOffice(ctx)} al ${ctx.portal.provider.phone}, o a Servicios para Miembros de Concord al 1-800-555-0150 (TTY 711). También puede pedir una llamada abajo.`
        : `You can call ${ctx.L(ctx.portal.provider.office)} at ${ctx.portal.provider.phone}, or Concord Member Services at 1-800-555-0150 (TTY 711). You can also request a callback below.`,
      callback: true,
    }
  },
}
