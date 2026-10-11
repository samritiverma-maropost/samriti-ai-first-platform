<script setup lang="ts">
import MpDialog from '@/components/MpDialog.vue'

defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const reviewItems = [
  'Business information',
  'Bank account details',
  'Identity documents',
  'Beneficial owner information',
]

const nextSteps = [
  'Review complete — you will receive an email immediately',
  'If we need anything — you will see an action required alert',
  'Once verified — add your payment method to go live',
]

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <MpDialog
    :model-value="modelValue"
    title="Application under review"
    size="md"
    flush
    class="maropay-review-dialog"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="review-progress">
      <div class="review-progress__hero d-flex justify-center">
        <div class="review-progress__hero-icon" aria-hidden="true">
          <img
            src="/assets/maropay/review-hero-icon.svg"
            alt=""
            width="33"
            height="33"
            class="review-progress__hero-icon-img"
          />
        </div>
      </div>

      <div class="review-progress__intro text-center">
        <h2 class="review-progress__title">Application under review</h2>
        <p class="review-progress__subtitle text-medium-emphasis mb-0">
          We have received everything. Our team is reviewing your business details. This typically takes
          1–2 business days.
        </p>
      </div>

      <p class="review-progress__confirmation" role="status">
        Confirmation sent to your registered email
      </p>

      <v-divider class="review-progress__divider" />

      <section class="review-progress__section">
        <h3 class="review-progress__section-title">What we are reviewing</h3>
        <ul class="review-progress__list">
          <li
            v-for="item in reviewItems"
            :key="item"
            class="review-progress__list-item d-flex align-center ga-3"
          >
            <span class="review-progress__item-icon flex-shrink-0" aria-hidden="true">
              <img
                src="/assets/maropay/review-item-icon.svg"
                alt=""
                width="10"
                height="10"
                class="review-progress__item-icon-img"
              />
            </span>
            <span class="text-body-2">{{ item }}</span>
          </li>
        </ul>
      </section>

      <v-divider class="review-progress__divider" />

      <section class="review-progress__section">
        <h3 class="review-progress__section-title">What happens next</h3>
        <ol class="review-progress__steps">
          <li v-for="(step, index) in nextSteps" :key="step" class="review-progress__step d-flex ga-3">
            <span class="review-progress__step-index flex-shrink-0">{{ index + 1 }}</span>
            <span class="text-body-2 text-medium-emphasis">{{ step }}</span>
          </li>
        </ol>
      </section>
    </div>

    <template #footer>
      <div class="review-progress__footer w-100 d-flex justify-center">
        <v-btn color="secondary" variant="flat" class="text-none review-progress__ok" @click="close">
          OK
        </v-btn>
      </div>
    </template>
  </MpDialog>
</template>

<style scoped>
/* Body owns the visible title — hide the shell header band entirely. */
.maropay-review-dialog :deep(.mp-dialog__header),
.maropay-review-dialog :deep(.mp-dialog__header + .v-divider) {
  display: none;
}

.review-progress {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-20);
  padding: var(--mp-space-4) var(--mp-component-dialog-padding) var(--mp-space-4);
}

.review-progress__hero-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--mp-space-64);
  height: var(--mp-space-64);
  border-radius: var(--mp-radius-full);
  background: var(--warn-soft);
}

.review-progress__hero-icon-img {
  display: block;
  width: 33px;
  height: 33px;
}

.review-progress__title {
  font-size: var(--mp-fontSize-20);
  font-weight: 600;
  line-height: 1.2;
  margin: 0 0 var(--mp-space-8);
  color: rgb(var(--v-theme-on-surface));
}

.review-progress__subtitle {
  font-size: var(--mp-fontSize-15);
  line-height: 1.5;
  max-width: 29rem;
  margin-inline: auto;
}

.review-progress__confirmation {
  margin: 0;
  padding: var(--mp-space-10) var(--mp-space-16);
  border-radius: var(--mp-radius-8);
  background: var(--accent-container);
  color: var(--accent-on-container);
  font-size: var(--mp-fontSize-13);
  line-height: 1.4;
  text-align: center;
}

.review-progress__divider {
  opacity: 1;
  border-color: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 12%, transparent);
}

.review-progress__section-title {
  font-size: var(--mp-fontSize-16);
  font-weight: 500;
  line-height: 1.5;
  margin: 0 0 var(--mp-space-12);
  color: rgb(var(--v-theme-on-surface));
}

.review-progress__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-16);
}

.review-progress__item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--mp-space-20);
  height: var(--mp-space-20);
  border-radius: var(--mp-radius-full);
  background: var(--warn-soft);
}

.review-progress__item-icon-img {
  display: block;
  width: 10px;
  height: 10px;
}

.review-progress__steps {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-16);
}

.review-progress__step-index {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--mp-space-24);
  height: var(--mp-space-24);
  border-radius: var(--mp-radius-10);
  background: var(--surface-container);
  font-size: var(--mp-fontSize-11);
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.65);
  line-height: 1;
}

.review-progress__ok {
  min-width: var(--mp-space-80);
  letter-spacing: 0.05em;
  font-weight: 700;
}

.maropay-review-dialog :deep(.mp-dialog__footer) {
  justify-content: center;
}
</style>
