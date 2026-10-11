import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { MaropayToastKey } from '@/constants/maropayFlow'

export type MaropayLifecycleStatus =
  | 'not_connected'
  | 'connecting'
  | 'setup_required'
  | 'under_review'
  | 'action_required'
  | 'active'

export type MaropayBusinessType = 'individual' | 'registered_business' | 'non_profit'

export interface MaropayOnboardingData {
  businessType: MaropayBusinessType
  entityType: string
  firstName: string
  lastName: string
  dateOfBirth: string
  taxId: string
  businessDescription: string
  country: string
  registrationNumber: string
  addressLine1: string
  city: string
  state: string
  postalCode: string
  bankAccountName: string
  routingNumber: string
  accountNumber: string
  agreedToTerms: boolean
}

export type MaropayPayoutSchedule = 'daily' | 'weekly' | 'monthly' | 'manual'

export interface MaropayPaymentMethods {
  visa: boolean
  mastercard: boolean
  amex: boolean
  shopPay: boolean
  applePay: boolean
  googlePay: boolean
}

export interface MaropayChannelState {
  status: MaropayLifecycleStatus
  methodsConfigured: boolean
  onboarding: MaropayOnboardingData
  submittedAt?: string
  paymentMethods: MaropayPaymentMethods
  payoutSchedule: MaropayPayoutSchedule
  minimumPayoutAmount: string
  settlementPeriod: string
  declineFailedCvv: boolean
  declineFailedAvs: boolean
  /** One-shot toast to show on the payments gateway after navigation. */
  pendingToast?: MaropayToastKey
}

const DEFAULT_PAYMENT_METHODS = (): MaropayPaymentMethods => ({
  visa: true,
  mastercard: true,
  amex: true,
  shopPay: true,
  applePay: true,
  googlePay: false,
})

function defaultMaropayState(overrides: Partial<MaropayChannelState> = {}): MaropayChannelState {
  return {
    status: 'not_connected',
    methodsConfigured: false,
    onboarding: DEFAULT_ONBOARDING(),
    paymentMethods: DEFAULT_PAYMENT_METHODS(),
    payoutSchedule: 'daily',
    minimumPayoutAmount: '$50.00 AUD',
    settlementPeriod: 'Next business day after transaction',
    declineFailedCvv: true,
    declineFailedAvs: false,
    ...overrides,
  }
}

export function formatMaropayBusinessType(type: MaropayBusinessType, entityType: string): string {
  if (type === 'individual') return 'An individual'
  if (type === 'non_profit') return 'A non-profit'
  return entityType || 'A registered business'
}

export function formatMaropayDate(iso: string): string {
  if (!iso) return '—'
  const parsed = new Date(iso.includes('T') ? iso : `${iso}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return iso
  return parsed.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}

export function maskAccountNumber(value: string): string {
  if (!value) return '—'
  if (value.includes('•') || value.includes('*')) return value
  const tail = value.slice(-4)
  return `•••• •••• ${tail}`
}

/** Application submitted and awaiting or past review. */
export function hasSubmittedMaropayApplication(state: MaropayChannelState): boolean {
  return (
    Boolean(state.submittedAt) ||
    state.status === 'under_review' ||
    state.status === 'action_required' ||
    state.status === 'active'
  )
}

/** Merchant started the onboarding form but has not submitted yet. */
export function hasMaropayBusinessDraft(state: MaropayChannelState): boolean {
  const onboarding = state.onboarding
  return Boolean(
    onboarding.firstName ||
      onboarding.lastName ||
      onboarding.addressLine1 ||
      onboarding.bankAccountName ||
      onboarding.taxId,
  )
}

/** Business profile can be edited through the onboarding form in these states. */
export function canEditMaropayBusinessProfile(status: MaropayLifecycleStatus): boolean {
  return status === 'setup_required' || status === 'action_required' || status === 'active'
}

/** Onboarding form is reachable for initial setup, re-verification, or post-KYC edits. */
export function canAccessMaropayOnboardingForm(status: MaropayLifecycleStatus): boolean {
  return canEditMaropayBusinessProfile(status)
}

export function isMaropayAccountVerified(status: MaropayLifecycleStatus): boolean {
  return status === 'active'
}

/** Checkout methods are ready — verified accounts are treated as configured by default. */
export function hasMaropayCheckoutMethodsConfigured(state: MaropayChannelState): boolean {
  return state.methodsConfigured || isMaropayAccountVerified(state.status)
}

const DEFAULT_ONBOARDING = (): MaropayOnboardingData => ({
  businessType: 'registered_business',
  entityType: 'Private corporation',
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  taxId: '',
  businessDescription: '',
  country: 'United States',
  registrationNumber: '',
  addressLine1: '',
  city: '',
  state: '',
  postalCode: '',
  bankAccountName: '',
  routingNumber: '',
  accountNumber: '',
  agreedToTerms: false,
})

const VERIFIED_MAROPAY_ONBOARDING = (): MaropayOnboardingData => ({
  ...DEFAULT_ONBOARDING(),
  businessType: 'registered_business',
  entityType: 'Private corporation',
  firstName: 'Sam',
  lastName: 'Verma',
  dateOfBirth: '1990-01-01',
  taxId: '•••-••-4321',
  businessDescription: 'Premium outdoor apparel and accessories.',
  registrationNumber: 'AU 2 037 482 116',
  addressLine1: '234 Atlantic Avenue, Suite 4B',
  city: 'Brooklyn',
  state: 'NY',
  postalCode: '11201',
  bankAccountName: 'Atlas Outfitters Ltd.',
  routingNumber: '••••5678',
  accountNumber: '••••4242',
  agreedToTerms: true,
})

function seedMaropay(): Record<string, MaropayChannelState> {
  return {
    // Primary storefront — always starts on the Connect landing.
    'retest-sales-notification': defaultMaropayState({ status: 'not_connected' }),
    'beta-sales-channel': defaultMaropayState({
      status: 'setup_required',
      declineFailedCvv: false,
      declineFailedAvs: false,
    }),
    'max-test-store': defaultMaropayState({
      status: 'active',
      methodsConfigured: true,
      declineFailedAvs: true,
      onboarding: VERIFIED_MAROPAY_ONBOARDING(),
      submittedAt: '2026-09-01T10:00:00Z',
    }),
  }
}

export const MAROPAY_STATUS_LABELS: Record<MaropayLifecycleStatus, string> = {
  not_connected: 'Not connected',
  connecting: 'Connecting',
  setup_required: 'Setup required',
  under_review: 'Under review',
  action_required: 'Action required',
  active: 'Active',
}

export const useMaropayOnboardingStore = defineStore('maropayOnboarding', () => {
  const byChannel = ref<Record<string, MaropayChannelState>>(seedMaropay())

  function stateFor(channelId: string): MaropayChannelState {
    if (!byChannel.value[channelId]) {
      byChannel.value[channelId] = defaultMaropayState()
    }
    return byChannel.value[channelId]!
  }

  function updateOnboarding(channelId: string, patch: Partial<MaropayOnboardingData>) {
    const state = stateFor(channelId)
    state.onboarding = { ...state.onboarding, ...patch }
  }

  function startConnect(channelId: string): Promise<void> {
    const state = stateFor(channelId)
    state.status = 'connecting'
    return new Promise((resolve) => {
      window.setTimeout(() => {
        state.status = 'setup_required'
        state.pendingToast = 'connected'
        resolve()
      }, 1500)
    })
  }

  function submitOnboarding(channelId: string) {
    const state = stateFor(channelId)
    state.status = 'under_review'
    state.submittedAt = new Date().toISOString()
    state.pendingToast = 'application_submitted'
  }

  function queueToast(channelId: string, key: MaropayToastKey) {
    stateFor(channelId).pendingToast = key
  }

  function consumePendingToast(channelId: string): MaropayToastKey | undefined {
    const state = stateFor(channelId)
    const key = state.pendingToast
    state.pendingToast = undefined
    return key
  }

  function approveApplication(channelId: string) {
    const state = stateFor(channelId)
    state.status = 'active'
    state.methodsConfigured = true
    state.pendingToast = 'account_activated'
  }

  function saveDraft(channelId: string) {
    stateFor(channelId)
  }

  function markActionRequired(channelId: string) {
    stateFor(channelId).status = 'action_required'
  }

  function activate(channelId: string) {
    const state = stateFor(channelId)
    state.status = 'active'
    state.methodsConfigured = true
  }

  function configureMethods(channelId: string) {
    stateFor(channelId).methodsConfigured = true
  }

  function updateManageSettings(
    channelId: string,
    patch: Partial<
      Pick<
        MaropayChannelState,
        | 'paymentMethods'
        | 'payoutSchedule'
        | 'minimumPayoutAmount'
        | 'settlementPeriod'
        | 'declineFailedCvv'
        | 'declineFailedAvs'
      >
    >,
  ) {
    const state = stateFor(channelId)
    Object.assign(state, patch)
  }

  function disconnect(channelId: string) {
    byChannel.value[channelId] = defaultMaropayState()
  }

  return {
    byChannel,
    stateFor,
    updateOnboarding,
    startConnect,
    submitOnboarding,
    saveDraft,
    queueToast,
    consumePendingToast,
    approveApplication,
    markActionRequired,
    activate,
    configureMethods,
    updateManageSettings,
    disconnect,
  }
})
