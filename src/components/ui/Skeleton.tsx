/**
 * A placeholder for content that is on its way.
 *
 * There were no skeletons anywhere on this site. ViewCounter rendered three
 * literal dots, RelatedGraph an empty grey box, SkillGraph and EcosystemGraph
 * nothing at all — so a slow fetch looked like a broken component rather than a
 * pending one.
 *
 * A React component rather than an .astro one because every consumer is a React
 * island: the loading state has to live inside the same render that does the
 * fetching.
 *
 * The shimmer is a sweep of the warm palette, not the usual grey pulse, and it
 * holds still under prefers-reduced-motion — an indefinite animation is exactly
 * what that preference is about.
 */
interface Props {
  /** Tailwind sizing/shape classes for the block. */
  className?: string;
  /** Number of stacked bars. Use for text-shaped placeholders. */
  lines?: number;
  /** Announced to assistive tech instead of the visual placeholder. */
  label?: string;
}

export default function Skeleton({ className = '', lines = 1, label }: Props) {
  const bars = Array.from({ length: lines });

  return (
    <div
      // The placeholder itself is decoration; the status is the message. Without
      // this a screen reader gets a stack of empty divs and no explanation.
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={lines > 1 ? 'flex flex-col gap-2' : undefined}
    >
      {bars.map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className={`skeleton rounded-plate ${className}`}
          // Last line of a paragraph-shaped block runs short, the way text does.
          style={lines > 1 && i === lines - 1 ? { width: '62%' } : undefined}
        />
      ))}
      <span className="sr-only">{label ?? 'Indlæser…'}</span>
    </div>
  );
}
