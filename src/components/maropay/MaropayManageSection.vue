<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  icon?: string
  editable?: boolean
  /** Nested inside the manage shell card — no outer card wrapper. */
  embedded?: boolean
}>()

const emit = defineEmits<{
  edit: []
}>()
</script>

<template>
  <component
    :is="embedded ? 'div' : 'v-card'"
    :class="embedded ? 'manage-section-embedded' : 'manage-section'"
    v-bind="embedded ? {} : { flat: true, border: true, rounded: 'lg' }"
  >
    <div class="manage-section__head d-flex align-center justify-space-between">
      <h3 class="manage-section__title">{{ title }}</h3>
      <v-btn
        v-if="editable !== false"
        icon="pencil"
        variant="text"
        size="small"
        aria-label="Edit section"
        @click="emit('edit')"
      />
    </div>
    <p v-if="description" class="text-body-2 text-medium-emphasis manage-section__description">
      {{ description }}
    </p>
    <slot />
  </component>
</template>

<style scoped>
.manage-section {
  padding: var(--mp-component-card-padding);
}

.manage-section-embedded {
  padding-block: var(--mp-space-24);
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.manage-section-embedded:first-child {
  border-top: none;
  padding-top: 0;
}

.manage-section__head {
  min-height: var(--mp-component-control-height);
  margin-bottom: var(--mp-space-12);
}

.manage-section__title {
  font-size: var(--mp-font-size-20);
  font-weight: 600;
  line-height: 1.2;
  margin: 0;
  color: rgba(var(--v-theme-on-surface), 0.87);
}

.manage-section__description {
  margin: calc(var(--mp-space-8) * -1) 0 var(--mp-space-16);
}
</style>
