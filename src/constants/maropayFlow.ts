/** Figma E2E copy — MaroPay Wix-style Onboarding (node 6657:65415). */
export type MaropayToastKey =
  | 'connected'
  | 'application_submitted'
  | 'account_activated'
  | 'draft_saved'
  | 'methods_enabled'
  | 'settings_saved'
  | 'profile_updated'
  | 'verification_failed'

export const MAROPAY_TOASTS: Record<
  MaropayToastKey,
  { title?: string; message: string; type: 'success' | 'info' | 'error' | 'warning' }
> = {
  connected: {
    title: 'Maropay activated successfully',
    message: 'Complete your setup to start accepting payments.',
    type: 'success',
  },
  application_submitted: {
    title: 'Application submitted for review',
    message: 'We will email you when your Maropay account is approved.',
    type: 'success',
  },
  account_activated: {
    message: 'Account verified · Maropay is active and accepting payments',
    type: 'success',
  },
  draft_saved: {
    message: 'Draft saved — finish your application anytime.',
    type: 'success',
  },
  methods_enabled: {
    message: 'Payment methods enabled for checkout.',
    type: 'success',
  },
  settings_saved: {
    message: 'MaroPay settings saved.',
    type: 'success',
  },
  profile_updated: {
    message: 'Business details updated.',
    type: 'success',
  },
  verification_failed: {
    title: 'Verification unsuccessful',
    message: "We couldn't verify your identity. Review your details and resubmit.",
    type: 'error',
  },
}
