import { MAROPAY_TOASTS, type MaropayToastKey } from '@/constants/maropayFlow'
import { useMaropaySnackbar } from '@/composables/useMaropaySnackbar'

/** Show a Maropay lifecycle snackbar using Figma E2E copy (top-center, not bottom toast). */
export function showMaropayToast(key: MaropayToastKey) {
  const payload = MAROPAY_TOASTS[key]
  const tone = payload.type === 'error' ? 'error' : payload.type === 'warning' ? 'info' : 'success'

  useMaropaySnackbar().show({
    title: payload.title,
    message: payload.message,
    tone,
  })
}
