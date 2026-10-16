# Pre-Auth Demo

A working prototype of an AI-assisted **Prior Authorization Decision Support** tool for utilization management (UM) nurses.

Given a multi-page clinical packet (fax cover, H&P, cardiology clearance, labs, orders, etc.), the tool extracts the relevant facts, matches them against a hierarchical set of inpatient level-of-care criteria (NCD → LCD → payer policy → MCG), and surfaces a criteria checklist with source citations back to the exact page/sentence in the packet. Every citation is genuine and clickable — nothing is asserted without a traceable source. Ambiguous criteria are never guessed: the nurse (or, for higher-risk cases, a medical director) still makes the final call, with the tool's reasoning shown alongside the evidence.

The demo covers five golden-set cases end to end:
- a clean, straight-through approval
- a provider clarification round (standard and expedited)
- a medical-director escalation
- a packet that fails to parse, routed to manual review

## Highlights

- **Extraction → criteria matching → review → determination** as a single guided flow, with a shared case header and audit trail throughout.
- **Source citations** that open the actual packet PDF and highlight the exact sentence being cited.
- **"Ask about this document"** — an in-page chat panel for querying the packet's contents (procedure, comorbidities, clearances, labs, expected length of stay, etc.), with citation links back into the source document.
- **Review-tier banner** that explains, in plain language, why a case needs a clarification request vs. an escalation vs. is ready to approve.
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
