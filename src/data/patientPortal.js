// Patient-facing content for each demo case: who requested it, the
// appointment, plain-language prep steps, and the cost estimate. Every
// string a patient reads is { en, es }; see patientI18n.js.
//
// Dates are relative to today (offset in days), so the demo always reads as
// a live request rather than going stale after a fixed calendar date. Cost
// figures are invented but plausible for a Medicare Advantage HMO.

const DAY = 24 * 60 * 60 * 1000

export function daysFromToday(offset) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return new Date(d.getTime() + offset * DAY)
}

const RIDGELINE = {
  office: { en: 'Dr. Amanda Reyes’s office', es: 'el consultorio de la Dra. Amanda Reyes' },
  officeShort: 'Ridgeline Orthopedic & Spine',
  phone: '(614) 555-0142',
}

const COMMON_BRING = {
  en: ['Photo ID and your Concord member card', 'A list of your medications', 'Your phone and charger', 'Comfortable, loose clothes for going home'],
  es: ['Identificación con foto y su tarjeta de miembro de Concord', 'Una lista de sus medicamentos', 'Su teléfono y cargador', 'Ropa cómoda y holgada para regresar a casa'],
}

export const PATIENT_PORTAL = {
  'MBR-0042': {
    provider: RIDGELINE,
    procedure: { en: 'Lower back fusion surgery (L4–L5)', es: 'Cirugía de fusión lumbar (L4–L5)' },
    submittedOffset: -1,
    contact: { phone: '(614) 555-0186', email: 'j.doe@example.com' },
    appointment: {
      offset: 8,
      arrive: '5:30 AM',
      facility: 'Ridgeline Surgical Center',
      address: '4420 Meridian Parkway, Columbus, OH 43219',
      phone: '(614) 555-0142',
      durationHours: 4,
      bring: {
        en: ['Your cane', ...COMMON_BRING.en],
        es: ['Su bastón', ...COMMON_BRING.es],
      },
    },
    checklist: [
      { id: 'ride', group: 'before', en: 'Arrange a ride home and someone to stay with you the first few days', es: 'Consiga quien lo lleve a casa y lo acompañe los primeros días' },
      { id: 'home', group: 'before', en: 'Get your home ready: clear walkways, keep things you use often at waist height, and plan for help with stairs', es: 'Prepare su casa: despeje los pasillos, ponga lo que usa seguido a la altura de la cintura y planee ayuda con las escaleras' },
      { id: 'meds_list', group: 'before', en: 'Bring an up-to-date medication list, including aspirin and furosemide', es: 'Traiga una lista actualizada de sus medicamentos, incluidos la aspirina y la furosemida' },
      { id: 'shower', group: 'night', en: 'Shower with the chlorhexidine soap you were given, the night before and the morning of surgery', es: 'Báñese con el jabón de clorhexidina que le dieron, la noche anterior y la mañana de la cirugía' },
      { id: 'npo', group: 'night', en: 'Nothing to eat or drink after midnight', es: 'No coma ni beba nada después de la medianoche' },
      { id: 'glipizide', group: 'morning', en: 'Do not take glipizide the morning of surgery', es: 'No tome glipizida la mañana de la cirugía' },
      { id: 'morning_meds', group: 'morning', en: 'Take metformin, lisinopril and atorvastatin with a small sip of water', es: 'Tome metformina, lisinopril y atorvastatina con un sorbo pequeño de agua' },
      { id: 'cane', group: 'morning', en: 'Bring your cane and wear loose, comfortable clothes', es: 'Traiga su bastón y use ropa holgada y cómoda' },
    ],
    costs: {
      plan: 'Concord Gold Plus HMO',
      lines: [
        { term: 'copay', en: 'Hospital stay (inpatient copay)', es: 'Estadía en el hospital (copago de hospitalización)', amount: 350 },
        { term: 'deductible', en: 'Remaining deductible ($180 of $500 met)', es: 'Deducible restante (ha pagado $180 de $500)', amount: 320 },
        { term: 'coinsurance', en: 'Surgeon and anesthesia (20% of $3,100)', es: 'Cirujano y anestesia (20% de $3,100)', amount: 620 },
        { term: 'copay', en: 'Walker and raised toilet seat', es: 'Andadera y asiento elevado para el inodoro', amount: 40 },
      ],
      oopMax: 4900,
      oopMet: 1265,
    },
    waitingOn: {
      los: {
        en: 'How many nights you’re expected to stay in the hospital after surgery. Your plan needs this number to confirm a hospital stay is covered.',
        es: 'Cuántas noches se espera que se quede en el hospital después de la cirugía. Su plan necesita este número para confirmar que la estadía está cubierta.',
      },
    },
  },
  'MBR-1001': {
    provider: {
      office: { en: 'Dr. Lisa Patel’s office', es: 'el consultorio de la Dra. Lisa Patel' },
      officeShort: 'Lakeshore Orthopedics',
      phone: '(614) 555-0231',
    },
    procedure: { en: 'Right knee replacement', es: 'Reemplazo de rodilla derecha' },
    submittedOffset: -2,
    contact: { phone: '(614) 555-0172', email: 's.chen@example.com' },
    appointment: {
      offset: 12,
      arrive: '6:00 AM',
      facility: 'Ridgeline Surgical Center',
      address: '4420 Meridian Parkway, Columbus, OH 43219',
      phone: '(614) 555-0231',
      durationHours: 3,
      bring: {
        en: ['Your CPAP machine and mask', ...COMMON_BRING.en],
        es: ['Su máquina CPAP y mascarilla', ...COMMON_BRING.es],
      },
    },
    checklist: [
      { id: 'ride', group: 'before', en: 'Arrange a ride home and help at home for the first week', es: 'Consiga quien la lleve a casa y ayuda en casa la primera semana' },
      { id: 'walker', group: 'before', en: 'Pick up your walker and practice using it before surgery', es: 'Recoja su andadera y practique usarla antes de la cirugía' },
      { id: 'home', group: 'before', en: 'Remove loose rugs and set up a bedroom on the main floor if you can', es: 'Quite las alfombras sueltas y, si puede, prepare un dormitorio en la planta baja' },
      { id: 'npo', group: 'night', en: 'Nothing to eat or drink after midnight', es: 'No coma ni beba nada después de la medianoche' },
      { id: 'shower', group: 'night', en: 'Shower with the antiseptic soap you were given', es: 'Báñese con el jabón antiséptico que le dieron' },
      { id: 'cpap', group: 'morning', en: 'Bring your CPAP machine — you’ll use it in the hospital', es: 'Traiga su máquina CPAP — la usará en el hospital' },
    ],
    costs: {
      plan: 'Concord Silver Value HMO',
      lines: [
        { term: 'copay', en: 'Hospital stay (inpatient copay)', es: 'Estadía en el hospital (copago de hospitalización)', amount: 295 },
        { term: 'deductible', en: 'Remaining deductible (already met this year)', es: 'Deducible restante (ya lo cubrió este año)', amount: 0 },
        { term: 'coinsurance', en: 'Surgeon and anesthesia (20% of $2,600)', es: 'Cirujano y anestesia (20% de $2,600)', amount: 520 },
        { term: 'copay', en: 'Walker', es: 'Andadera', amount: 25 },
      ],
      oopMax: 5500,
      oopMet: 2140,
    },
    waitingOn: {},
  },
  'MBR-2003': {
    provider: {
      office: { en: 'Dr. James Ortiz’s office', es: 'el consultorio del Dr. James Ortiz' },
      officeShort: 'Riverside General Surgery',
      phone: '(614) 555-0318',
    },
    procedure: { en: 'Gallbladder removal (open surgery) and hospital stay', es: 'Extirpación de la vesícula (cirugía abierta) y estadía en el hospital' },
    submittedOffset: -1,
    contact: { phone: '(614) 555-0149', email: 'r.kim@example.com' },
    admitted: true,
    appointment: {
      facility: 'Riverside General Hospital',
      address: '780 Riverside Drive, Columbus, OH 43215',
      phone: '(614) 555-0318',
      bring: {
        en: ['Ask a family member to bring your medication list and glasses'],
        es: ['Pida a un familiar que traiga su lista de medicamentos y sus lentes'],
      },
    },
    checklist: [
      { id: 'walk', group: 'stay', en: 'Walk with help as soon as your nurse says it’s OK — it speeds recovery', es: 'Camine con ayuda en cuanto su enfermera lo permita — acelera la recuperación' },
      { id: 'breathe', group: 'stay', en: 'Use the breathing exerciser 10 times an hour while awake', es: 'Use el ejercitador de respiración 10 veces por hora mientras esté despierto' },
      { id: 'call', group: 'stay', en: 'Call your nurse before getting up the first time', es: 'Llame a su enfermera antes de levantarse la primera vez' },
      { id: 'ride', group: 'home', en: 'Arrange a ride home and someone to help for a few days', es: 'Consiga quien lo lleve a casa y lo ayude unos días' },
    ],
    costs: {
      plan: 'Concord Gold Plus HMO',
      lines: [
        { term: 'copay', en: 'Hospital stay (inpatient copay)', es: 'Estadía en el hospital (copago de hospitalización)', amount: 350 },
        { term: 'deductible', en: 'Remaining deductible', es: 'Deducible restante', amount: 500 },
        { term: 'coinsurance', en: 'Surgeon and anesthesia (20% of $2,200)', es: 'Cirujano y anestesia (20% de $2,200)', amount: 440 },
      ],
      oopMax: 4900,
      oopMet: 610,
    },
    waitingOn: {
      comorbidities: {
        en: 'Whether you have a history of liver disease (cirrhosis). Two of your records say different things.',
        es: 'Si tiene antecedentes de enfermedad del hígado (cirrosis). Dos de sus expedientes dicen cosas diferentes.',
      },
      clearance: {
        en: 'A signed and dated letter from your liver specialist saying surgery is safe for you.',
        es: 'Una carta firmada y fechada de su especialista del hígado que diga que la cirugía es segura para usted.',
      },
    },
  },
  'MBR-3004': {
    provider: {
      office: { en: 'Dr. Nina Shah’s office', es: 'el consultorio de la Dra. Nina Shah' },
      officeShort: 'Harborview Surgical Associates',
      phone: '(614) 555-0427',
    },
    procedure: { en: 'Scheduled surgery (details being re-sent)', es: 'Cirugía programada (se están reenviando los detalles)' },
    submittedOffset: -2,
    contact: { phone: '(614) 555-0163', email: 'm.lopez@example.com' },
    appointment: {
      offset: 15,
      arrive: '7:00 AM',
      facility: 'Ridgeline Surgical Center',
      address: '4420 Meridian Parkway, Columbus, OH 43219',
      phone: '(614) 555-0427',
      durationHours: 2,
      bring: COMMON_BRING,
    },
    checklist: [
      { id: 'ride', group: 'before', en: 'Arrange a ride home', es: 'Consiga quien la lleve a casa' },
      { id: 'npo', group: 'night', en: 'Nothing to eat or drink after midnight', es: 'No coma ni beba nada después de la medianoche' },
    ],
    costs: {
      plan: 'Concord Gold Plus HMO',
      lines: [
        { term: 'copay', en: 'Hospital stay (inpatient copay)', es: 'Estadía en el hospital (copago de hospitalización)', amount: 350 },
        { term: 'deductible', en: 'Remaining deductible', es: 'Deducible restante', amount: 280 },
      ],
      oopMax: 4900,
      oopMet: 220,
    },
    waitingOn: {},
  },
  'MBR-4005': {
    provider: {
      office: { en: 'Dr. James Ortiz’s office', es: 'el consultorio del Dr. James Ortiz' },
      officeShort: 'Riverside General Surgery',
      phone: '(614) 555-0318',
    },
    procedure: { en: 'Gallbladder removal (laparoscopic)', es: 'Extirpación de la vesícula (laparoscópica)' },
    submittedOffset: -3,
    contact: { phone: '(614) 555-0195', email: 'e.watson@example.com' },
    appointment: {
      offset: 6,
      arrive: '6:30 AM',
      facility: 'Riverside General Hospital',
      address: '780 Riverside Drive, Columbus, OH 43215',
      phone: '(614) 555-0318',
      durationHours: 2,
      bring: COMMON_BRING,
    },
    checklist: [
      { id: 'ride', group: 'before', en: 'Arrange a ride home and someone to stay with you the first night', es: 'Consiga quien la lleve a casa y la acompañe la primera noche' },
      { id: 'metformin', group: 'before', en: 'Ask your doctor whether to hold metformin the morning of surgery', es: 'Pregunte a su médico si debe suspender la metformina la mañana de la cirugía' },
      { id: 'npo', group: 'night', en: 'Nothing to eat or drink after midnight', es: 'No coma ni beba nada después de la medianoche' },
      { id: 'shower', group: 'night', en: 'Shower the night before surgery', es: 'Báñese la noche anterior a la cirugía' },
      { id: 'clothes', group: 'morning', en: 'Wear loose clothing that’s easy to put on over your belly', es: 'Use ropa holgada que sea fácil de poner sobre el abdomen' },
    ],
    costs: {
      plan: 'Concord Gold Plus HMO',
      lines: [
        { term: 'copay', en: 'Hospital stay (inpatient copay)', es: 'Estadía en el hospital (copago de hospitalización)', amount: 350 },
        { term: 'deductible', en: 'Remaining deductible ($350 of $500 met)', es: 'Deducible restante (ha pagado $350 de $500)', amount: 150 },
        { term: 'coinsurance', en: 'Surgeon and anesthesia (20% of $1,800)', es: 'Cirujano y anestesia (20% de $1,800)', amount: 360 },
      ],
      oopMax: 4900,
      oopMet: 980,
    },
    waitingOn: {},
  },
  'MBR-5006': {
    provider: {
      office: { en: 'Dr. Kevin Hale’s team', es: 'el equipo del Dr. Kevin Hale' },
      officeShort: 'Mercy Orthopedic Trauma',
      phone: '(614) 555-0560',
    },
    procedure: { en: 'Left hip repair (partial hip replacement)', es: 'Reparación de cadera izquierda (reemplazo parcial de cadera)' },
    submittedOffset: 0,
    contact: { phone: '(614) 555-0128', email: 'd.che@example.com' },
    admitted: true,
    appointment: {
      facility: 'Mercy General Hospital',
      address: '1200 Mercy Way, Columbus, OH 43210',
      phone: '(614) 555-0560',
      bring: {
        en: ['Ask a family member to bring your insulin schedule and medication list', 'Your glasses and hearing aids, if you use them'],
        es: ['Pida a un familiar que traiga su horario de insulina y su lista de medicamentos', 'Sus lentes y audífonos, si los usa'],
      },
    },
    checklist: [
      { id: 'blood_thinner', group: 'stay', en: 'Your team is managing your blood thinner before surgery — don’t take any doses on your own', es: 'Su equipo está manejando su anticoagulante antes de la cirugía — no tome dosis por su cuenta' },
      { id: 'npo', group: 'stay', en: 'Don’t eat or drink until your nurse says it’s OK', es: 'No coma ni beba hasta que su enfermera lo permita' },
      { id: 'call', group: 'stay', en: 'Call your nurse before trying to get up', es: 'Llame a su enfermera antes de intentar levantarse' },
      { id: 'family', group: 'home', en: 'Ask a family member to plan for help at home or a short rehab stay after the hospital', es: 'Pida a un familiar que planee ayuda en casa o una estadía corta de rehabilitación después del hospital' },
    ],
    costs: {
      plan: 'Concord Gold Plus HMO',
      lines: [
        { term: 'copay', en: 'Hospital stay (inpatient copay)', es: 'Estadía en el hospital (copago de hospitalización)', amount: 175 },
        { term: 'deductible', en: 'Remaining deductible (already met this year)', es: 'Deducible restante (ya lo cubrió este año)', amount: 0 },
        { term: 'coinsurance', en: 'Surgeon and anesthesia (10% of $2,900)', es: 'Cirujano y anestesia (10% de $2,900)', amount: 290 },
      ],
      oopMax: 3900,
      oopMet: 1720,
    },
    waitingOn: {
      clearance: {
        en: 'A signed letter from your heart doctor saying surgery is safe, including the plan for your blood thinner.',
        es: 'Una carta firmada de su cardiólogo que diga que la cirugía es segura, incluido el plan para su anticoagulante.',
      },
    },
  },
}

export const CHECKLIST_GROUPS = {
  before: { en: 'This week', es: 'Esta semana' },
  night: { en: 'The night before', es: 'La noche anterior' },
  morning: { en: 'The morning of surgery', es: 'La mañana de la cirugía' },
  stay: { en: 'While you’re in the hospital', es: 'Mientras esté en el hospital' },
  home: { en: 'Planning for home', es: 'Cómo prepararse para volver a casa' },
}

// Patient-friendly names for the packet's sections (keys from packetIndex.json).
export const DOC_LABELS = {
  cover: { en: 'Fax cover sheet', es: 'Portada del fax' },
  request: { en: 'Request form, eligibility and insurance card', es: 'Formulario de solicitud, elegibilidad y tarjeta del seguro' },
  pcp: { en: 'Primary care visit notes and referral', es: 'Notas de atención primaria y referido' },
  surgical: { en: 'Surgeon’s consultation and follow-up notes', es: 'Consulta y notas de seguimiento del cirujano' },
  imaging: { en: 'X-rays, MRI and nerve tests', es: 'Radiografías, resonancia magnética y pruebas de nervios' },
  pt: { en: 'Physical therapy records', es: 'Expedientes de terapia física' },
  pain: { en: 'Pain management and injection records', es: 'Expedientes de manejo del dolor e inyecciones' },
  hp: { en: 'History and physical exam', es: 'Historia clínica y examen físico' },
  cardiology: { en: 'Heart doctor records and clearance', es: 'Expedientes y autorización del cardiólogo' },
  endo: { en: 'Diabetes specialist notes', es: 'Notas del especialista en diabetes' },
  anesthesia: { en: 'Anesthesia evaluation', es: 'Evaluación de anestesia' },
  labs: { en: 'Lab results', es: 'Resultados de laboratorio' },
  meds: { en: 'Medication list', es: 'Lista de medicamentos' },
  orders: { en: 'Surgery orders and recovery plan', es: 'Órdenes de cirugía y plan de recuperación' },
  consents: { en: 'Signed consent forms and education', es: 'Formularios de consentimiento firmados y educación' },
  attestation: { en: 'Doctor’s statement of medical necessity', es: 'Declaración del médico sobre la necesidad médica' },
}

export function portalFor(caseId) {
  return PATIENT_PORTAL[caseId]
}

export function costTotal(costs) {
  return costs.lines.reduce((n, l) => n + l.amount, 0)
}

// Monthly amount for an interest-free plan, rounded up to the cent so the
// payments always cover the total.
export function monthlyAmount(total, months) {
  return Math.ceil((total / months) * 100) / 100
}

export const PAYMENT_PLAN_MONTHS = [3, 6, 12]
