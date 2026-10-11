<script setup lang="ts">
import { computed } from 'vue'
import type { MaropayLifecycleStatus } from '@/stores/useMaropayOnboarding'

const props = defineProps<{
  status: MaropayLifecycleStatus
}>()

const emit = defineEmits<{
  primary: []
  secondary: []
}>()

const tone = computed(() => {
  if (props.status === 'action_required') return 'error'
  if (props.status === 'setup_required' || props.status === 'under_review') return 'warning'
  return null
})

const statusLabel = computed(() => {
  switch (props.status) {
    case 'setup_required':
      return 'Setup required'
    case 'under_review':
      return 'Under review'
    case 'action_required':
      return 'Action required'
    default:
      return ''
  }
})

const icon = computed(() => {
  switch (props.status) {
    case 'setup_required':
      return 'clipboard-list'
    case 'under_review':
      return 'clock'
    case 'action_required':
      return 'circle-alert'
    default:
      return 'triangle-alert'
  }
})

const title = computed(() => {
  switch (props.status) {
    case 'setup_required':
      return 'Complete your account setup to unlock payouts'
    case 'under_review':
      return 'Your Maropay account is under review'
    case 'action_required':
      return 'Action required — your verification was unsuccessful'
    default:
      return ''
  }
})

const description = computed(() => {
  switch (props.status) {
    case 'setup_required':
      return 'Fill in your business details and bank account so Maropay can send money directly to your bank. This takes about 10 minutes.'
    case 'under_review':
      return "We're verifying your business. Payments are paused until approval. Your store is fully set up and ready."
    case 'action_required':
      return "We couldn't verify your identity. Review your details below, correct any issues, and resubmit. Allow 1–3 business days for reprocessing."
    default:
      return ''
  }
})
</script>

<template>
  <div
    v-if="tone"
    class="maropay-banner"
    :class="[`maropay-banner--${tone}`, `maropay-banner--${status}`]"
    role="alert"
    aria-live="assertive"
  >
    <div class="maropay-banner__icon-wrap" aria-hidden="true">
      <v-icon size="18">{{ icon }}</v-icon>
    </div>

    <div class="maropay-banner__body min-width-0">
      <div class="maropay-banner__eyebrow">{{ statusLabel }}</div>
      <div class="maropay-banner__title">{{ title }}</div>
      <p class="maropay-banner__message mb-0">{{ description }}</p>
    </div>

    <div class="maropay-banner__actions d-flex flex-wrap ga-2">
      <v-btn
        v-if="status === 'setup_required'"
        variant="flat"
        class="maropay-banner__cta text-none"
        @click="emit('primary')"
      >
        Complete business setup
      </v-btn>
      <v-btn
        v-else-if="status === 'under_review'"
        variant="flat"
        class="maropay-banner__cta text-none"
        @click="emit('primary')"
      >
        View progress
      </v-btn>
      <template v-else-if="status === 'action_required'">
        <v-btn
          variant="flat"
          class="maropay-banner__cta text-none"
          @click="emit('primary')"
        >
        Action required
      </v-btn>
        <v-btn
          variant="text"
          class="maropay-banner__cta-secondary text-none"
          @click="emit('secondary')"
        >
          Contact support
        </v-btn>
      </template>
    </div>
  </div>
</template>

<style scoped>
.maropay-banner {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: var(--mp-space-12);
  padding: var(--mp-space-16) var(--mp-space-16) var(--mp-space-16) var(--mp-space-20);
  border-radius: var(--mp-radius-12);
  font-size: var(--mp-fontSize-14);
  line-height: 1.5;
  border-width: 1px;
  border-style: solid;
  position: relative;
  overflow: hidden;
}

.maropay-banner::before {
  content: '';
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  width: var(--mp-space-4);
}

.maropay-banner--warning {
  background: rgb(var(--v-theme-warning-container));
  color: rgb(var(--v-theme-on-warning-container));
  border-color: color-mix(in srgb, rgb(var(--v-theme-warning)) 35%, transparent);
}

.maropay-banner--warning::before {
  background: rgb(var(--v-theme-warning));
}

.maropay-banner--under_review {
  background: color-mix(in srgb, rgb(var(--v-theme-warning-container)) 88%, rgb(var(--v-theme-warning)) 12%);
}

.maropay-banner--error {
  background: rgb(var(--v-theme-error-container));
  color: rgb(var(--v-theme-on-error-container));
  border-color: color-mix(in srgb, rgb(var(--v-theme-error)) 35%, transparent);
}

.maropay-banner--error::before {
  background: rgb(var(--v-theme-error));
}

.maropay-banner__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: var(--mp-space-40);
  height: var(--mp-space-40);
  border-radius: var(--mp-radius-full);
  margin-top: var(--mp-space-2);
}

.maropay-banner--warning .maropay-banner__icon-wrap {
  background: color-mix(in srgb, rgb(var(--v-theme-warning)) 18%, rgb(var(--v-theme-warning-container)));
  color: rgb(var(--v-theme-warning));
}

.maropay-banner--error .maropay-banner__icon-wrap {
  background: color-mix(in srgb, rgb(var(--v-theme-error)) 18%, rgb(var(--v-theme-error-container)));
  color: rgb(var(--v-theme-error));
}

.maropay-banner__body {
  flex: 1 1 16rem;
}

.maropay-banner__eyebrow {
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.9;
  margin-bottom: var(--mp-space-2);
}

.maropay-banner__title {
  font-weight: var(--mp-fontWeight-semibold);
  font-size: var(--mp-fontSize-16);
  line-height: 1.35;
}

.maropay-banner__message {
  margin-top: var(--mp-space-4);
  opacity: 0.9;
}

.maropay-banner__actions {
  flex-shrink: 0;
  align-self: center;
  margin-left: auto;
}

.maropay-banner__cta {
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  border: 1px solid color-mix(in srgb, currentColor 12%, transparent);
}

.maropay-banner__cta-secondary {
  color: inherit;
  opacity: 0.88;
}
</style>
