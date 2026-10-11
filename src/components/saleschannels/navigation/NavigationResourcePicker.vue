<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  NAVIGATION_CATALOG,
  catalogAncestorIds,
  catalogDescendantIds,
  catalogShallowestPickedId,
  catalogSubtreeSize,
  findCatalogNode,
  type CatalogNode,
} from '@/constants/navigationCatalog'
import { MAX_MENU_DEPTH } from '@/stores/navigationTreeUtils'

const props = defineProps<{
  kind: 'collection' | 'category' | 'page' | 'blog'
  selectedIds?: string[]
  includeChildren?: boolean
}>()

const emit = defineEmits<{
  apply: [
    payload: {
      id: string
      label: string
      includeChildren: boolean
      childNodes: CatalogNode[]
      pickedIds: string[]
      childTotal: number
      includeById: Record<string, boolean>
    },
  ]
}>()

const query = ref('')
const expanded = ref<Record<string, boolean>>({})
const selectedIds = ref<string[]>([...(props.selectedIds ?? [])])
const includeById = ref<Record<string, boolean>>({})

const catalog = computed(() => NAVIGATION_CATALOG[props.kind] ?? [])

const title = computed(() => {
  if (props.kind === 'page') return 'Choose pages'
  if (props.kind === 'blog') return 'Choose blogs'
  return props.kind === 'category' ? 'Choose category' : 'Choose collection'
})

const includeColumnLabel = computed(() =>
  props.kind === 'page' || props.kind === 'blog' ? 'Children' : 'Include children',
)

interface PickerRow {
  node: CatalogNode
  depth: number
  childCount: number
}

const rows = computed(() => {
  const q = query.value.trim().toLowerCase()
  const out: PickerRow[] = []

  function walk(nodes: CatalogNode[], depth: number, ancestorsOpen: boolean) {
    for (const node of nodes) {
      const matches = !q || node.label.toLowerCase().includes(q)
      const visible = ancestorsOpen && (matches || childMatches(node, q))
      if (visible) {
        out.push({ node, depth, childCount: countCatalogDescendants(node) })
      }
      const open = expanded.value[node.id] !== false
      if (node.children?.length && open) walk(node.children, depth + 1, visible)
    }
  }

  walk(catalog.value, 1, true)
  return out
})

watch(
  () => props.selectedIds,
  (ids) => {
    selectedIds.value = [...(ids ?? [])]
  },
)

function childMatches(node: CatalogNode, q: string): boolean {
  if (!q) return true
  let hit = false
  function walk(nodes: CatalogNode[]) {
    for (const n of nodes) {
      if (n.label.toLowerCase().includes(q)) hit = true
      if (n.children?.length) walk(n.children)
    }
  }
  if (node.children?.length) walk(node.children)
  return hit
}

function countCatalogDescendants(node: CatalogNode): number {
  let n = 0
  function walk(nodes: CatalogNode[]) {
    for (const child of nodes) {
      n += 1
      if (child.children?.length) walk(child.children)
    }
  }
  if (node.children?.length) walk(node.children)
  return n
}

function isSelected(id: string) {
  return selectedIds.value.includes(id)
}

function toggleExpand(id: string) {
  expanded.value[id] = expanded.value[id] === false
}

function expandAll() {
  function walk(nodes: CatalogNode[]) {
    for (const n of nodes) {
      if (n.children?.length) expanded.value[n.id] = true
      if (n.children?.length) walk(n.children)
    }
  }
  walk(catalog.value)
}

function toggleCheck(id: string) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) {
    next.delete(id)
    catalogDescendantIds(props.kind, id).forEach((childId) => next.delete(childId))
    const { [id]: _removed, ...rest } = includeById.value
    includeById.value = rest
  } else {
    next.add(id)
    catalogAncestorIds(props.kind, id).forEach((ancestorId) => next.add(ancestorId))
    const exp = { ...expanded.value }
    catalogAncestorIds(props.kind, id).forEach((ancestorId) => {
      exp[ancestorId] = true
    })
    exp[id] = true
    expanded.value = exp
  }
  selectedIds.value = [...next]
}

function toggleIncludeChildren(id: string) {
  const kidIds = catalogDescendantIds(props.kind, id)
  const next = new Set(selectedIds.value)
  next.add(id)
  const allKidsOn = kidIds.length > 0 && kidIds.every((kid) => next.has(kid))
  const exp = { ...expanded.value }
  if (allKidsOn) {
    kidIds.forEach((kid) => next.delete(kid))
    includeById.value = { ...includeById.value, [id]: false }
  } else {
    kidIds.forEach((kid) => next.add(kid))
    exp[id] = true
    includeById.value = { ...includeById.value, [id]: true }
  }
  expanded.value = exp
  selectedIds.value = [...next]
}

function includeCell(row: PickerRow) {
  const on = isSelected(row.node.id)
  const hasKids = row.childCount > 0
  if (hasKids && !on) return { type: 'count' as const, value: String(row.childCount) }
  if (hasKids && on) {
    const kidIds = catalogDescendantIds(props.kind, row.node.id)
    const allOn = kidIds.every((kid) => selectedIds.value.includes(kid))
    return { type: 'link' as const, allOn }
  }
  return { type: 'dash' as const }
}

function apply() {
  if (!selectedIds.value.length) return
  const rootId = catalogShallowestPickedId(props.kind, selectedIds.value)
  if (!rootId) return
  const root = findCatalogNode(props.kind, rootId)
  if (!root) return
  const includeChildren = Boolean(includeById.value[rootId] ?? props.includeChildren)
  emit('apply', {
    id: rootId,
    label: root.label,
    includeChildren,
    childNodes: includeChildren ? (root.children ?? []) : [],
    pickedIds: [...selectedIds.value],
    childTotal: catalogSubtreeSize(props.kind, rootId),
    includeById: { ...includeById.value },
  })
}

onMounted(() => {
  expandAll()
  if (props.includeChildren && props.selectedIds?.length) {
    const rootId = props.selectedIds[0]
    if (rootId) includeById.value = { [rootId]: true }
  }
})
</script>

<template>
  <div class="resource-picker">
    <div class="resource-picker__head">
      <span class="resource-picker__title">{{ title }}</span>
      <button type="button" class="resource-picker__expand text-none" @click="expandAll">Expand all</button>
    </div>

    <v-text-field
      v-model="query"
      placeholder="Search"
      prepend-inner-icon="search"
      hide-details
      density="compact"
      aria-label="Search catalog"
      class="resource-picker__search"
    />

    <div class="picker-table">
      <div class="picker-cols text-caption text-medium-emphasis font-weight-medium">
        <span class="picker-col picker-col--check" />
        <span class="picker-col picker-col--chev" />
        <span class="picker-col picker-col--item">Item</span>
        <span class="picker-col picker-col--inc">{{ includeColumnLabel }}</span>
        <span class="picker-col picker-col--level">Level</span>
      </div>

      <div class="picker-body">
        <div
          v-for="row in rows"
          :key="row.node.id"
          class="picker-row"
          :class="{ 'picker-row--on': isSelected(row.node.id) }"
        >
          <div class="picker-col picker-col--check">
            <v-checkbox-btn
              :model-value="isSelected(row.node.id)"
              density="compact"
              hide-details
              @update:model-value="toggleCheck(row.node.id)"
            />
          </div>
          <div class="picker-col picker-col--chev">
            <v-btn
              v-if="row.node.children?.length"
              icon
              variant="text"
              size="x-small"
              :aria-label="expanded[row.node.id] !== false ? 'Collapse' : 'Expand'"
              @click="toggleExpand(row.node.id)"
            >
              <v-icon size="16">{{ expanded[row.node.id] !== false ? 'chevron-down' : 'chevron-right' }}</v-icon>
            </v-btn>
          </div>
          <div
            class="picker-col picker-col--item"
            :style="{ paddingLeft: `${(row.depth - 1) * 16}px` }"
          >
            <span class="picker-row__name text-body-2">{{ row.node.label }}</span>
          </div>
          <div class="picker-col picker-col--inc text-caption text-medium-emphasis">
            <template v-if="includeCell(row).type === 'link'">
              <button
                type="button"
                class="picker-inc-link text-none"
                @click="toggleIncludeChildren(row.node.id)"
              >
                {{ includeCell(row).allOn ? 'Remove children' : 'Include children' }}
              </button>
            </template>
            <span v-else-if="includeCell(row).type === 'count'">{{ includeCell(row).value }}</span>
            <span v-else>—</span>
          </div>
          <div class="picker-col picker-col--level">
            <span
              class="nav-level-pill"
              :class="`nav-level-pill--l${Math.min(row.depth, MAX_MENU_DEPTH)}`"
            >
              L{{ row.depth }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <v-btn
      color="primary"
      variant="flat"
      class="resource-picker__apply text-none"
      :disabled="!selectedIds.length"
      @click="apply"
    >
      Apply to menu
    </v-btn>
  </div>
</template>

<style scoped lang="scss">
@use './navigationMenuShared.scss';

.resource-picker {
  min-width: 0;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: var(--mp-component-card-radius);
  padding: var(--mp-component-card-paddingCompact);
  background: rgb(var(--v-theme-surface));
}

.resource-picker__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-space-8);
  margin-bottom: var(--mp-space-12);
}

.resource-picker__title {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-bold);
  color: rgb(var(--v-theme-on-surface));
}

.resource-picker__expand {
  border: 0;
  background: none;
  padding: 0;
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-medium);
  color: rgb(var(--v-theme-primary));
  cursor: pointer;
}

.resource-picker__expand:hover {
  text-decoration: underline;
}

.resource-picker__search {
  margin-bottom: var(--mp-space-12);
}

.picker-table {
  border: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.6));
  border-radius: var(--mp-radius-8);
  overflow-x: auto;
  overflow-y: hidden;
}

.picker-cols,
.picker-row {
  display: grid;
  grid-template-columns: 36px 28px minmax(160px, 1fr) minmax(108px, 128px) 48px;
  align-items: center;
  column-gap: var(--mp-space-8);
  min-width: 480px;
}

.picker-cols {
  padding: var(--mp-space-8) var(--mp-space-10);
  background: rgb(var(--v-theme-surface-container-low));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.picker-body {
  max-height: 320px;
  overflow: auto;
}

.picker-row {
  min-height: var(--mp-component-control-height);
  padding: 0 var(--mp-space-10);
  border-bottom: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.5));
}

.picker-row:last-child {
  border-bottom: 0;
}

.picker-row:hover {
  background: rgba(var(--v-theme-primary), 0.03);
}

.picker-row--on {
  background: rgba(var(--v-theme-primary), 0.08);
}

.picker-col--check,
.picker-col--chev,
.picker-col--level {
  display: flex;
  align-items: center;
  justify-content: center;
}

.picker-col--item {
  min-width: 0;
  display: flex;
  align-items: center;
}

.picker-row__name {
  white-space: nowrap;
}

.picker-col--inc {
  min-width: 0;
}

.picker-inc-link {
  border: 0;
  background: none;
  padding: 0;
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
  cursor: pointer;
  font-size: var(--mp-fontSize-12);
  text-align: left;
}

.resource-picker__apply {
  width: 100%;
  margin-top: var(--mp-space-12);
}
</style>
