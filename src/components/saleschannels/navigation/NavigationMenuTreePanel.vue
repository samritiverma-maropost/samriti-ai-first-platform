<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import {
  MAX_MENU_DEPTH,
  countDescendants,
  flattenMenuItems,
  itemDepth,
  locateMenuItem,
  maxRelativeDepth,
  type MenuDropPosition,
} from '@/stores/navigationTreeUtils'
import { itemTreeSubtitle, type MenuItem } from '@/stores/useStoreNavigation'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'

const props = defineProps<{
  items: MenuItem[]
  selectedId: string | null
  checkedIds: string[]
  showDaVinciActions?: boolean
  davinciGenerating?: boolean
  fromDaVinci?: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
  'update:checkedIds': [ids: string[]]
  addTop: []
  addUnder: [parentId: string]
  indent: [id: string]
  outdent: [id: string]
  hide: [id: string]
  remove: [id: string]
  drop: [sourceId: string, targetId: string, position: MenuDropPosition]
  bulkHide: []
  bulkRemove: []
  'open-da-vinci': []
}>()

const expandedIds = ref<Record<string, boolean>>({})
const addMenuOpen = ref(false)
const dragSourceId = ref<string | null>(null)
const dropHint = ref<{ targetId: string; position: MenuDropPosition } | null>(null)
let pointerDragCleanup: (() => void) | null = null

const flatRows = computed(() => flattenMenuItems(props.items))

const selectedItem = computed(() =>
  props.selectedId ? flatRows.value.find((r) => r.item.id === props.selectedId)?.item ?? null : null,
)

/** Design-ready: dropdown only when a row is selected; otherwise Add new inserts at top level. */
const addNewUsesMenu = computed(
  () => props.items.length > 0 && Boolean(props.selectedId && selectedItem.value),
)

function onAddNewClick() {
  emit('addTop')
}

const allIds = computed(() => flatRows.value.map((row) => row.item.id))

const allChecked = computed(
  () => allIds.value.length > 0 && props.checkedIds.length === allIds.value.length,
)

const someChecked = computed(
  () => props.checkedIds.length > 0 && props.checkedIds.length < allIds.value.length,
)

const l1WithChildren = computed(() => props.items.filter((item) => (item.children?.length ?? 0) > 0))

const hasNestedChildren = computed(() =>
  flatRows.value.some((row) => (row.item.children?.length ?? 0) > 0),
)

const includedColumnLabel = computed(() =>
  hasNestedChildren.value ? 'Included' : 'Include children',
)

function isExpanded(id: string) {
  return expandedIds.value[id] !== false
}

function toggleExpand(id: string) {
  expandedIds.value[id] = !isExpanded(id)
}

function toggleExpandAll() {
  const expand = !l1WithChildren.value.every((item) => isExpanded(item.id))
  for (const item of l1WithChildren.value) expandedIds.value[item.id] = expand
}

function toggleCheck(id: string) {
  const set = new Set(props.checkedIds)
  if (set.has(id)) set.delete(id)
  else set.add(id)
  emit('update:checkedIds', [...set])
}

function toggleCheckAll() {
  emit('update:checkedIds', allChecked.value ? [] : [...allIds.value])
}

interface TreeDisplayRow {
  item: MenuItem
  depth: number
  ancestorLabels: string[]
}

const displayRows = computed(() => {
  const out: TreeDisplayRow[] = []
  function walk(nodes: MenuItem[], depth: number, ancestorLabels: string[]) {
    for (const node of nodes) {
      out.push({ item: node, depth, ancestorLabels: [...ancestorLabels] })
      const kids = node.children ?? []
      const label = (node.linkedLabel?.split(',')[0] ?? node.linkedLabel)?.trim() || node.title
      if (kids.length && isExpanded(node.id)) {
        walk(kids, depth + 1, [...ancestorLabels, label])
      }
    }
  }
  walk(props.items, 1, [])
  return out
})

watch(
  () => props.items,
  (items) => {
    function expandAll(nodes: MenuItem[]) {
      for (const node of nodes) {
        if (node.children?.length) {
          expandedIds.value[node.id] = true
          expandAll(node.children)
        }
      }
    }
    expandAll(items)
  },
  { immediate: true, deep: true },
)

function includedLabel(item: MenuItem): string {
  const direct = item.children?.length ?? 0
  if (!direct) return '—'
  const desc = countDescendants(item)
  if (item.childTotal) {
    const cats = (item.children ?? []).filter((c) => (c.children?.length ?? 0) > 0).length
    if (cats) {
      const word = cats === 1 ? 'category' : 'categories'
      return `${desc} of ${item.childTotal} (${cats} ${word})`
    }
    return `${desc} of ${item.childTotal}`
  }
  return String(desc)
}

function canIndent(id: string) {
  const loc = locateMenuItem(props.items, id)
  if (!loc || loc.index === 0) return false
  const node = loc.list[loc.index]
  if (!node) return false
  return itemDepth(props.items, id) + maxRelativeDepth(node) - 1 <= MAX_MENU_DEPTH
}

function canOutdent(id: string) {
  return Boolean(flatRows.value.find((r) => r.item.id === id)?.parent)
}

function resolveDropPositionFromPointer(clientY: number, rowEl: HTMLElement): MenuDropPosition {
  const rect = rowEl.getBoundingClientRect()
  return clientY < rect.top + rect.height / 2 ? 'before' : 'after'
}

function rowDropClass(id: string): string {
  if (!dropHint.value || dropHint.value.targetId !== id) return ''
  return `tree-row--drop-${dropHint.value.position}`
}

function rowFromPoint(clientX: number, clientY: number, ignoreRowId?: string | null): HTMLElement | null {
  const stack = document.elementsFromPoint(clientX, clientY)
  for (const el of stack) {
    const row = el.closest?.('.tree-row') as HTMLElement | null
    if (!row) continue
    const id = row.dataset.rowId
    if (ignoreRowId && id === ignoreRowId) continue
    return row
  }
  return null
}

function rowIdFromElement(row: HTMLElement | null): string | null {
  return row?.dataset.rowId ?? null
}

function updateDropHint(clientX: number, clientY: number, sourceId: string) {
  const row = rowFromPoint(clientX, clientY, sourceId)
  const targetId = rowIdFromElement(row)
  if (!row || !targetId || targetId === sourceId) {
    dropHint.value = null
    return
  }
  dropHint.value = {
    targetId,
    position: resolveDropPositionFromPointer(clientY, row),
  }
}

function commitPointerDrop(
  sourceId: string,
  hint: { targetId: string; position: MenuDropPosition } | null,
  clientX: number,
  clientY: number,
) {
  dropHint.value = null
  dragSourceId.value = null

  if (hint && hint.targetId !== sourceId) {
    emit('drop', sourceId, hint.targetId, hint.position)
    return
  }

  const row = rowFromPoint(clientX, clientY, sourceId)
  const targetId = rowIdFromElement(row)
  if (!row || !targetId || targetId === sourceId) return
  const position = resolveDropPositionFromPointer(clientY, row)
  emit('drop', sourceId, targetId, position)
}

function onGripPointerDown(event: PointerEvent, id: string) {
  if (event.button !== 0) return
  event.preventDefault()
  event.stopPropagation()
  pointerDragCleanup?.()
  dragSourceId.value = id

  const gripEl = event.currentTarget as HTMLElement | null
  gripEl?.setPointerCapture(event.pointerId)

  const onMove = (e: PointerEvent) => {
    if (!dragSourceId.value) return
    updateDropHint(e.clientX, e.clientY, dragSourceId.value)
  }

  const onEnd = (e: PointerEvent) => {
    const sourceId = dragSourceId.value
    const hint = dropHint.value ? { ...dropHint.value } : null
    pointerDragCleanup = null
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onEnd)
    window.removeEventListener('pointercancel', onEnd)
    try {
      gripEl?.releasePointerCapture(e.pointerId)
    } catch {
      /* already released */
    }
    if (sourceId) commitPointerDrop(sourceId, hint, e.clientX, e.clientY)
    else {
      dropHint.value = null
      dragSourceId.value = null
    }
  }

  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onEnd)
  window.addEventListener('pointercancel', onEnd)
  pointerDragCleanup = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onEnd)
    window.removeEventListener('pointercancel', onEnd)
  }
}

onBeforeUnmount(() => {
  pointerDragCleanup?.()
  pointerDragCleanup = null
})
</script>

<template>
  <v-card flat border rounded="lg" class="tree-panel h-100 d-flex flex-column">
    <div class="tree-panel__head d-flex align-center justify-space-between flex-wrap ga-3">
      <MpSectionHeader title="Menu structure" />
      <div class="d-flex align-center flex-wrap ga-2">
        <v-btn
          v-if="l1WithChildren.length"
          variant="text"
          size="small"
          class="text-none"
          @click="toggleExpandAll"
        >
          {{ l1WithChildren.every((item) => isExpanded(item.id)) ? 'Collapse all' : 'Expand all' }}
        </v-btn>
        <v-btn
          v-if="showDaVinciActions"
          variant="outlined"
          class="text-none"
          prepend-icon="sparkles"
          @click="emit('open-da-vinci')"
        >
          Generate with Da Vinci
        </v-btn>
        <v-menu v-if="addNewUsesMenu" v-model="addMenuOpen" location="bottom end">
          <template #activator="{ props: menuProps }">
            <v-btn color="primary" variant="flat" class="text-none" v-bind="menuProps" prepend-icon="plus">
              Add new
            </v-btn>
          </template>
          <v-list density="compact" role="menu">
            <v-list-item
              role="menuitem"
              :disabled="itemDepth(items, selectedId!) >= MAX_MENU_DEPTH"
              @click="emit('addUnder', selectedId!); addMenuOpen = false"
            >
              <v-list-item-title>Add under {{ selectedItem!.title || 'Untitled' }}</v-list-item-title>
            </v-list-item>
            <v-list-item role="menuitem" @click="emit('addTop'); addMenuOpen = false">
              <v-list-item-title>Add to top level</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-btn
          v-else
          color="primary"
          variant="flat"
          class="text-none"
          prepend-icon="plus"
          @click="onAddNewClick"
        >
          Add new
        </v-btn>
      </div>
    </div>

    <div v-if="checkedIds.length" class="tree-bulk mx-4 mb-3 pa-3 d-flex align-center flex-wrap ga-3">
      <span class="text-body-2 font-weight-medium">{{ checkedIds.length }} selected</span>
      <div class="d-flex align-center flex-wrap ga-2 ms-auto">
        <v-btn variant="text" size="small" class="text-none" @click="emit('bulkHide')">Hide</v-btn>
        <v-btn variant="text" size="small" class="text-none" @click="emit('bulkRemove')">Remove</v-btn>
        <v-btn variant="text" size="small" class="text-none" @click="emit('update:checkedIds', [])">Clear</v-btn>
      </div>
    </div>

    <div v-if="fromDaVinci && items.length" class="nav-dv-info">
      <v-icon size="18">sparkles</v-icon>
      <p>Da Vinci draft — review labels and links before Save. Select a row to edit details.</p>
    </div>

    <div v-if="!items.length && !davinciGenerating" class="tree-empty mx-4 mb-4">
      <h3 class="tree-empty__title text-h6 font-weight-bold text-center">Build your storefront menu</h3>
      <p class="text-body-2 text-medium-emphasis text-center mt-2 px-4 mb-0">
        Add collections in bulk, or add a single item. Nested children can be pulled from your catalog.
      </p>
      <p class="text-body-2 text-medium-emphasis text-center mt-2 px-4 mb-0">
        New items are added at the bottom as top-level items. Select a row, then Add new, to choose Add under instead.
      </p>
    </div>

    <div v-else class="tree-table flex-grow-1 tree-table--relative">
      <div v-if="davinciGenerating" class="nav-dv-generating" aria-live="polite">
        <div class="nav-dv-spinner" aria-hidden="true" />
        <p class="text-body-2 font-weight-medium ma-0">Drafting menu from your catalog…</p>
      </div>
      <div class="tree-cols text-caption text-medium-emphasis font-weight-medium">
        <span class="tree-col tree-col--check">
          <v-checkbox-btn
            :model-value="allChecked"
            :indeterminate="someChecked"
            density="compact"
            hide-details
            @update:model-value="toggleCheckAll()"
          />
        </span>
        <span class="tree-col tree-col--grip" />
        <span class="tree-col tree-col--chev" />
        <span class="tree-col tree-col--item">Item</span>
        <span class="tree-col tree-col--inc">{{ includedColumnLabel }}</span>
        <span class="tree-col tree-col--level">Level</span>
        <span class="tree-col tree-col--menu" />
      </div>

      <div
        v-for="row in displayRows"
        :key="row.item.id"
        class="tree-row"
        :data-row-id="row.item.id"
        :class="[
          {
            'tree-row--selected': selectedId === row.item.id,
            'tree-row--hidden': row.item.hidden,
            'tree-row--dragging': dragSourceId === row.item.id,
          },
          rowDropClass(row.item.id),
        ]"
        @click="emit('select', row.item.id)"
      >
        <div class="tree-col tree-col--check">
          <v-checkbox-btn
            :model-value="checkedIds.includes(row.item.id)"
            density="compact"
            hide-details
            @click.stop
            @update:model-value="toggleCheck(row.item.id)"
          />
        </div>
        <div class="tree-col tree-col--grip">
          <div
            class="tree-grip"
            role="button"
            tabindex="-1"
            title="Drag to reorder"
            aria-label="Drag to reorder"
            @pointerdown="onGripPointerDown($event, row.item.id)"
            @click.stop
          >
            <v-icon size="16" class="text-medium-emphasis">grip-vertical</v-icon>
          </div>
        </div>
        <div class="tree-col tree-col--chev">
          <v-btn
            v-if="(row.item.children?.length ?? 0) > 0"
            icon
            variant="text"
            size="x-small"
            :aria-label="isExpanded(row.item.id) ? 'Collapse' : 'Expand'"
            @click.stop="toggleExpand(row.item.id)"
          >
            <v-icon size="18">{{ isExpanded(row.item.id) ? 'chevron-down' : 'chevron-right' }}</v-icon>
          </v-btn>
        </div>
        <div
          class="tree-col tree-col--item"
          :style="{ paddingLeft: `${(row.depth - 1) * 16}px` }"
        >
          <div class="tree-item-copy min-width-0">
            <div class="d-flex align-center ga-2">
              <span class="text-body-2 font-weight-medium text-truncate">{{ row.item.title || 'Untitled' }}</span>
              <span v-if="row.item.aiDraft" class="nav-dv-ai-tag flex-shrink-0">Da Vinci</span>
              <v-chip v-if="row.item.hidden" size="x-small" variant="outlined" class="text-uppercase flex-shrink-0">Hidden</v-chip>
            </div>
            <div class="text-caption text-medium-emphasis text-truncate">
              {{ itemTreeSubtitle(row.item, row.depth, row.ancestorLabels) }}
            </div>
          </div>
        </div>
        <div class="tree-col tree-col--inc text-caption text-medium-emphasis">
          {{ includedLabel(row.item) }}
        </div>
        <div class="tree-col tree-col--level">
          <span
            class="nav-level-pill"
            :class="`nav-level-pill--l${Math.min(row.depth, MAX_MENU_DEPTH)}`"
          >
            L{{ row.depth }}
          </span>
        </div>
        <div class="tree-col tree-col--menu" @click.stop>
          <MpRowActionsMenu
            ariaLabel="Item actions"
            :itemLabel="row.item.title || 'Menu item'"
          >
          <MpMenuItem title="Indent" :disabled="!canIndent(row.item.id)" @click="emit('indent', row.item.id)" />
          <MpMenuItem title="Outdent" :disabled="!canOutdent(row.item.id)" @click="emit('outdent', row.item.id)" />
          <MpMenuItem :title="row.item.hidden ? 'Unhide' : 'Hide'" @click="emit('hide', row.item.id)" />
          <v-divider class="my-1" />
          <MpMenuItem title="Remove from menu" danger @click="emit('remove', row.item.id)" />
        </MpRowActionsMenu>
        </div>
      </div>
    </div>
  </v-card>
</template>

<style scoped lang="scss">
@use './navigationMenuShared.scss';
@use './navigationDaVinciFeature.scss';

.tree-table--relative {
  position: relative;
}

.tree-panel {
  overflow: hidden;
}

.tree-panel__head {
  padding: var(--mp-component-card-padding);
  padding-bottom: 0;
}

.tree-table {
  overflow: auto;
  min-height: 0;
  padding: 0 var(--mp-component-card-padding) var(--mp-component-card-padding);
}

.tree-empty {
  padding-block: var(--mp-component-state-padding);
  min-height: var(--mp-component-state-minHeight);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.tree-empty__title {
  margin: 0;
}

.tree-bulk {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: var(--mp-radius-8);
  background: rgb(var(--v-theme-surface-container-low));
}

.tree-cols,
.tree-row {
  display: grid;
  grid-template-columns:
    36px 24px 28px minmax(120px, 1fr) minmax(96px, 128px) 52px var(--mp-component-control-height);
  align-items: center;
  column-gap: var(--mp-space-8);
  min-height: var(--mp-component-table-rowMinHeight);
  min-width: 640px;
}

.tree-cols {
  padding: var(--mp-space-8) var(--mp-space-12);
  padding-inline-end: var(--mp-space-16);
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.tree-row {
  padding: var(--mp-space-8) var(--mp-space-12);
  padding-inline-end: var(--mp-space-16);
  border-bottom: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.6));
  cursor: pointer;
  box-sizing: border-box;
}

.tree-col--check,
.tree-col--grip,
.tree-col--chev,
.tree-col--level,
.tree-col--menu {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tree-col--level {
  justify-content: center;
}

.tree-col--menu {
  justify-content: center;
  max-width: var(--mp-component-control-height);
}

.tree-col--menu :deep(.mp-row-actions__trigger) {
  margin: 0;
}

.tree-col--menu :deep(.mp-row-actions__trigger::after) {
  width: 32px;
  height: 32px;
}

.tree-col--item {
  min-width: 0;
  display: flex;
  align-items: center;
}

.tree-col--inc {
  min-width: 0;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tree-row:hover {
  background: rgba(var(--v-theme-primary), 0.04);
}

.tree-row--selected {
  background: rgba(var(--v-theme-primary), 0.08);
}

.tree-row--hidden {
  opacity: 0.65;
}

.tree-row--drop-before {
  box-shadow: inset 0 2px 0 rgb(var(--v-theme-primary));
}

.tree-row--drop-after {
  box-shadow: inset 0 -2px 0 rgb(var(--v-theme-primary));
}

.tree-row--drop-inside {
  background: rgba(var(--v-theme-primary), 0.12);
}

.tree-grip {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--mp-component-control-height);
  height: var(--mp-component-control-height);
  margin: calc(-1 * var(--mp-space-8)) 0;
  opacity: 0.45;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.tree-grip:active {
  cursor: grabbing;
}

.tree-row--dragging {
  opacity: 0.55;
  pointer-events: none;
}

.tree-grip:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
  border-radius: var(--mp-radius-4);
}

.tree-item-copy {
  width: 100%;
}

.min-width-0 {
  min-width: 0;
}
</style>
