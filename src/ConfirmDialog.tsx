type ConfirmDialogProps = {
  kicker: string
  title: string
  message: string
  confirmLabel?: string
  tone?: 'danger' | 'primary'
  onCancel: () => void
  onConfirm: () => void
}

export default function ConfirmDialog({
  kicker,
  title,
  message,
  confirmLabel = 'Confirmer',
  tone = 'danger',
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const confirmIcon = tone === 'danger'
    ? <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 1h4l1 2h4v2H1V3h5l1-2zM3.5 6h9l-.6 9h-7.8L3.5 6z" /></svg>
    : <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1 8.2 5.6 13 15 2.4 13.5 1 5.6 10 2.4 6.7z" /></svg>

  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="kicker">{kicker}</div>
        <h2 id="confirm-dialog-title" style={{ margin: '8px 0 0' }}>{title}</h2>
        <p className="muted">{message}</p>
        <div className="modal-actions">
          <button type="button" className="icon-btn ghost" title="Annuler" aria-label="Annuler" onClick={onCancel}>
            <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M1.2.4 6 5.2 10.8.4 12 1.6 7.2 6.4 12 11.2 10.8 12.4 6 7.6 1.2 12.4 0 11.2 4.8 6.4 0 1.6z" /></svg>
          </button>
          <button
            type="button"
            className={`icon-btn ${tone === 'primary' ? 'primary' : 'danger'}`}
            title={confirmLabel}
            aria-label={confirmLabel}
            onClick={onConfirm}
          >
            {confirmIcon}
          </button>
        </div>
      </div>
    </div>
  )
}
