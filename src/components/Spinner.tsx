import { cn } from '@/lib/utils';

const BAR_COUNT = 12;
const DURATION_MS = 1000;

// Each bar sits at the top of the box and rotates about the box's centre.
// The bar is 25% of the box tall, so its own centre-of-rotation is 200% of its
// height down from its top edge -- hence transformOrigin '50% 200%'.
const BARS = Array.from({ length: BAR_COUNT }, (_, i) => ({
  rotation: (360 / BAR_COUNT) * i,
  // Negative delays start the cycle mid-flight, so the bright point is already
  // sweeping on the first frame instead of every bar flashing on together.
  delay: `${-(DURATION_MS - (DURATION_MS / BAR_COUNT) * i)}ms`,
}));

interface SpinnerProps {
  /** Box size in px. The bars scale with it. */
  size?: number;
  className?: string;
  /** Announced to screen readers; pass null inside an already-labelled control. */
  label?: string | null;
}

/**
 * iOS-style activity indicator. Inherits `currentColor`, so set the colour with
 * a text-* class on this element or an ancestor.
 */
const Spinner = ({ size = 20, className, label = 'Loading' }: SpinnerProps) => (
  <span
    role="status"
    aria-label={label ?? undefined}
    aria-hidden={label === null ? true : undefined}
    className={cn('relative inline-block shrink-0 align-middle', className)}
    style={{ width: size, height: size }}
  >
    {BARS.map(({ rotation, delay }) => (
      <span
        key={rotation}
        className="absolute left-1/2 top-0 block rounded-full bg-current animate-ios-spinner motion-reduce:animate-none motion-reduce:opacity-60"
        style={{
          width: '8%',
          height: '25%',
          marginLeft: '-4%',
          transformOrigin: '50% 200%',
          transform: `rotate(${rotation}deg)`,
          animationDelay: delay,
        }}
      />
    ))}
  </span>
);

export default Spinner;
