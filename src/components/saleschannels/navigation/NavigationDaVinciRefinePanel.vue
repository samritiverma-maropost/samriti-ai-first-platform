<script setup lang="ts">
import { ref } from 'vue'
import MpFormSection from '@/components/MpFormSection.vue'

const emit = defineEmits<{
  refine: [kind: 'simpler' | 'sale' | 'brand' | 'custom']
  regenerate: []
  discard: []
}>()

const prompt = ref('')

function applyCustom() {
  emit('refine', 'custom')
}
</script>

<template>
  <v-card flat border rounded="lg" class="details-panel h-100 d-flex flex-column">
    <div class="details-panel__body d-flex flex-column ga-4 flex-grow-1">
      <MpFormSection
        title="Menu draft"
        description="Da Vinci filled the structure from your catalog. Select a row to edit, or apply a quick change."
      />

      <div class="nav-dv-assist">
        <div class="nav-dv-assist__chips">
          <button type="button" @click="emit('refine', 'simpler')">Make simpler</button>
          <button type="button" @click="emit('refine', 'sale')">Highlight sale</button>
          <button type="button" @click="emit('refine', 'brand')">Group by brand</button>
        </div>
        <div class="nav-dv-assist__refine">
          <v-text-field
            v-model="prompt"
            placeholder="Describe a change…"
            hide-details
            density="comfortable"
            aria-label="Describe a menu change"
          />
          <v-btn color="primary" variant="flat" class="text-none" @click="applyCustom">
            Apply
          </v-btn>
        </div>
        <p class="text-body-2 mt-3 mb-0">
          <button type="button" class="nav-dv-link text-none" @click="emit('regenerate')">Regenerate</button>
          ·
          <button type="button" class="nav-dv-link text-none" @click="emit('discard')">Discard draft</button>
        </p>
      </div>
    </div>
  </v-card>
</template>

<style scoped lang="scss">
@use '@/components/saleschannels/navigation/navigationDaVinciFeature.scss';

.details-panel__body {
  padding: var(--mp-component-card-padding);
  min-height: 0;
  overflow-y: auto;
}

.nav-dv-link {
  border: 0;
  background: none;
  padding: 0;
  font: inherit;
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
  cursor: pointer;
}
</style>
