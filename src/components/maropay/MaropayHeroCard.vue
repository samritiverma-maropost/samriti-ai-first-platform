<script setup lang="ts">
import MaropayLogoMark from '@/components/maropay/MaropayLogoMark.vue'
import type { MaropayLifecycleStatus } from '@/stores/useMaropayOnboarding'

defineProps<{
  status: MaropayLifecycleStatus
  loading?: boolean
}>()

const emit = defineEmits<{
  connect: []
  manage: []
  viewPayouts: []
}>()

const isConnected = (status: MaropayLifecycleStatus) =>
  status !== 'not_connected' && status !== 'connecting'
</script>

<template>
  <v-card flat border rounded="lg" class="maropay-hero">
    <div class="maropay-hero__inner d-flex flex-column ga-4">
      <div class="d-flex align-center justify-space-between flex-wrap ga-3">
        <div class="maropay-hero__brand d-flex align-center ga-4">
          <MaropayLogoMark />
          <h2 class="maropay-hero__title">
            {{ isConnected(status) ? 'Maropay' : 'Activate Maropay' }}
          </h2>
        </div>
        <div v-if="isConnected(status)" class="d-flex flex-wrap ga-2">
          <v-btn
            v-if="status === 'active'"
            variant="outlined"
            class="text-none"
            @click="emit('viewPayouts')"
          >
            View payouts
          </v-btn>
          <v-btn
            color="secondary"
            variant="flat"
            class="text-none"
            @click="emit('manage')"
          >
            {{ status === 'setup_required' ? 'Manage payments' : 'Manage' }}
          </v-btn>
        </div>
      </div>

      <p class="maropay-hero__description text-body-2 text-medium-emphasis mb-0">
        <template v-if="status === 'setup_required'">
          Configure payment methods and payout preferences while you complete business verification.
        </template>
        <template v-else-if="isConnected(status)">
          Native payment gateway for Maropost · No transaction fees
        </template>
        <template v-else>
          Accept cards and local payment methods with settlement to your linked bank account.
          A short verification keeps your business and customers protected.
        </template>
      </p>

      <div v-if="loading" class="d-flex align-center ga-3">
        <v-progress-circular indeterminate size="20" width="2" color="primary" />
        <span class="text-body-2 text-medium-emphasis">Connecting Maropay…</span>
      </div>

      <v-btn
        v-else-if="!isConnected(status)"
        color="secondary"
        variant="flat"
        class="maropay-hero__connect text-none align-self-start"
        @click="emit('connect')"
      >
        Connect
      </v-btn>
    </div>
  </v-card>
</template>

<style scoped>
.maropay-hero {
  padding: var(--mp-component-card-padding);
}

.maropay-hero__inner {
  max-width: var(--mp-component-state-measure-wide);
}

.maropay-hero__brand {
  min-width: 0;
}

.maropay-hero__title {
  font-size: var(--mp-fontSize-28);
  font-weight: 500;
  line-height: 1.15;
  margin: 0;
  color: rgb(var(--v-theme-secondary));
}

.maropay-hero__description {
  max-width: 42rem;
}

.maropay-hero__connect {
  min-width: var(--mp-space-80);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
</style>
