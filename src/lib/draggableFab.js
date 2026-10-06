import { useEffect, useRef } from 'react'
import { animate, createDraggable } from 'animejs'

const EDGE_PADDING = 14

function readSavedPosition(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Floating action button that can be dragged anywhere in the viewport (animejs clamps
// position:fixed elements to the window) with a pulsing ring; the drop position is
// remembered per browser under `storageKey`. Returns `consumeDrag()` so the click
// handler can ignore the click that ends a drag.
export function useDraggableFab(storageKey) {
  const buttonRef = useRef(null)
  const ringRef = useRef(null)
  const draggedRef = useRef(false)

  useEffect(() => {
    const el = buttonRef.current
    if (!el) return undefined
    const draggable = createDraggable(el, {
      container: document.body,
      containerPadding: EDGE_PADDING,
      // No throw on release: the button stays exactly where it is dropped.
      velocityMultiplier: 0,
      onGrab: () => {
        draggedRef.current = false
      },
      onDrag: () => {
        draggedRef.current = true
      },
      onSettle: (d) => {
        try {
          localStorage.setItem(storageKey, JSON.stringify({ x: d.x, y: d.y }))
        } catch {
          // ignore
        }
      },
    })
    const saved = readSavedPosition(storageKey)
    if (saved) {
      const rect = el.getBoundingClientRect()
      draggable.setX(Math.min(0, Math.max(-(rect.left - EDGE_PADDING), saved.x)))
      draggable.setY(Math.min(0, Math.max(-(rect.top - EDGE_PADDING), saved.y)))
    }
    const pulse =
      prefersReducedMotion() || !ringRef.current
        ? null
        : animate(ringRef.current, { scale: [1, 1.5], opacity: [0.55, 0], duration: 1700, loop: true, ease: 'outQuad' })
    return () => {
      pulse?.revert()
      draggable.revert()
    }
  }, [storageKey])

  const consumeDrag = () => {
    const dragged = draggedRef.current
    draggedRef.current = false
    return dragged
  }

  return { buttonRef, ringRef, consumeDrag }
}
