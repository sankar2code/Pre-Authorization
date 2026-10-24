# Pre-Auth Demo

A working prototype of an AI-assisted **Prior Authorization Decision Support** tool for utilization management (UM) nurses.

Given a realistic 106-page faxed clinical packet (primary care and surgical notes, imaging, 24 physical therapy visits, injection records, H&P, cardiology clearance, anesthesia, labs, orders and consents), the tool extracts the relevant facts, matches them against a hierarchical set of inpatient level-of-care criteria (NCD → LCD → payer policy → MCG), and surfaces a criteria checklist with source citations back to the exact page/sentence in the packet. Every citation is genuine and clickable — nothing is asserted without a traceable source. Ambiguous criteria are never guessed: the nurse (or, for higher-risk cases, a medical director) still makes the final call, with the tool's reasoning shown alongside the evidence.

The demo covers six golden-set cases end to end:
- a clean, straight-through approval
- a provider clarification round (standard and expedited)
- a medical-director escalation
- a packet that fails to parse, routed to manual review

## Highlights

- **Extraction → criteria matching → review → determination** as a single guided flow, with a shared case header and audit trail throughout.
- **Source citations** that open the actual packet PDF and highlight the exact sentence being cited.
- **"Ask about this document"** — an in-page chat panel for querying the packet's contents (procedure, comorbidities, clearances, labs, expected length of stay, etc.), with citation links back into the source document.
- **Review-tier banner** that explains, in plain language, why a case needs a clarification request vs. an escalation vs. is ready to approve.
- **Patient portal** — the member's side of the same case, live-linked to the nurse workflow: a five-step status tracker (initiated → sent to insurance → in review → information needed → approved), the CMS decision clock (72 hours critical, 7 days standard), what the plan is waiting on and who owns it, plain-language activity history, and what was sent.
- **After approval** — an interactive pre-op checklist from the surgeon's orders, appointment details with an add-to-calendar file, and a cost estimate (copay, deductible, coinsurance) the patient can accept (pay now, pay later, or an interest-free plan) or decline, with a financial-assistance check when cost is the reason.
- **After a denial** — the specific reason in plain language, appeal rights and deadline, an "ask my doctor to appeal" request, and a simulated doctor-to-doctor review.
- **Patient help** — a scripted assistant for status, cost and prep questions (medical questions go to the care team), callback requests, notification preferences, English/Spanish, and read-aloud.
- **Patient engagement report** — acceptance rate, pay now vs. later, declines by reason, callbacks and appeals, live for the session.
- Full light/dark theme support.

## Stack

React 19 + Vite + Tailwind CSS v4, with `pdfjs-dist` for in-browser PDF rendering/highlighting and `mermaid` for the workflow diagrams on the landing page. No backend — all data and "AI" behavior is scripted/simulated for demo purposes.

## Running locally

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build
npm run lint     # oxlint
```

## Source packet

`public/packet.pdf` is generated, not hand-made. `src/data/packetIndex.json` records its section ranges and the page and quote behind every citation; the app reads page numbers from the index, so regenerating the packet can't break a citation.

```bash
python3 scripts/generate-packet.py   # rebuild packet.pdf + packetIndex.json (needs reportlab)
python3 scripts/check-packet.py      # verify every citation quote is on its stated page (needs pypdf)
```
