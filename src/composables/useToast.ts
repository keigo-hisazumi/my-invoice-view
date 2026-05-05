import { reactive } from 'vue'

type ToastType = 'success' | 'error'

interface Toast {
  id: number
  message: string
  type: ToastType
}

const toasts = reactive<Toast[]>([])
let nextId = 0

export function useToast() {
  const show = (message: string, type: ToastType = 'success', duration = 3000) => {
    const id = nextId++
    toasts.push({ id, message, type })
    setTimeout(() => {
      const index = toasts.findIndex(t => t.id === id)
      if (index !== -1) toasts.splice(index, 1)
    }, duration)
  }

  return { toasts, show }
}
