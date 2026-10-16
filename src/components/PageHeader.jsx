const PRODUCT_NAME = 'Prior Authorization Decision Support'

export default function PageHeader({ title, subtitle }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-brand-dark">
        {PRODUCT_NAME}
      </p>
      <h1 className="mt-1 text-[26px] font-semibold leading-tight text-ink">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-ink-faint">{subtitle}</p>}
    </div>
  )
}
