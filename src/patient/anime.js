import { useEffect } from 'react'
import { animate, stagger } from 'animejs'

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

// Fades/slides the elements matching `selector` inside `ref` in, one after another.
// Re-runs whenever `deps` change (e.g. a filtered list re-rendering).
export function useStaggerIn(ref, selector, deps = []) {
  useEffect(() => {
    const root = ref.current
    if (!root || prefersReducedMotion()) return undefined
    const targets = root.querySelectorAll(selector)
    if (!targets.length) return undefined
    const animation = animate(targets, {
      opacity: [0, 1],
      translateY: [14, 0],
      duration: 520,
      delay: stagger(55),
      ease: 'outQuad',
    })
    return () => animation.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

// Small "pop" used to draw attention to an element that just changed.
export function popIn(element) {
  if (!element || prefersReducedMotion()) return
  animate(element, { scale: [0.92, 1], opacity: [0.4, 1], duration: 380, ease: 'outBack(2)' })
}
