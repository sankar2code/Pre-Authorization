# Replit Agent prompt: Prior Authorization AI (with Patient Portal)

> **How to use:** paste everything below the line into Replit Agent. Attach these files from your Pre-Auth Demo folder in the same message:
> - `Pre-Authorization-PRD-v1.1.pdf` (product context)
> - `scripts/generate-packet.py` and `scripts/check-packet.py` (so the 106-page packet is identical)
> - optional: screenshots of the current app for visual reference
>
> Then let the agent work one phase at a time. Approve each checkpoint before saying "continue".

---

## Goal

Build a front-end-only web prototype called **Prior Authorization AI**. A utilization management (UM) nurse reviews AI-extracted evidence from a 106-page faxed clinical packet against four inpatient level-of-care criteria, then approves, requests clarification from the provider, or escalates to a medical director (MD). A **patient portal** shows the member the same case in plain language, live. All "AI" behavior is scripted. There is no backend, no database, no API keys and no real payments. All data is synthetic. The attached PRD (v1.1) describes the product; this prompt is the build spec.

## Tech stack (use exactly this)

- React 19 + Vite, plain JavaScript (JSX), single-page app with screen state in `App.jsx` (no router)
- Tailwind CSS v4 via `@tailwindcss/vite`, with theme tokens in `@theme` in `src/index.css`
- `pdfjs-dist` for rendering the packet PDF and highlighting sentences
- `mermaid` for two flow diagrams on the landing page
- `oxlint` for linting; zero warnings is the bar
- A second Vite entry, `packet-viewer.html`, that opens in a popup window
- Python 3 + `reportlab` + `pypdf`, only for the packet generator and checker scripts
- All state lives in one React hook (`useCaseRuntime`), in memory per session

## Design system

- Font: Inter. Calm, clinical, light by default, with a dark theme toggle (top-right floating button, persisted in localStorage, defaults to the system preference). Dark theme is set via `[data-theme="dark"]` on `<html>`.
- Color tokens (light / dark):
  - brand green `#4e8416` / `#6bb52e` (MD queue, primary nurse buttons)
  - nurse blue `#2f6fb0` / `#6fa8dc` (nurse queue, patient portal accent), plus `nurse-solid` `#2f6fb0` in both themes (hover `#255a91`) for every filled blue button with white text, so contrast holds in dark mode
  - ink `#2c2c2a` / `#ececea`, ink-soft `#5c5c58`, ink-faint `#8a8a86`
  - paper `#fdfdfc` / `#15161a`, surface `#ffffff` / `#1e1f24`, line `#e4e3df` / `#34353b`
  - met green `#1a7f37`, ambiguous amber `#9a6700`, missing gray `#6b6b66`, not-met red `#b3261e`, escalated orange `#c97a3d`; each has matching `-bg` and `-border` tints in both themes
- Rounded cards with thin borders, small uppercase labels, status pills. Modals have a subtle flip-in animation. Layout must work at 390px width with no horizontal scroll.

## Domain rules

**Four criteria** (every case uses the same four):

| id | Label | Policy ref | Tier |
|---|---|---|---|
| procedure | Procedure meets inpatient level-of-care criteria | LCD L33438 (links to the real CMS Coverage Database page) | 2 (LCD) |
| comorbidities | Comorbidities support inpatient setting | Payer Medical Policy §4.2 | 3 |
| clearance | Required clearance / pre-op workup on file | Payer Medical Policy §4.3 | 3 |
| los | Expected length of stay meets inpatient threshold (≥ 2 midnights) | Payer Medical Policy §4.4 | 3 |

- The policy precedence shown in the UI is NCD → LCD → Payer policy → MCG.
- Each criterion is **Met / Ambiguous / Missing / Not Met** and carries a quote, a source ("History & Physical, p. 69"), and reasoning.
- **Review tier:**
  - all Met = "Lighter-touch review eligible"
  - one Ambiguous or Missing = "Standard review required"
  - two or more, or any Not Met = "Escalation required"
- **Who can do what:**
  - The nurse can approve only when all criteria are Met. Otherwise the nurse can request clarification or escalate.
  - The MD can approve, request clarification, or deny. Only the MD can deny.
- **Every action** opens a confirmation modal. The modal shows a read-only AI-generated summary built from the criteria's actual reasoning, plus a **mandatory** reviewer comment. Both are written to the audit trail.
- **Decision clock:** expedited requests have 72 hours, standard requests have 7 days. Each case has a fixed time remaining.

## The six cases (use these exact details)

| ID | Patient | Title | Procedure | Clock | Criteria |
|---|---|---|---|---|---|
| MBR-1001 | Sarah Chen | Clean Approval | Total knee arthroplasty, right knee | Standard, 6 days | All Met (BMI 42.1 + sleep apnea on CPAP; anesthesia clearance 09/12/2026; surgeon orders 2-midnight stay) |
| MBR-0042 | John Doe | Ambiguous Length of Stay | Open lumbar spinal fusion, L4–L5 | Expedited, 31 hours | LOS Ambiguous ("multi-day stay", no midnight count). Clarification question: "Please confirm expected length of stay in midnights for this admission." Provider response: "Provider confirms: 3-midnight stay." Others Met (HFrEF EF 40%, type 2 diabetes, cardiology clearance) |
| MBR-2003 | Robert Kim | Multi-Ambiguous | Laparoscopic cholecystectomy, converted to open | Standard, 4 days | Comorbidities Ambiguous (H&P says no history; anesthesia note says cirrhosis, Child-Pugh B) and Clearance Ambiguous (hepatology letter unsigned and undated), so the tier is escalation. Procedure and LOS (2-midnight) Met |
| MBR-3004 | Maria Lopez | Corrupted Packet | Unknown (extraction failed) | Standard, 5 days | Parse fails: pages 24–61 illegible (low-resolution scan, skew, compression). No criteria. Routes to manual review; the nurse can "Notify provider & close" (an administrative closure, not a determination) |
| MBR-4005 | Emily Watson | Resolved | Laparoscopic cholecystectomy, elective | Standard, 7 days | All Met. **Seeded as already Approved** two days ago, with audit entries, and the patient has already accepted a 6-month payment plan |
| MBR-5006 | Dany Che | Expedited Clarification | Left hip hemiarthroplasty (femoral neck fracture) | Expedited, 4 hours | Clearance Ambiguous: atrial fibrillation on anticoagulation, cardiology clearance referenced but not attached. Clarification: "Please send the signed cardiology pre-op clearance, including the anticoagulation plan." Others Met (age 81, insulin-dependent diabetes; 3-midnight stay) |

When a provider responds, each clarified criterion flips to Met, with the response quote and new reasoning, and gets a "just resolved" highlight.

## Nurse and MD screens

1. **Landing** (scrolls normally; works at 390px):
   - Product badge, then the headline "From faxed packet to patient decision, end to end". Subtext: a working prototype of AI-assisted prior authorization; the UM nurse reviews AI-extracted evidence where every fact links to its page, a person always decides, and the patient follows the same case live in plain language.
   - **"How a request moves through the app"** card with six numbered steps. Each step shows its actor, a title and one line of text. The layout is horizontal with connecting lines on desktop, 2 columns on tablet, and stacked on phones:
     1. Doctor's office: Request submitted. The request and a 106-page clinical packet arrive by fax or portal.
     2. AI: Facts extracted and matched. Key facts are checked against NCD → LCD → payer policy → MCG, each cited to its page.
     3. UM nurse: Nurse reviews. The nurse verifies every criterion against the source sentence, then approves or sends one precise clarification.
     4. Medical director: Escalation if needed. Two or more gaps go to the MD with a structured brief; only the MD can deny.
     5. Health plan: Decision on the clock. 72 hours expedited, 7 days standard; every step lands in the audit trail.
     6. Patient: Patient follows along. Live status, what's pending, prep steps, costs and payment, or the reason and appeal rights.
   - A "Flow diagram" button on that card opens the full app flow as a Mermaid diagram. It covers all case paths and ends at a Patient portal node.
   - **Two equal entry cards**, side by side (stacked on phones):
     - **UM nurse view** (green): "Work the case queue: six cases covering a clean approval, two provider clarifications (one expedited), a medical-director escalation, a resolved case and an unreadable packet." Button: "Open UM nurse view →", which goes to the case queue.
     - **Patient view** (blue): "See the same cases as the member: where the request stands, what's pending, how to prepare, what it will cost, and how to appeal. In English or Spanish." Button: "Open patient view →", which goes to the patient picker.
     - Caption under both cards: "Try both: act on a case as the nurse, then open the patient view and watch it update."
   - **"Why it matters"** section below: a Current State / Future State toggle.
     - Current state shows the manual steps, a "106 pages, one packet, read manually" callout, and where today's process costs you.
     - Future state shows the tool's steps and the 4 paths the demo covers.
     - Each state has its own flow diagram button.
2. **Case queue:**
   - Tabs: All / Needs action / Escalated / Closed.
   - Rows show name, ID, procedure, decision-clock pill, owner pill (Nurse queue or MD queue), status pill ("Ready to approve" when all criteria are Met) and an unread dot.
   - Sort order: expedited first (fewest hours left), then standard (fewest days left).
   - A "This week's impact →" button opens Reports.
3. **Case header**, shared by every case screen: back to queue, name and ID, owner tag, journey steps (Extracted → Matched → Reviewed → Determined), and an Audit trail button whose color reflects the current case status.
4. **Loading:** staged extraction steps over about 6 seconds ("Reading 106 pages"…), then either the extraction screen or the failure screen.
5. **Extraction:**
   - The four extracted facts, each with its document and page.
   - "View source packet · 106 pages" button.
   - "Match against criteria →" button.
6. **Criteria checklist:**
   - Review-tier banner.
   - Four criterion rows: status badge, quote, "Source: … — view in document" (opens the viewer on the cited sentence), policy reference and tier, reasoning, and thumbs up/down feedback.
   - Action panel.
   - An **"Ask about this document"** chat: scripted keyword-matched Q&A over the packet, with suggested questions and "view on page" citation links.
7. **Clarification sent:**
   - Request ID (CLR-8842…), sent via the provider portal.
   - Stages Sent → Delivered → Viewed, advancing on timers, with timestamps.
   - "Simulate provider response" button.
8. **Provider response:** the resolved criteria, then the action panel.
9. **Escalation handoff:** what transfers to the MD (structured checklist, not the raw packet), then "Continue to Medical Director →".
10. **MD view:** the same checklist with the nurse's observations shown, plus MD actions.
11. **Determination:**
    - Approved or Denied, with the path taken (straight-through, clarification, or escalation) and who decided.
    - Citation trail.
    - "← Back to Queue" and **"See what the patient sees →"** buttons.
12. **Failure state:** the illegible pages, "Routed to manual review — no AI determination", and "Notify provider & close".
13. **Audit trail modal:**
    - A timeline of grouped events, color-coded by the status at that moment, with a flag icon for determinations and a person icon for patient actions.
    - AI summaries and reviewer comments appear nested under their event.
    - CSV export with these columns: Sequence #, Case Name, MBR ID, Event, Status, Timestamp, AI Summary, Reviewer Comment.
14. **Reports:**
    - Team Impact and Your Impact tabs, with illustrative numbers labeled as such.
    - A **Patient Engagement** tab that is live from session state:
      - share of approved patients who accepted their estimate
      - portal opens out of 6
      - pay now vs. later
      - callbacks
      - appeals
      - declines by reason, as bars
      - financial-assistance checks

## The 106-page packet and viewer

- Run the attached `scripts/generate-packet.py` (`pip install reportlab pypdf`). It writes `public/packet.pdf` and `src/data/packetIndex.json`. The JSON holds `totalPages`, section ranges and **anchors**: a page number plus an exact quote for every citation. `scripts/check-packet.py` must report "19 of 19 anchors found".
- **The app must never hard-code page numbers.** `src/data/packet.js` exports:
  - `PACKET_PAGES`
  - `PACKET_SECTIONS`
  - `anchor(key)`
  - `pageRef(label, key)`, which returns "Surgical Consult, p. 16"
  - `openPacketWindow(criterionId, label)` and `openPacketWindowAt(page, quote, label)`
- Criterion anchors are procedure (p. 16), comorbidities (p. 69), clearance (p. 78) and los (p. 95). The 14-page packet is gone everywhere, including the copy.
- **Viewer popup** (`packet-viewer.html?page=&q=&label=`):
  - Sticky header with a section dropdown and a page-number box.
  - Sizes all 106 page placeholders up front.
  - Renders the cited page first and scrolls to it.
  - Highlights the quoted phrase by mapping pdf.js text items to viewport rectangles (case- and whitespace-insensitive, may span lines) with a pulsing yellow box.
  - Lazy-renders other pages with an IntersectionObserver (1200px margin) and releases canvases far off-screen.

## Patient portal

Entry points:
- "Open patient view →" on the landing page opens a picker of the 6 patients, each with a patient-status pill. "Open UM nurse view →" opens the case queue.
- "See what the patient sees" on the determination screen opens that patient directly; Back returns there.

The portal reads the **same runtime** as the nurse side, so nurse actions update it immediately. It keeps no separate copy of status.

**Patient status:** approved or denied comes from the determination. Information needed means a clarification was sent and not yet answered, or the packet failed to parse. In review means the nurse opened the case. Otherwise the request is submitted.

**Header:**
- "Concord Health Plans · My Prior Authorization".
- Patient name, plain-language procedure, member ID and requesting office.
- Timeline badge: "Critical — decision within 72 hours" or "Standard — decision within 7 days", plus time left or "Decision made".
- EN/ES toggle (persisted).
- Read-aloud button using `speechSynthesis` with en-US or es-US; it reads the current tab and stops on tab change.
- Notifications bell with an unread count. Each status change appears as a simulated text or email message ("Concord: … Log in to My Prior Authorization for details.") sent to fictional 555 numbers.

**Tabs:** My request · Get ready (locked until approved) · Costs & payment (locked until approved) · Help.

1. **My request**
   - **Status card.** Headline and subtext per status, then a 5-step tracker:
     - Initiated — doctor's office
     - Request sent to insurance
     - Review in progress
     - Additional information needed (shown as "Not needed" if skipped)
     - Approved, or Not approved in red
     - The tracker is horizontal on desktop and vertical on phones.
   - **What we're waiting on.** Shown only while a clarification is outstanding. It says who owns it ("Not you — your doctor's office has been asked"), gives a plain-language version of each question, and shows the sent, delivered and viewed stages. For a failed packet, it says the office must resend pages 24–61.
   - **Activity history.** Newest first, translated from the audit log into patient language. Internal AI summaries and reviewer comments never appear.
   - **What was sent to your plan.** Collapsible list of packet sections with patient-friendly names and page counts.
   - **When denied:**
     - The specific reasons: each unmet criterion in plain language.
     - Appeal rights: "Ask for an appeal by [decision date + 65 days]". The plan decides within 30 days, or 72 hours if the doctor says waiting could harm the patient's health.
     - An **Ask my doctor to appeal** button.
     - A peer-to-peer tracker that auto-advances Requested → Call scheduled → Call completed after about 5 and 7 seconds.
2. **Get ready**
   - Countdown ("Your procedure is in N days"), or an "already admitted" message for inpatients (Robert Kim, Dany Che).
   - Grouped, checkable pre-op checklist with a progress bar. John Doe's comes from his orders:
     - nothing to eat or drink after midnight
     - hold glipizide
     - take metformin, lisinopril and atorvastatin with a sip of water
     - chlorhexidine shower
     - ride home
     - prepare the house and plan for stairs
     - bring cane
   - Disclaimer to follow the care team's instructions.
   - Appointment card (date, arrival time, facility and address, phone, what to bring) with an **Add to calendar** button that downloads a valid `.ics` file with a 1-day alarm.
3. **Costs & payment**
   - Estimate line items, each with a "?" definition that opens on hover or tap (copay, deductible, coinsurance, out-of-pocket maximum). John Doe's, on Concord Gold Plus HMO:
     - inpatient copay $350
     - remaining deductible $320
     - surgeon and anesthesia 20% of $3,100 = $620
     - walker and toilet seat $40
     - total $1,330; out-of-pocket max $4,900 with $1,265 met
   - Give the other patients different plausible numbers. Sarah Chen's total is $840.
   - **Accept and continue**, then a payment choice:
     - **Pay now:** card or HSA/FSA, a "Demo — no payment processed" note, **no card fields**, then a confirmation number (PAY-40218…).
     - **Pay later:** at my appointment, or 3, 6 or 12 interest-free monthly payments (computed, rounded up to the cent). Then "We'll send a secure payment link by text/email before your procedure."
   - **Decline:** reason (cost too high, second opinion, timing, other) plus an optional note.
     - If the reason is cost, show a financial-assistance check first: household size and income bracket give a demo result of full, partial or none, labeled "demo screening only". The patient can then accept with help or decline anyway.
     - After declining: "Your care team at [office] will contact you about next steps", with a **Review the estimate again** button.
4. **Help**
   - **Ask about my authorization:** scripted keyword assistant in English and Spanish with status-aware suggested questions. It answers status, timing, what we're waiting on, cost, cost terms (only the term asked about), payment options, prep, appointment, appeals and contact.
   - **Guardrail:** questions about symptoms, doses or safety get "That's a medical question… call [office] … or request a callback… If this is an emergency, call 911", with a jump to the callback form. Check this guardrail before anything else.
   - **Request a callback:** who (doctor's office or plan), topic, best time. Shows a confirmation and a list of requests (CB-311…).
   - **Notification preferences:** text and email toggles.

**Every patient action** (accept, pay, decline, reopen, assistance check, appeal, peer-to-peer stage, callback) is logged to the case audit trail as its own event, prefixed "Patient:". Opening the portal counts as a view for Reports.

**Language:** keep all patient-facing text in a `{ en, es }` dictionary, with helpers for UI strings, data values, currency and dates in the current language. Use correct Spanish ("al consultorio", not "a el"). Keep the nurse side in English.

**Dates:** request and appointment dates are relative to today (for example, John's surgery is today + 8 days), so the demo never goes stale.

## Build phases (stop for my review after each one)

1. Scaffold, theme tokens, landing page (journey, two entry cards, why it matters), case queue, case data, `useCaseRuntime`, audit-trail data model.
2. The nurse workflow end to end: loading, extraction, checklist, all modals, clarification, escalation, MD, determination, failure path, audit trail and CSV export.
3. Packet: run the generator, add `packet.js` helpers, the lazy viewer popup with highlighting, and the document chat.
4. Patient portal: picker, status, My request tab, live link to nurse actions.
5. Get ready, Costs & payment, Help tab, notifications.
6. Spanish, read-aloud, Reports Patient Engagement, mobile pass.

## Acceptance checks

- The landing page shows the six-step journey and the two entry cards; "Open UM nurse view →" opens the queue and "Open patient view →" opens the patient picker.
- `npm run build` and `npm run lint` pass with zero warnings. `python3 scripts/check-packet.py` prints 19 of 19.
- Clicking John Doe's length-of-stay source opens the viewer on p. 95 with the sentence highlighted.
- John Doe: the nurse requests clarification, and his portal shows "Additional information needed" and what's being waited on. The provider responds and the nurse approves; "See what the patient sees" then shows Approved, unlocked tabs, the checklist and the $1,330 estimate. Accepting a 6-month plan shows in the nurse audit trail.
- Robert Kim: escalate, then the MD denies. The portal shows two plain-language reasons, the appeal deadline, and the peer-to-peer tracker reaching Call completed.
- Maria Lopez: the portal says the office must resend pages 24–61.
- A medical question to the assistant is never answered and always routed.
- Spanish mode has no English left in the patient view. Dark mode looks correct. 390px width has no horizontal scroll. No console errors.
