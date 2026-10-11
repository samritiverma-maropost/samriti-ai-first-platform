<script setup lang="ts">
import maropayLogoUrl from '@/assets/brand/maropay-logo.svg?url'

withDefaults(defineProps<{
  height?: number
  alt?: string
}>(), {
  height: 33,
  alt: 'Maropay',
})
</script>

<template>
  <img
    :src="maropayLogoUrl"
    :alt="alt"
    class="maropay-logo"
    :style="{ height: `${height}px` }"
  />
</template>

<style scoped>
.maropay-logo {
  width: auto;
  display: block;
}
</style>
