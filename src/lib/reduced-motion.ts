import { MotionGlobalConfig } from 'framer-motion';

/**
 * Makes framer-motion honour prefers-reduced-motion.
 *
 * reset.css flattens every CSS animation and transition when the viewer asks
 * for less motion, but framer-motion does not animate through CSS — it writes
 * inline styles frame by frame from JS, so a media query cannot touch it. The
 * fifteen React islands on this site were the one part of the page that kept
 * moving regardless.
 *
 * MotionGlobalConfig is module state, and Vite gives every island the same
 * framer-motion chunk, so setting it once here covers all of them. Imported for
 * its side effect at the top of each island rather than wrapped around each
 * component tree — the islands mount into separate React roots, so there is no
 * single provider that could sit above them.
 *
 * skipAnimations sends animations straight to their end state, which is the
 * right reading of the preference: the interface still updates, it just does
 * not travel.
 */
if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)');

  const apply = () => {
    MotionGlobalConfig.skipAnimations = query.matches;
  };

  apply();
  // Honour the preference if it changes mid-session, rather than only at load.
  query.addEventListener('change', apply);
}
