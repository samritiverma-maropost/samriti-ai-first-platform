<script setup lang="ts">
defineProps<{
  label: string
  value: string
  icon?: string
}>()
</script>

<template>
  <div class="manage-field d-flex ga-3">
    <v-avatar v-if="icon" color="primary" variant="tonal" size="24" rounded="lg" class="manage-field__icon flex-shrink-0 mt-1">
      <v-icon size="14">{{ icon }}</v-icon>
    </v-avatar>
    <div class="min-width-0">
      <div class="manage-field__label text-caption text-medium-emphasis">{{ label }}</div>
      <div class="manage-field__value text-body-2">{{ value || '—' }}</div>
    </div>
  </div>
</template>

<style scoped>
.manage-field__icon {
  margin-top: var(--mp-space-2);
}

.manage-field__label {
  line-height: 1.3;
}

.manage-field__value {
  font-weight: 500;
  line-height: 1.4;
}
</style>
