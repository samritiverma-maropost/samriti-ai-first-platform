import { ref } from 'vue'

export type MaropaySnackbarTone = 'success' | 'error' | 'info'

export interface MaropaySnackbarPayload {
  title?: string
  message: string
  tone?: MaropaySnackbarTone
  durationMs?: number
}

interface MaropaySnackbarState extends MaropaySnackbarPayload {
  id: string
  tone: MaropaySnackbarTone
  leaving: boolean
}

const snackbar = ref<MaropaySnackbarState | null>(null)
let hideTimer: ReturnType<typeof setTimeout> | null = null
let leaveTimer: ReturnType<typeof setTimeout> | null = null

const LEAVE_MS = 200
const DEFAULT_DURATION_MS = 6000

function clearTimers() {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  if (leaveTimer) {
    clearTimeout(leaveTimer)
    leaveTimer = null
  }
}

function dismiss() {
  if (!snackbar.value) return
  clearTimers()
  snackbar.value = { ...snackbar.value, leaving: true }
  leaveTimer = setTimeout(() => {
    snackbar.value = null
  }, LEAVE_MS)
}

function show(payload: MaropaySnackbarPayload) {
  clearTimers()
  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `maropay-snackbar-${Date.now()}`

  snackbar.value = {
    id,
    title: payload.title,
    message: payload.message,
    tone: payload.tone ?? 'success',
    durationMs: payload.durationMs ?? DEFAULT_DURATION_MS,
    leaving: false,
  }

  hideTimer = setTimeout(dismiss, snackbar.value.durationMs)
}

/** Figma-style top snackbar for the Maropay E2E flow (node 6657:65415). */
export function useMaropaySnackbar() {
  return {
    snackbar,
    show,
    dismiss,
  }
}
