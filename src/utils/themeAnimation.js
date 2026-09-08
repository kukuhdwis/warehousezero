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

  // Calculate coordinates of the click, prioritizing the button element's exact center
  let x = window.innerWidth - 80;
  let y = 35;

  if (event) {
    // Check currentTarget or target (including children like svg or path)
    const rawTarget = event.currentTarget || event.target;
    const buttonEl = rawTarget?.closest ? rawTarget.closest('button') || rawTarget : rawTarget;
    if (buttonEl && typeof buttonEl.getBoundingClientRect === 'function') {
      const rect = buttonEl.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        x = Math.round(rect.left + rect.width / 2);
        y = Math.round(rect.top + rect.height / 2);
      }
    } else if (typeof event.clientX === 'number' && typeof event.clientY === 'number' && (event.clientX > 0 || event.clientY > 0)) {
      x = Math.round(event.clientX);
      y = Math.round(event.clientY);
    }
  }

  // Fallback: locate the theme toggle button in DOM if coordinates could not be extracted
  if (x === window.innerWidth - 80 && y === 35) {
    const toggleBtn = document.querySelector('button[aria-label*="Mode"], button[aria-label*="mode"], button[aria-label*="Dark"], button[aria-label*="dark"], button[title*="Mode"], button[title*="mode"], button[title*="Dark"], button[title*="dark"]');
    if (toggleBtn) {
      const rect = toggleBtn.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        x = Math.round(rect.left + rect.width / 2);
        y = Math.round(rect.top + rect.height / 2);
      }
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
        duration: 450,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        pseudoElement: '::view-transition-new(root)'
      }
    );
  });
}

