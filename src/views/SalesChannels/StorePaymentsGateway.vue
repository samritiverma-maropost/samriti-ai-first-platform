<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { useStoreSettingsStore } from '@/stores/useStoreSettings'
import {
  hasMaropayCheckoutMethodsConfigured,
  isMaropayAccountVerified,
  useMaropayOnboardingStore,
} from '@/stores/useMaropayOnboarding'
import { useToast } from '@/composables/useToast'
import { showMaropayToast } from '@/composables/useMaropayToast'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MaropayHeroCard from '@/components/maropay/MaropayHeroCard.vue'
import MaropayPaymentMethodsPanel from '@/components/maropay/MaropayPaymentMethodsPanel.vue'
import MaropayReviewProgressDialog from '@/components/maropay/MaropayReviewProgressDialog.vue'
import MaropayStatusBanner from '@/components/maropay/MaropayStatusBanner.vue'

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
const payments = computed(() => settingsStore.bundleFor(channelId.value, domain.value).payments)
const maropay = computed(() => maropayStore.stateFor(channelId.value))

const activeTab = ref('maropay')
const progressDialog = ref(false)
const disconnectDialog = ref(false)

const tabs = [
  { label: 'Maropay', key: 'maropay' },
  { label: 'Payment gateway', key: 'gateway' },
  { label: 'Manual payments', key: 'manual' },
]

const backTo = computed(() => ({
  name: 'StoreSettingsLanding',
  params: { accountId: accountId.value, channelId: channelId.value },
}))

const isConnected = computed(() =>
  maropay.value.status !== 'not_connected' && maropay.value.status !== 'connecting',
)

const isVerified = computed(() => isMaropayAccountVerified(maropay.value.status))

const methodsConfigured = computed(() => hasMaropayCheckoutMethodsConfigured(maropay.value))

const checkoutAcceptCards = computed(() => {
  if (isVerified.value) {
    const methods = maropay.value.paymentMethods
    return methods.visa || methods.mastercard || methods.amex
  }
  return payments.value.acceptCards
})

const checkoutAcceptApplePay = computed(() =>
  isVerified.value ? maropay.value.paymentMethods.applePay : payments.value.acceptApplePay,
)

const checkoutAcceptGooglePay = computed(() =>
  isVerified.value ? maropay.value.paymentMethods.googlePay : payments.value.acceptGooglePay,
)

/** Methods belong on Manage until approved; landing only summarizes live or locked checkout state. */
const showAcceptedMethodsOnGateway = computed(
  () => isVerified.value || maropay.value.status === 'under_review',
)

const statusChip = computed(() => {
  switch (maropay.value.status) {
    case 'active': return 'Connected'
    case 'under_review': return 'Under review'
    case 'action_required': return 'Action required'
    case 'setup_required': return 'Setup required'
    case 'connecting': return 'Connecting'
    default: return 'Not connected'
  }
})

const disconnectConsequences = [
  'Checkout will stop accepting card and wallet payments on this store.',
  'Your Maropay application and bank details will be removed.',
  'You can reconnect and reapply at any time.',
]

function flushPendingToast() {
  const key = maropayStore.consumePendingToast(channelId.value)
  if (key) showMaropayToast(key)
}

/** Always land on the Maropay tab with a fresh hero when entering this page. */
function refreshMaropayLanding() {
  activeTab.value = 'maropay'
  progressDialog.value = false
}

onMounted(() => {
  refreshMaropayLanding()
  flushPendingToast()
})

onBeforeRouteUpdate((to) => {
  if (to.name === 'StorePaymentsGateway') {
    refreshMaropayLanding()
    flushPendingToast()
  }
})

watch(channelId, () => {
  refreshMaropayLanding()
  flushPendingToast()
})

watch(
  () => maropay.value.pendingToast,
  (key) => {
    if (key) flushPendingToast()
  },
)

async function connectMaropay() {
  await maropayStore.startConnect(channelId.value)
  settingsStore.connectMaropay(channelId.value, domain.value)
  flushPendingToast()
}

function openOnboarding() {
  router.push({
    name: 'MaropayOnboarding',
    params: { accountId: accountId.value, channelId: channelId.value },
  })
}

function openManage() {
  if (!isConnected.value) return
  router.push({
    name: 'MaropayManageSettings',
    params: { accountId: accountId.value, channelId: channelId.value },
  })
}

function handleBannerPrimary() {
  if (maropay.value.status === 'setup_required' || maropay.value.status === 'action_required') {
    openOnboarding()
    return
  }
  if (maropay.value.status === 'under_review') {
    progressDialog.value = true
  }
}

function configureMethods() {
  if (maropay.value.status === 'active') {
    maropayStore.configureMethods(channelId.value)
    showMaropayToast('methods_enabled')
    return
  }
  if (maropay.value.status === 'under_review') {
    toast.info('Payment methods unlock after Maropay approves your application')
    return
  }
  if (isConnected.value) {
    openManage()
  }
}

function confirmDisconnect() {
  maropayStore.disconnect(channelId.value)
  settingsStore.disconnectMaropay(channelId.value, domain.value)
  toast.success('Maropay disconnected from this store')
}

function updatePayment(patch: Partial<typeof payments.value>) {
  settingsStore.updatePayments(channelId.value, patch, domain.value)
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

  <div v-else class="d-flex flex-column ga-5">
    <MpPageHeader
      :eyebrow="`Sales channels · ${channel.name} · Store settings · Payments`"
      title="Payments"
      subtitle="Configure checkout payments and payout settings for this store."
      :back-to="backTo"
    >
      <template #actions>
        <MpStatusChip :status="statusChip" type="payment" size="sm" />
        <v-btn
          v-if="isConnected"
          variant="text"
          color="error"
          class="text-none"
          @click="disconnectDialog = true"
        >
          Disconnect
        </v-btn>
      </template>
    </MpPageHeader>

    <MpFilterTabs v-model="activeTab" :tabs="tabs" aria-label="Payments configuration tabs" />

    <template v-if="activeTab === 'maropay'">
      <MaropayStatusBanner
        :status="maropay.status"
        @primary="handleBannerPrimary"
        @secondary="toast.info('Support team notified — we will email you within 1 business day.')"
      />

      <MaropayHeroCard
        :key="`${channelId}-${maropay.status}`"
        :status="maropay.status"
        :loading="maropay.status === 'connecting'"
        @connect="connectMaropay"
        @manage="openManage"
        @view-payouts="toast.info('Payout history opens in Maropay (demo)')"
      />

      <MaropayPaymentMethodsPanel
        v-if="showAcceptedMethodsOnGateway"
        :accept-cards="checkoutAcceptCards"
        :accept-apple-pay="checkoutAcceptApplePay"
        :accept-google-pay="checkoutAcceptGooglePay"
        :accept-bnpl="payments.acceptBnpl"
        :configured="methodsConfigured || maropay.status === 'under_review'"
        :verified="isVerified"
        :show-suggestions="true"
        :locked="maropay.status === 'under_review'"
        @update:accept-cards="updatePayment({ acceptCards: $event })"
        @update:accept-apple-pay="updatePayment({ acceptApplePay: $event })"
        @update:accept-google-pay="updatePayment({ acceptGooglePay: $event })"
        @update:accept-bnpl="updatePayment({ acceptBnpl: $event })"
        @configure="configureMethods"
        @manage="openManage"
      />
    </template>

    <v-card v-else-if="activeTab === 'gateway'" flat border rounded="lg" class="pa-6">
      <MpEmptyState
        icon="wallet"
        title="Third-party payment gateway"
        description="Connect Stripe or PayPal as an alternative checkout provider."
        action-label="Coming soon"
      />
    </v-card>

    <v-card v-else flat border rounded="lg" class="pa-6">
      <MpEmptyState
        icon="banknote"
        title="Manual payments"
        description="Let customers pay by bank transfer, cheque, or cash on delivery."
        action-label="Coming soon"
      />
    </v-card>

    <MaropayReviewProgressDialog v-model="progressDialog" />

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
