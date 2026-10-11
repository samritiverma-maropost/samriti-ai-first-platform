<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  NAVIGATION_PRODUCTS,
  NAV_RESOURCE_TYPE_OPTIONS,
  catalogSelectionToMenuChildren,
  catalogShallowestPickedId,
  findCatalogNode,
  type NavResourceType,
} from '@/constants/navigationCatalog'
import MpAlert from '@/components/MpAlert.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'
import NavigationResourcePicker from '@/components/saleschannels/navigation/NavigationResourcePicker.vue'
import {
  linkedResourceSummary,
  type MenuImageSource,
  type MenuItem,
} from '@/stores/useStoreNavigation'

const props = defineProps<{
  item: MenuItem | null
  /** 1-based depth of the selected item in the menu tree. */
  selectedDepth?: number
}>()

const emit = defineEmits<{
  patch: [patch: Partial<MenuItem>]
  remove: []
  toggleHidden: []
}>()

const pickerOpen = ref(false)

watch(
  () => props.item?.id,
  () => {
    pickerOpen.value = false
  },
)

const imageSourceItems = [
  { value: 'collection', label: 'Resource Image' },
  { value: 'custom', label: 'Custom' },
  { value: 'none', label: 'None' },
]

const pickerKind = computed(() => {
  if (!props.item) return null
  if (props.item.resourceType === 'collection') return 'collection' as const
  if (props.item.resourceType === 'category') return 'category' as const
  if (props.item.resourceType === 'page') return 'page' as const
  if (props.item.resourceType === 'blog') return 'blog' as const
  return null
})

const showInlinePicker = computed(() => {
  if (!pickerKind.value || !props.item) return false
  const linked = Boolean(props.item.target?.trim() || props.item.linkedIds?.length)
  return !linked || pickerOpen.value
})

const productItems = computed(() =>
  NAVIGATION_PRODUCTS.map((p) => ({ title: p.label, value: p.id })),
)

const typeNote = computed(() => {
  if (!props.item) return null
  if (props.item.resourceType === 'homepage') {
    return { title: 'Home page', body: 'Links to the storefront home. No collection picker for this type.' }
  }
  if (props.item.resourceType === 'search') {
    return { title: 'Search', body: 'Links to storefront search results.' }
  }
  if (props.item.resourceType === 'product') {
    return { title: 'Products', body: 'This item links to a product. Menu nesting still follows L1 → L2 → L3.' }
  }
  return null
})

const imageNote = computed(() => {
  if (!props.item) return null
  const src = props.item.imageSource ?? 'none'
  if (src === 'collection') {
    return {
      title: 'Using collection image',
      body: 'Pulled from the linked resource. Shown in the mega menu feature tile.',
    }
  }
  if (src === 'custom') {
    return {
      title: 'Upload image',
      body: 'PNG or JPG · recommended 800×600 for mega menu',
    }
  }
  return {
    title: 'No image on this item',
    body: 'Mega menu shows text only for this link (no feature tile image).',
  }
})

function setResourceType(value: NavResourceType) {
  pickerOpen.value = ['collection', 'category', 'page', 'blog'].includes(value)
  emit('patch', {
    resourceType: value,
    target: value === 'custom_url' ? '/' : value === 'homepage' ? '' : '',
    linkedLabel: '',
    linkedIds: [],
    includeChildren: false,
    childTotal: undefined,
  })
}

function onPickerApply(payload: {
  id: string
  label: string
  includeChildren: boolean
  childNodes: import('@/constants/navigationCatalog').CatalogNode[]
  pickedIds: string[]
  childTotal: number
  includeById: Record<string, boolean>
}) {
  if (!props.item || !pickerKind.value) return
  const depth = props.selectedDepth ?? 1
  const rootId = catalogShallowestPickedId(pickerKind.value, payload.pickedIds) ?? payload.id
  const rootNode = findCatalogNode(pickerKind.value, rootId)
  const rootLabel = rootNode?.label ?? payload.label

  const hasNestedPicks = payload.pickedIds.some((id) => id !== rootId)
  const children =
    hasNestedPicks || payload.includeChildren
      ? catalogSelectionToMenuChildren(
          pickerKind.value,
          rootId,
          payload.pickedIds,
          payload.includeById,
          props.item.resourceType,
          depth,
        )
      : []

  pickerOpen.value = false
  emit('patch', {
    target: rootId,
    linkedLabel: rootLabel,
    linkedIds: payload.pickedIds,
    includeChildren: payload.includeChildren,
    childTotal: payload.childTotal,
    title: props.item.title.trim() ? props.item.title : rootLabel,
    children,
    imageSource: 'collection',
  })
}

const hasLinkedResource = computed(
  () => Boolean(props.item?.target?.trim() || props.item?.linkedIds?.length),
)

function onProductPick(id: string | null) {
  if (!id || !props.item) return
  const product = NAVIGATION_PRODUCTS.find((p) => p.id === id)
  emit('patch', {
    target: id,
    linkedLabel: product?.label ?? '',
    linkedIds: [id],
    title: props.item.title.trim() ? props.item.title : product?.label ?? props.item.title,
  })
}

const customFileName = ref('')

function onCustomImagePick(files: File | File[] | null) {
  const file = Array.isArray(files) ? files[0] : files
  if (!file) return
  customFileName.value = file.name
  emit('patch', { imageSource: 'custom' })
}
</script>

<template>
  <v-card flat border rounded="lg" class="details-panel h-100 d-flex flex-column">
    <div class="details-panel__body d-flex flex-column ga-4 flex-grow-1">
      <MpFormSection
        title="Item details"
        description="Feeds storefront mega menu configuration"
      />

      <template v-if="!item">
        <MpEmptyState
          icon="list-tree"
          title="Nothing selected yet"
          description="Select a menu item to edit label, link, and image."
        />
      </template>

      <template v-else>
        <v-text-field
          :model-value="item.title"
          label="Menu page name"
          placeholder="Menu page name"
          @update:model-value="emit('patch', { title: String($event ?? '') })"
        />

        <v-select
          :model-value="item.resourceType"
          label="Resource type"
          :items="NAV_RESOURCE_TYPE_OPTIONS"
          item-title="label"
          item-value="value"
          @update:model-value="setResourceType($event as NavResourceType)"
        />

        <v-text-field
          v-if="item.resourceType === 'custom_url'"
          :model-value="item.target"
          label="Link to"
          placeholder="https://… or /path"
          @update:model-value="emit('patch', { target: String($event ?? '') })"
        />

        <v-autocomplete
          v-if="item.resourceType === 'product'"
          :model-value="item.target || null"
          label="Product"
          :items="productItems"
          item-title="title"
          item-value="value"
          placeholder="Search products"
          @update:model-value="onProductPick($event as string | null)"
        />

        <MpAlert v-if="typeNote" tone="info" :title="typeNote.title">
          {{ typeNote.body }}
        </MpAlert>

        <div v-if="pickerKind" class="details-picker d-flex flex-column ga-3">
          <template v-if="hasLinkedResource && !pickerOpen">
            <v-text-field
              :model-value="linkedResourceSummary(item)"
              label="Linked resources"
              readonly
              class="mp-field-readonly"
            />
            <v-btn
              variant="outlined"
              class="text-none w-100 details-picker__change"
              @click="pickerOpen = true"
            >
              Change selection
            </v-btn>
          </template>
          <NavigationResourcePicker
            v-if="showInlinePicker"
            :kind="pickerKind"
            :selected-ids="item.linkedIds?.length ? item.linkedIds : item.target ? [item.target] : []"
            :include-children="item.includeChildren"
            @apply="onPickerApply"
          />
        </div>

        <div class="details-image">
          <p class="details-image__label text-caption text-medium-emphasis mb-2">Image source</p>
          <MpSegmentedControl
            :model-value="item.imageSource ?? 'none'"
            :items="imageSourceItems"
            ariaLabel="Image source"
            size="sm"
            class="w-100"
            @update:model-value="emit('patch', { imageSource: ($event ?? 'none') as MenuImageSource })"
          />
          <div v-if="imageNote" class="details-image__note mt-3 pa-3 d-flex ga-3 rounded-lg">
            <v-icon size="20" class="text-medium-emphasis flex-shrink-0">{{ item.imageSource === 'custom' ? 'image-plus' : item.imageSource === 'collection' ? 'image' : 'image-off' }}</v-icon>
            <div class="text-left">
              <div class="text-body-2 font-weight-medium">{{ imageNote.title }}</div>
              <div class="text-caption text-medium-emphasis">{{ imageNote.body }}</div>
            </div>
          </div>
          <div
            v-if="item.imageSource === 'custom'"
            class="custom-upload mt-3 pa-4 d-flex flex-column align-center ga-2"
          >
            <v-icon size="28" class="text-medium-emphasis">image-plus</v-icon>
            <span class="text-body-2 text-medium-emphasis">
              {{ customFileName || 'Drop image or browse' }}
            </span>
            <v-file-input
              accept="image/png,image/jpeg"
              hide-details
              density="compact"
              prepend-icon=""
              label="Upload image"
              class="custom-upload__input w-100"
              @update:model-value="onCustomImagePick"
            />
          </div>
        </div>

        <div class="details-panel__foot d-flex flex-wrap ga-2 mt-auto pt-2">
          <v-btn
            v-if="item.title.trim()"
            variant="outlined"
            class="text-none flex-grow-1"
            @click="emit('toggleHidden')"
          >
            {{ item.hidden ? 'Unhide on storefront' : 'Hide on storefront' }}
          </v-btn>
          <v-btn variant="outlined" class="text-none flex-grow-1" @click="emit('remove')">
            Remove from menu
          </v-btn>
        </div>
      </template>
    </div>
  </v-card>
</template>

<style scoped>
.details-panel__body {
  padding: var(--mp-component-card-padding);
  min-height: 0;
  overflow-y: auto;
}

.details-picker {
  min-width: 0;
  width: 100%;
}

.details-picker__change {
  min-height: var(--mp-component-control-height);
}

.custom-upload {
  border: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: var(--mp-radius-12);
  background: rgb(var(--v-theme-surface-container-low));
}

.custom-upload__input :deep(.v-field) {
  border-style: dashed;
}

.details-image__note {
  background: rgb(var(--v-theme-surface-container-low));
  border: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.5));
}
</style>
