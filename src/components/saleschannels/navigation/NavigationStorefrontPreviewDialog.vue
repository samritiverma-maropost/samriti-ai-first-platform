<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { flattenMenuItems, visibleMenuItems } from '@/stores/navigationTreeUtils'
import type { MenuItem, StoreMenu } from '@/stores/useStoreNavigation'
import MpDialog from '@/components/MpDialog.vue'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'

const props = defineProps<{
  menu: StoreMenu
  storeName?: string
}>()

const open = defineModel<boolean>({ required: true })

const previewMode = ref<'desktop' | 'mobile'>('desktop')
const openItemId = ref<string | null>(null)

const l1Items = computed(() => visibleMenuItems(props.menu.items))

const openItem = computed(() => {
  if (!openItemId.value) return l1Items.value[0] ?? null
  const flat = flattenMenuItems(props.menu.items)
  return flat.find((row) => row.item.id === openItemId.value)?.item ?? l1Items.value[0] ?? null
})

const l2Items = computed(() => (openItem.value ? visibleMenuItems(openItem.value.children ?? []) : []))

watch(
  () => open.value,
  (isOpen) => {
    if (isOpen) openItemId.value = l1Items.value[0]?.id ?? null
  },
)

function selectL1(item: MenuItem) {
  openItemId.value = item.id
}
</script>

<template>
  <MpDialog
    v-model="open"
    title="Storefront preview"
    size="lg"
    flush
    @close="open = false"
  >
    <template #headerActions>
      <MpSegmentedControl
        v-model="previewMode"
        ariaLabel="Preview device"
        size="sm"
        :items="[
          { value: 'desktop', label: 'Desktop' },
          { value: 'mobile', label: 'Mobile' },
        ]"
      />
    </template>

    <div class="preview-body">
      <template v-if="previewMode === 'desktop'">
        <div class="preview-desktop">
          <div class="preview-bar d-flex align-center justify-space-between">
            <span class="preview-brand">Maropost</span>
            <nav class="preview-nav d-flex flex-wrap ga-6" aria-label="Menu preview">
              <button
                v-for="item in l1Items"
                :key="item.id"
                type="button"
                class="preview-nav-link"
                :class="{ 'preview-nav-link--active': openItem?.id === item.id }"
                @click="selectL1(item)"
              >
                {{ item.title }}
              </button>
              <span v-if="!l1Items.length" class="text-caption text-medium-emphasis">Empty menu</span>
            </nav>
            <span class="text-caption text-medium-emphasis">Bag · Account</span>
          </div>

          <div v-if="openItem && l2Items.length" class="preview-mega d-flex">
            <div class="preview-mega-main flex-grow-1">
              <p class="preview-kicker">{{ openItem.title }}</p>
              <div class="d-flex flex-wrap ga-8">
                <div v-for="l2 in l2Items" :key="l2.id" class="preview-col">
                  <div class="text-body-2 font-weight-medium mb-1">{{ l2.title }}</div>
                  <div
                    v-for="l3 in visibleMenuItems(l2.children ?? [])"
                    :key="l3.id"
                    class="text-body-2 text-medium-emphasis preview-l3"
                  >
                    {{ l3.title }}
                  </div>
                </div>
              </div>
            </div>
            <div class="preview-feature flex-shrink-0">
              <div class="preview-feature-img" />
              <div class="text-caption text-primary mt-2">{{ openItem.title }} · collection</div>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="preview-mobile mx-auto">
          <div class="preview-bar d-flex align-center justify-space-between">
            <span class="preview-brand">Maropost</span>
            <span class="text-caption text-medium-emphasis">Bag · Account</span>
          </div>
          <div class="preview-mobile-list">
            <div v-for="item in l1Items" :key="item.id">
              <button
                type="button"
                class="preview-m-l1"
                :class="{ 'preview-m-l1--active': openItem?.id === item.id }"
                @click="selectL1(item)"
              >
                {{ item.title }}
              </button>
              <template v-if="openItem?.id === item.id">
                <div v-for="l2 in l2Items" :key="l2.id" class="preview-m-l2">{{ l2.title }}</div>
                <div
                  v-for="l2 in l2Items"
                  :key="`${l2.id}-l3`"
                >
                  <div
                    v-for="l3 in visibleMenuItems(l2.children ?? [])"
                    :key="l3.id"
                    class="preview-m-l3"
                  >
                    {{ l3.title }}
                  </div>
                </div>
              </template>
            </div>
            <p v-if="!l1Items.length" class="text-caption text-medium-emphasis pa-4 mb-0">No visible items</p>
          </div>
        </div>
      </template>
    </div>
  </MpDialog>
</template>

<style scoped>
.preview-body {
  padding: var(--mp-component-dialog-padding);
  background: rgb(var(--v-theme-surface-container-low));
}

.preview-desktop,
.preview-mobile {
  background: rgb(var(--v-theme-surface));
  border-radius: var(--mp-radius-8);
  overflow: hidden;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.preview-bar {
  padding: var(--mp-space-16) var(--mp-space-24);
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.preview-brand {
  font-size: var(--mp-fontSize-14);
  font-weight: 900;
  letter-spacing: 0.08em;
}

.preview-nav-link {
  border: 0;
  background: none;
  padding: 0;
  font-size: var(--mp-fontSize-14);
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
  cursor: pointer;
}

.preview-nav-link--active {
  color: rgb(var(--v-theme-primary));
}

.preview-mega {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  min-height: 200px;
}

.preview-mega-main {
  padding: var(--mp-space-20) var(--mp-space-24);
}

.preview-kicker {
  margin: 0 0 var(--mp-space-12);
  font-size: var(--mp-fontSize-10);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgb(var(--v-theme-on-surface-muted));
}

.preview-l3 {
  padding-left: var(--mp-space-12);
}

.preview-feature {
  padding: var(--mp-space-20) var(--mp-space-16);
}

.preview-feature-img {
  width: 161px;
  height: 102px;
  border-radius: var(--mp-radius-4);
  background: linear-gradient(156deg, #7fa8c9 6%, #a8c4dc 94%);
}

.preview-mobile {
  max-width: 360px;
}

.preview-mobile-list {
  padding: var(--mp-space-8) 0 var(--mp-space-16);
}

.preview-m-l1 {
  display: block;
  width: 100%;
  text-align: left;
  border: 0;
  background: none;
  padding: var(--mp-space-10) var(--mp-space-20);
  font-size: var(--mp-fontSize-14);
  font-weight: 500;
  cursor: pointer;
}

.preview-m-l1--active {
  color: rgb(var(--v-theme-primary));
}

.preview-m-l2 {
  padding: var(--mp-space-6) var(--mp-space-20) var(--mp-space-4) var(--mp-space-32);
  font-size: var(--mp-fontSize-14);
  font-weight: 600;
}

.preview-m-l3 {
  padding: var(--mp-space-4) var(--mp-space-20) var(--mp-space-4) var(--mp-space-44);
  font-size: var(--mp-fontSize-14);
  color: rgb(var(--v-theme-on-surface-muted));
}
</style>
