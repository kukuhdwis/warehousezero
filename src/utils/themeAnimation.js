import { flushSync } from 'react-dom';

/**
 * Immersive Circular Clip-Path Theme Transition using the View Transitions API.
 * Creates an expanding circular ripple originating from the toggle button coordinates.
 *
 * @param {MouseEvent|TouchEvent|React.SyntheticEvent} event - The triggering click event
 * @param {Function} updateThemeCallback - Callback that applies the theme update
 */
export function toggleThemeWithClipPath(event, updateThemeCallback) {
  // If browser doesn't support View Transitions or user prefers reduced motion, fallback directly
  if (
    typeof document === 'undefined' ||
    !document.startViewTransition ||
    (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  ) {
    updateThemeCallback();
    return;
  }

  // Calculate coordinates of the click, or fallback to the center of the trigger element or window
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;

  if (event) {
    if (typeof event.clientX === 'number' && typeof event.clientY === 'number' && (event.clientX !== 0 || event.clientY !== 0)) {
      x = event.clientX;
      y = event.clientY;
    } else if (event.currentTarget && typeof event.currentTarget.getBoundingClientRect === 'function') {
      const rect = event.currentTarget.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }
  }

  // Compute radius from (x, y) to the furthest screen corner
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  const transition = document.startViewTransition(() => {
    flushSync(() => {
      updateThemeCallback();
    });
  });

  transition.ready.then(() => {
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`
        ]
      },
      {
        duration: 550,
        easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
        pseudoElement: '::view-transition-new(root)'
      }
    );
  });
}
