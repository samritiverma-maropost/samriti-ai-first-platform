<script setup lang="ts">
import { computed } from 'vue'
import { NAVIGATION_E2E_STEPS } from '@/constants/navigationDaVinci'

const props = defineProps<{
  step: number
  showComplete?: boolean
}>()

const emit = defineEmits<{
  restart: []
}>()

const current = computed(
  () => NAVIGATION_E2E_STEPS.find((s) => s.id === props.step) ?? NAVIGATION_E2E_STEPS[0],
)

function stepClass(id: number) {
  const done = id < props.step || (props.showComplete && id <= 7)
  const active = id === props.step && !props.showComplete
  return { done, active }
}
</script>

<template>
  <div class="nav-e2e-journey" role="navigation" aria-label="End-to-end journey">
    <div class="nav-e2e-journey__head">
      <div>
        <strong>Da Vinci Menu Builder</strong>
        · PRD Journey D (Phase 2 on Phase 1 editor)
      </div>
      <button type="button" class="nav-e2e-reset" @click="emit('restart')">Restart journey</button>
    </div>
    <ol class="nav-e2e-steps">
      <li
        v-for="s in NAVIGATION_E2E_STEPS"
        :key="s.id"
        :class="{ done: stepClass(s.id).done, active: stepClass(s.id).active }"
      >
        <span class="nav-e2e-n">{{ s.id }}</span>
        <span>{{ s.title }}</span>
      </li>
    </ol>
    <p class="nav-e2e-now">
      <span class="nav-e2e-now-label">Now:</span>
      {{ current.now }}
    </p>
    <p v-if="showComplete" class="nav-e2e-done">
      <v-icon size="20">circle-check</v-icon>
      End-to-end complete — your menu is on the list below.
    </p>
  </div>
</template>

<style scoped lang="scss">
@use '@/components/saleschannels/navigation/navigationDaVinciFeature.scss';
</style>
