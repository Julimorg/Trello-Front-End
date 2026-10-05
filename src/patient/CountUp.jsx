import { useLayoutEffect, useRef } from 'react'
import { animate } from 'animejs'
import { prefersReducedMotion } from './anime'

// Number that counts up from 0 with animejs. The text is written imperatively, so the
// span has no React children for React to reconcile against.
export default function CountUp({ value, pad = 2, suffix = '' }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const format = (v) => `${String(Math.round(v)).padStart(pad, '0')}${suffix}`
    el.textContent = format(value)
    if (prefersReducedMotion() || value === 0) return undefined
    const counter = { v: 0 }
    el.textContent = format(0)
    const animation = animate(counter, {
      v: value,
      duration: 900,
      ease: 'outExpo',
      onUpdate: () => {
        el.textContent = format(counter.v)
      },
    })
    return () => {
      animation.pause()
      el.textContent = format(value)
    }
  }, [value, pad, suffix])

  return <span ref={ref} />
}
