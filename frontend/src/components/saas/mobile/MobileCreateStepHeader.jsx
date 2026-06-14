/**
 * @param {{ step: number, total?: number, label?: string }} props
 */
export function MobileCreateStepHeader({ step, total = 2, label }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
        Step {step} of {total}
      </p>
      {label && <p className="mt-1 text-sm text-blue-900">{label}</p>}
    </div>
  );
}
