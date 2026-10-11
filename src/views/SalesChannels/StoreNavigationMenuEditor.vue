<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import {
  buildDaVinciDraft,
  computeNavigationE2eStep,
  DEFAULT_DAVINCI_PREFS,
  type DaVinciMenuPrefs,
} from '@/constants/navigationDaVinci'
import { useToast } from '@/composables/useToast'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import {
  appendTopLevelItem,
  findMenuItem,
  indentMenuItem,
  insertMenuChild,
  itemDepth,
  moveMenuItemSibling,
  outdentMenuItem,
  removeMenuItem,
  removeMenuItems,
  setMenuItemsHidden,
  type MenuDropPosition,
} from '@/stores/navigationTreeUtils'
import {
  createMenuDraft,
  createMenuItem,
  useStoreNavigationStore,
  type StoreMenu,
} from '@/stores/useStoreNavigation'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import NavigationDaVinciE2eBanner from '@/components/saleschannels/navigation/NavigationDaVinciE2eBanner.vue'
import NavigationDaVinciRefinePanel from '@/components/saleschannels/navigation/NavigationDaVinciRefinePanel.vue'
import NavigationDaVinciSetupDialog from '@/components/saleschannels/navigation/NavigationDaVinciSetupDialog.vue'
import NavigationItemDetailsPanel from '@/components/saleschannels/navigation/NavigationItemDetailsPanel.vue'
import NavigationMenuTreePanel from '@/components/saleschannels/navigation/NavigationMenuTreePanel.vue'
import NavigationStorefrontPreviewDialog from '@/components/saleschannels/navigation/NavigationStorefrontPreviewDialog.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const salesChannelsStore = useSalesChannelsStore()
const navigationStore = useStoreNavigationStore()

const journeyE2e = computed(() => route.query.journey === 'e2e')
const journeyQuery = computed(() => (journeyE2e.value ? { journey: 'e2e' } : {}))

const accountId = computed(() => {
  const value = route.params.accountId
  return (Array.isArray(value) ? value[0] : value) ?? '2000290'
})

const channelId = computed(() => {
  const value = route.params.channelId
  return (Array.isArray(value) ? value[0] : value) ?? ''
})

const menuId = computed(() => {
  const value = route.params.menuId
  return (Array.isArray(value) ? value[0] : value) ?? ''
})

const channel = computed(() => salesChannelsStore.getChannel(accountId.value, channelId.value))
const isNew = computed(() => !menuId.value)

function cloneMenu(source: StoreMenu): StoreMenu {
  return JSON.parse(JSON.stringify(source)) as StoreMenu
}

function loadDraft(): StoreMenu | null {
  if (!menuId.value) return createMenuDraft(channelId.value)
  const existing = navigationStore.getMenu(menuId.value)
  if (!existing) return null
  return cloneMenu(existing)
}

const draft = ref<StoreMenu | null>(loadDraft())
const savedSnapshot = ref(draft.value ? JSON.stringify(draft.value) : '')
const selectedId = ref<string | null>(draft.value?.items[0]?.id ?? null)
const checkedIds = ref<string[]>([])
const previewOpen = ref(false)
const saveConfirmOpen = ref(false)
const discardDialog = ref(false)
const davinciModalOpen = ref(false)
const davinciGenerating = ref(false)
const fromDaVinci = ref(false)
const davinciPrefs = ref<DaVinciMenuPrefs>({ ...DEFAULT_DAVINCI_PREFS })
const e2eRefined = ref(false)

watch(
  () => route.query.davinci,
  (value) => {
    if (value === '1' && isNew.value) davinciModalOpen.value = true
  },
  { immediate: true },
)

const e2eStep = computed(() =>
  computeNavigationE2eStep({
    journeyE2e: journeyE2e.value,
    view: 'editor',
    e2eJustSaved: false,
    saveConfirmOpen: saveConfirmOpen.value,
    previewOpen: previewOpen.value,
    e2eRefined: e2eRefined.value,
    fromDaVinci: fromDaVinci.value,
    hasItems: Boolean(draft.value?.items.length),
    davinciModalOpen: davinciModalOpen.value,
    davinciGenerating: davinciGenerating.value,
  }),
)

const isDirty = computed(() => draft.value !== null && JSON.stringify(draft.value) !== savedSnapshot.value)

const selectedItem = computed(() =>
  draft.value && selectedId.value ? findMenuItem(draft.value.items, selectedId.value) ?? null : null,
)

const selectedDepth = computed(() =>
  draft.value && selectedId.value ? itemDepth(draft.value.items, selectedId.value) : 1,
)

const crumbTail = computed(() =>
  isNew.value ? 'Create new navigation' : draft.value?.name.trim() || 'Edit menu',
)

const itemsValid = computed(() => {
  if (!draft.value?.items.length) return false
  const walk = (nodes: StoreMenu['items']): boolean =>
    nodes.every((item) => {
      const selfOk = Boolean(item.title.trim()) && (item.resourceType !== 'custom_url' || item.target.trim())
      const kidsOk = item.children?.length ? walk(item.children) : true
      return selfOk && kidsOk
    })
  return walk(draft.value.items)
})

const canSave = computed(() => Boolean(draft.value?.name.trim() && itemsValid.value && isDirty.value))

const backTo = computed(() => ({
  name: 'StoreNavigation',
  params: { accountId: accountId.value, channelId: channelId.value },
  query: { ...journeyQuery.value },
}))

const pageTitle = computed(() =>
  isNew.value ? 'Create new navigation' : draft.value?.name.trim() || 'Edit menu',
)

function replaceMenuItems(next: StoreMenu['items']) {
  if (!draft.value || next === draft.value.items) return
  draft.value = { ...draft.value, items: next }
}

function patchSelected(patch: Partial<StoreMenu['items'][number]>) {
  if (!draft.value || !selectedId.value) return
  const id = selectedId.value
  replaceMenuItems(
    draft.value.items.map(function mapNode(item): StoreMenu['items'][number] {
      if (item.id === id) return { ...item, ...patch }
      return { ...item, children: (item.children ?? []).map(mapNode) }
    }),
  )
}

function addTopLevel() {
  if (!draft.value) return
  const item = createMenuItem({ title: 'New Page', resourceType: 'custom_url', target: '/' })
  replaceMenuItems(appendTopLevelItem(draft.value.items, item))
  selectedId.value = item.id
}

function addUnder(parentId: string) {
  if (!draft.value) return
  if (itemDepth(draft.value.items, parentId) >= 3) return
  const item = createMenuItem({ title: 'New Page', resourceType: 'custom_url', target: '/' })
  replaceMenuItems(insertMenuChild(draft.value.items, parentId, item))
  selectedId.value = item.id
}

function removeFromMenu(id: string) {
  if (!draft.value) return
  replaceMenuItems(removeMenuItem(draft.value.items, id))
  if (selectedId.value === id) selectedId.value = draft.value.items[0]?.id ?? null
  checkedIds.value = checkedIds.value.filter((cid) => cid !== id)
}

function toggleHidden(id: string) {
  if (!draft.value) return
  const node = findMenuItem(draft.value.items, id)
  if (!node) return
  patchSelected({ hidden: !node.hidden })
}

function onIndent(id: string) {
  if (!draft.value) return
  replaceMenuItems(indentMenuItem(draft.value.items, id))
}

function onOutdent(id: string) {
  if (!draft.value) return
  replaceMenuItems(outdentMenuItem(draft.value.items, id))
}

function onDrop(sourceId: string, targetId: string, position: MenuDropPosition) {
  if (!draft.value) return
  if (position === 'inside') return
  replaceMenuItems(
    moveMenuItemSibling(
      draft.value.items,
      sourceId,
      targetId,
      position === 'before' ? 'before' : 'after',
    ),
  )
}

function bulkHide() {
  if (!draft.value || !checkedIds.value.length) return
  replaceMenuItems(setMenuItemsHidden(draft.value.items, checkedIds.value, true))
}

function bulkRemove() {
  if (!draft.value || !checkedIds.value.length) return
  replaceMenuItems(removeMenuItems(draft.value.items, checkedIds.value))
  checkedIds.value = []
  if (selectedId.value && !findMenuItem(draft.value.items, selectedId.value)) {
    selectedId.value = draft.value.items[0]?.id ?? null
  }
}

function requestSave() {
  if (!draft.value || !canSave.value) return
  if (draft.value.status === 'Active') {
    saveConfirmOpen.value = true
    return
  }
  commitSave()
}

function commitSave() {
  if (!draft.value || !canSave.value) return
  navigationStore.saveMenu(draft.value)
  savedSnapshot.value = JSON.stringify(draft.value)
  saveConfirmOpen.value = false
  leaveConfirmed = true
  router.push({
    ...backTo.value,
    query: journeyE2e.value ? { journey: 'e2e', saved: '1' } : {},
  })
}

function openDaVinciSetup() {
  davinciModalOpen.value = true
}

function runDaVinciGenerate(prefs: DaVinciMenuPrefs) {
  if (!draft.value) return
  davinciPrefs.value = { ...prefs }
  davinciModalOpen.value = false
  davinciGenerating.value = true
  window.setTimeout(() => {
    if (!draft.value) return
    replaceMenuItems(buildDaVinciDraft(prefs))
    selectedId.value = null
    fromDaVinci.value = true
    e2eRefined.value = false
    davinciGenerating.value = false
    toast.success('Review the draft in the tree (same as manual build)')
  }, 900)
}

function onDaVinciRefine(kind: 'simpler' | 'sale' | 'brand' | 'custom') {
  if (kind === 'simpler') {
    davinciPrefs.value = { ...davinciPrefs.value, style: 'simple', depth: 2 }
  } else if (kind === 'sale') {
    davinciPrefs.value = { ...davinciPrefs.value, style: 'promotional' }
  } else if (kind === 'brand') {
    davinciPrefs.value = { ...davinciPrefs.value, style: 'brand-led' }
  }
  runDaVinciGenerate(davinciPrefs.value)
  e2eRefined.value = true
}

function discardDaVinciDraft() {
  if (!draft.value) return
  replaceMenuItems([])
  fromDaVinci.value = false
  e2eRefined.value = false
  selectedId.value = null
}

function restartE2eJourney() {
  fromDaVinci.value = false
  e2eRefined.value = false
  davinciModalOpen.value = false
  davinciGenerating.value = false
  if (draft.value) {
    draft.value = createMenuDraft(channelId.value)
    savedSnapshot.value = JSON.stringify(draft.value)
    selectedId.value = null
    checkedIds.value = []
  }
  router.push({
    name: 'StoreNavigation',
    params: { accountId: accountId.value, channelId: channelId.value },
    query: { journey: 'e2e' },
  })
}

let leaveConfirmed = false
const pendingTarget = ref<string | null>(null)

function requestCancel() {
  if (!isDirty.value) {
    backToList()
    return
  }
  pendingTarget.value = null
  discardDialog.value = true
}

function backToList() {
  leaveConfirmed = true
  router.push(backTo.value)
}

onBeforeRouteLeave((to) => {
  if (!isDirty.value || leaveConfirmed) return true
  pendingTarget.value = to.fullPath
  discardDialog.value = true
  return false
})

function confirmDiscard() {
  leaveConfirmed = true
  const target = pendingTarget.value
  pendingTarget.value = null
  if (target) {
    router.push(target)
    return
  }
  backToList()
}
</script>

<template>
  <div v-if="!channel || !draft" class="h-100 d-flex align-center justify-center">
    <v-card variant="flat" border rounded="lg" class="pa-6" max-width="420">
      <MpEmptyState
        icon="list-tree"
        title="Menu not found"
        description="This menu doesn't exist or was deleted."
        action-label="Back to navigation"
        @action="backToList"
      />
    </v-card>
  </div>

  <div v-else class="nav-editor-page d-flex flex-column ga-4 pb-6">
    <NavigationDaVinciE2eBanner v-if="journeyE2e" :step="e2eStep" @restart="restartE2eJourney" />

    <nav class="nav-crumb" aria-label="Breadcrumb">
      <router-link :to="{ name: 'SalesChannels', params: { accountId } }">Sales channel</router-link>
      <span class="nav-crumb__sep">&gt;</span>
      <router-link :to="{ name: 'SalesChannelDetail', params: { accountId, channelId } }">
        {{ channel.name }}
      </router-link>
      <span class="nav-crumb__sep">&gt;</span>
      <router-link :to="backTo">Navigation</router-link>
      <span class="nav-crumb__sep">&gt;</span>
      <span class="text-medium-emphasis">{{ crumbTail }}</span>
    </nav>

    <div class="nav-editor-head d-flex flex-wrap align-center ga-4">
      <h1 class="nav-editor-head__title text-h5 font-weight-bold">{{ pageTitle }}</h1>
      <v-text-field
        v-model="draft.name"
        label="Menu name"
        hide-details
        density="compact"
        class="menu-name-field flex-grow-1"
      />
      <div class="d-flex align-center ga-2">
        <span class="text-body-2">{{ draft.status === 'Active' ? 'Active' : 'Inactive' }}</span>
        <v-switch
          :model-value="draft.status === 'Active'"
          hide-details
          density="compact"
          @update:model-value="draft.status = $event ? 'Active' : 'Inactive'"
        />
      </div>
      <div class="d-flex align-center flex-wrap ga-2 ms-lg-auto">
        <v-btn variant="outlined" prepend-icon="eye" class="text-none" @click="previewOpen = true">
          Preview
        </v-btn>
        <v-btn variant="text" class="text-none" @click="requestCancel">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!canSave" @click="requestSave">
          Save
        </v-btn>
      </div>
    </div>

    <v-row class="nav-editor-split flex-grow-1" dense>
      <v-col cols="12" lg="6" xl="6">
        <NavigationMenuTreePanel
          :items="draft.items"
          :selected-id="selectedId"
          :checked-ids="checkedIds"
          :show-da-vinci-actions="isNew"
          :davinci-generating="davinciGenerating"
          :from-da-vinci="fromDaVinci"
          @select="selectedId = $event"
          @update:checked-ids="checkedIds = $event"
          @add-top="addTopLevel"
          @add-under="addUnder"
          @indent="onIndent"
          @outdent="onOutdent"
          @hide="toggleHidden"
          @remove="removeFromMenu"
          @drop="onDrop"
          @bulk-hide="bulkHide"
          @bulk-remove="bulkRemove"
          @open-da-vinci="openDaVinciSetup"
        />
      </v-col>
      <v-col cols="12" lg="6" xl="6">
        <NavigationDaVinciRefinePanel
          v-if="fromDaVinci && !selectedItem"
          @refine="onDaVinciRefine"
          @regenerate="openDaVinciSetup"
          @discard="discardDaVinciDraft"
        />
        <NavigationItemDetailsPanel
          v-else
          :item="selectedItem"
          :selected-depth="selectedDepth"
          @patch="patchSelected"
          @remove="selectedId && removeFromMenu(selectedId)"
          @toggle-hidden="selectedId && toggleHidden(selectedId)"
        />
      </v-col>
    </v-row>

    <NavigationDaVinciSetupDialog v-model="davinciModalOpen" @generate="runDaVinciGenerate" />

    <NavigationStorefrontPreviewDialog v-model="previewOpen" :menu="draft" :store-name="channel.name" />

    <MpConfirmDialog
      v-model="saveConfirmOpen"
      :title="draft.status === 'Active' ? 'This menu is live' : 'This will make the menu live'"
      :message="
        draft.status === 'Active'
          ? 'This menu is live on your storefront — shoppers will see updated links immediately.'
          : 'Once you save, this menu becomes visible to shoppers on your storefront.'
      "
      confirm-label="Save"
      @confirm="commitSave"
    />

    <MpConfirmDialog
      v-model="discardDialog"
      title="Discard unsaved changes?"
      :message="`Your edits to “${draft.name.trim() || 'this menu'}” haven't been saved and will be lost.`"
      confirm-label="Discard changes"
      danger
      @confirm="confirmDiscard"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/components/saleschannels/navigation/navigationMenuShared.scss';

.nav-editor-head__title {
  flex: 1 1 100%;
  margin: 0;
}

@media (min-width: 960px) {
  .nav-editor-head__title {
    flex: 0 1 auto;
    min-width: 200px;
  }
}

.menu-name-field {
  min-width: 220px;
  max-width: 320px;
}

.nav-editor-page {
  max-width: none;
}

.nav-editor-split {
  min-height: 0;
}

.nav-editor-split > .v-col {
  display: flex;
  flex-direction: column;
  min-height: 480px;
}
</style>
