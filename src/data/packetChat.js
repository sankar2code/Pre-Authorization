// Scripted "ask the document" Q&A for the packet viewer. This is a static
// demo (no backend/LLM), so answers are pre-written and matched by keyword
// rather than generated — same simulated-AI approach as the rest of the app.
// The packet PDF is shared across every case, so this knowledge base is too.
export const SUGGESTED_QUESTIONS = [
  'What procedure is being requested?',
  'What comorbidities does the patient have?',
  'Is cardiology clearance on file?',
  'Why does the surgeon expect an inpatient stay?',
]

export const PACKET_QA = [
  {
    keywords: ['procedure', 'diagnosis', 'surgery', 'fusion', 'cpt', 'icd', 'spondylolisthesis'],
    answer:
      'Open lumbar spinal fusion, L4-L5 (CPT 22612), for lumbar spondylolisthesis with radiculopathy (ICD-10 M43.16) — requested as an elective inpatient admission.',
    page: 4,
    quote: 'Recommend open lumbar spinal fusion, L4-L5, with posterior instrumentation.',
  },
  {
    keywords: ['comorbid', 'comorbidities', 'medical history', 'chf', 'heart failure', 'diabetes', 'ejection fraction'],
    answer:
      'Congestive heart failure (HFrEF, EF 40% on the 07/2026 echo), type 2 diabetes mellitus, hypertension, hyperlipidemia, and GERD.',
    page: 6,
    quote: 'Congestive heart failure, HFrEF, EF 40% (echo 07/2026)',
  },
  {
    keywords: ['cardiology', 'cardiac clearance', 'clearance', 'cleared for surgery', 'heart clearance'],
    answer:
      'Yes — Heartland Cardiology cleared the patient for surgery on 09/16/2026, with telemetry monitoring recommended for the first 24-48 hours post-op given the HFrEF history.',
    page: 10,
    quote: 'Patient is cleared for surgery from a cardiac standpoint.',
  },
  {
    keywords: ['anesthesia', 'asa', 'pre-op eval', 'anesthesia clearance'],
    answer:
      'Anesthesia pre-op evaluation was completed 09/23/2026 — ASA Physical Status III, cleared for surgery with standard cardiac monitoring intra-operatively.',
    page: 8,
    quote: 'Anesthesia pre-op evaluation completed 09/23/2026, cleared for surgery with standard cardiac monitoring intra-operatively.',
  },
  {
    keywords: ['length of stay', 'los', 'how long', 'inpatient stay', 'multi-day', 'admission'],
    answer:
      "The surgical and cardiology notes anticipate a multi-day inpatient stay for pain control, mobilization, and cardiac monitoring; an exact LOS isn't given and depends on the post-op course.",
    page: 12,
    quote: 'Patient anticipated to require inpatient admission post-operatively for pain control, mobilization, and cardiac monitoring',
  },
  {
    keywords: ['lab', 'labs', 'laboratory', 'bnp', 'a1c', 'hemoglobin', 'glucose', 'anemia'],
    answer:
      'Labs drawn 09/23/2026 show mild anemia, hyperglycemia and elevated A1c consistent with known diabetes, and a mildly elevated BNP consistent with compensated heart failure — no acute change from baseline.',
    page: 13,
    quote: 'Mild anemia, consistent with chronic disease.',
  },
  {
    keywords: ['dvt', 'prophylaxis', 'blood clot', 'compression', 'heparin'],
    answer:
      'Sequential compression devices plus subcutaneous heparin, starting post-operative day 0, per the pre-operative orders.',
    page: 12,
    quote: 'Sequential compression devices + subcutaneous heparin per protocol, starting post-operative day 0.',
  },
  {
    keywords: ['functional', 'ambulat', 'mobility', 'cane', 'stairs', 'adl'],
    answer:
      'He ambulates with a single-point cane due to pain but is otherwise independent; he lives in a two-story home and will need help with stairs post-operatively.',
    page: 7,
    quote: 'Patient ambulates with a single-point cane due to pain, otherwise independent.',
  },
  {
    keywords: ['medication', 'meds', 'metformin', 'lisinopril', 'drugs'],
    answer:
      'Metformin, glipizide, lisinopril, atorvastatin, furosemide, and daily aspirin.',
    page: 6,
    quote: 'Metformin 1000mg BID, Glipizide 5mg daily',
  },
  {
    keywords: ['conservative', 'physical therapy', 'failed treatment', 'steroid injection', 'refractory'],
    answer:
      'He failed 12 weeks of physical therapy and two epidural steroid injections before surgery was recommended.',
    page: 2,
    quote: 'physical therapy x 12 weeks, epidural steroid injection x2',
  },
  {
    keywords: ['attestation', 'certification', 'medical necessity', 'sign', 'attest'],
    answer:
      'Dr. Amanda Reyes certifies the request is accurate and that the inpatient admission is medically necessary given the clinical presentation, failed conservative management, and comorbid conditions.',
    page: 14,
    quote: 'the requested inpatient admission for open lumbar spinal fusion (L4-L5) is medically necessary',
  },
  {
    keywords: ['nyha', 'cardiac risk', 'risk index', 'stable'],
    answer:
      'NYHA Class II symptoms, stable on current guideline-directed medical therapy, with no recent decompensation — Revised Cardiac Risk Index of 2 (heart failure, diabetes), estimated intermediate peri-operative risk.',
    page: 9,
    quote: 'NYHA Class II symptoms, stable on current guideline-directed medical therapy',
  },
]

const FALLBACK_ANSWER =
  "I couldn't find that in the packet. Try asking about the procedure, comorbidities, cardiology or anesthesia clearance, labs, expected length of stay, or DVT prophylaxis."

// Scores each entry by how many of its keywords appear in the question, and
// returns the best match (or the fallback if nothing scores above zero).
export function answerPacketQuestion(question) {
  const q = question.toLowerCase()
  let best = null
  let bestScore = 0
  for (const entry of PACKET_QA) {
    const score = entry.keywords.reduce((n, kw) => (q.includes(kw) ? n + 1 : n), 0)
    if (score > bestScore) {
      best = entry
      bestScore = score
    }
  }
  if (!best) return { answer: FALLBACK_ANSWER }
  return best
}
