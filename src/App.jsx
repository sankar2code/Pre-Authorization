import { useState } from 'react'
import { getCase } from './data/cases'
import {
  generateApprovalSummary,
  generateEscalationSummary,
  generateClarificationSummary,
  generateDenialSummary,
  generateFailureClosureSummary,
} from './data/domain'
import { useCaseRuntime } from './state/useCaseRuntime'
import { useTheme } from './state/useTheme'

import ThemeToggle from './components/ThemeToggle'
import ApprovalModal from './components/ApprovalModal'
import EscalationModal from './components/EscalationModal'
import ClarificationModal from './components/ClarificationModal'
import DenialModal from './components/DenialModal'
import NotifyProviderModal from './components/NotifyProviderModal'
import CaseHeader from './components/CaseHeader'
import LandingPage from './components/LandingPage'
import CaseQueue from './components/CaseQueue'
import ReportsView from './components/ReportsView'
import LoadingState from './components/LoadingState'
import ExtractionView from './components/ExtractionView'
import CriteriaChecklist from './components/CriteriaChecklist'
import ClarificationSent from './components/ClarificationSent'
import ProviderResponse from './components/ProviderResponse'
import EscalationHandoff from './components/EscalationHandoff'
import Determination from './components/Determination'
import FailureState from './components/FailureState'

const SCREEN_STEP = {
  loading: 'extracted',
  extraction: 'extracted',
  checklist: 'matched',
  clarification_sent: 'reviewed',
  provider_response: 'reviewed',
  escalation_handoff: 'reviewed',
  md_view: 'reviewed',
  determination: 'determined',
  failure: 'extracted',
}

function resolvedViaFor(rt) {
  if (rt.owner === 'md') return 'escalation'
  if (rt.clarification) return 'clarification'
  return 'straight-through'
}

export default function App() {
  const [screen, setScreen] = useState('landing')
  const [activeCaseId, setActiveCaseId] = useState(null)
  const [approvalModalOpen, setApprovalModalOpen] = useState(false)
  const [escalationModalOpen, setEscalationModalOpen] = useState(false)
  const [clarificationModalOpen, setClarificationModalOpen] = useState(false)
  const [denialModalOpen, setDenialModalOpen] = useState(false)
  const [notifyModalOpen, setNotifyModalOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const {
    runtime,
    markRead,
    startExtraction,
    finishExtraction,
    requestClarification,
    advanceClarificationDelivered,
    advanceClarificationViewed,
    receiveProviderResponse,
    escalate,
    assumeMdOwnership,
    determine,
    recordApproval,
    recordDenial,
    notifyProviderAndClose,
  } = useCaseRuntime()

  const caseData = activeCaseId ? getCase(activeCaseId) : null
  const rt = activeCaseId ? runtime[activeCaseId] : null

  function goToQueue() {
    setActiveCaseId(null)
    setApprovalModalOpen(false)
    setEscalationModalOpen(false)
    setClarificationModalOpen(false)
    setDenialModalOpen(false)
    setNotifyModalOpen(false)
    setScreen('queue')
  }

  function resumeScreenFor(caseId) {
    const caseRt = runtime[caseId]
    if (caseRt.determination) return 'determination'
    if (caseRt.phase === 'failed') return 'failure'
    if (caseRt.phase === 'queued') return null // needs fresh extraction
    if (caseRt.clarification?.status === 'sent') return 'clarification_sent'
    if (caseRt.clarification?.status === 'responded') return 'provider_response'
    if (caseRt.owner === 'md') return 'md_view'
    return 'checklist'
  }

  function openCase(caseId) {
    setActiveCaseId(caseId)
    markRead(caseId)

    const resumeScreen = resumeScreenFor(caseId)
    if (resumeScreen) {
      setScreen(resumeScreen)
      return
    }

    setScreen('loading')
    startExtraction(caseId)
  }

  function handleLoadingComplete() {
    finishExtraction(activeCaseId)
    setScreen(getCase(activeCaseId).parseFailed ? 'failure' : 'extraction')
  }

  function handleApprove() {
    setApprovalModalOpen(true)
  }

  function handleConfirmApproval(comment) {
    recordApproval(activeCaseId, {
      summary: generateApprovalSummary(caseData, rt.criteria),
      comment,
      resolvedByLabel: rt.owner === 'md' ? 'Medical Director' : 'Nurse',
    })
    determine(activeCaseId, {
      outcome: 'Approved',
      resolvedVia: resolvedViaFor(rt),
      resolvedBy: rt.owner === 'md' ? 'medical director' : 'nurse',
    })
    setApprovalModalOpen(false)
    setScreen('determination')
  }

  function handleDeny() {
    setDenialModalOpen(true)
  }

  function handleConfirmDenial(comment) {
    recordDenial(activeCaseId, {
      summary: generateDenialSummary(caseData, rt.criteria),
      comment,
    })
    determine(activeCaseId, {
      outcome: 'Denied',
      resolvedVia: resolvedViaFor(rt),
      resolvedBy: 'medical director',
    })
    setDenialModalOpen(false)
    setScreen('determination')
  }

  function handleConfirmNotifyProvider(comment) {
    notifyProviderAndClose(activeCaseId, {
      summary: generateFailureClosureSummary(caseData),
      comment,
    })
    setNotifyModalOpen(false)
  }

  function handleRequestClarification() {
    setClarificationModalOpen(true)
  }

  function handleConfirmClarification(comment) {
    requestClarification(activeCaseId, rt.owner, {
      summary: generateClarificationSummary(rt.criteria),
      comment,
    })
    setClarificationModalOpen(false)
    setScreen('clarification_sent')
  }

  function handleEscalate() {
    setEscalationModalOpen(true)
  }

  function handleConfirmEscalation(observations) {
    escalate(activeCaseId, {
      summary: generateEscalationSummary(caseData, rt.criteria),
      observations,
    })
    setEscalationModalOpen(false)
    setScreen('escalation_handoff')
  }

  function handleSimulateResponse() {
    receiveProviderResponse(activeCaseId)
    setScreen('provider_response')
  }

  function handleContinueToMd() {
    assumeMdOwnership(activeCaseId)
    setScreen('md_view')
  }

  const themeToggle = <ThemeToggle theme={theme} onToggle={toggleTheme} />

  if (screen === 'landing') {
    return (
      <>
        {themeToggle}
        <LandingPage onEnter={() => setScreen('queue')} theme={theme} />
      </>
    )
  }

  if (screen === 'queue') {
    return (
      <>
        {themeToggle}
        <CaseQueue
          runtime={runtime}
          onOpenCase={openCase}
          onViewReports={() => setScreen('reports')}
          onBack={() => setScreen('landing')}
        />
      </>
    )
  }

  if (screen === 'reports') {
    return (
      <>
        {themeToggle}
        <ReportsView runtime={runtime} onBack={goToQueue} />
      </>
    )
  }

  // Every remaining screen is scoped to an active case and shares the header.
  return (
    <div>
      {themeToggle}
      <CaseHeader
        caseData={caseData}
        journeyStep={SCREEN_STEP[screen]}
        errorStep={screen === 'failure' ? 'extracted' : undefined}
        rt={rt}
        onBackToQueue={goToQueue}
      />

      <ApprovalModal
        open={approvalModalOpen}
        onClose={() => setApprovalModalOpen(false)}
        caseData={caseData}
        criteria={rt.criteria}
        onSubmit={handleConfirmApproval}
      />

      <EscalationModal
        open={escalationModalOpen}
        onClose={() => setEscalationModalOpen(false)}
        caseData={caseData}
        criteria={rt.criteria}
        onSubmit={handleConfirmEscalation}
      />

      <NotifyProviderModal
        open={notifyModalOpen}
        onClose={() => setNotifyModalOpen(false)}
        caseData={caseData}
        onSubmit={handleConfirmNotifyProvider}
      />

      <ClarificationModal
        open={clarificationModalOpen}
        onClose={() => setClarificationModalOpen(false)}
        criteria={rt.criteria}
        onSubmit={handleConfirmClarification}
      />

      <DenialModal
        open={denialModalOpen}
        onClose={() => setDenialModalOpen(false)}
        caseData={caseData}
        criteria={rt.criteria}
        onSubmit={handleConfirmDenial}
      />

      {screen === 'loading' && (
        <LoadingState caseData={caseData} onComplete={handleLoadingComplete} />
      )}

      {screen === 'failure' && (
        <FailureState
          caseData={caseData}
          closure={rt.closure}
          onNotifyProvider={() => setNotifyModalOpen(true)}
          onBackToQueue={goToQueue}
        />
      )}

      {screen === 'extraction' && (
        <ExtractionView caseData={caseData} onContinue={() => setScreen('checklist')} />
      )}

      {screen === 'checklist' && (
        <CriteriaChecklist
          caseData={caseData}
          criteria={rt.criteria}
          owner="nurse"
          onApprove={handleApprove}
          onRequestClarification={handleRequestClarification}
          onEscalate={handleEscalate}
        />
      )}

      {screen === 'clarification_sent' && (
        <ClarificationSent
          caseData={caseData}
          criteria={rt.criteria}
          clarification={rt.clarification}
          owner={rt.clarification.owner}
          onSimulateResponse={handleSimulateResponse}
          onDelivered={() => advanceClarificationDelivered(activeCaseId)}
          onViewed={() => advanceClarificationViewed(activeCaseId)}
        />
      )}

      {screen === 'provider_response' && (
        <ProviderResponse
          caseData={caseData}
          criteria={rt.criteria}
          clarification={rt.clarification}
          owner={rt.clarification.owner}
          onApprove={handleApprove}
          onRequestClarification={handleRequestClarification}
          onEscalate={handleEscalate}
          onDeny={handleDeny}
        />
      )}

      {screen === 'escalation_handoff' && (
        <EscalationHandoff caseData={caseData} criteria={rt.criteria} onContinue={handleContinueToMd} />
      )}

      {screen === 'md_view' && (
        <CriteriaChecklist
          caseData={caseData}
          criteria={rt.criteria}
          owner="md"
          escalation={rt.escalation}
          onApprove={handleApprove}
          onRequestClarification={handleRequestClarification}
          onDeny={handleDeny}
        />
      )}

      {screen === 'determination' && (
        <Determination
          caseData={caseData}
          criteria={rt.criteria}
          determination={rt.determination}
          onBackToQueue={goToQueue}
        />
      )}
    </div>
  )
}
