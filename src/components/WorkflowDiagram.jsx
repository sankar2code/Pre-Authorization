import { useEffect, useRef } from 'react'
import mermaid from 'mermaid'
import { CURRENT_FLOW_DEFINITION } from '../data/workflowDiagrams'

// mermaid.render errors if two in-flight calls share an id (e.g. React
// StrictMode's mount->cleanup->mount in dev) — a per-call counter avoids
// relying on the effect only ever running once.
let renderCounter = 0

const THEME_VARIABLES = {
  light: {
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    fontSize: '14px',
    primaryColor: '#FDFDFC',
    primaryTextColor: '#2C2C2A',
    primaryBorderColor: '#D8D8D3',
    lineColor: '#8A8A86',
    edgeLabelBackground: '#FDFDFC',
    tertiaryColor: '#FDFDFC',
  },
  dark: {
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    fontSize: '14px',
    primaryColor: '#1E1F24',
    primaryTextColor: '#ECECEA',
    primaryBorderColor: '#34353B',
    lineColor: '#96958D',
    edgeLabelBackground: '#1E1F24',
    tertiaryColor: '#1E1F24',
  },
}

export default function WorkflowDiagram({
  definition = CURRENT_FLOW_DEFINITION,
  label = "TODAY'S PROCESS",
  sublabel = 'Manual review path',
  theme = 'light',
}) {
  const containerRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    renderCounter += 1
    const id = `workflow-diagram-${renderCounter}`

    // mermaid.initialize is a global singleton, so re-set it right before
    // each render — that's the only way to pick up a theme change, since
    // node classDefs are baked into the definition string and the base
    // theme only affects edges/lines/backgrounds, not the colored chips.
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: THEME_VARIABLES[theme] ?? THEME_VARIABLES.light,
      flowchart: {
        htmlLabels: true,
        curve: 'basis',
      },
    })

    mermaid.render(id, definition).then(({ svg }) => {
      if (!cancelled && containerRef.current) {
        containerRef.current.innerHTML = svg
      }
    })
    return () => {
      cancelled = true
    }
  }, [definition, theme])

  return (
    <div className="mt-6 w-full rounded-lg border border-line bg-surface p-4 text-left shadow-sm">
      <div className="flex items-center justify-between border-b border-line pb-2">
        <span className="text-xs font-medium text-ink-faint">{label}</span>
        <span className="text-xs text-ink-faint">{sublabel}</span>
      </div>
      <div ref={containerRef} className="mt-3 flex justify-center overflow-x-auto" />
    </div>
  )
}
