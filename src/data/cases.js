// Hardcoded mock case data. Nothing here hits a network — this is a
// prototype that simulates extraction + review, not a production pipeline.

export const CASES = [
  {
    id: 'MBR-1001',
    memberName: 'Sarah Chen',
    memberId: 'MBR-1001',
    title: 'Clean Approval',
    summary: 'Elective TKA, all criteria clearly met',
    procedure: 'Total knee arthroplasty, right knee',
    requestedSetting: 'Inpatient',
    packetPages: 14,
    parseFailed: false,
    // CMS decision clock: standard = 7 days, expedited = 72 hours.
    cmsClock: { type: 'standard', daysRemaining: 6 },
    extraction: [
      {
        label: 'Procedure',
        value: 'Right total knee arthroplasty (primary, elective)',
        doc: 'Surgical Consult, p. 3',
      },
      {
        label: 'Comorbidities',
        value: 'Morbid obesity (BMI 42.1); obstructive sleep apnea, on home CPAP',
        doc: 'History & Physical, p. 5',
      },
      {
        label: 'Clearance',
        value: 'Anesthesia pre-op clearance on file, signed 09/12/2026',
        doc: 'Pre-Op Clearance, p. 9',
      },
      {
        label: 'Length of Stay',
        value: 'Surgeon order: anticipate 2-midnight admission for mobility and pain control',
        doc: 'Surgeon Orders, p. 11',
      },
    ],
    criteria: [
      {
        id: 'procedure',
        status: 'met',
        quote: 'Op note: right total knee arthroplasty, primary, elective.',
        source: 'Surgical Consult, p. 3',
        reasoning:
          'Procedure is on the inpatient-appropriate list for elective joint replacement.',
      },
      {
        id: 'comorbidities',
        status: 'met',
        quote: 'H&P: BMI 42.1; obstructive sleep apnea on home CPAP.',
        source: 'History & Physical, p. 5',
        reasoning:
          'Documented comorbidities elevate perioperative risk, supporting inpatient monitoring.',
      },
      {
        id: 'clearance',
        status: 'met',
        quote: 'Anesthesia Pre-Op Clearance, signed 09/12/2026.',
        source: 'Pre-Op Clearance, p. 9',
        reasoning: 'Clearance is on file and within the required 30-day window.',
      },
      {
        id: 'los',
        status: 'met',
        quote: "Surgeon's order: \"Anticipate 2-midnight admission for mobility and pain control.\"",
        source: 'Surgeon Orders, p. 11',
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
    packetPages: 14,
    parseFailed: false,
    // CMS decision clock: standard = 7 days, expedited = 72 hours.
    cmsClock: { type: 'expedited', hoursRemaining: 31 },
    extraction: [
      {
        label: 'Procedure',
        value: 'Open posterior lumbar spinal fusion, L4–L5',
        doc: 'Surgical Consult, p. 2',
      },
      {
        label: 'Comorbidities',
        value: 'Heart failure, LVEF 40%; Type 2 diabetes mellitus',
        doc: 'History & Physical, p. 4',
      },
      {
        label: 'Clearance',
        value: 'Cardiology clearance on file, dated 09/10/2026',
        doc: 'Cardiology Clearance, p. 8',
      },
      {
        label: 'Length of Stay',
        value:
          'Surgeon expects a multi-day stay for pain control and mobilization. Exact length of stay not documented.',
        doc: 'Surgeon Orders, p. 10',
      },
    ],
    criteria: [
      {
        id: 'procedure',
        status: 'met',
        quote: 'Op note: open posterior lumbar fusion, L4–L5.',
        source: 'Surgical Consult, p. 2',
        reasoning: 'Procedure is on the inpatient-appropriate list for spinal fusion.',
      },
      {
        id: 'comorbidities',
        status: 'met',
        quote: 'H&P: LVEF 40%, Type 2 diabetes mellitus.',
        source: 'History & Physical, p. 4',
        reasoning: 'Cardiac and endocrine comorbidities support inpatient monitoring.',
      },
      {
        id: 'clearance',
        status: 'met',
        quote: 'Cardiology clearance note, dated 09/10/2026.',
        source: 'Cardiology Clearance, p. 8',
        reasoning: 'Cardiology clearance on file supports surgical readiness given LVEF 40%.',
      },
      {
        id: 'los',
        status: 'ambiguous',
        quote:
          'Surgeon expects a multi-day stay for pain control and mobilization. Exact length of stay not documented.',
        source: 'Surgeon Orders, p. 10',
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
    packetPages: 14,
    parseFailed: false,
    // CMS decision clock: standard = 7 days, expedited = 72 hours.
    cmsClock: { type: 'standard', daysRemaining: 4 },
    extraction: [
      {
        label: 'Procedure',
        value: 'Laparoscopic cholecystectomy converted to open due to intraoperative bleeding',
        doc: 'Operative Report, p. 6',
      },
      {
        label: 'Comorbidities',
        value:
          'H&P states "no significant past medical history"; anesthesia pre-op note states "history of cirrhosis, Child-Pugh Class B"',
        doc: 'History & Physical, p. 4 / Anesthesia Note, p. 7',
      },
      {
        label: 'Clearance',
        value: 'Hepatology clearance letter present, missing signature and date',
        doc: 'Hepatology Clearance, p. 9',
      },
      {
        label: 'Length of Stay',
        value: 'Surgeon note: plan for minimum 2-midnight stay given intraoperative complication',
        doc: 'Surgeon Orders, p. 12',
      },
    ],
    criteria: [
      {
        id: 'procedure',
        status: 'met',
        quote:
          'Op note: laparoscopic cholecystectomy converted to open due to intraoperative bleeding.',
        source: 'Operative Report, p. 6',
        reasoning: 'Converted open procedure is on the inpatient-appropriate list.',
      },
      {
        id: 'comorbidities',
        status: 'ambiguous',
        quote:
          'H&P states "no significant past medical history"; anesthesia pre-op note states "history of cirrhosis, Child-Pugh Class B."',
        source: 'History & Physical, p. 4 / Anesthesia Note, p. 7',
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
        source: 'Hepatology Clearance, p. 9',
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
        source: 'Surgeon Orders, p. 12',
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
    packetPages: 14,
    parseFailed: true,
    // CMS decision clock: standard = 7 days, expedited = 72 hours.
    cmsClock: { type: 'standard', daysRemaining: 5 },
    unreadablePages: 'Pages 4–9',
    failureCause: 'low-resolution scan, visible skew and compression artifacts',
    failureReason:
      'Image quality too low to extract text reliably. Pages 4–9 of the faxed packet are illegible (low-resolution scan, visible skew and compression artifacts).',
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
    packetPages: 14,
    parseFailed: false,
    // CMS decision clock: standard = 7 days, expedited = 72 hours.
    cmsClock: { type: 'standard', daysRemaining: 7 },
    extraction: [
      {
        label: 'Procedure',
        value: 'Elective laparoscopic cholecystectomy',
        doc: 'Surgical Consult, p. 2',
      },
      {
        label: 'Comorbidities',
        value: 'Type 2 diabetes mellitus, well-controlled on metformin',
        doc: 'History & Physical, p. 4',
      },
      {
        label: 'Clearance',
        value: 'Anesthesia pre-op clearance on file, signed 09/21/2026',
        doc: 'Pre-Op Clearance, p. 7',
      },
      {
        label: 'Length of Stay',
        value: 'Surgeon order: anticipate 2-midnight admission for pain control and monitoring',
        doc: 'Surgeon Orders, p. 9',
      },
    ],
    criteria: [
      {
        id: 'procedure',
        status: 'met',
        quote: 'Op note: elective laparoscopic cholecystectomy.',
        source: 'Surgical Consult, p. 2',
        reasoning: 'Procedure is on the inpatient-appropriate list for elective gallbladder removal.',
      },
      {
        id: 'comorbidities',
        status: 'met',
        quote: 'H&P: Type 2 diabetes mellitus, well-controlled on metformin.',
        source: 'History & Physical, p. 4',
        reasoning: 'Documented comorbidity supports inpatient monitoring during recovery.',
      },
      {
        id: 'clearance',
        status: 'met',
        quote: 'Anesthesia Pre-Op Clearance, signed 09/21/2026.',
        source: 'Pre-Op Clearance, p. 7',
        reasoning: 'Clearance is on file and within the required 30-day window.',
      },
      {
        id: 'los',
        status: 'met',
        quote: "Surgeon's order: \"Anticipate 2-midnight admission for pain control and monitoring.\"",
        source: 'Surgeon Orders, p. 9',
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
        { at: 'Sep/23/2026, 8:14 AM', label: 'Case received', group: 'received', status: 'pre_review' },
        {
          at: 'Sep/23/2026, 8:16 AM',
          label: '4 of 4 criteria matched — lighter-touch review eligible',
          group: 'matched',
          status: 'pre_review',
        },
        { at: 'Sep/23/2026, 8:17 AM', label: 'Determined — Approved', group: 'determined', status: 'determined' },
      ],
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
    packetPages: 14,
    parseFailed: false,
    // CMS decision clock: standard = 7 days, expedited = 72 hours.
    cmsClock: { type: 'expedited', hoursRemaining: 4 },
    extraction: [
      {
        label: 'Procedure',
        value: 'Left hip hemiarthroplasty for displaced femoral neck fracture (urgent)',
        doc: 'Orthopedic Consult, p. 2',
      },
      {
        label: 'Comorbidities',
        value: 'Age 81; type 2 diabetes on insulin; atrial fibrillation, on anticoagulation',
        doc: 'History & Physical, p. 4',
      },
      {
        label: 'Clearance',
        value:
          'Anesthesia clearance on file, signed 09/25/2026. Cardiology clearance referenced but not attached.',
        doc: 'Pre-Op Clearance, p. 6',
      },
      {
        label: 'Length of Stay',
        value: 'Surgeon order: anticipate 3-midnight admission for pain control and early mobilization',
        doc: 'Surgeon Orders, p. 8',
      },
    ],
    criteria: [
      {
        id: 'procedure',
        status: 'met',
        quote: 'Consult: displaced left femoral neck fracture, hemiarthroplasty indicated.',
        source: 'Orthopedic Consult, p. 2',
        reasoning: 'Hip fracture repair is on the inpatient-appropriate procedure list.',
      },
      {
        id: 'comorbidities',
        status: 'met',
        quote: 'H&P: age 81; insulin-dependent type 2 diabetes; atrial fibrillation on anticoagulation.',
        source: 'History & Physical, p. 4',
        reasoning:
          'Documented comorbidities raise perioperative risk, supporting inpatient monitoring.',
      },
      {
        id: 'clearance',
        status: 'ambiguous',
        quote:
          'Anesthesia pre-op clearance, signed 09/25/2026. Cardiology clearance referenced in H&P, not attached.',
        source: 'Pre-Op Clearance, p. 6',
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
        source: 'Surgeon Orders, p. 8',
        reasoning: 'Documented length of stay exceeds the 2-midnight inpatient threshold.',
      },
    ],
  },
]

export function getCase(caseId) {
  return CASES.find((c) => c.id === caseId)
}
