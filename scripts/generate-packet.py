#!/usr/bin/env python3
"""Generates the demo's source packet: public/packet.pdf plus
src/data/packetIndex.json (section ranges and citation anchors).

Every page of the packet is one entry below, so page numbers are known up
front. Text can reference other pages with {p:anchor} placeholders, and any
page can declare anchors: named citations the app jumps to. The app reads
page numbers from packetIndex.json, never hard-codes them, so regenerating
the packet can't break a citation.

Run from the repo root:  python3 scripts/generate-packet.py
Requires: reportlab
"""

import json
import os
import re
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    BaseDocTemplate,
    Flowable,
    Frame,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF_OUT = os.path.join(ROOT, 'public', 'packet.pdf')
INDEX_OUT = os.path.join(ROOT, 'src', 'data', 'packetIndex.json')

GRAY = colors.Color(0.45, 0.45, 0.45)
RULE = colors.Color(0.8, 0.8, 0.8)
RED = colors.Color(0.75, 0.15, 0.12)

S_TITLE = ParagraphStyle('title', fontName='Helvetica-Bold', fontSize=14, leading=18)
S_SUB = ParagraphStyle('sub', fontName='Helvetica', fontSize=9, leading=13, textColor=GRAY)
S_H = ParagraphStyle('h', fontName='Helvetica-Bold', fontSize=10, leading=13, spaceBefore=5, spaceAfter=2)
S_P = ParagraphStyle('p', fontName='Helvetica', fontSize=9.5, leading=13, spaceAfter=3)
S_LI = ParagraphStyle('li', parent=S_P, leftIndent=12, firstLineIndent=-12, spaceAfter=1.5)
S_SIG = ParagraphStyle('sig', fontName='Helvetica-Oblique', fontSize=9, leading=13, spaceBefore=6)
S_NOTE = ParagraphStyle('note', fontName='Helvetica', fontSize=8, leading=11, textColor=GRAY, spaceBefore=6)
S_URGENT = ParagraphStyle('urgent', fontName='Helvetica-Bold', fontSize=10.5, leading=14, textColor=RED, spaceBefore=4, spaceAfter=4)
S_CELL = ParagraphStyle('cell', fontName='Helvetica', fontSize=8.5, leading=11)
S_CELLB = ParagraphStyle('cellb', fontName='Helvetica-Bold', fontSize=8.5, leading=11)
S_BLANK = ParagraphStyle('blank', fontName='Helvetica-Oblique', fontSize=10, leading=14, textColor=GRAY, alignment=1)

PATIENT = 'Patient: John Doe | DOB: 03/14/1955 | MRN: 774213'

RIDGELINE_ORTHO = 'Ridgeline Orthopedic & Spine Associates'
RIDGELINE_SC = 'Ridgeline Surgical Center'
RIDGELINE_PAT = 'Ridgeline Surgical Center — Pre-Admission Testing'
LAKEVIEW = 'Lakeview Family Medicine'
SUMMIT_PT = 'Summit Rehab & Physical Therapy'
PAIN = 'Central Ohio Pain & Spine Institute'
HEARTLAND = 'Heartland Cardiology Associates'
IMAGING = 'Meridian Imaging Center'
ENDO = 'Ridgeline Endocrinology & Diabetes Care'
NEURO = 'Columbus Neurodiagnostics'


# ---------------------------------------------------------------- blocks
# Small constructors so page content reads like a document, not code.

def h(text):
    return ('h', text)


def p(text):
    return ('p', text)


def li(*items):
    return ('list', list(items))


def ol(*items):
    return ('list', [f'{i}. {t}' for i, t in enumerate(items, 1)])


def kv(*rows):
    return ('kv', list(rows))


def table(header, *rows, widths=None):
    return ('table', header, list(rows), widths)


def sig(text):
    return ('sig', text)


def note(text):
    return ('note', text)


def urgent(text):
    return ('urgent', text)


def page(title, org, *blocks, section=None, anchors=None, plain=False):
    """One packet page. `section` starts a new section in the index;
    `anchors` names citations whose quote must appear on this page."""
    return {
        'title': title,
        'org': org,
        'blocks': list(blocks),
        'section': section,
        'anchors': anchors or {},
        'plain': plain,
    }


def blank_page():
    return {'title': None, 'org': None, 'blocks': [], 'section': None, 'anchors': {}, 'plain': True, 'blank': True}


# ---------------------------------------------------------------- content

def front_matter():
    return [
        page(
            'FAX TRANSMISSION COVER SHEET',
            f'{RIDGELINE_ORTHO}\n4420 Meridian Parkway, Suite 210  |  Fax: (614) 555-0198  |  Phone: (614) 555-0142',
            kv(
                ('TO:', 'Concord Utilization Management'),
                ('DATE:', '09/24/2026'),
                ('FAX:', '1-800-555-0177'),
                ('PAGES:', '{total} (including cover)'),
                ('FROM:', 'Dr. Amanda Reyes, MD'),
                ('RE:', 'Prior Authorization Request'),
                ('PATIENT:', 'Doe, John'),
                ('MEMBER ID:', 'MBR-0042'),
            ),
            urgent('URGENT — Prior authorization requested for scheduled inpatient admission.'),
            p('Attached please find the complete clinical record supporting the above-referenced request, including '
              'primary care records, surgical consultation, imaging, physical therapy and pain management records, history '
              'and physical, cardiology clearance, anesthesia evaluation, laboratory results, and pre-operative orders. '
              'Please contact our office with any questions regarding this submission.'),
            h('Contents'),
            table(
                ['Document', 'Pages'],
                ['Prior authorization request & eligibility', '{r:request}'],
                ['Primary care records & referral', '{r:pcp}'],
                ['Surgical consultation & spine follow-up', '{r:surgical}'],
                ['Imaging & electrodiagnostic studies', '{r:imaging}'],
                ['Physical therapy records', '{r:pt}'],
                ['Pain management & injection records', '{r:pain}'],
                ['History & physical', '{r:hp}'],
                ['Cardiology records & clearance', '{r:cardiology}'],
                ['Endocrinology', '{r:endo}'],
                ['Anesthesia pre-operative evaluation', '{r:anesthesia}'],
                ['Laboratory results', '{r:labs}'],
                ['Medication reconciliation', '{r:meds}'],
                ['Pre-operative orders & post-operative plan', '{r:orders}'],
                ['Consents, education & nursing assessment', '{r:consents}'],
                ['Provider attestation', '{r:attestation}'],
                widths=[360, 144],
            ),
            note('CONFIDENTIALITY NOTICE: This facsimile transmission contains confidential health information protected under '
                 'HIPAA. If you are not the intended recipient, please notify the sender immediately and destroy this transmission.'),
            section=('cover', 'Fax cover sheet'),
        ),
        page(
            'Prior Authorization Request Form',
            'Concord Utilization Management Program',
            kv(
                ('Member Name:', 'John Doe'),
                ('Member ID:', 'MBR-0042'),
                ('Date of Birth:', '03/14/1955'),
                ('Plan:', 'Concord Gold Plus HMO'),
                ('Requesting Provider:', 'Amanda Reyes, MD'),
                ('NPI:', '1780234561'),
                ('Facility:', 'Ridgeline Surgical Center'),
                ('Facility NPI:', '1922004471'),
                ('Requested Service:', 'Elective inpatient admission'),
                ('Procedure:', 'Open lumbar spinal fusion, L4-L5'),
                ('CPT:', '22612'),
                ('Requested Admission Date:', '10/02/2026'),
                ('Requested LOS:', 'See attached notes'),
                ('Diagnosis:', 'Lumbar spondylolisthesis with radiculopathy'),
                ('ICD-10:', 'M43.16'),
            ),
            h('Clinical Justification Summary'),
            p('Patient is a 71-year-old male with progressive lumbar radiculopathy refractory to conservative management '
              '(physical therapy x 12 weeks, epidural steroid injection x2). MRI demonstrates severe L4-L5 spondylolisthesis '
              'with foraminal stenosis. Surgical intervention recommended given failure of conservative treatment and '
              'progressive neurologic symptoms. See attached surgical consultation, H&P, and cardiology clearance for full '
              'clinical detail.'),
            section=('request', 'Prior authorization request & eligibility'),
            anchors={'conservative': 'physical therapy x 12 weeks, epidural steroid injection x2'},
        ),
        page(
            'Prior Authorization Request Form (continued)',
            'Concord Utilization Management Program',
            h('Requesting Provider Contact'),
            kv(
                ('Contact Name:', 'Linda Morales, Surgical Scheduler'),
                ('Phone:', '(614) 555-0142 ext. 214'),
                ('Fax:', '(614) 555-0198'),
                ('Preferred Response:', 'Provider portal and fax'),
            ),
            h('Request Type'),
            kv(
                ('Review Type:', 'Expedited — admission date within 10 days'),
                ('Setting:', 'Inpatient hospital'),
                ('Place of Service:', '21 — Inpatient hospital'),
                ('Additional CPT Codes:', '22840 (posterior instrumentation), 63047 (laminectomy/decompression)'),
                ('Secondary Diagnoses:', 'I50.22 (chronic systolic heart failure), E11.9 (type 2 diabetes), I10 (hypertension)'),
            ),
            h('Supporting Documentation Enclosed'),
            li('Primary care records and referral', 'Surgical consultation and spine follow-up notes',
               'Imaging reports (radiographs, MRI, flexion-extension films) and EMG/NCS',
               'Physical therapy evaluation, visit notes, and discharge summary',
               'Pain management consultation and epidural steroid injection records',
               'History & physical, cardiology clearance, anesthesia evaluation',
               'Laboratory results, medication reconciliation, pre-operative orders',
               'Signed consents and provider attestation'),
            sig('Submitted by: Linda Morales on behalf of Amanda Reyes, MD   |   09/24/2026 10:12 AM'),
        ),
        page(
            'Member Eligibility & Benefits Verification',
            'Generated by Ridgeline Surgical Center — Patient Access',
            kv(
                ('Member Name:', 'John Doe'),
                ('Member ID:', 'MBR-0042'),
                ('Group Number:', 'GRP-88214'),
                ('Effective Date:', '01/01/2026'),
                ('Plan Type:', 'Concord Gold Plus HMO (Medicare Advantage)'),
                ('PCP of Record:', 'Michael Tran, MD — Lakeview Family Medicine'),
                ('Prior Auth Required:', 'Yes — inpatient surgical admission'),
                ('Inpatient Benefit:', '$350 copay per admission'),
                ('Annual Deductible:', '$500 (in-network); $180 met YTD'),
                ('Out-of-Pocket Max:', '$4,900 (in-network); $1,265 met YTD'),
                ('Verification Date:', '09/20/2026'),
                ('Verified By:', 'K. Alvarez, Patient Access Rep'),
            ),
            note('Note: Eligibility and benefit information is verified as of the date shown above and is subject to change. '
                 'Verification does not guarantee payment.'),
            anchors={'benefits': 'Inpatient Benefit:'},
        ),
    ]


def pcp_records():
    visits = [
        ('02/10/2026', 'Low back pain, 4 weeks', 'Gradual-onset low back pain without trauma, radiating intermittently into the right buttock. '
         'No bowel or bladder changes. Taking acetaminophen with partial relief.',
         'BP 136/80, HR 74, Wt 212 lb. Lumbar paraspinal tenderness. Straight leg raise equivocal on right. Strength 5/5.',
         'Mechanical low back pain with possible right L5 radicular component.',
         ['Lumbar spine radiographs ordered.', 'Acetaminophen 1 g TID as needed; avoid NSAIDs given heart failure and renal risk.',
          'Home exercise handout provided. Return in 4 weeks.']),
        ('03/12/2026', 'Follow-up, back pain worse', 'Pain now radiating below the right knee to the dorsum of the foot. Reports '
         'tingling in the right great toe and difficulty walking more than two blocks.',
         'BP 140/84, HR 78. Positive straight leg raise on right at 45 degrees. EHL strength 4+/5 right.',
         'Lumbar radiculopathy, right L5 distribution, with grade 1 spondylolisthesis on radiographs.',
         ['Referral to physical therapy, 2x/week for 12 weeks.', 'Referral to spine surgery for evaluation.',
          'Gabapentin 100 mg at bedtime, titrate as tolerated.']),
        ('04/14/2026', 'Chronic disease follow-up', 'Heart failure symptoms stable, mild exertional dyspnea unchanged. Back pain '
         'persists; started physical therapy last week.',
         'BP 134/78, HR 72, Wt 210 lb. Lungs clear. Trace ankle edema. Lumbar exam unchanged.',
         'HFrEF, stable. Type 2 diabetes, A1c pending. Lumbar radiculopathy, in PT.',
         ['Continue guideline-directed medical therapy per cardiology.', 'Gabapentin increased to 300 mg at bedtime.',
          'Labs at next visit.']),
        ('06/02/2026', 'Follow-up, labs reviewed', 'Six weeks of PT completed with minimal change. Pain 6/10, worse with standing. '
         'Sleep disrupted by leg pain.',
         'BP 138/82, HR 76. Diminished right Achilles reflex. Sensation reduced over right L5 dermatome.',
         'Persistent right L5 radiculopathy despite conservative care. A1c 7.3%.',
         ['Referral to pain management for epidural steroid injection.', 'Continue PT to complete 12-week course.',
          'Diabetes: continue metformin and glipizide; dietary counseling.']),
        ('07/20/2026', 'Follow-up after first injection', 'First epidural steroid injection on 06/10/2026 gave about two weeks of '
         'partial relief; pain has returned to baseline. Second injection scheduled 07/22/2026.',
         'BP 132/80, HR 70. Neurologic findings unchanged from prior visit.',
         'Lumbar radiculopathy, refractory.',
         ['Proceed with second injection as planned.', 'MRI lumbar spine to be ordered by spine surgeon.']),
        ('08/25/2026', 'Pre-surgical planning', 'Second injection provided minimal and short-lived relief. Patient now using a cane '
         'and reports difficulty with stairs at home. Wishes to proceed with surgical evaluation.',
         'BP 138/82, HR 76, Wt 208 lb. Antalgic gait with single-point cane.',
         'Lumbar spondylolisthesis with radiculopathy, failed conservative management.',
         ['Agree with surgical consultation.', 'Cardiology pre-operative clearance requested given HFrEF.',
          'Records forwarded to Ridgeline Orthopedic & Spine.']),
    ]
    pages = [
        page(
            'Referral Letter — Spine Surgery',
            LAKEVIEW,
            p('Date: 03/12/2026'),
            p('To: Amanda Reyes, MD, Ridgeline Orthopedic & Spine Associates'),
            p('Re: John Doe, DOB 03/14/1955'),
            p('Dear Dr. Reyes,'),
            p('I am referring Mr. Doe, a 71-year-old man with progressive low back pain radiating into the right leg, for '
              'surgical evaluation. Radiographs show a grade 1 anterolisthesis at L4-L5. He has right L5 radicular findings on '
              'examination and has begun a course of physical therapy.'),
            p('His history is notable for heart failure with reduced ejection fraction followed by Heartland Cardiology, type 2 '
              'diabetes, hypertension, and hyperlipidemia. He is a former smoker. He is motivated and lives with his spouse, '
              'who is supportive.'),
            p('Enclosed are my recent office notes and imaging. Thank you for seeing him.'),
            sig('Michael Tran, MD   |   Lakeview Family Medicine   |   (614) 555-0110'),
            section=('pcp', 'Primary care records & referral'),
        ),
    ]
    for date, reason, hpi, exam, assessment, plan in visits:
        pages.append(page(
            'Office Visit Note',
            LAKEVIEW,
            p(f'{PATIENT} | Date of Visit: {date}'),
            h('Reason for Visit'), p(reason),
            h('History of Present Illness'), p(hpi),
            h('Examination'), p(exam),
            h('Assessment'), p(assessment),
            h('Plan'), ol(*plan),
            sig(f'Electronically signed: Michael Tran, MD   |   {date}'),
        ))
    return pages


def surgical_records():
    return [
        page(
            'Surgical Consultation Note',
            RIDGELINE_ORTHO,
            p('Patient: John Doe | DOB: 03/14/1955 | Date of Visit: 09/18/2026'),
            h('Chief Complaint'),
            p('Progressive low back pain with right leg radiculopathy, 8 months duration.'),
            h('History of Present Illness'),
            p('Mr. Doe is a 71-year-old male referred for evaluation of chronic low back pain with radiation into the right lower '
              'extremity. Symptoms have progressively worsened over the past 8 months despite a course of physical therapy and two '
              'epidural steroid injections. MRI lumbar spine dated 08/15/2026 demonstrates Grade 1 spondylolisthesis at L4-L5 with '
              'associated foraminal stenosis and nerve root impingement. Patient reports increasing difficulty with ambulation and '
              'activities of daily living.'),
            h('Past Medical History'),
            p('Congestive heart failure (reduced ejection fraction, last EF 40% per cardiology), Type 2 diabetes mellitus, '
              'hypertension, hyperlipidemia.'),
            h('Assessment'),
            p('Lumbar spondylolisthesis with radiculopathy, refractory to conservative management. Surgical candidate for '
              'decompression and fusion.'),
            h('Plan'),
            p("Recommend open lumbar spinal fusion, L4-L5, with posterior instrumentation. Given patient's cardiac history (reduced "
              'EF) and diabetes, cardiology clearance obtained prior to scheduling — see attached. Surgeon expects a multi-day stay '
              'for pain control and mobilization. Patient counseled on risks, benefits, and alternatives; agrees to proceed.'),
            sig('Electronically signed: Amanda Reyes, MD   |   09/18/2026 4:42 PM'),
            section=('surgical', 'Surgical consultation & spine follow-up'),
            anchors={'procedure': 'Recommend open lumbar spinal fusion, L4-L5, with posterior instrumentation.'},
        ),
        page(
            'Surgical Consultation Note (continued)',
            RIDGELINE_ORTHO,
            h('Review of Systems'),
            p('Constitutional: Denies fever, chills, unintentional weight loss. Cardiovascular: Denies chest pain, orthopnea. Reports '
              'mild exertional dyspnea, stable. Endocrine: Diabetes controlled on oral agents, last A1c 7.1%. Musculoskeletal: As above.'),
            h('Physical Examination'),
            p('Vitals: BP 138/82, HR 76, RR 16, SpO2 97% RA. Lumbar spine with decreased range of motion, positive straight leg '
              'raise on right. Motor strength 4/5 right EHL. Sensation diminished right L5 dermatome. Reflexes 1+ bilateral patellar, '
              'absent right Achilles.'),
            h('Imaging Reviewed'),
            p('MRI Lumbar Spine (08/15/2026): Grade 1 anterolisthesis L4 on L5, severe bilateral foraminal stenosis, moderate central '
              'canal stenosis. Flexion-extension radiographs (09/02/2026): 4 mm of translation at L4-L5, consistent with dynamic '
              'instability.'),
            h('Conservative Treatment History'),
            table(
                ['Treatment', 'Dates', 'Response'],
                ['Physical therapy, 24 visits', '05/04/2026 – 07/24/2026', 'Minimal functional improvement'],
                ['Epidural steroid injection #1', '06/10/2026', '~40% relief for 2 weeks'],
                ['Epidural steroid injection #2', '07/22/2026', '<20% relief for ~10 days'],
                ['Gabapentin, acetaminophen', '03/2026 – present', 'Partial, limited by sedation'],
                widths=[180, 140, 184],
            ),
        ),
        page(
            'Surgical Consultation Note (continued)',
            RIDGELINE_ORTHO,
            h('Surgical Discussion'),
            p('Given dynamic instability at L4-L5 with severe foraminal stenosis and a progressive motor deficit, decompression alone '
              'carries a meaningful risk of worsening instability. Instrumented posterior fusion with decompression is recommended.'),
            h('Risks Discussed'),
            p('Infection, bleeding, dural tear, nerve injury, nonunion, adjacent segment disease, blood clots, and cardiac and '
              'anesthetic risk related to heart failure. Patient verbalized understanding.'),
            h('Alternatives Discussed'),
            p('Continued non-operative care, additional injections, and decompression without fusion. Patient declines further '
              'non-operative management.'),
            h('Pre-Operative Requirements'),
            ol('Cardiology pre-operative clearance.', 'Anesthesia pre-admission evaluation.',
               'Endocrinology review of peri-operative diabetes management.', 'Pre-admission laboratory testing.'),
            sig('Electronically signed: Amanda Reyes, MD   |   09/18/2026 4:42 PM'),
        ),
        page(
            'Spine Clinic — New Patient Visit',
            RIDGELINE_ORTHO,
            p(f'{PATIENT} | Date of Visit: 04/02/2026'),
            h('History'),
            p('Referred by Dr. Tran for right leg pain and grade 1 spondylolisthesis on radiographs. Began physical therapy this month.'),
            h('Examination'),
            p('Positive straight leg raise on right. EHL 4+/5 right. Reflexes symmetric at this visit.'),
            h('Assessment / Plan'),
            p('Right L5 radiculopathy with degenerative spondylolisthesis. Recommend completing a full 12-week course of physical '
              'therapy and considering epidural steroid injection. Return after PT, or sooner if weakness progresses.'),
            sig('Electronically signed: Amanda Reyes, MD   |   04/02/2026'),
        ),
        page(
            'Spine Clinic — Follow-up Visit',
            RIDGELINE_ORTHO,
            p(f'{PATIENT} | Date of Visit: 08/06/2026'),
            h('Interval History'),
            p('Completed 12 weeks of PT and two epidural steroid injections without durable relief. Now walking with a cane.'),
            h('Examination'),
            p('EHL strength decreased to 4/5 right. Right Achilles reflex now absent. Sensory loss over right L5 dermatome.'),
            h('Assessment / Plan'),
            p('Progressive motor deficit despite conservative care. MRI lumbar spine and flexion-extension radiographs ordered. '
              'EMG/NCS of the right lower extremity ordered. Surgical consultation to follow.'),
            sig('Electronically signed: Amanda Reyes, MD   |   08/06/2026'),
        ),
    ]


def imaging_records():
    return [
        page(
            'Radiology Report — Lumbar Spine Radiographs',
            IMAGING,
            p(f'{PATIENT} | Exam Date: 02/20/2026 | Ordering: Michael Tran, MD'),
            h('Exam'), p('XR lumbar spine, AP and lateral, 2 views.'),
            h('Findings'),
            p('Grade 1 anterolisthesis of L4 on L5. Moderate disc space narrowing at L4-L5 and L5-S1 with endplate sclerosis. '
              'Facet arthropathy at L4-L5. No acute fracture. Vascular calcification of the abdominal aorta.'),
            h('Impression'),
            p('Degenerative grade 1 spondylolisthesis at L4-L5 with multilevel degenerative disc disease.'),
            sig('Electronically signed: Grace Whitfield, MD (Radiology)   |   02/20/2026'),
            section=('imaging', 'Imaging & electrodiagnostic studies'),
        ),
        page(
            'Radiology Report — MRI Lumbar Spine without Contrast',
            IMAGING,
            p(f'{PATIENT} | Exam Date: 08/15/2026 | Ordering: Amanda Reyes, MD'),
            h('Clinical History'), p('Right L5 radiculopathy, failed conservative management.'),
            h('Technique'), p('Multiplanar, multisequence MRI of the lumbar spine without intravenous contrast.'),
            h('Findings'),
            p('L3-L4: Mild disc bulge. No significant stenosis.'),
            p('L4-L5: Grade 1 anterolisthesis. Disc uncovering with broad-based bulge. Severe facet hypertrophy with ligamentum '
              'flavum thickening. Moderate central canal stenosis. Severe bilateral foraminal stenosis with impingement of the '
              'exiting right L4 and traversing right L5 nerve roots.'),
            p('L5-S1: Mild disc desiccation. Mild left foraminal narrowing.'),
            p('Conus terminates normally at L1. No marrow signal abnormality.'),
        ),
        page(
            'Radiology Report — MRI Lumbar Spine (continued)',
            IMAGING,
            h('Impression'),
            ol('Grade 1 anterolisthesis of L4 on L5 with severe bilateral foraminal stenosis.',
               'Moderate central canal stenosis at L4-L5.',
               'Findings correlate with the clinical right L5 radiculopathy.'),
            sig('Electronically signed: Grace Whitfield, MD (Radiology)   |   08/15/2026'),
            anchors={'mri': 'Grade 1 anterolisthesis of L4 on L5 with severe bilateral foraminal stenosis.'},
        ),
        page(
            'Radiology Report — Lumbar Flexion-Extension Radiographs',
            IMAGING,
            p(f'{PATIENT} | Exam Date: 09/02/2026 | Ordering: Amanda Reyes, MD'),
            h('Findings'),
            p('Neutral: Grade 1 anterolisthesis of L4 on L5 measuring 6 mm. Flexion: slip increases to 10 mm. Extension: slip '
              'reduces to 6 mm. Total translation of 4 mm at L4-L5.'),
            h('Impression'),
            p('Dynamic instability at L4-L5.'),
            sig('Electronically signed: Grace Whitfield, MD (Radiology)   |   09/02/2026'),
        ),
        page(
            'EMG / Nerve Conduction Study Report',
            NEURO,
            p(f'{PATIENT} | Study Date: 08/27/2026 | Referring: Amanda Reyes, MD'),
            h('Nerve Conduction Studies'),
            table(
                ['Nerve', 'Latency', 'Amplitude', 'Velocity'],
                ['R peroneal motor', '5.8 ms', '1.9 mV (low)', '41 m/s'],
                ['R tibial motor', '5.1 ms', '6.2 mV', '43 m/s'],
                ['R superficial peroneal sensory', '3.9 ms', '7 uV', '44 m/s'],
                ['R sural sensory', '4.0 ms', '8 uV', '42 m/s'],
                widths=[180, 100, 120, 104],
            ),
            h('Needle EMG'),
            p('Fibrillation potentials and positive sharp waves in the right tibialis anterior, extensor hallucis longus, and L5 '
              'paraspinals. Chronic reinnervation changes in the same muscles.'),
            h('Interpretation'),
            p('Findings consistent with chronic right L5 radiculopathy with ongoing denervation. No evidence of peripheral neuropathy.'),
            sig('Electronically signed: Samuel Okafor, MD (Neurology)   |   08/27/2026'),
            anchors={'emg': 'Findings consistent with chronic right L5 radiculopathy with ongoing denervation.'},
        ),
    ]


def pt_records():
    pages = [
        page(
            'Physical Therapy Initial Evaluation',
            SUMMIT_PT,
            p(f'{PATIENT} | Date: 05/04/2026 | Referring: Michael Tran, MD'),
            h('Subjective'),
            p('Low back pain with right leg radiation for 3 months. Pain 7/10 at worst. Walking tolerance two blocks. Difficulty with '
              'prolonged standing, stairs, and yard work.'),
            h('Objective'),
            p('Lumbar flexion limited to 50% with reproduction of leg pain. Positive right straight leg raise. Hip abductor strength '
              '4/5 bilaterally. Oswestry Disability Index (ODI): 52%.'),
            h('Assessment'),
            p('Signs and symptoms consistent with lumbar radiculopathy with movement impairment. Good rehab potential for symptom '
              'management.'),
            h('Plan'),
            p('Twice weekly for 12 weeks: neural mobilization, core stabilization, gait training, and home exercise program.'),
            sig('Electronically signed: Rachel Kim, PT, DPT   |   05/04/2026'),
            section=('pt', 'Physical therapy records'),
        ),
        page(
            'Physical Therapy Initial Evaluation (continued)',
            SUMMIT_PT,
            h('Goals (12 weeks)'),
            ol('Reduce worst pain to 3/10 or less.', 'Improve walking tolerance to 30 minutes.',
               'Reduce ODI to below 30%.', 'Independent with home exercise program.'),
            h('Precautions'),
            p('Heart failure: monitor for dyspnea and edema; stop exercise if SpO2 drops below 90% or symptoms worsen. Diabetes: '
              'confirm glucose above 100 mg/dL before session.'),
            h('Plan of Care Certification'),
            p('Plan of care reviewed and certified by referring physician.'),
            sig('Certified: Michael Tran, MD   |   05/06/2026'),
        ),
    ]
    # 24 visits, twice weekly, 05/05 – 07/24/2026. Pain and ODI barely move.
    dates = ['05/05', '05/08', '05/12', '05/15', '05/19', '05/22', '05/26', '05/29', '06/02', '06/05', '06/09', '06/12',
             '06/16', '06/19', '06/23', '06/26', '06/30', '07/03', '07/07', '07/10', '07/14', '07/17', '07/21', '07/24']
    pain = [7, 7, 7, 6, 7, 6, 6, 7, 6, 6, 6, 5, 5, 5, 6, 6, 6, 6, 6, 7, 6, 6, 6, 6]
    walk = [8, 8, 10, 10, 10, 12, 12, 10, 12, 12, 12, 15, 15, 15, 12, 12, 12, 12, 12, 10, 12, 12, 12, 12]
    focus = [
        'Neural mobilization (sciatic slider), supine core activation, gait assessment.',
        'Core stabilization, hip abductor strengthening, home exercise review.',
        'Aquatic-style walking program progression, lumbar flexion bias exercises.',
        'Stationary cycling 10 minutes, bridges, neural mobilization.',
        'Balance training, sit-to-stand practice, postural education.',
        'Core progression, step-ups 4-inch step, walking program.',
    ]
    response = [
        'Leg pain eased during session; returned within an hour.',
        'Tolerated session; reports soreness the following day.',
        'Unable to progress walking distance due to right leg pain.',
        'Mild improvement in morning stiffness; leg pain unchanged.',
        'Symptoms unchanged. Patient frustrated with lack of progress.',
        'Increased numbness in right foot after prolonged standing.',
    ]
    for i, d in enumerate(dates):
        n = i + 1
        extra = []
        if d == '06/12':
            extra = [p('Note: Patient received epidural steroid injection on 06/10/2026; reports improved leg pain this week.')]
        if d == '07/24':
            extra = [p('Final visit of plan of care. See discharge summary.')]
        pages.append(page(
            'Physical Therapy Daily Note',
            SUMMIT_PT,
            p(f'{PATIENT} | Visit {n} of 24 | Date: {d}/2026'),
            h('Subjective'),
            p(f'Worst pain {pain[i]}/10 over the past several days. Walking tolerance about {walk[i]} minutes before leg pain forces rest.'),
            h('Treatment'),
            p(focus[i % len(focus)]),
            h('Response'),
            p(response[i % len(response)]),
            *extra,
            h('Plan'),
            p('Continue plan of care. Next visit as scheduled.'),
            sig(f'Rachel Kim, PT, DPT   |   {d}/2026'),
        ))
    pages.append(page(
        'Physical Therapy Progress Note — Week 6',
        SUMMIT_PT,
        p(f'{PATIENT} | Date: 06/12/2026'),
        h('Progress Toward Goals'),
        table(
            ['Goal', 'Baseline', 'Current', 'Status'],
            ['Worst pain', '7/10', '5/10', 'Partially met'],
            ['Walking tolerance', '8 min', '15 min', 'Not met'],
            ['ODI', '52%', '48%', 'Not met'],
            ['Home program', 'Not started', 'Independent', 'Met'],
            widths=[150, 110, 110, 134],
        ),
        h('Assessment'),
        p('Limited improvement. Temporary benefit after the epidural injection this week. Recommend continuing plan of care.'),
        sig('Rachel Kim, PT, DPT   |   06/12/2026'),
    ))
    pages.append(page(
        'Physical Therapy Discharge Summary',
        SUMMIT_PT,
        p(f'{PATIENT} | Date: 07/24/2026'),
        h('Summary'),
        p('Patient completed 24 visits over 12 weeks with minimal functional improvement. Gains from the first injection were not '
          'sustained.'),
        h('Outcome Measures'),
        table(
            ['Measure', 'Initial (05/04)', 'Discharge (07/24)'],
            ['Worst pain (NPRS)', '7/10', '6/10'],
            ['Walking tolerance', '8 minutes', '12 minutes'],
            ['Oswestry Disability Index', '52%', '50%'],
            widths=[200, 150, 154],
        ),
        h('Recommendation'),
        p('Plateau in conservative management. Recommend follow-up with spine surgery. Continue home exercise program.'),
        sig('Rachel Kim, PT, DPT   |   07/24/2026'),
        anchors={'pt': 'Patient completed 24 visits over 12 weeks with minimal functional improvement.'},
    ))
    return pages


def pain_records():
    def esi(n, date, level_note, meds):
        return page(
            f'Procedure Note — Epidural Steroid Injection #{n}',
            PAIN,
            p(f'{PATIENT} | Date of Procedure: {date} | Physician: Kevin Osei, MD'),
            h('Procedure'), p('Right L4-L5 transforaminal epidural steroid injection under fluoroscopic guidance.'),
            h('Indication'), p('Right L5 radiculopathy refractory to physical therapy and oral medications.'),
            h('Description'),
            p(f'Informed consent obtained. Patient positioned prone. {level_note} Contrast confirmed epidural spread without vascular '
              f'uptake. Injected {meds}. No complications. Patient tolerated the procedure well.'),
            h('Peri-Procedure Notes'),
            p('Aspirin continued. Fingerstick glucose 148 mg/dL pre-procedure; patient advised steroid may raise glucose for 2-3 days.'),
            h('Pre / Post Pain Score'), p('Pre: 7/10. Post (30 min): 3/10.'),
            sig(f'Electronically signed: Kevin Osei, MD   |   {date}'),
        )

    return [
        page(
            'Pain Management Consultation',
            PAIN,
            p(f'{PATIENT} | Date: 06/03/2026 | Referring: Michael Tran, MD'),
            h('History'),
            p('Right L5 radicular pain for 4 months. Six weeks of PT with minimal benefit. Gabapentin limited by daytime sedation. '
              'NSAIDs avoided due to heart failure.'),
            h('Examination'),
            p('Positive right straight leg raise. Diminished sensation over the right dorsal foot. EHL 4+/5 right.'),
            h('Assessment'),
            p('Lumbar radiculopathy secondary to L4-L5 foraminal stenosis.'),
            h('Plan'),
            p('Right L4-L5 transforaminal epidural steroid injection. Glucose monitoring after injection given diabetes. Up to two '
              'injections if partial response.'),
            sig('Electronically signed: Kevin Osei, MD   |   06/03/2026'),
            section=('pain', 'Pain management & injection records'),
        ),
        esi(1, '06/10/2026', 'Needle advanced to the right L4-L5 foramen.', 'triamcinolone 40 mg with 1 mL 0.25% bupivacaine'),
        page(
            'Post-Procedure Follow-up',
            PAIN,
            p(f'{PATIENT} | Date: 06/24/2026'),
            h('Response'),
            p('Approximately 40% relief of leg pain lasting about two weeks, now returning. Glucose peaked at 240 mg/dL for two days '
              'post-injection, then normalized.'),
            h('Plan'),
            p('Repeat injection in 4-6 weeks if pain returns to baseline.'),
            sig('Electronically signed: Kevin Osei, MD   |   06/24/2026'),
        ),
        esi(2, '07/22/2026', 'Needle advanced to the right L4-L5 foramen; repeat approach.', 'triamcinolone 40 mg with 1 mL 0.25% bupivacaine'),
        page(
            'Post-Procedure Follow-up',
            PAIN,
            p(f'{PATIENT} | Date: 08/05/2026'),
            h('Response'),
            p('Patient reports less than 20% relief lasting approximately 10 days following the second injection.'),
            h('Assessment'),
            p('Diminishing response to injection therapy. Further injections are unlikely to provide durable benefit.'),
            h('Plan'),
            p('Return to spine surgery for operative evaluation. No further injections planned.'),
            sig('Electronically signed: Kevin Osei, MD   |   08/05/2026'),
            anchors={'esi': 'Patient reports less than 20% relief lasting approximately 10 days following the second injection.'},
        ),
    ]


def hp_records():
    return [
        page(
            'History & Physical',
            RIDGELINE_PAT,
            p('Patient: John Doe | MRN: 774213 | Date: 09/22/2026'),
            h('Reason for Admission'),
            p('Pre-operative history and physical for scheduled open lumbar spinal fusion, L4-L5.'),
            h('Past Medical History'),
            ol('Congestive heart failure, HFrEF, EF 40% (echo 07/2026)', 'Type 2 diabetes mellitus, on metformin and glipizide',
               'Hypertension, controlled on lisinopril', 'Hyperlipidemia, on atorvastatin', 'GERD'),
            h('Past Surgical History'),
            p('Cholecystectomy (2011), right total knee arthroplasty (2019).'),
            h('Medications'),
            p('Metformin 1000mg BID, Glipizide 5mg daily, Lisinopril 20mg daily, Atorvastatin 40mg daily, Furosemide 20mg daily, '
              'Aspirin 81mg daily.'),
            h('Allergies'),
            p('No known drug allergies.'),
            section=('hp', 'History & physical'),
            anchors={
                'comorbidities': 'Congestive heart failure, HFrEF, EF 40% (echo 07/2026)',
                'meds': 'Metformin 1000mg BID, Glipizide 5mg daily',
            },
        ),
        page(
            'History & Physical',
            RIDGELINE_PAT,
            h('Social History'),
            p('Former smoker, quit 2015 (30 pack-year history). Denies alcohol or illicit substance use. Lives with spouse, '
              'independent with ADLs at baseline.'),
            h('Family History'),
            p('Father: coronary artery disease. Mother: type 2 diabetes.'),
            h('Physical Examination'),
            p('General: Well-developed, well-nourished male in no acute distress.'),
            p('Cardiovascular: Regular rate and rhythm, no murmurs. Trace bilateral lower extremity edema.'),
            p('Pulmonary: Clear to auscultation bilaterally, no wheezes or crackles.'),
            p('Abdomen: Soft, non-tender, non-distended.'),
            p('Extremities: No cyanosis or clubbing. Trace edema as noted above.'),
            p('Neurologic: As detailed in surgical consultation note.'),
            h('Functional Status'),
            p('Patient ambulates with a single-point cane due to pain, otherwise independent. Lives in a two-story home; will require '
              'assistance with stairs post-operatively.'),
            anchors={'functional': 'Patient ambulates with a single-point cane due to pain, otherwise independent.'},
        ),
        page(
            'History & Physical',
            RIDGELINE_PAT,
            h('Pre-Admission Testing Summary'),
            p('See attached laboratory results (page {p:labs_pat}) and cardiology clearance (pages {p:clearance_1}-{p:clearance}) '
              'for complete pre-operative risk stratification.'),
            h('Anesthesia Risk Assessment'),
            p('ASA Physical Status Classification: III (severe systemic disease — CHF, diabetes). Anesthesia pre-op evaluation '
              'completed 09/23/2026, cleared for surgery with standard cardiac monitoring intra-operatively.'),
            h('Assessment / Plan'),
            p('71-year-old male with HFrEF (EF 40%) and type 2 diabetes, cleared for open lumbar spinal fusion following cardiology '
              'evaluation. Anticipate inpatient admission for post-operative monitoring given cardiac history; exact anticipated '
              'length of stay to be determined by surgical team based on intra-operative course and post-operative mobilization.'),
            sig('Electronically signed: Daniel Brooks, MD (Hospitalist, Pre-Admission Testing)   |   09/22/2026'),
            anchors={'anesthesia': 'Anesthesia pre-op evaluation completed 09/23/2026, cleared for surgery with standard cardiac '
                                   'monitoring intra-operatively.'},
        ),
    ]


def cardiology_records():
    return [
        page(
            'Heart Failure Clinic Visit',
            HEARTLAND,
            p(f'{PATIENT} | Date: 04/08/2026'),
            h('Interval History'),
            p('NYHA Class II. No hospitalizations since diagnosis in 2022. Weight stable. Adherent to medications and 2 g sodium diet.'),
            h('Examination'),
            p('BP 128/76, HR 68. JVP not elevated. Lungs clear. Trace ankle edema.'),
            h('Assessment / Plan'),
            p('Chronic HFrEF, compensated. Continue lisinopril, furosemide. Discussed transition to sacubitril/valsartan; patient prefers '
              'to defer given cost. Repeat echocardiogram in July.'),
            sig('Electronically signed: Priya Nkemelu, MD, FACC   |   04/08/2026'),
            section=('cardiology', 'Cardiology records & clearance'),
        ),
        page(
            'Transthoracic Echocardiogram Report',
            HEARTLAND,
            p(f'{PATIENT} | Study Date: 07/09/2026'),
            h('Measurements'),
            table(
                ['Parameter', 'Value', 'Normal'],
                ['LVEF (biplane)', '40%', '52-72%'],
                ['LV end-diastolic diameter', '5.9 cm', '4.2-5.8 cm'],
                ['Left atrial volume index', '38 mL/m2', '<34 mL/m2'],
                ['TAPSE', '1.9 cm', '>1.7 cm'],
                ['RVSP', '32 mmHg', '<35 mmHg'],
                widths=[200, 150, 154],
            ),
            h('Findings'),
            p('Mildly dilated left ventricle with moderate global hypokinesis. Mild-moderate mitral regurgitation. No significant '
              'valvular stenosis. Normal right ventricular size and function. No pericardial effusion.'),
        ),
        page(
            'Transthoracic Echocardiogram Report (continued)',
            HEARTLAND,
            h('Impression'),
            ol('Moderately reduced left ventricular systolic function, LVEF 40%, unchanged from 2025.',
               'Mild-moderate mitral regurgitation.', 'Normal right ventricular function.'),
            sig('Electronically signed: Priya Nkemelu, MD, FACC   |   07/09/2026'),
        ),
        page(
            'Cardiology Office Visit',
            HEARTLAND,
            p(f'{PATIENT} | Date: 07/09/2026'),
            h('Interval History'),
            p('Stable exertional dyspnea after two flights of stairs. Back pain limiting activity. No chest pain, syncope, or orthopnea.'),
            h('Assessment / Plan'),
            p('HFrEF, stable, LVEF 40% on today\'s echo. Continue current regimen. Patient may need spine surgery; will see for '
              'pre-operative risk assessment when a date is set.'),
            sig('Electronically signed: Priya Nkemelu, MD, FACC   |   07/09/2026'),
        ),
        page(
            'Cardiology Pre-Operative Clearance',
            HEARTLAND,
            p('Patient: John Doe | DOB: 03/14/1955 | Date: 09/16/2026'),
            h('Reason for Consultation'),
            p('Pre-operative cardiac risk assessment prior to elective lumbar spinal fusion.'),
            h('History'),
            p('Patient with known history of heart failure with reduced ejection fraction, last assessed at 40% on echocardiogram dated '
              '07/09/2026. NYHA Class II symptoms, stable on current guideline-directed medical therapy. No recent decompensation, '
              'hospitalization, or change in symptoms.'),
            h('Diagnostic Studies'),
            p('Echocardiogram (07/09/2026): LVEF 40%, mild-moderate mitral regurgitation, no significant valvular stenosis.'),
            p('EKG (09/16/2026): Normal sinus rhythm, no acute ST-T changes.'),
            p('Stress test: Not indicated given recent echo and stable symptoms.'),
            h('Assessment'),
            p("Revised Cardiac Risk Index: 2 points (heart failure, diabetes). Estimated peri-operative cardiac risk: intermediate. "
              "Patient's heart failure is compensated and stable."),
            anchors={'clearance_1': 'Pre-operative cardiac risk assessment',
                     'nyha': 'NYHA Class II symptoms, stable on current guideline-directed medical therapy'},
        ),
        page(
            'Cardiology Pre-Operative Clearance (continued)',
            HEARTLAND,
            h('Recommendations'),
            ol('Patient is cleared for surgery from a cardiac standpoint.',
               'Continue home cardiac medications through peri-operative period per anesthesia protocol.',
               'Recommend telemetry monitoring for first 24-48 hours post-operatively given HFrEF.',
               'Maintain euvolemia — monitor daily weights and strict intake/output.',
               'Given cardiac history, inpatient monitoring is recommended; anticipate this will support a multi-day admission for '
               'adequate post-operative cardiac and pain management, though exact duration will depend on post-operative course.'),
            p('Clearance Status: CLEARED FOR SURGERY'),
            sig('Electronically signed: Dr. Priya Nkemelu, MD, FACC   |   09/16/2026'),
            anchors={'clearance': 'Patient is cleared for surgery from a cardiac standpoint.'},
        ),
        page(
            '12-Lead Electrocardiogram',
            HEARTLAND,
            p(f'{PATIENT} | Date: 09/16/2026'),
            table(
                ['Measurement', 'Value'],
                ['Rate', '74 bpm'], ['Rhythm', 'Normal sinus rhythm'], ['PR interval', '176 ms'],
                ['QRS duration', '104 ms'], ['QTc', '438 ms'], ['Axis', '-12 degrees'],
                widths=[200, 304],
            ),
            h('Interpretation'),
            p('Normal sinus rhythm. Left ventricular hypertrophy by voltage criteria. No acute ST-T changes. Unchanged from 07/2026.'),
            sig('Read by: Priya Nkemelu, MD, FACC   |   09/16/2026'),
        ),
    ]


def endo_records():
    return [
        page(
            'Endocrinology Consultation — Peri-Operative Diabetes',
            ENDO,
            p(f'{PATIENT} | Date: 09/19/2026'),
            h('History'),
            p('Type 2 diabetes for 12 years on metformin and glipizide. A1c 7.3% (06/2026), 7.1% (09/2026). No hypoglycemia. Glucose '
              'rose to 240 mg/dL after each epidural steroid injection.'),
            h('Assessment'),
            p('Type 2 diabetes, adequately controlled for elective surgery (A1c below 8%). Risk of peri-operative hyperglycemia with '
              'surgical stress.'),
            h('Recommendations'),
            ol('Hold glipizide the morning of surgery.', 'Metformin may be continued per anesthesia protocol; hold if contrast is given.',
               'Sliding scale insulin while NPO and post-operatively; target glucose 140-180 mg/dL.',
               'Resume home regimen when eating reliably.'),
            sig('Electronically signed: Helena Varga, MD (Endocrinology)   |   09/19/2026'),
            section=('endo', 'Endocrinology'),
        ),
        page(
            'Endocrinology Consultation (continued)',
            ENDO,
            h('Glucose Log Reviewed (patient-reported, fasting)'),
            table(
                ['Week of', 'Average', 'Range'],
                ['08/24/2026', '138 mg/dL', '121-156'], ['08/31/2026', '134 mg/dL', '118-149'],
                ['09/07/2026', '141 mg/dL', '126-162'], ['09/14/2026', '136 mg/dL', '119-151'],
                widths=[200, 150, 154],
            ),
            h('Patient Education'),
            p('Reviewed hypoglycemia symptoms, sick-day rules, and the plan to hold glipizide on the morning of surgery.'),
            sig('Electronically signed: Helena Varga, MD (Endocrinology)   |   09/19/2026'),
        ),
    ]


def anesthesia_records():
    return [
        page(
            'Anesthesia Pre-Operative Evaluation',
            RIDGELINE_SC,
            p(f'{PATIENT} | Date: 09/23/2026 | Anesthesiologist: Marcus Lee, MD'),
            h('Planned Procedure'), p('Open lumbar spinal fusion, L4-L5, prone positioning, estimated 4 hours.'),
            h('Airway'), p('Mallampati II. Thyromental distance >6 cm. Full neck range of motion. Dentition intact.'),
            h('Cardiopulmonary'),
            p('HFrEF, EF 40%, NYHA II, compensated. Former smoker, lungs clear. STOP-BANG score 4 (intermediate risk for sleep apnea).'),
            h('ASA Classification'), p('ASA III.'),
            section=('anesthesia', 'Anesthesia pre-operative evaluation'),
        ),
        page(
            'Anesthesia Pre-Operative Evaluation (continued)',
            RIDGELINE_SC,
            h('Anesthetic Plan'),
            p('General endotracheal anesthesia. Arterial line for continuous blood pressure monitoring. Goal-directed fluid therapy given '
              'reduced EF. Multimodal analgesia with acetaminophen and regional infiltration; limit opioids.'),
            h('Post-Operative Considerations'),
            p('Telemetry per cardiology. Continuous pulse oximetry given intermediate sleep apnea risk and opioid exposure.'),
            h('Clearance'),
            p('Cleared for surgery with standard cardiac monitoring intra-operatively.'),
            sig('Electronically signed: Marcus Lee, MD (Anesthesiology)   |   09/23/2026'),
        ),
    ]


def lab_records():
    def lab_page(title, collected, rows, interpretation=None, anchors=None, section=None):
        blocks = [p(f'Collected: {collected}'), table(['Test', 'Result', 'Reference Range', 'Flag'], *rows, widths=[170, 110, 140, 84])]
        if interpretation:
            blocks += [h('Interpretation'), p(interpretation)]
        return page(title, RIDGELINE_PAT, *blocks, anchors=anchors, section=section)

    return [
        lab_page(
            'Laboratory Results',
            '09/23/2026',
            [['WBC', '6.8 K/uL', '4.5-11.0', ''], ['Hemoglobin', '13.2 g/dL', '13.5-17.5', 'L'],
             ['Platelets', '245 K/uL', '150-400', ''], ['Sodium', '138 mEq/L', '136-145', ''],
             ['Potassium', '4.4 mEq/L', '3.5-5.1', ''], ['Creatinine', '1.1 mg/dL', '0.7-1.3', ''],
             ['Glucose', '142 mg/dL', '70-99', 'H'], ['Hemoglobin A1c', '7.1 %', '<5.7', 'H'],
             ['INR', '1.0', '0.8-1.1', ''], ['BNP', '210 pg/mL', '<100', 'H']],
            'Mild anemia, consistent with chronic disease. Hyperglycemia and elevated A1c consistent with known type 2 diabetes, '
            'adequate for surgical clearance per anesthesia. BNP mildly elevated, consistent with known compensated heart failure — '
            'no acute change from prior baseline.',
            anchors={'labs_pat': 'Laboratory Results', 'labs': 'Mild anemia, consistent with chronic disease.'},
            section=('labs', 'Laboratory results'),
        ),
        lab_page(
            'Laboratory Results — Comprehensive Metabolic Panel',
            '09/23/2026',
            [['BUN', '19 mg/dL', '7-20', ''], ['Chloride', '102 mEq/L', '98-107', ''], ['CO2', '26 mEq/L', '22-29', ''],
             ['Calcium', '9.3 mg/dL', '8.6-10.3', ''], ['Albumin', '3.9 g/dL', '3.5-5.0', ''], ['AST', '24 U/L', '10-40', ''],
             ['ALT', '21 U/L', '7-56', ''], ['Alk Phos', '88 U/L', '44-147', ''], ['Total bilirubin', '0.7 mg/dL', '0.1-1.2', ''],
             ['eGFR', '68 mL/min/1.73m2', '>60', '']],
        ),
        lab_page(
            'Laboratory Results — Coagulation, Type & Screen, Urinalysis',
            '09/23/2026',
            [['PT', '11.8 sec', '11.0-13.5', ''], ['PTT', '29 sec', '25-35', ''], ['ABO/Rh', 'O positive', '', ''],
             ['Antibody screen', 'Negative', 'Negative', ''], ['UA leukocyte esterase', 'Negative', 'Negative', ''],
             ['UA nitrite', 'Negative', 'Negative', ''], ['UA glucose', 'Trace', 'Negative', 'A'], ['MRSA nares screen', 'Negative', 'Negative', '']],
            'No evidence of urinary tract infection. MRSA screen negative. Type and screen valid for 72 hours.',
        ),
        lab_page(
            'Laboratory Results — Prior (Primary Care)',
            '06/02/2026',
            [['Hemoglobin', '13.4 g/dL', '13.5-17.5', 'L'], ['Creatinine', '1.0 mg/dL', '0.7-1.3', ''],
             ['Potassium', '4.3 mEq/L', '3.5-5.1', ''], ['Hemoglobin A1c', '7.3 %', '<5.7', 'H'],
             ['LDL cholesterol', '78 mg/dL', '<100', ''], ['TSH', '2.1 mIU/L', '0.4-4.0', ''], ['BNP', '195 pg/mL', '<100', 'H']],
            'Stable chronic anemia and BNP compared with 2025. Diabetes control near goal.',
        ),
    ]


def med_rec():
    return [
        page(
            'Medication Reconciliation',
            RIDGELINE_PAT,
            p(f'{PATIENT} | Reconciled: 09/22/2026 by Jenna Park, RN'),
            table(
                ['Medication', 'Dose / Frequency', 'Indication', 'Day of Surgery'],
                ['Metformin', '1000 mg BID', 'Diabetes', 'Take with sip of water'],
                ['Glipizide', '5 mg daily', 'Diabetes', 'HOLD'],
                ['Lisinopril', '20 mg daily', 'HF / hypertension', 'Take with sip of water'],
                ['Atorvastatin', '40 mg daily', 'Hyperlipidemia', 'Take with sip of water'],
                ['Furosemide', '20 mg daily', 'Heart failure', 'Per anesthesia'],
                ['Aspirin', '81 mg daily', 'Cardiac', 'Continue per cardiology'],
                ['Gabapentin', '300 mg at bedtime', 'Radicular pain', 'Take night before'],
                ['Acetaminophen', '1 g TID PRN', 'Pain', 'May take'],
                widths=[100, 120, 120, 164],
            ),
            note('Patient reports no herbal supplements. Last dose times to be confirmed at check-in.'),
            section=('meds', 'Medication reconciliation'),
        ),
    ]


def orders():
    return [
        page(
            'Pre-Operative Orders',
            RIDGELINE_SC,
            kv(
                ('Procedure:', 'Open lumbar spinal fusion, L4-L5'),
                ('Scheduled Date:', '10/02/2026'),
                ('Admission Type:', 'Inpatient'),
                ('Attending Surgeon:', 'Amanda Reyes, MD'),
            ),
            h('Pre-Operative Instructions'),
            ol('NPO after midnight prior to surgery.',
               'Continue metformin, lisinopril, atorvastatin morning of surgery with sip of water.',
               'Hold glipizide morning of surgery.',
               'Type and screen, CBC, BMP, coagulation panel day of surgery.',
               'Cardiology clearance on file — see attached.',
               'Anesthesia pre-op evaluation on file — see H&P.',
               'Sequential compression devices intra-operatively for DVT prophylaxis.'),
            section=('orders', 'Pre-operative orders & post-operative plan'),
        ),
        page(
            'Pre-Operative Orders (continued)',
            RIDGELINE_SC,
            h('Post-Operative Plan (Anticipated)'),
            p('Patient anticipated to require inpatient admission post-operatively for pain control, mobilization, and cardiac '
              'monitoring given history of heart failure. Physical therapy consult day of surgery. Telemetry monitoring per cardiology '
              'recommendation. Diabetic management per sliding scale insulin protocol while NPO/post-operative. Discharge planning '
              'to begin day 1 post-operatively; anticipated discharge disposition to be determined based on mobility and pain control '
              'status.'),
            h('DVT Prophylaxis'),
            p('Sequential compression devices + subcutaneous heparin per protocol, starting post-operative day 0.'),
            anchors={
                'los': 'Patient anticipated to require inpatient admission post-operatively for pain control, mobilization, and '
                       'cardiac monitoring',
                'dvt': 'Sequential compression devices + subcutaneous heparin per protocol, starting post-operative day 0.',
            },
        ),
    ]


def consents():
    return [
        page(
            'Informed Consent for Surgery',
            RIDGELINE_SC,
            p(f'{PATIENT}'),
            p('I consent to the following procedure: open lumbar spinal fusion, L4-L5, with posterior instrumentation and '
              'decompression, to be performed by Amanda Reyes, MD, and assistants.'),
            p('The nature of the procedure, its expected benefits, material risks (including infection, bleeding, nerve injury, '
              'spinal fluid leak, failure of fusion, blood clots, heart complications, and death), and alternatives have been '
              'explained to me. I have had the opportunity to ask questions.'),
            p('I consent to the administration of blood products if necessary.'),
            sig('Patient signature: John Doe   |   Witness: Jenna Park, RN   |   09/22/2026'),
            section=('consents', 'Consents, education & nursing assessment'),
        ),
        page(
            'Consent for Anesthesia',
            RIDGELINE_SC,
            p(f'{PATIENT}'),
            p('I consent to general anesthesia and invasive monitoring as described by my anesthesiologist. Risks including sore '
              'throat, dental injury, nausea, awareness, allergic reaction, heart and lung complications have been explained.'),
            sig('Patient signature: John Doe   |   Anesthesiologist: Marcus Lee, MD   |   09/23/2026'),
        ),
        page(
            'Patient Education — Preparing for Spine Surgery',
            RIDGELINE_SC,
            p(f'{PATIENT} | Education completed: 09/22/2026'),
            h('Topics Reviewed'),
            li('Nothing to eat or drink after midnight the night before surgery.',
               'Which morning medications to take with a sip of water, and to hold glipizide.',
               'Shower with chlorhexidine soap the night before and morning of surgery.',
               'Arrange a responsible adult to drive you home and stay with you after discharge.',
               'Prepare your home: clear walkways, place frequently used items at waist height, and plan for help with stairs.',
               'Bring your cane, medication list, and insurance card on the day of surgery.'),
            h('Teach-Back'),
            p('Patient and spouse verbalized understanding of all instructions.'),
            sig('Jenna Park, RN   |   09/22/2026'),
        ),
        page(
            'Nursing Pre-Admission Assessment',
            RIDGELINE_PAT,
            p(f'{PATIENT} | Date: 09/22/2026'),
            kv(
                ('Height / Weight:', '5 ft 11 in / 208 lb (BMI 29.0)'),
                ('Fall Risk:', 'Moderate — uses cane, radicular weakness'),
                ('Skin:', 'Intact'),
                ('Pain:', '6/10, right leg'),
                ('Support at Home:', 'Spouse; adult daughter nearby'),
                ('Advance Directive:', 'Yes — copy on file'),
            ),
            h('Discharge Planning Screen'),
            p('Lives in a two-story home with bedroom upstairs. Spouse able to assist. Anticipate walker and raised toilet seat at '
              'discharge. Physical therapy to assess for home versus short-term rehabilitation.'),
            sig('Jenna Park, RN   |   09/22/2026'),
        ),
    ]


def attestation():
    return [
        page(
            'Provider Attestation & Certification of Medical Necessity',
            RIDGELINE_ORTHO,
            p('I certify that the information provided in this prior authorization request, and the attached clinical documentation, '
              'is accurate and reflects the current medical condition of the patient named herein. I attest that the requested '
              'inpatient admission for open lumbar spinal fusion (L4-L5) is medically necessary based on the patient\'s clinical '
              'presentation, failed conservative management, and comorbid conditions requiring inpatient-level post-operative '
              'monitoring.'),
            kv(
                ('Provider Signature:', 'Amanda Reyes, MD'),
                ('Date:', '09/24/2026'),
                ('NPI:', '1780234561'),
            ),
            p('— End of transmission ({total} pages) —'),
            section=('attestation', 'Provider attestation'),
            anchors={'attestation': 'the requested inpatient admission for open lumbar spinal fusion (L4-L5) is medically necessary'},
        ),
    ]


def insurance_card():
    return page(
        'Copy of Member Insurance Card',
        'Concord Health Plans',
        kv(
            ('Plan:', 'Concord Gold Plus HMO (Medicare Advantage)'),
            ('Member:', 'JOHN DOE'),
            ('Member ID:', 'MBR-0042'),
            ('Group:', 'GRP-88214'),
            ('PCP:', 'Michael Tran, MD  (614) 555-0110'),
            ('Copays:', 'PCP $0  |  Specialist $35  |  ER $90  |  Inpatient $350/admission'),
            ('Rx BIN / PCN:', '610014 / CONMA'),
            ('Member Services:', '1-800-555-0150 (TTY 711)'),
            ('Prior Authorization:', 'Fax 1-800-555-0177  |  Provider portal'),
        ),
        note('Card front and back copied by Ridgeline Surgical Center Patient Access, 09/20/2026.'),
    )


def pcp_extra():
    return [
        page(
            'Problem List & Health Maintenance',
            LAKEVIEW,
            p(f'{PATIENT} | Printed: 08/25/2026'),
            h('Active Problems'),
            table(
                ['Problem', 'ICD-10', 'Onset'],
                ['Chronic systolic heart failure', 'I50.22', '2022'], ['Type 2 diabetes mellitus', 'E11.9', '2014'],
                ['Essential hypertension', 'I10', '2010'], ['Hyperlipidemia', 'E78.5', '2010'],
                ['Gastroesophageal reflux disease', 'K21.9', '2016'], ['Lumbar radiculopathy', 'M54.16', '2026'],
                ['Spondylolisthesis, lumbar region', 'M43.16', '2026'],
                widths=[260, 120, 124],
            ),
            h('Immunizations'),
            p('Influenza 10/2025. Pneumococcal (PCV20) 2023. COVID-19 booster 09/2025. Tdap 2019. Shingles series complete 2021.'),
            h('Screening'),
            p('Colonoscopy 2021, normal, repeat 2031. Diabetic eye exam 03/2026, no retinopathy. Diabetic foot exam 03/2026, '
              'diminished monofilament sensation right great toe.'),
        ),
        page(
            'Annual Wellness Visit',
            LAKEVIEW,
            p(f'{PATIENT} | Date of Visit: 01/15/2026'),
            h('Summary'),
            p('Annual wellness visit. Reports intermittent low back stiffness for several weeks, no leg symptoms at that time. '
              'Independent with all activities of daily living. Walks 20 minutes daily.'),
            h('Functional and Safety Screen'),
            p('No falls in the past year. Lives with spouse in a two-story home. Hearing and vision adequate with glasses. '
              'Depression screen (PHQ-2) negative.'),
            h('Plan'),
            ol('Continue current medications.', 'Back stiffness: stretching program; return if worse or if leg symptoms develop.',
               'Annual labs due in June.'),
            sig('Electronically signed: Michael Tran, MD   |   01/15/2026'),
        ),
        page(
            'Office Visit Note — Pre-Operative Medical Evaluation',
            LAKEVIEW,
            p(f'{PATIENT} | Date of Visit: 09/15/2026'),
            h('Reason for Visit'), p('Medical optimization before planned lumbar fusion on 10/02/2026.'),
            h('Assessment'),
            p('Medically optimized from a primary care standpoint pending cardiology and anesthesia evaluation. Blood pressure at goal. '
              'Diabetes control acceptable for elective surgery.'),
            h('Plan'),
            ol('Cardiology appointment 09/16/2026 for clearance.', 'Pre-admission testing at Ridgeline on 09/22/2026.',
               'Arranged for spouse and daughter to assist at home after discharge.'),
            sig('Electronically signed: Michael Tran, MD   |   09/15/2026'),
        ),
    ]


def surgical_extra():
    return [
        page(
            'Spine Clinic — Follow-up Visit',
            RIDGELINE_ORTHO,
            p(f'{PATIENT} | Date of Visit: 06/18/2026'),
            h('Interval History'),
            p('Six weeks into physical therapy. First injection last week with partial relief so far.'),
            h('Examination'),
            p('EHL 4+/5 right, unchanged. Right Achilles reflex diminished.'),
            h('Plan'),
            p('Complete physical therapy and reassess after the injection series.'),
            sig('Electronically signed: Amanda Reyes, MD   |   06/18/2026'),
        ),
        page(
            'Patient-Reported Outcome Measures',
            RIDGELINE_ORTHO,
            p(f'{PATIENT} | Collected: 09/18/2026'),
            table(
                ['Measure', '04/02/2026', '09/18/2026', 'Interpretation'],
                ['Oswestry Disability Index', '46%', '56%', 'Severe disability'],
                ['Back pain (NPRS)', '5/10', '6/10', 'Worsened'],
                ['Leg pain (NPRS)', '6/10', '8/10', 'Worsened'],
                ['PROMIS physical function', '38', '32', 'Below population mean'],
                widths=[160, 100, 100, 144],
            ),
            p('Scores worsened despite twelve weeks of physical therapy and two injections.'),
        ),
        page(
            'Surgical Scheduling Request',
            RIDGELINE_ORTHO,
            kv(
                ('Patient:', 'John Doe, DOB 03/14/1955'),
                ('Surgeon:', 'Amanda Reyes, MD'),
                ('Procedure:', 'Open lumbar spinal fusion, L4-L5, posterior instrumentation (CPT 22612, 22840, 63047)'),
                ('Facility:', 'Ridgeline Surgical Center'),
                ('Requested Date:', '10/02/2026, first case'),
                ('Estimated Duration:', '4 hours'),
                ('Admission:', 'Inpatient, telemetry bed'),
                ('Equipment:', 'Pedicle screw system, neuromonitoring, cell saver'),
                ('Prior Auth Status:', 'Pending — submitted 09/24/2026'),
            ),
            sig('Linda Morales, Surgical Scheduler   |   09/19/2026'),
        ),
    ]


def imaging_extra():
    return [
        page(
            'Radiology Report — Chest Radiograph (Pre-Operative)',
            IMAGING,
            p(f'{PATIENT} | Exam Date: 09/22/2026'),
            h('Findings'),
            p('Mild cardiomegaly, unchanged. No pulmonary edema. No focal consolidation or effusion. Degenerative changes of the '
              'thoracic spine.'),
            h('Impression'),
            p('Stable mild cardiomegaly. No acute cardiopulmonary process.'),
            sig('Electronically signed: Grace Whitfield, MD (Radiology)   |   09/22/2026'),
        ),
        page(
            'Fluoroscopy Report — Spinal Injection Guidance',
            IMAGING,
            p(f'{PATIENT} | Dates: 06/10/2026 and 07/22/2026'),
            h('Findings'),
            p('Fluoroscopic guidance for right L4-L5 transforaminal epidural injections. Contrast outlines the right L5 nerve root '
              'with epidural spread on both dates. Fluoroscopy time 38 seconds and 41 seconds.'),
            sig('Electronically signed: Grace Whitfield, MD (Radiology)   |   07/22/2026'),
        ),
    ]


def pt_extra():
    return [
        page(
            'Home Exercise Program',
            SUMMIT_PT,
            p(f'{PATIENT} | Issued: 05/04/2026, updated 06/12/2026'),
            table(
                ['Exercise', 'Sets / Reps', 'Frequency'],
                ['Sciatic nerve slider, supine', '2 x 10', 'Twice daily'],
                ['Abdominal bracing', '10 x 10-second holds', 'Twice daily'],
                ['Bridges', '2 x 10', 'Daily'],
                ['Side-lying hip abduction', '2 x 10 each side', 'Daily'],
                ['Walking program', 'Start 8 minutes, add 2 minutes weekly', 'Daily'],
                widths=[200, 180, 124],
            ),
            note('Stop any exercise that increases leg numbness or weakness, and contact your therapist.'),
        ),
        page(
            'Physical Therapy Attendance Log',
            SUMMIT_PT,
            p(f'{PATIENT} | Plan of care: 05/04/2026 – 07/24/2026'),
            table(
                ['Scheduled', 'Attended', 'Cancelled', 'No-show'],
                ['24', '24', '0', '0'],
                widths=[126, 126, 126, 126],
            ),
            p('Attendance 100%. Patient adherent to home exercise program per self-report and therapist observation.'),
            sig('Front desk verification: Summit Rehab & Physical Therapy   |   07/24/2026'),
        ),
    ]


def pain_extra():
    def consent(date):
        return page(
            'Consent for Epidural Steroid Injection',
            PAIN,
            p(f'{PATIENT} | Date: {date}'),
            p('I consent to a right L4-L5 transforaminal epidural steroid injection under fluoroscopy by Kevin Osei, MD. Risks '
              'explained include infection, bleeding, headache, temporary numbness or weakness, elevated blood sugar, nerve injury, '
              'and lack of benefit.'),
            sig(f'Patient signature: John Doe   |   Witness: T. Ruiz, RN   |   {date}'),
        )

    return [consent('06/10/2026'), consent('07/22/2026')]


def cardiology_extra():
    return [
        page(
            'Heart Failure Clinic Visit',
            HEARTLAND,
            p(f'{PATIENT} | Date: 01/21/2026'),
            h('Interval History'),
            p('Doing well. NYHA Class II. Home weights stable at 210-212 lb.'),
            h('Plan'),
            p('Continue lisinopril 20 mg, furosemide 20 mg, aspirin. Repeat echocardiogram in July. Return in 3 months.'),
            sig('Electronically signed: Priya Nkemelu, MD, FACC   |   01/21/2026'),
        ),
        page(
            'Cardiology Letter to Surgeon',
            HEARTLAND,
            p('Date: 09/16/2026'),
            p('To: Amanda Reyes, MD'),
            p('Re: John Doe, DOB 03/14/1955'),
            p('Dear Dr. Reyes, I saw Mr. Doe today for pre-operative assessment. My full clearance note is enclosed. In brief, his '
              'heart failure is compensated, and I recommend telemetry and close fluid management after surgery. Please call me '
              'with any peri-operative concerns.'),
            sig('Priya Nkemelu, MD, FACC   |   (614) 555-0177 ext. 3'),
        ),
    ]


def anesthesia_extra():
    return [
        page(
            'Patient Pre-Anesthesia Questionnaire',
            RIDGELINE_SC,
            p(f'{PATIENT} | Completed by patient: 09/21/2026'),
            table(
                ['Question', 'Answer'],
                ['Prior problems with anesthesia?', 'Nausea after knee replacement (2019)'],
                ['Family history of anesthesia problems?', 'No'],
                ['Loose teeth, dentures, or caps?', 'No'],
                ['Snoring or witnessed pauses in breathing?', 'Snores; spouse unsure about pauses'],
                ['Can you climb a flight of stairs without stopping?', 'Yes, slowly, limited by leg pain'],
                ['Blood thinners?', 'Aspirin 81 mg'],
                widths=[280, 224],
            ),
        ),
        page(
            'STOP-BANG Sleep Apnea Screening',
            RIDGELINE_SC,
            p(f'{PATIENT} | Date: 09/23/2026'),
            table(
                ['Item', 'Result'],
                ['Snoring', 'Yes'], ['Tired during the day', 'No'], ['Observed apnea', 'No'],
                ['Pressure (hypertension)', 'Yes'], ['BMI over 35', 'No'], ['Age over 50', 'Yes'],
                ['Neck circumference over 40 cm', 'No'], ['Gender male', 'Yes'],
                widths=[280, 224],
            ),
            p('Score 4: intermediate risk. Continuous pulse oximetry recommended post-operatively.'),
        ),
    ]


def lab_extra():
    return [
        page(
            'Laboratory Results — Complete Blood Count with Differential',
            RIDGELINE_PAT,
            p('Collected: 09/23/2026'),
            table(
                ['Test', 'Result', 'Reference Range', 'Flag'],
                ['RBC', '4.41 M/uL', '4.5-5.9', 'L'], ['Hematocrit', '39.6 %', '41-53', 'L'], ['MCV', '89.8 fL', '80-100', ''],
                ['RDW', '13.9 %', '11.5-14.5', ''], ['Neutrophils', '62 %', '40-70', ''], ['Lymphocytes', '27 %', '20-40', ''],
                ['Monocytes', '8 %', '2-10', ''], ['Eosinophils', '2 %', '0-6', ''],
                widths=[170, 110, 140, 84],
            ),
        ),
        page(
            'Laboratory Trend Summary',
            RIDGELINE_PAT,
            p(f'{PATIENT} | Prepared for pre-admission review'),
            table(
                ['Test', '01/2026', '06/2026', '09/2026'],
                ['Hemoglobin (g/dL)', '13.6', '13.4', '13.2'], ['Creatinine (mg/dL)', '1.0', '1.0', '1.1'],
                ['Hemoglobin A1c (%)', '7.4', '7.3', '7.1'], ['BNP (pg/mL)', '188', '195', '210'],
                ['Potassium (mEq/L)', '4.5', '4.3', '4.4'],
                widths=[180, 108, 108, 108],
            ),
            p('Values stable across 2026. No acute changes.'),
        ),
    ]


def orders_extra():
    return [
        page(
            'Post-Operative Order Set — Pain Management',
            RIDGELINE_SC,
            p(f'{PATIENT} | Pre-signed by Amanda Reyes, MD, 09/24/2026'),
            ol('Acetaminophen 1 g IV/PO every 8 hours scheduled.', 'Gabapentin 300 mg at bedtime, resume home dose.',
               'Hydromorphone PCA per protocol on post-operative day 0, transition to oral oxycodone as tolerated.',
               'Avoid NSAIDs given heart failure and fusion.', 'Continuous pulse oximetry while on PCA.',
               'Bowel regimen: senna and docusate.'),
        ),
        page(
            'Therapy & Equipment Orders',
            RIDGELINE_SC,
            p(f'{PATIENT} | Pre-signed by Amanda Reyes, MD, 09/24/2026'),
            ol('Physical therapy evaluation day of surgery; ambulate with assistance as tolerated.',
               'Occupational therapy evaluation post-operative day 1 for ADLs and bathing.',
               'Spine precautions: no bending, lifting over 10 lb, or twisting.',
               'Durable medical equipment at discharge: front-wheeled walker, raised toilet seat, reacher.',
               'Stair training before discharge.'),
        ),
    ]


def consents_extra():
    return [
        page(
            'Consent for Blood Transfusion',
            RIDGELINE_SC,
            p(f'{PATIENT}'),
            p('I consent to transfusion of blood or blood products if my doctor finds it necessary during or after surgery. Risks, '
              'benefits, and alternatives, including cell salvage, were explained.'),
            sig('Patient signature: John Doe   |   Witness: Jenna Park, RN   |   09/22/2026'),
        ),
        page(
            'Authorization to Release Health Information',
            RIDGELINE_ORTHO,
            p(f'{PATIENT}'),
            p('I authorize Ridgeline Orthopedic & Spine Associates to release my medical records to Concord Health Plans for the '
              'purpose of prior authorization and payment for my planned surgery. This authorization expires one year from the '
              'date signed.'),
            sig('Patient signature: John Doe   |   09/18/2026'),
        ),
        page(
            'Financial Responsibility Acknowledgment',
            RIDGELINE_SC,
            p(f'{PATIENT}'),
            p('I understand that my surgery requires prior authorization from my health plan. I understand I am responsible for '
              'my plan\'s copays, deductible, and coinsurance, and that the facility will provide an estimate once a decision is '
              'made. I will be contacted if the authorization is not approved.'),
            sig('Patient signature: John Doe   |   09/22/2026'),
        ),
    ]


def build_pages():
    front = front_matter()
    pages = front[:]
    pages.append(insurance_card())
    pages += pcp_records()[:1] + pcp_extra()[:2] + pcp_records()[1:] + pcp_extra()[2:]
    surg = surgical_records()
    pages += surg[:3] + surg[3:4] + surgical_extra()[:1] + surg[4:] + surgical_extra()[1:]
    pages += imaging_records() + imaging_extra()
    pt = pt_records()
    pages += pt[:14]
    # Real faxes aren't clean: a blank page mid-stack, and a page sent twice.
    pages.append(blank_page())
    pages += pt[14:] + pt_extra()
    pain = pain_records()
    pe = pain_extra()
    pages += pain[:1] + pe[:1] + pain[1:3] + pe[1:] + pain[3:]
    pages += hp_records()
    # Older records lead their section, so the section marker moves with them.
    ce, cr = cardiology_extra(), cardiology_records()
    ce[0]['section'], cr[0]['section'] = cr[0]['section'], None
    pages += ce[:1] + cr + ce[1:]
    pages += endo_records()
    ae, ar = anesthesia_extra(), anesthesia_records()
    ae[0]['section'], ar[0]['section'] = ar[0]['section'], None
    pages += ae + ar
    pages += lab_records() + lab_extra()
    pages += med_rec()
    pages += orders() + orders_extra()
    pages += consents() + consents_extra()
    resent = dict(front[3])
    resent['title'] = 'Member Eligibility & Benefits Verification (RESENT)'
    resent['anchors'] = {}
    resent['section'] = None
    pages.append(resent)
    pages += attestation()
    return pages


# ---------------------------------------------------------------- render

class Bookmark(Flowable):
    """Zero-size flowable that registers a PDF outline entry for the page it
    lands on, so the section index also shows in any PDF reader."""

    def __init__(self, key, title):
        super().__init__()
        self.key, self.title = key, title
        self.width = self.height = 0

    def draw(self):
        self.canv.bookmarkPage(self.key)
        self.canv.addOutlineEntry(self.title, self.key, level=0)


def para(text, style):
    # Escape for ReportLab's mini-markup; newlines become line breaks.
    return Paragraph(escape(text).replace('\n', '<br/>'), style)


def render_blocks(blocks):
    out = []
    for b in blocks:
        kind = b[0]
        if kind == 'h':
            out.append(para(b[1], S_H))
        elif kind == 'p':
            out.append(para(b[1], S_P))
        elif kind == 'list':
            out += [para(item if re.match(r'^\d+\. ', item) else f'• {item}', S_LI) for item in b[1]]
            out.append(Spacer(1, 3))
        elif kind == 'kv':
            data = [[para(k, S_CELLB), para(v, S_CELL)] for k, v in b[1]]
            t = Table(data, colWidths=[180, 324])
            t.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
                                   ('TOPPADDING', (0, 0), (-1, -1), 1), ('LEFTPADDING', (0, 0), (-1, -1), 0)]))
            out += [t, Spacer(1, 4)]
        elif kind == 'table':
            header, rows, widths = b[1], b[2], b[3]
            data = [[para(c, S_CELLB) for c in header]] + [[para(c, S_CELL) for c in r] for r in rows]
            t = Table(data, colWidths=widths, repeatRows=1)
            t.setStyle(TableStyle([('GRID', (0, 0), (-1, -1), 0.4, RULE), ('BACKGROUND', (0, 0), (-1, 0), colors.Color(0.95, 0.95, 0.94)),
                                   ('VALIGN', (0, 0), (-1, -1), 'TOP'), ('TOPPADDING', (0, 0), (-1, -1), 3),
                                   ('BOTTOMPADDING', (0, 0), (-1, -1), 3)]))
            out += [t, Spacer(1, 4)]
        elif kind == 'sig':
            out.append(para(b[1], S_SIG))
        elif kind == 'note':
            out.append(para(b[1], S_NOTE))
        elif kind == 'urgent':
            out.append(para(b[1], S_URGENT))
    return out


class HR(Flowable):
    def __init__(self, width=504):
        super().__init__()
        self.width, self.height = width, 8

    def draw(self):
        self.canv.setStrokeColor(RULE)
        self.canv.setLineWidth(0.6)
        self.canv.line(0, 4, self.width, 4)


def main():
    pages = build_pages()
    total = len(pages)

    # Section ranges and anchors, known before rendering since each entry is one page.
    sections = []
    anchors = {}
    for i, pg in enumerate(pages, 1):
        if pg.get('section'):
            key, title = pg['section']
            if sections:
                sections[-1]['end'] = i - 1
            sections.append({'key': key, 'title': title, 'start': i, 'end': total})
        for k, quote in pg['anchors'].items():
            if k in anchors:
                raise SystemExit(f'Duplicate anchor {k}')
            anchors[k] = {'page': i, 'quote': quote}

    def rng(key):
        s = next(s for s in sections if s['key'] == key)
        return str(s['start']) if s['start'] == s['end'] else f"{s['start']}-{s['end']}"

    def fill(text):
        text = text.replace('{total}', str(total))
        text = re.sub(r'\{p:(\w+)\}', lambda m: str(anchors[m.group(1)]['page']), text)
        return re.sub(r'\{r:(\w+)\}', lambda m: rng(m.group(1)), text)

    def fill_block(b):
        if b[0] in ('h', 'p', 'sig', 'note', 'urgent'):
            return (b[0], fill(b[1]))
        if b[0] == 'list':
            return ('list', [fill(x) for x in b[1]])
        if b[0] == 'kv':
            return ('kv', [(fill(k), fill(v)) for k, v in b[1]])
        if b[0] == 'table':
            return ('table', b[1], [[fill(c) for c in r] for r in b[2]], b[3])
        return b

    story = []
    for i, pg in enumerate(pages, 1):
        if pg.get('section'):
            story.append(Bookmark(pg['section'][0], pg['section'][1]))
        if pg.get('blank'):
            story += [Spacer(1, 300), para('[ This page intentionally left blank — fax transmission ]', S_BLANK)]
        else:
            org_lines = pg['org'].split('\n')
            story.append(para(pg['title'], S_TITLE))
            story.append(Spacer(1, 4))
            story.append(para(f'{org_lines[0]}  •  Page {i} of {total}' if pg['title'] != 'FAX TRANSMISSION COVER SHEET'
                              else org_lines[0], S_SUB))
            for extra in org_lines[1:]:
                story.append(para(extra, S_SUB))
            story.append(Spacer(1, 4))
            story.append(HR())
            story += render_blocks([fill_block(b) for b in pg['blocks']])
        if i < total:
            story.append(PageBreak())

    def footer(canvas, doc):
        canvas.saveState()
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(GRAY)
        canvas.drawRightString(558, 36, f'Page {doc.page} of {total}')
        canvas.restoreState()

    doc = BaseDocTemplate(PDF_OUT, pagesize=letter, leftMargin=54, rightMargin=54, topMargin=48, bottomMargin=54,
                          title='Prior Authorization Packet — John Doe (MBR-0042)', author='Ridgeline Orthopedic & Spine Associates')
    frame = Frame(54, 54, 504, 792 - 48 - 54, id='body', leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([PageTemplate(id='page', frames=[frame], onPage=footer)])
    doc.build(story)

    # Guard: every entry must fit on exactly one page, or page numbers drift.
    if doc.page != total:
        raise SystemExit(f'Expected {total} pages, rendered {doc.page} — a page overflowed')

    with open(INDEX_OUT, 'w') as f:
        json.dump({'totalPages': total, 'sections': sections, 'anchors': anchors}, f, indent=2)
        f.write('\n')
    print(f'Wrote {PDF_OUT} ({total} pages) and {INDEX_OUT}')


if __name__ == '__main__':
    main()
