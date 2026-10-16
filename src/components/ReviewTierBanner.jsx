const TIER_STYLES = {
  lighter: 'bg-brand-tint border-brand/30 text-brand-dark',
  standard: 'bg-ambiguous-bg border-ambiguous-border text-ambiguous',
  escalation: 'bg-notmet-bg border-notmet-border text-notmet',
}

export default function ReviewTierBanner({ tier }) {
  return (
    <div className={`rounded-lg border px-4 py-3 ${TIER_STYLES[tier.tier]}`}>
      <p className="text-sm font-semibold">{tier.label}</p>
      <p className="mt-0.5 text-sm opacity-90">{tier.detail}</p>
    </div>
  )
}
