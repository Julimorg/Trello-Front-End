import Modal, { ModalCloseButton } from './Modal'

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Xác nhận',
  confirmTone = 'primary',
  onConfirm,
  onClose,
  children,
  confirmDisabled = false,
}) {
  return (
    <Modal open={open} onClose={onClose} className="compact" labelledBy="confirmDialogTitle">
      <div className="modal-head">
        <div>
          <h2 id="confirmDialogTitle">{title}</h2>
          {description && <p className="modal-intro">{description}</p>}
        </div>
        <ModalCloseButton onClose={onClose} />
      </div>
      {children}
      <div className="modal-actions">
        <button type="button" className="btn ghost" onClick={onClose}>
          Hủy
        </button>
        <button type="button" className={`btn ${confirmTone}`} onClick={onConfirm} disabled={confirmDisabled}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
