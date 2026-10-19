import { ref } from 'vue'

const toasts = ref([])
let nextToastId = 1

const modalState = ref({
  isOpen: false,
  type: 'warning', // 'warning' | 'error' | 'info' | 'success'
  title: '',
  message: '',
  confirmText: '我知道了',
  cancelText: '',
  onConfirm: null,
  onCancel: null
})

export function useToast() {
  function showToast({
    type = 'info',
    title = '',
    message = '',
    duration = 4500
  }) {
    const id = nextToastId++
    const toast = { id, type, title, message }
    toasts.value.push(toast)

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
    return id
  }

  function removeToast(id) {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx !== -1) {
      toasts.value.splice(idx, 1)
    }
  }

  function warning(message, title = '提醒事項') {
    return showToast({ type: 'warning', title, message })
  }

  function error(message, title = '發生錯誤') {
    return showToast({ type: 'error', title, message, duration: 6000 })
  }

  function success(message, title = '操作成功') {
    return showToast({ type: 'success', title, message, duration: 3500 })
  }

  function info(message, title = '系統通知') {
    return showToast({ type: 'info', title, message })
  }

  function showModal({
    type = 'warning',
    title = '提示訊息',
    message = '',
    confirmText = '我知道了',
    cancelText = '',
    onConfirm = null,
    onCancel = null
  }) {
    modalState.value = {
      isOpen: true,
      type,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm,
      onCancel
    }
  }

  function closeModal() {
    modalState.value.isOpen = false
  }

  function confirmModal() {
    if (typeof modalState.value.onConfirm === 'function') {
      modalState.value.onConfirm()
    }
    closeModal()
  }

  function cancelModal() {
    if (typeof modalState.value.onCancel === 'function') {
      modalState.value.onCancel()
    }
    closeModal()
  }

  return {
    toasts,
    modalState,
    showToast,
    removeToast,
    warning,
    error,
    success,
    info,
    showModal,
    closeModal,
    confirmModal,
    cancelModal
  }
}
