// Hardcoded mock case data. Nothing here hits a network — this is a
// prototype that simulates extraction + review, not a production pipeline.
import { PACKET_PAGES, pageRef } from './packet'

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// A seeded audit timestamp `daysAgo` days back, in the same display format
// as live entries, so seeded history lines up with the portal's dates.
function seededAt(daysAgo, hour, minute) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, minute, 0, 0)
  const date = `${MONTH_ABBR[d.getMonth()]}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })
  return { at: `${date}, ${time}`, atMs: d.getTime() }
}

export const CASES = [
  {
    id: 'MBR-1001',
    memberName: 'Sarah Chen',
    memberId: 'MBR-1001',
    title: 'Clean Approval',
    summary: 'Elective TKA, all criteria clearly met',
    procedure: 'Total knee arthroplasty, right knee',
    requestedSetting: 'Inpatient',
    packetPages: PACKET_PAGES,
    parseFailed: false,
    // CMS decision clock: standard = 7 days, expedited = 72 hours.
    cmsClock: { type: 'standard', daysRemaining: 6 },
    extraction: [
      {
        label: 'Procedure',
        value: 'Right total knee arthroplasty (primary, elective)',
        doc: pageRef('Surgical Consult', 'procedure'),
      },
      {
        label: 'Comorbidities',
        value: 'Morbid obesity (BMI 42.1); obstructive sleep apnea, on home CPAP',
        doc: pageRef('History & Physical', 'comorbidities'),
      },
      {
        label: 'Clearance',
        value: 'Anesthesia pre-op clearance on file, signed 09/12/2026',
        doc: pageRef('Pre-Op Clearance', 'clearance'),
      },
      {
        label: 'Length of Stay',
        value: 'Surgeon order: anticipate 2-midnight admission for mobility and pain control',
        doc: pageRef('Surgeon Orders', 'los'),
      },
    ],
    criteria: [
      {
        id: 'procedure',
        status: 'met',
        quote: 'Op note: right total knee arthroplasty, primary, elective.',
        source: pageRef('Surgical Consult', 'procedure'),
        reasoning:
          'Procedure is on the inpatient-appropriate list for elective joint replacement.',
      },
      {
        id: 'comorbidities',
        status: 'met',
        quote: 'H&P: BMI 42.1; obstructive sleep apnea on home CPAP.',
        source: pageRef('History & Physical', 'comorbidities'),
        reasoning:
          'Documented comorbidities elevate perioperative risk, supporting inpatient monitoring.',
      },
      {
        id: 'clearance',
        status: 'met',
        quote: 'Anesthesia Pre-Op Clearance, signed 09/12/2026.',
        source: pageRef('Pre-Op Clearance', 'clearance'),
        reasoning: 'Clearance is on file and within the required 30-day window.',
      },
      {
        id: 'los',
        status: 'met',
        quote: "Surgeon's order: \"Anticipate 2-midnight admission for mobility and pain control.\"",
        source: pageRef('Surgeon Orders', 'los'),
        reasoning: 'Documented length of stay meets the 2-midnight inpatient threshold.',
      },
    ],
  },
  {
    id: 'MBR-0042',
    memberName: 'John Doe',
    memberId: 'MBR-0042',
    title: 'Ambiguous Length of Stay',
    summary: 'Spinal fusion, LOS not explicitly documented',
    procedure: 'Open lumbar spinal fusion, L4–L5',
    requestedSetting: 'Inpatient',
    packetPages: PACKET_PAGES,
    parseFailed: false,
    // CMS decision clock: standard = 7 days, expedited = 72 hours.
    cmsClock: { type: 'expedited', hoursRemaining: 31 },
    extraction: [
      {
        label: 'Procedure',
        value: 'Open posterior lumbar spinal fusion, L4–L5',
        doc: pageRef('Surgical Consult', 'procedure'),
      },
      {
        label: 'Comorbidities',
        value: 'Heart failure, LVEF 40%; Type 2 diabetes mellitus',
        doc: pageRef('History & Physical', 'comorbidities'),
      },
      {
        label: 'Clearance',
        value: 'Cardiology clearance on file, dated 09/10/2026',
        doc: pageRef('Cardiology Clearance', 'clearance'),
      },
      {
        label: 'Length of Stay',
        value:
          'Surgeon expects a multi-day stay for pain control and mobilization. Exact length of stay not documented.',
        doc: pageRef('Surgeon Orders', 'los'),
      },
    ],
    criteria: [
      {
        id: 'procedure',
        status: 'met',
        quote: 'Op note: open posterior lumbar fusion, L4–L5.',
        source: pageRef('Surgical Consult', 'procedure'),
        reasoning: 'Procedure is on the inpatient-appropriate list for spinal fusion.',
      },
      {
        id: 'comorbidities',
        status: 'met',
        quote: 'H&P: LVEF 40%, Type 2 diabetes mellitus.',
        source: pageRef('History & Physical', 'comorbidities'),
        reasoning: 'Cardiac and endocrine comorbidities support inpatient monitoring.',
      },
      {
        id: 'clearance',
        status: 'met',
        quote: 'Cardiology clearance note, dated 09/10/2026.',
        source: pageRef('Cardiology Clearance', 'clearance'),
        reasoning: 'Cardiology clearance on file supports surgical readiness given LVEF 40%.',
      },
      {
        id: 'los',
        status: 'ambiguous',
        quote:
          'Surgeon expects a multi-day stay for pain control and mobilization. Exact length of stay not documented.',
        source: pageRef('Surgeon Orders', 'los'),
        reasoning:
          '"Multi-day" does not specify a midnight count. Policy requires an explicit expectation of 2 or more midnights.',
        clarificationQuestion:
          'Please confirm expected length of stay in midnights for this admission.',
        providerResponseQuote: 'Provider confirms: 3-midnight stay.',
        resolvedReasoning:
          'Provider confirmed a 3-midnight stay, meeting the inpatient LOS threshold.',
      },
    ],
  },
  {
    id: 'MBR-2003',
    memberName: 'Robert Kim',
    memberId: 'MBR-2003',
    title: 'Multi-Ambiguous',
    summary: 'Cholecystectomy converted to open, conflicting comorbidity notes',
    procedure: 'Laparoscopic cholecystectomy, converted to open',
    requestedSetting: 'Inpatient',
    packetPages: PACKET_PAGES,
    parseFailed: false,
    // CMS decision clock: standard = 7 days, expedited = 72 hours.
    cmsClock: { type: 'standard', daysRemaining: 4 },
    extraction: [
      {
        label: 'Procedure',
        value: 'Laparoscopic cholecystectomy converted to open due to intraoperative bleeding',
        doc: pageRef('Operative Report', 'procedure'),
      },
      {
        label: 'Comorbidities',
        value:
          'H&P states "no significant past medical history"; anesthesia pre-op note states "history of cirrhosis, Child-Pugh Class B"',
        doc: `${pageRef('History & Physical', 'comorbidities')} / ${pageRef('Anesthesia Note', 'anesthesia')}`,
      },
      {
        label: 'Clearance',
        value: 'Hepatology clearance letter present, missing signature and date',
        doc: pageRef('Hepatology Clearance', 'clearance'),
      },
      {
        label: 'Length of Stay',
        value: 'Surgeon note: plan for minimum 2-midnight stay given intraoperative complication',
        doc: pageRef('Surgeon Orders', 'los'),
      },
    ],
    criteria: [
      {
        id: 'procedure',
        status: 'met',
        quote:
          'Op note: laparoscopic cholecystectomy converted to open due to intraoperative bleeding.',
        source: pageRef('Operative Report', 'procedure'),
        reasoning: 'Converted open procedure is on the inpatient-appropriate list.',
      },
      {
        id: 'comorbidities',
        status: 'ambiguous',
        quote:
          'H&P states "no significant past medical history"; anesthesia pre-op note states "history of cirrhosis, Child-Pugh Class B."',
        source: `${pageRef('History & Physical', 'comorbidities')} / ${pageRef('Anesthesia Note', 'anesthesia')}`,
        reasoning:
          'Two source documents conflict on comorbidity status — risk profile cannot be confirmed without reconciliation.',
        clarificationQuestion:
          'Please confirm current comorbidity status — is there a documented history of cirrhosis (Child-Pugh Class B)?',
        providerResponseQuote:
          'Provider confirms: history of cirrhosis, Child-Pugh Class B, stable, no active decompensation.',
        resolvedReasoning:
          'Provider confirmed cirrhosis history, reconciling the conflicting documentation and supporting inpatient monitoring.',
      },
      {
        id: 'clearance',
        status: 'ambiguous',
        quote: 'Hepatology clearance letter present in packet but missing signature and date.',
        source: pageRef('Hepatology Clearance', 'clearance'),
        reasoning: 'An unsigned, undated clearance cannot be confirmed as valid or current.',
        clarificationQuestion:
          'Please provide a signed and dated hepatology clearance for this admission.',
        providerResponseQuote: 'Provider confirms: signed hepatology clearance received, dated 09/18/2026.',
        resolvedReasoning: 'Signed, dated hepatology clearance received and on file.',
      },
      {
        id: 'los',
        status: 'met',
        quote:
          "Surgeon's note: \"Plan for minimum 2-midnight stay given intraoperative complication and conversion to open procedure.\"",
        source: pageRef('Surgeon Orders', 'los'),
        reasoning:
          'Explicit expectation of 2 or more midnights documented following conversion to open procedure.',
      },
    ],
  },
  {
    id: 'MBR-3004',
    memberName: 'Maria Lopez',
    memberId: 'MBR-3004',
    title: 'Corrupted Packet',
    summary: 'Fax scan quality too low to extract reliably',
    procedure: 'Unknown — extraction failed',
    requestedSetting: 'Inpatient',
    packetPages: PACKET_PAGES,
    parseFailed: true,
    // CMS decision clock: standard = 7 days, expedited = 72 hours.
    cmsClock: { type: 'standard', daysRemaining: 5 },
    unreadablePages: 'Pages 24–61',
    failureCause: 'low-resolution scan, visible skew and compression artifacts',
    failureReason:
      'Image quality too low to extract text reliably. Pages 24–61 of the faxed packet are illegible (low-resolution scan, visible skew and compression artifacts).',
    extraction: [],
    criteria: [],
  },
  {
    id: 'MBR-4005',
    memberName: 'Emily Watson',
    memberId: 'MBR-4005',
    title: 'Resolved',
    summary: 'Elective cholecystectomy, resolved 2 days ago',
    procedure: 'Laparoscopic cholecystectomy, elective',
    requestedSetting: 'Inpatient',
    packetPages: PACKET_PAGES,
    parseFailed: false,
    // CMS decision clock: standard = 7 days, expedited = 72 hours.
    cmsClock: { type: 'standard', daysRemaining: 7 },
    extraction: [
      {
        label: 'Procedure',
        value: 'Elective laparoscopic cholecystectomy',
        doc: pageRef('Surgical Consult', 'procedure'),
      },
      {
        label: 'Comorbidities',
        value: 'Type 2 diabetes mellitus, well-controlled on metformin',
        doc: pageRef('History & Physical', 'comorbidities'),
      },
      {
        label: 'Clearance',
        value: 'Anesthesia pre-op clearance on file, signed 09/21/2026',
        doc: pageRef('Pre-Op Clearance', 'clearance'),
      },
      {
        label: 'Length of Stay',
        value: 'Surgeon order: anticipate 2-midnight admission for pain control and monitoring',
        doc: pageRef('Surgeon Orders', 'los'),
      },
    ],
    criteria: [
      {
        id: 'procedure',
        status: 'met',
        quote: 'Op note: elective laparoscopic cholecystectomy.',
        source: pageRef('Surgical Consult', 'procedure'),
        reasoning: 'Procedure is on the inpatient-appropriate list for elective gallbladder removal.',
      },
      {
        id: 'comorbidities',
        status: 'met',
        quote: 'H&P: Type 2 diabetes mellitus, well-controlled on metformin.',
        source: pageRef('History & Physical', 'comorbidities'),
        reasoning: 'Documented comorbidity supports inpatient monitoring during recovery.',
      },
      {
        id: 'clearance',
        status: 'met',
        quote: 'Anesthesia Pre-Op Clearance, signed 09/21/2026.',
        source: pageRef('Pre-Op Clearance', 'clearance'),
        reasoning: 'Clearance is on file and within the required 30-day window.',
      },
      {
        id: 'los',
        status: 'met',
        quote: "Surgeon's order: \"Anticipate 2-midnight admission for pain control and monitoring.\"",
        source: pageRef('Surgeon Orders', 'los'),
        reasoning: 'Documented length of stay meets the 2-midnight inpatient threshold.',
      },
    ],
    // Seeds the case queue with one already-closed case, so the "Closed" tab
    // has something to show without the nurse having to work through it live.
    seedRuntime: {
      read: true,
      phase: 'extracted',
      determination: { outcome: 'Approved', resolvedVia: 'straight-through', resolvedBy: 'nurse' },
      audit: [
        { ...seededAt(2, 8, 14), label: 'Case received', group: 'received', status: 'pre_review' },
        {
          ...seededAt(2, 8, 16),
          label: '4 of 4 criteria matched — lighter-touch review eligible',
          group: 'matched',
          status: 'pre_review',
        },
        { ...seededAt(2, 8, 17), label: 'Determined — Approved', group: 'determined', status: 'determined', outcome: 'Approved' },
        {
          ...seededAt(1, 19, 42),
          label: 'Patient: accepted cost estimate — 6-month payment plan',
          group: 'patient-seed-1',
          status: 'determined',
          patientEvent: { type: 'accepted_later', when: 'later', option: 6, monthly: 143.34, amount: 860 },
        },
      ],
      // Emily has already opened her portal and set up a payment plan, so
      // the patient-engagement report has a real data point from the start.
      patient: {
        viewed: true,
        decision: 'accepted',
        payment: { when: 'later', option: 6, monthly: 143.34, amount: 860, ref: null },
        checklist: { ride: true },
      },
    },
  },
  {
    id: 'MBR-5006',
    memberName: 'Dany Che',
    memberId: 'MBR-5006',
    title: 'Expedited Clarification',
    summary: 'Urgent hip fracture repair, cardiology clearance not attached, 4 hours left on the clock',
    procedure: 'Hemiarthroplasty, left hip (femoral neck fracture)',
    requestedSetting: 'Inpatient',
    packetPages: PACKET_PAGES,
    parseFailed: false,
    // CMS decision clock: standard = 7 days, expedited = 72 hours.
    cmsClock: { type: 'expedited', hoursRemaining: 4 },
    extraction: [
      {
        label: 'Procedure',
        value: 'Left hip hemiarthroplasty for displaced femoral neck fracture (urgent)',
        doc: pageRef('Orthopedic Consult', 'procedure'),
      },
      {
        label: 'Comorbidities',
        value: 'Age 81; type 2 diabetes on insulin; atrial fibrillation, on anticoagulation',
        doc: pageRef('History & Physical', 'comorbidities'),
      },
      {
        label: 'Clearance',
        value:
          'Anesthesia clearance on file, signed 09/25/2026. Cardiology clearance referenced but not attached.',
        doc: pageRef('Pre-Op Clearance', 'clearance'),
      },
      {
        label: 'Length of Stay',
        value: 'Surgeon order: anticipate 3-midnight admission for pain control and early mobilization',
        doc: pageRef('Surgeon Orders', 'los'),
      },
    ],
    criteria: [
      {
        id: 'procedure',
        status: 'met',
        quote: 'Consult: displaced left femoral neck fracture, hemiarthroplasty indicated.',
        source: pageRef('Orthopedic Consult', 'procedure'),
        reasoning: 'Hip fracture repair is on the inpatient-appropriate procedure list.',
      },
      {
        id: 'comorbidities',
        status: 'met',
        quote: 'H&P: age 81; insulin-dependent type 2 diabetes; atrial fibrillation on anticoagulation.',
        source: pageRef('History & Physical', 'comorbidities'),
        reasoning:
          'Documented comorbidities raise perioperative risk, supporting inpatient monitoring.',
      },
      {
        id: 'clearance',
        status: 'ambiguous',
        quote:
          'Anesthesia pre-op clearance, signed 09/25/2026. Cardiology clearance referenced in H&P, not attached.',
        source: pageRef('Pre-Op Clearance', 'clearance'),
        reasoning:
          'Atrial fibrillation on anticoagulation requires documented cardiology clearance. The H&P mentions it, but no signed note is in the packet.',
        clarificationQuestion:
          'Please send the signed cardiology pre-op clearance, including the anticoagulation plan.',
        providerResponseQuote:
          'Provider confirms: signed cardiology clearance received, dated 09/25/2026.',
        resolvedReasoning:
          'Signed, dated cardiology clearance received and on file, including the anticoagulation plan.',
      },
      {
        id: 'los',
        status: 'met',
        quote:
          "Surgeon's order: \"Anticipate 3-midnight admission for pain control and early mobilization.\"",
        source: pageRef('Surgeon Orders', 'los'),
        reasoning: 'Documented length of stay exceeds the 2-midnight inpatient threshold.',
      },
    ],
  },
]

export function getCase(caseId) {
  return CASES.find((c) => c.id === caseId)
}
