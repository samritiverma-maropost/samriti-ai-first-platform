<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  DEFAULT_DAVINCI_PREFS,
  type DaVinciMenuPrefs,
} from '@/constants/navigationDaVinci'
import MpDialog from '@/components/MpDialog.vue'

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  generate: [prefs: DaVinciMenuPrefs]
}>()

const prefs = ref<DaVinciMenuPrefs>({ ...DEFAULT_DAVINCI_PREFS })

watch(open, (isOpen) => {
  if (isOpen) prefs.value = { ...DEFAULT_DAVINCI_PREFS }
})

function setPref<K extends keyof DaVinciMenuPrefs>(key: K, value: DaVinciMenuPrefs[K]) {
  prefs.value = { ...prefs.value, [key]: value }
}

function onGenerate() {
  emit('generate', { ...prefs.value })
  open.value = false
}
</script>

<template>
  <MpDialog
    v-model="open"
    title="Draft menu from catalog"
    subtitle="Same editor as manual build — rename, reorder, and nest before Save."
    size="md"
  >
    <div class="d-flex flex-column ga-4">
      <div>
        <div class="text-body-2 font-weight-medium mb-2">Menu type</div>
        <div class="nav-dv-choice">
          <button
            type="button"
            class="nav-dv-opt"
            :class="{ 'nav-dv-opt--on': prefs.menuType === 'main' }"
            @click="setPref('menuType', 'main')"
          >
            <strong>Main menu</strong>
            <span>Header navigation</span>
          </button>
          <button
            type="button"
            class="nav-dv-opt"
            :class="{ 'nav-dv-opt--on': prefs.menuType === 'mega' }"
            @click="setPref('menuType', 'mega')"
          >
            <strong>Mega menu</strong>
            <span>Deeper hierarchy + images</span>
          </button>
        </div>
      </div>

      <div>
        <div class="text-body-2 font-weight-medium mb-2">Style</div>
        <div class="nav-dv-choice">
          <button
            type="button"
            class="nav-dv-opt"
            :class="{ 'nav-dv-opt--on': prefs.style === 'simple' }"
            @click="setPref('style', 'simple')"
          >
            <strong>Simple</strong>
            <span>Flat top-level only</span>
          </button>
          <button
            type="button"
            class="nav-dv-opt"
            :class="{ 'nav-dv-opt--on': prefs.style === 'collection-led' }"
            @click="setPref('style', 'collection-led')"
          >
            <strong>Collection-led</strong>
            <span>Mirror catalog tree</span>
          </button>
          <button
            type="button"
            class="nav-dv-opt"
            :class="{ 'nav-dv-opt--on': prefs.style === 'brand-led' }"
            @click="setPref('style', 'brand-led')"
          >
            <strong>Brand-led</strong>
            <span>Prioritise brands</span>
          </button>
          <button
            type="button"
            class="nav-dv-opt"
            :class="{ 'nav-dv-opt--on': prefs.style === 'promotional' }"
            @click="setPref('style', 'promotional')"
          >
            <strong>Promotional</strong>
            <span>Sale &amp; new first</span>
          </button>
        </div>
      </div>

      <div>
        <div class="text-body-2 font-weight-medium mb-2">Max depth</div>
        <div class="nav-dv-choice">
          <button
            type="button"
            class="nav-dv-opt"
            :class="{ 'nav-dv-opt--on': prefs.depth === 2 }"
            @click="setPref('depth', 2)"
          >
            <strong>2 levels</strong>
            <span>Parent + children</span>
          </button>
          <button
            type="button"
            class="nav-dv-opt"
            :class="{ 'nav-dv-opt--on': prefs.depth === 3 }"
            @click="setPref('depth', 3)"
          >
            <strong>3 levels</strong>
            <span>Mega menu cap</span>
          </button>
        </div>
      </div>
    </div>

    <template #footer>
      <v-btn variant="text" class="text-none" @click="open = false">Cancel</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" @click="onGenerate">
        Create draft
      </v-btn>
    </template>
  </MpDialog>
</template>

<style scoped lang="scss">
@use '@/components/saleschannels/navigation/navigationDaVinciFeature.scss';
</style>
