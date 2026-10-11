<script setup lang="ts">
import { computed } from 'vue'
import { useMaropaySnackbar } from '@/composables/useMaropaySnackbar'

const { snackbar, dismiss } = useMaropaySnackbar()

const icon = computed(() => {
  switch (snackbar.value?.tone) {
    case 'error':
      return 'circle-alert'
    case 'info':
      return 'info'
    default:
      return 'circle-check'
  }
})

const isSingleLine = computed(() => Boolean(snackbar.value && !snackbar.value.title))
</script>

<template>
  <Teleport to="body">
    <div class="maropay-snackbar-host" aria-live="polite">
      <Transition name="maropay-snackbar">
        <div
          v-if="snackbar && !snackbar.leaving"
          class="maropay-snackbar"
          :class="`maropay-snackbar--${snackbar.tone}`"
          :role="snackbar.tone === 'error' ? 'alert' : 'status'"
        >
          <v-icon size="20" class="maropay-snackbar__icon" aria-hidden="true">{{ icon }}</v-icon>

          <div class="maropay-snackbar__body">
            <div
              v-if="snackbar.title"
              class="maropay-snackbar__title"
            >
              {{ snackbar.title }}
            </div>
            <div
              class="maropay-snackbar__message"
              :class="{ 'maropay-snackbar__message--solo': isSingleLine }"
            >
              {{ snackbar.message }}
            </div>
          </div>

          <button
            type="button"
            class="maropay-snackbar__close"
            aria-label="Dismiss notification"
            @click="dismiss"
          >
            <v-icon size="20">x</v-icon>
          </button>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<style scoped>
.maropay-snackbar-host {
  position: fixed;
  top: calc(var(--mp-layout-appbarHeight) + var(--mp-space-12));
  left: 50%;
  transform: translateX(-50%);
  z-index: calc(var(--mp-zIndex-toast, 2400) + 1);
  width: min(432px, calc(100vw - var(--mp-space-32)));
  pointer-events: none;
}

.maropay-snackbar {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: start;
  gap: var(--mp-space-12);
  padding: var(--mp-space-12);
  border-radius: var(--mp-radius-4);
  pointer-events: auto;
  box-shadow: var(--mp-shadow-md);
}

.maropay-snackbar--success {
  background: var(--pos-soft);
  color: var(--pos-ink);
}

.maropay-snackbar--error {
  background: var(--neg-soft);
  color: var(--neg-ink);
}

.maropay-snackbar--info {
  background: var(--accent-container);
  color: var(--accent-on-container);
}

.maropay-snackbar__icon {
  flex-shrink: 0;
  margin-top: var(--mp-space-2);
}

.maropay-snackbar__body {
  min-width: 0;
}

.maropay-snackbar__title {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  line-height: 1.5;
}

.maropay-snackbar__message {
  font-size: var(--mp-fontSize-14);
  line-height: 1.43;
  opacity: 0.92;
}

.maropay-snackbar__message--solo {
  font-weight: var(--mp-fontWeight-medium);
  opacity: 1;
}

.maropay-snackbar__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--mp-space-32);
  height: var(--mp-space-32);
  margin: calc(-1 * var(--mp-space-4)) calc(-1 * var(--mp-space-4)) 0 0;
  border: 0;
  border-radius: var(--mp-radius-full);
  background: transparent;
  color: inherit;
  opacity: 0.72;
  cursor: pointer;
  appearance: none;
}

.maropay-snackbar__close:hover,
.maropay-snackbar__close:focus-visible {
  opacity: 1;
  background: color-mix(in srgb, currentColor 8%, transparent);
}

.maropay-snackbar-enter-active,
.maropay-snackbar-leave-active {
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}

.maropay-snackbar-enter-from,
.maropay-snackbar-leave-to {
  opacity: 0;
  transform: translateY(calc(-1 * var(--mp-space-8)));
}
</style>
