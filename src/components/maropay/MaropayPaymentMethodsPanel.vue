<script setup lang="ts">
import { computed } from 'vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'

const props = defineProps<{
  acceptCards: boolean
  acceptApplePay: boolean
  acceptGooglePay: boolean
  acceptBnpl: boolean
  configured: boolean
  /** Verified MaroPay account — methods are live at checkout, no setup empty state. */
  verified?: boolean
  /** Connected Maropay — show method tiles below the empty state. */
  showSuggestions?: boolean
  /** Payments paused (under review / action required) — tiles stay off and non-interactive. */
  locked?: boolean
  /** Setup still in progress — empty state stays actionable; suggested toggles preview as on. */
  pendingSetup?: boolean
}>()

const emit = defineEmits<{
  'update:acceptCards': [value: boolean]
  'update:acceptApplePay': [value: boolean]
  'update:acceptGooglePay': [value: boolean]
  'update:acceptBnpl': [value: boolean]
  configure: []
  manage: []
}>()

const suggestedMethods = [
  { id: 'cards', title: 'Credit & Debit Cards', subtitle: 'Visa, Mastercard, Amex', badge: 'VISA', key: 'acceptCards' as const },
  { id: 'apple', title: 'Apple Pay', subtitle: 'One-tap checkout', badge: 'Pay', key: 'acceptApplePay' as const },
  { id: 'google', title: 'Google Pay', subtitle: 'One-tap checkout', badge: 'G Pay', key: 'acceptGooglePay' as const },
]

function toggleMethod(key: 'acceptCards' | 'acceptApplePay' | 'acceptGooglePay', value: boolean | null) {
  const next = Boolean(value)
  if (key === 'acceptCards') emit('update:acceptCards', next)
  if (key === 'acceptApplePay') emit('update:acceptApplePay', next)
  if (key === 'acceptGooglePay') emit('update:acceptGooglePay', next)
}

function isEnabled(key: 'acceptCards' | 'acceptApplePay' | 'acceptGooglePay') {
  if (props.locked) return false
  if (props.pendingSetup && !props.configured) return true
  if (key === 'acceptCards') return props.acceptCards
  if (key === 'acceptApplePay') return props.acceptApplePay
  return props.acceptGooglePay
}

const showEmptyState = computed(() => !props.configured && !props.verified)

const methodsListLabel = computed(() => {
  if (props.locked) return 'Payment methods (paused until approval)'
  if (props.verified || props.configured) return 'Payment methods at checkout'
  return 'Suggested methods to enable'
})
</script>

<template>
  <div class="d-flex flex-column ga-4">
    <div class="d-flex align-start justify-space-between flex-wrap ga-3">
      <div>
        <MpSectionHeader title="Accepted payment methods" />
        <p class="text-body-2 text-medium-emphasis mt-n2">
          {{
            locked
              ? 'Checkout payment methods unlock after MaroPay approves your application.'
              : verified
                ? 'These methods are active for customers at checkout. Manage all options in MaroPay settings.'
                : 'Choose which methods customers can use at checkout.'
          }}
        </p>
      </div>
      <v-btn
        v-if="verified"
        variant="text"
        class="text-none flex-shrink-0"
        @click="emit('manage')"
      >
        Manage payment methods
      </v-btn>
    </div>

    <v-card
      v-if="showEmptyState"
      flat
      border
      rounded="lg"
      class="methods-empty"
      :class="{
        'methods-empty--locked': locked,
        'methods-empty--pending': pendingSetup,
      }"
    >
      <MpEmptyState
        icon="credit-card"
        title="No payment methods configured"
        description="Add at least one payment method so customers can complete purchases at checkout."
        :action-label="locked ? undefined : 'Add payment methods'"
        action-icon="plus"
        @action="emit('configure')"
      />
    </v-card>

    <template v-if="showSuggestions && (configured || verified || pendingSetup)">
      <v-divider v-if="showEmptyState" class="methods-divider" />
      <p class="text-caption font-weight-bold text-uppercase text-medium-emphasis mb-0">
        {{ methodsListLabel }}
      </p>
      <div class="methods-grid">
        <v-card
          v-for="method in suggestedMethods"
          :key="method.id"
          flat
          border
          rounded="lg"
          class="method-tile d-flex align-center ga-3 pa-4"
          :class="{ 'method-tile--locked': locked }"
        >
          <div class="method-tile__badge d-flex align-center justify-center">
            <span class="text-caption font-weight-bold">{{ method.badge }}</span>
          </div>
          <div class="flex-grow-1 min-width-0">
            <div class="text-body-2 font-weight-medium">{{ method.title }}</div>
            <div class="text-caption text-medium-emphasis">{{ method.subtitle }}</div>
          </div>
          <v-switch
            :model-value="isEnabled(method.key)"
            hide-details
            density="compact"
            :disabled="locked || verified"
            @update:model-value="toggleMethod(method.key, $event)"
          />
        </v-card>
      </div>
    </template>
  </div>
</template>

<style scoped>
.methods-empty {
  padding: var(--mp-component-card-padding);
  background: var(--surface-container-low, var(--surface-container));
}

.methods-empty--locked {
  opacity: 0.72;
}

.methods-empty--pending :deep(.mp-empty-state__action) {
  background: rgb(var(--v-theme-secondary));
  color: rgb(var(--v-theme-on-secondary));
}

.methods-divider {
  margin-block: var(--mp-space-4);
}

.methods-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--mp-space-12);
}

.method-tile__badge {
  width: var(--mp-space-48);
  height: var(--mp-component-control-height);
  border-radius: var(--mp-radius-8);
  background: var(--surface-container);
  flex-shrink: 0;
}

.method-tile--locked {
  opacity: 0.55;
  pointer-events: none;
}

@media (max-width: 960px) {
  .methods-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
