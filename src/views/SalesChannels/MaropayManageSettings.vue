<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { useStoreSettingsStore } from '@/stores/useStoreSettings'
import {
  canEditMaropayBusinessProfile,
  formatMaropayDate,
  hasMaropayBusinessDraft,
  hasSubmittedMaropayApplication,
  useMaropayOnboardingStore,
  type MaropayPaymentMethods,
  type MaropayPayoutSchedule,
} from '@/stores/useMaropayOnboarding'
import { showMaropayToast } from '@/composables/useMaropayToast'
import { useToast } from '@/composables/useToast'
import MpAlert from '@/components/MpAlert.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MaropayManageField from '@/components/maropay/MaropayManageField.vue'
import MaropayManageSection from '@/components/maropay/MaropayManageSection.vue'

interface ManageDraft {
  paymentMethods: MaropayPaymentMethods
  payoutSchedule: MaropayPayoutSchedule
  minimumPayoutAmount: string
  settlementPeriod: string
  declineFailedCvv: boolean
  declineFailedAvs: boolean
}

const route = useRoute()
const router = useRouter()
const toast = useToast()
const salesChannelsStore = useSalesChannelsStore()
const settingsStore = useStoreSettingsStore()
const maropayStore = useMaropayOnboardingStore()

const accountId = computed(() => {
  const value = route.params.accountId
  return (Array.isArray(value) ? value[0] : value) ?? '2000290'
})

const channelId = computed(() => {
  const value = route.params.channelId
  return (Array.isArray(value) ? value[0] : value) ?? ''
})

const channel = computed(() => salesChannelsStore.getChannel(accountId.value, channelId.value))
const domain = computed(() => channel.value?.webStore?.domain)
const maropay = computed(() => maropayStore.stateFor(channelId.value))
const form = computed(() => maropay.value.onboarding)

const canManage = computed(
  () => maropay.value.status !== 'not_connected' && maropay.value.status !== 'connecting',
)

const settingsLocked = computed(() => maropay.value.status === 'under_review')

const hasSubmittedApplication = computed(() => hasSubmittedMaropayApplication(maropay.value))

const hasBusinessDraft = computed(() => hasMaropayBusinessDraft(maropay.value))

const canEditBusinessProfile = computed(() =>
  canEditMaropayBusinessProfile(maropay.value.status),
)

const showSubmittedBusinessProfile = computed(
  () => hasSubmittedApplication.value || (hasBusinessDraft.value && maropay.value.status === 'action_required'),
)

const needsSetupBanner = computed(() => maropay.value.status === 'setup_required' && !hasSubmittedApplication.value)

const needsVerificationBanner = computed(() => maropay.value.status === 'action_required')

const backTo = computed(() => ({
  name: 'StorePaymentsGateway',
  params: { accountId: accountId.value, channelId: channelId.value },
}))

const disconnectDialog = ref(false)

const disconnectConsequences = [
  'Checkout will stop accepting card and wallet payments on this store.',
  'Your Maropay application and bank details will be removed.',
  'You can reconnect and reapply at any time.',
]

const payoutOptions: { value: MaropayPayoutSchedule; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'manual', label: 'Manual' },
]

const settlementOptions = [
  'Next business day after transaction',
  '2 business days after transaction',
  'Weekly batch settlement',
]

const cardMethods: { key: keyof MaropayPaymentMethods; label: string }[] = [
  { key: 'visa', label: 'Visa' },
  { key: 'mastercard', label: 'Mastercards' },
  { key: 'amex', label: 'American Express' },
]

const walletMethods: { key: keyof MaropayPaymentMethods; label: string }[] = [
  { key: 'shopPay', label: 'ShopPay' },
  { key: 'applePay', label: 'ApplePay' },
  { key: 'googlePay', label: 'GooglePay' },
]

const draft = ref<ManageDraft>(cloneDraft())

function cloneDraft(): ManageDraft {
  const state = maropayStore.stateFor(channelId.value)
  return {
    paymentMethods: { ...state.paymentMethods },
    payoutSchedule: state.payoutSchedule,
    minimumPayoutAmount: state.minimumPayoutAmount,
    settlementPeriod: state.settlementPeriod,
    declineFailedCvv: state.declineFailedCvv,
    declineFailedAvs: state.declineFailedAvs,
  }
}

watch(channelId, () => {
  draft.value = cloneDraft()
})

const fullAddress = computed(() => {
  const parts = [form.value.addressLine1, form.value.city, form.value.state, form.value.postalCode].filter(Boolean)
  return parts.join(', ')
})

const entityName = computed(() => {
  if (form.value.bankAccountName) return form.value.bankAccountName
  const person = `${form.value.firstName} ${form.value.lastName}`.trim()
  if (person) return person
  return channel.value?.name ?? 'Business account'
})

const businessTypeLabel = computed(() => {
  if (form.value.entityType) return form.value.entityType
  if (hasBusinessDraft.value || hasSubmittedApplication.value) return 'Private corporation'
  return 'Not provided yet'
})

const maskedAccountNumber = computed(() => (form.value.accountNumber ? '** ** ** **' : '—'))

function openOnboarding() {
  router.push({
    name: 'MaropayOnboarding',
    params: { accountId: accountId.value, channelId: channelId.value },
    query: { from: 'manage' },
  })
}

function togglePaymentMethod(key: keyof MaropayPaymentMethods, value: boolean | null) {
  draft.value.paymentMethods = {
    ...draft.value.paymentMethods,
    [key]: Boolean(value),
  }
}

function cancel() {
  draft.value = cloneDraft()
  router.push(backTo.value)
}

function save() {
  maropayStore.updateManageSettings(channelId.value, {
    paymentMethods: { ...draft.value.paymentMethods },
    payoutSchedule: draft.value.payoutSchedule,
    minimumPayoutAmount: draft.value.minimumPayoutAmount.trim(),
    settlementPeriod: draft.value.settlementPeriod,
    declineFailedCvv: draft.value.declineFailedCvv,
    declineFailedAvs: draft.value.declineFailedAvs,
  })
  showMaropayToast('settings_saved')
  router.push(backTo.value)
}

function confirmDisconnect() {
  maropayStore.disconnect(channelId.value)
  settingsStore.disconnectMaropay(channelId.value, domain.value)
  toast.success('Maropay disconnected from this store')
  router.push(backTo.value)
}
</script>

<template>
  <div v-if="!channel" class="h-100 d-flex align-center justify-center">
    <v-card variant="flat" border rounded="lg" class="pa-6" max-width="420">
      <MpEmptyState
        icon="store"
        title="Sales channel not found"
        description="The store you're trying to manage doesn't exist or was removed."
        action-label="Back to sales channels"
        @action="router.push({ name: 'SalesChannels', params: { accountId } })"
      />
    </v-card>
  </div>

  <div v-else-if="!canManage" class="h-100 d-flex align-center justify-center">
    <v-card variant="flat" border rounded="lg" class="pa-6" max-width="480">
      <MpEmptyState
        icon="credit-card"
        title="Connect MaroPay first"
        description="Connect MaroPay from the payments gateway before managing settings."
        action-label="Back to payments"
        @action="router.push(backTo)"
      />
    </v-card>
  </div>

  <div v-else class="manage-page d-flex flex-column ga-5 pb-8">
    <MpPageHeader
      title="MaroPay payments"
      subtitle="Manage your payment provider settings"
      :back-to="backTo"
    />

    <v-card flat border rounded="lg" class="manage-shell">
      <div class="manage-shell__entity d-flex align-center justify-space-between">
        <div class="d-flex align-center ga-4 min-width-0">
          <v-avatar color="primary" variant="tonal" size="38" rounded="lg">
            <v-icon size="20">user</v-icon>
          </v-avatar>
          <div class="d-flex align-center ga-2 min-width-0 flex-wrap">
            <span class="text-body-1 font-weight-medium">{{ entityName }}</span>
            <MpStatusChip
              v-if="maropay.status === 'setup_required'"
              status="Setup required"
              type="payment"
              size="sm"
            />
            <MpStatusChip
              v-else-if="maropay.status === 'active'"
              status="Verified"
              type="payment"
              size="sm"
            />
          </div>
        </div>
        <v-icon size="20" class="text-medium-emphasis">chevron-up</v-icon>
      </div>

      <div class="manage-shell__body">
        <MpAlert
          v-if="needsSetupBanner"
          tone="info"
          title="Business verification is separate from payment settings"
          class="manage-context-alert"
        >
          Use <strong>Complete setup</strong> on the payments page to submit your business and bank
          details for payouts. This page is for payment methods, payout schedule, and fraud rules —
          you can save those preferences anytime.
          <template #actions>
            <v-btn variant="outlined" size="small" class="text-none" @click="openOnboarding">
              Complete setup
            </v-btn>
          </template>
        </MpAlert>

        <MpAlert
          v-else-if="needsVerificationBanner"
          tone="warning"
          title="Verification needs your attention"
          class="manage-context-alert"
        >
          Review and resubmit your business application. Payment settings below stay available while
          you fix verification.
          <template #actions>
            <v-btn variant="outlined" size="small" class="text-none" @click="openOnboarding">
              Review application
            </v-btn>
          </template>
        </MpAlert>

        <MaropayManageSection title="Payment Methods" embedded :editable="false">
          <div class="manage-methods">
            <div class="manage-methods__group">
              <div class="manage-methods__subtitle text-body-1 font-weight-medium">Cards</div>
              <template v-for="(method, index) in cardMethods" :key="method.key">
                <v-divider v-if="index === 0" class="manage-methods__divider" />
                <div class="manage-toggle-row d-flex align-center justify-space-between">
                  <span class="text-body-2">{{ method.label }}</span>
                  <v-switch
                    :model-value="draft.paymentMethods[method.key]"
                    hide-details
                    density="compact"
                    color="primary"
                    :disabled="settingsLocked"
                    @update:model-value="togglePaymentMethod(method.key, $event)"
                  />
                </div>
                <v-divider class="manage-methods__divider" />
              </template>
            </div>

            <div class="manage-methods__group">
              <div class="manage-methods__subtitle text-body-1 font-weight-medium">Wallets</div>
              <template v-for="(method, index) in walletMethods" :key="method.key">
                <v-divider v-if="index === 0" class="manage-methods__divider" />
                <div class="manage-toggle-row d-flex align-center justify-space-between">
                  <span class="text-body-2">{{ method.label }}</span>
                  <v-switch
                    :model-value="draft.paymentMethods[method.key]"
                    hide-details
                    density="compact"
                    color="primary"
                    :disabled="settingsLocked"
                    @update:model-value="togglePaymentMethod(method.key, $event)"
                  />
                </div>
                <v-divider class="manage-methods__divider" />
              </template>
            </div>
          </div>
        </MaropayManageSection>

        <MaropayManageSection title="Payout Schedule" embedded :editable="false">
          <v-radio-group
            v-model="draft.payoutSchedule"
            hide-details
            :disabled="settingsLocked"
            class="manage-radio-group"
          >
            <v-radio
              v-for="option in payoutOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </v-radio-group>

          <v-divider class="my-4" />

          <MpFormGrid :cols="2">
            <v-text-field
              v-model="draft.minimumPayoutAmount"
              label="Minimum payout amount"
              :disabled="settingsLocked"
            />
            <v-select
              v-model="draft.settlementPeriod"
              label="Settlement period"
              :items="settlementOptions"
              :disabled="settingsLocked"
            />
          </MpFormGrid>
        </MaropayManageSection>

        <MaropayManageSection title="Fraud Prevention" embedded :editable="false">
          <div class="manage-fraud">
            <div class="manage-fraud__row d-flex align-start justify-space-between ga-4">
              <div>
                <div class="text-body-2 font-weight-medium">Decline transactions with failed CVV</div>
                <div class="text-caption text-medium-emphasis">
                  Decline card if CVV check fails at checkout
                </div>
              </div>
              <v-switch
                v-model="draft.declineFailedCvv"
                hide-details
                density="compact"
                color="primary"
                :disabled="settingsLocked"
              />
            </div>
            <v-divider />
            <div class="manage-fraud__row d-flex align-start justify-space-between ga-4">
              <div>
                <div class="text-body-2 font-weight-medium">Decline transactions with failed AVS</div>
                <div class="text-caption text-medium-emphasis">
                  Decline card if billing address doesn't match
                </div>
              </div>
              <v-switch
                v-model="draft.declineFailedAvs"
                hide-details
                density="compact"
                color="primary"
                :disabled="settingsLocked"
              />
            </div>
          </div>
        </MaropayManageSection>

        <template v-if="!showSubmittedBusinessProfile">
          <MaropayManageSection title="Account verification" embedded :editable="false">
            <MpEmptyState
              v-if="!hasBusinessDraft"
              icon="clipboard-list"
              title="Business verification not started"
              description="Submit your business, address, and bank details so Maropay can send payouts to your account."
              action-label="Complete setup"
              action-icon="arrow-right"
              @action="openOnboarding"
            />
            <div v-else class="d-flex flex-column ga-4">
              <p class="text-body-2 text-medium-emphasis mb-0">
                You started your application but haven't submitted it yet. Finish verification to
                unlock payouts — payment preferences above can still be saved.
              </p>
              <div>
                <v-btn color="primary" variant="flat" class="text-none" @click="openOnboarding">
                  Continue setup
                </v-btn>
              </div>
            </div>
          </MaropayManageSection>
        </template>

        <template v-else>
          <MaropayManageSection
            title="Business type"
            embedded
            :editable="canEditBusinessProfile"
            @edit="openOnboarding"
          >
            <p class="text-body-1 mb-0">{{ businessTypeLabel }}</p>
          </MaropayManageSection>

          <MaropayManageSection
            title="Personal Details"
            embedded
            :editable="canEditBusinessProfile"
            @edit="openOnboarding"
          >
            <MpFormGrid :cols="2">
              <MaropayManageField label="First name" :value="form.firstName" icon="user" />
              <MaropayManageField label="Last name" :value="form.lastName" icon="user" />
              <MaropayManageField
                label="Date of birth"
                :value="formatMaropayDate(form.dateOfBirth)"
                icon="calendar"
              />
              <MaropayManageField label="SSN or ITIN" :value="form.taxId" icon="shield" />
            </MpFormGrid>
          </MaropayManageSection>

          <MaropayManageSection
            title="Business Address"
            embedded
            :editable="canEditBusinessProfile"
            @edit="openOnboarding"
          >
            <div class="d-flex flex-column ga-4">
              <MaropayManageField label="Registered name" :value="entityName" icon="building-2" />
              <MaropayManageField label="Business address" :value="fullAddress" icon="map-pin" />
            </div>
          </MaropayManageSection>

          <MaropayManageSection
            title="Bank Details"
            embedded
            :editable="canEditBusinessProfile"
            @edit="openOnboarding"
          >
            <MpFormGrid :cols="2">
              <MaropayManageField
                label="Name"
                :value="form.bankAccountName || entityName"
                icon="landmark"
              />
              <MaropayManageField
                label="Account number"
                :value="maskedAccountNumber"
                icon="credit-card"
              />
            </MpFormGrid>
          </MaropayManageSection>
        </template>

        <div class="manage-shell__footer d-flex justify-end ga-2">
          <v-btn variant="text" class="text-none manage-shell__cancel" @click="cancel">Cancel</v-btn>
          <v-btn
            color="secondary"
            variant="flat"
            class="text-none manage-shell__save"
            :disabled="settingsLocked"
            @click="save"
          >
            Save
          </v-btn>
        </div>
      </div>
    </v-card>

    <v-card flat border rounded="lg" class="manage-danger">
      <div class="d-flex align-center justify-space-between ga-4 flex-wrap">
        <div class="d-flex ga-3 min-width-0">
          <div class="manage-danger__icon d-flex align-center justify-center flex-shrink-0">
            <v-icon size="16" color="error">triangle-alert</v-icon>
          </div>
          <div class="min-width-0">
            <div class="text-body-2 font-weight-bold text-error">Disconnect MaroPay</div>
            <div class="text-caption text-medium-emphasis">
              This will immediately stop accepting payments. Your pending payouts will still be processed.
            </div>
          </div>
        </div>
        <v-btn
          variant="outlined"
          color="error"
          class="text-none flex-shrink-0 manage-danger__btn"
          @click="disconnectDialog = true"
        >
          Disconnect MaroPay
        </v-btn>
      </div>
    </v-card>

    <MpConfirmDialog
      v-model="disconnectDialog"
      title="Disconnect Maropay?"
      :message="`Maropay will be removed as the checkout provider for ${channel.name}.`"
      confirm-label="Disconnect Maropay"
      danger
      :consequences="disconnectConsequences"
      @confirm="confirmDisconnect"
    />
  </div>
</template>

<style scoped>
.manage-shell {
  overflow: hidden;
}

.manage-shell__entity {
  padding: var(--mp-component-card-padding);
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.manage-shell__body {
  padding-inline: var(--mp-component-card-padding);
}

.manage-shell__body :deep(.manage-section-embedded:first-child) {
  padding-top: var(--mp-space-24);
}

.manage-context-alert {
  margin-top: var(--mp-space-24);
}

.manage-methods__group + .manage-methods__group {
  margin-top: var(--mp-space-24);
}

.manage-methods__subtitle {
  margin-bottom: var(--mp-space-8);
}

.manage-methods__divider {
  opacity: 1;
}

.manage-toggle-row {
  min-height: var(--mp-component-control-height);
  padding-block: var(--mp-space-8);
}

.manage-radio-group :deep(.v-selection-control-group) {
  gap: var(--mp-space-12);
}

.manage-fraud {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-16);
}

.manage-fraud__row {
  padding-block: var(--mp-space-4);
}

.manage-shell__footer {
  padding-block: var(--mp-space-24) var(--mp-component-card-padding);
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  margin-top: var(--mp-space-8);
}

.manage-shell__cancel {
  letter-spacing: 0.05em;
  font-weight: 700;
  text-transform: uppercase;
}

.manage-shell__save {
  letter-spacing: 0.05em;
  font-weight: 700;
  text-transform: uppercase;
  min-width: var(--mp-space-80);
}

.manage-danger {
  padding: var(--mp-component-card-padding);
  border-color: rgba(var(--v-theme-error), 0.35);
  background: rgb(var(--v-theme-surface));
}

.manage-danger__icon {
  width: var(--mp-space-32);
  height: var(--mp-space-32);
  border-radius: var(--mp-radius-8);
  background: rgba(var(--v-theme-error), 0.12);
}

.manage-danger__btn {
  min-width: 172px;
}
</style>
