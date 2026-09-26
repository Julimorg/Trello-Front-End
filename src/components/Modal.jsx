import { useEffect } from 'react'

export default function Modal({ open, onClose, children, className = '', backdropClassName = '', labelledBy }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className={`modal-backdrop open ${backdropClassName}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={`modal ${className}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        {children}
      </div>
    </div>
  )
}

export function ModalCloseButton({ onClose, floating = false }) {
  return (
    <button
      type="button"
      className={`modal-close${floating ? ' floating' : ''}`}
      aria-label="Đóng"
      onClick={onClose}
    >
      <svg viewBox="0 0 24 24">
        <path d="m6 6 12 12M18 6 6 18" />
      </svg>
    </button>
  )
}
