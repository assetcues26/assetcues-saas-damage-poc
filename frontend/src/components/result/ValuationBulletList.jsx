/**
 * @param {{ bullets: string[], className?: string }} props
 */
export function ValuationBulletList({ bullets, className = '' }) {
  if (!bullets?.length) return null;
  return (
    <ul className={`list-disc space-y-1.5 pl-5 text-sm leading-relaxed ${className}`}>
      {bullets.map((item, index) => (
        <li key={`${index}-${item.slice(0, 24)}`}>{item}</li>
      ))}
    </ul>
  );
}
