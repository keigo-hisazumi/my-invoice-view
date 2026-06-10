import { createPortal } from 'react-dom'
import { useToast } from '../contexts/ToastContext'

export default function ToastNotification() {
  const { toasts } = useToast()

  return createPortal(
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          <span className="toast-icon">{toast.type === 'success' ? '✓' : '✕'}</span>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>,
    document.body
  )
}
