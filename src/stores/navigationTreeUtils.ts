import type { MenuItem } from '@/stores/useStoreNavigation'

export const MAX_MENU_DEPTH = 3

/** Deep clone menu tree; reactive proxies break structuredClone at nested levels. */
function cloneMenuTree(nodes: MenuItem[]): MenuItem[] {
  return JSON.parse(JSON.stringify(nodes)) as MenuItem[]
}

export function walkMenuItems(
  nodes: MenuItem[],
  visitor: (item: MenuItem, parent: MenuItem | null, depth: number) => void,
  parent: MenuItem | null = null,
  depth = 1,
) {
  for (const node of nodes) {
    visitor(node, parent, depth)
    if (node.children?.length) walkMenuItems(node.children, visitor, node, depth + 1)
  }
}

export function flattenMenuItems(nodes: MenuItem[]): { item: MenuItem; parent: MenuItem | null; depth: number }[] {
  const out: { item: MenuItem; parent: MenuItem | null; depth: number }[] = []
  walkMenuItems(nodes, (item, parent, depth) => out.push({ item, parent, depth }))
  return out
}

export function findMenuItem(nodes: MenuItem[], id: string): MenuItem | undefined {
  let found: MenuItem | undefined
  walkMenuItems(nodes, (item) => {
    if (item.id === id) found = item
  })
  return found
}

export function locateMenuItem(
  nodes: MenuItem[],
  id: string,
): { list: MenuItem[]; index: number; parent: MenuItem | null } | null {
  function search(list: MenuItem[], parent: MenuItem | null): { list: MenuItem[]; index: number; parent: MenuItem | null } | null {
    const index = list.findIndex((item) => item.id === id)
    if (index !== -1) return { list, index, parent }
    for (const item of list) {
      if (item.children?.length) {
        const hit = search(item.children, item)
        if (hit) return hit
      }
    }
    return null
  }
  return search(nodes, null)
}

export function maxRelativeDepth(node: MenuItem): number {
  if (!node.children?.length) return 1
  return 1 + Math.max(...node.children.map((child) => maxRelativeDepth(child)))
}

export function itemDepth(nodes: MenuItem[], id: string): number {
  const flat = flattenMenuItems(nodes)
  return flat.find((row) => row.item.id === id)?.depth ?? 1
}

export function removeMenuItem(nodes: MenuItem[], id: string): MenuItem[] {
  return nodes
    .filter((item) => item.id !== id)
    .map((item) => ({ ...item, children: removeMenuItem(item.children ?? [], id) }))
}

export function insertMenuChild(nodes: MenuItem[], parentId: string, child: MenuItem): MenuItem[] {
  return nodes.map((item) => {
    if (item.id === parentId) {
      return { ...item, children: [...(item.children ?? []), child] }
    }
    return { ...item, children: insertMenuChild(item.children ?? [], parentId, child) }
  })
}

export function appendTopLevelItem(nodes: MenuItem[], child: MenuItem): MenuItem[] {
  return [...nodes, child]
}

export function moveMenuItemFlat(nodes: MenuItem[], id: string, offset: -1 | 1): MenuItem[] {
  const loc = locateMenuItem(nodes, id)
  if (!loc) return nodes
  const next = loc.index + offset
  if (next < 0 || next >= loc.list.length) return nodes
  const clone = cloneMenuTree(nodes)
  const targetLoc = locateMenuItem(clone, id)
  if (!targetLoc) return nodes
  const [item] = targetLoc.list.splice(targetLoc.index, 1)
  if (item) targetLoc.list.splice(next, 0, item)
  return clone
}

export function indentMenuItem(nodes: MenuItem[], id: string): MenuItem[] {
  const loc = locateMenuItem(nodes, id)
  if (!loc || loc.index === 0) return nodes
  const node = loc.list[loc.index]
  if (!node) return nodes
  if (itemDepth(nodes, id) + maxRelativeDepth(node) - 1 > MAX_MENU_DEPTH) return nodes
  const clone = cloneMenuTree(nodes)
  const fresh = locateMenuItem(clone, id)
  if (!fresh || fresh.index === 0) return nodes
  const [moving] = fresh.list.splice(fresh.index, 1)
  if (!moving) return nodes
  const prev = fresh.list[fresh.index - 1]
  if (!prev) return nodes
  prev.children = [...(prev.children ?? []), moving]
  return clone
}

export function outdentMenuItem(nodes: MenuItem[], id: string): MenuItem[] {
  const loc = locateMenuItem(nodes, id)
  if (!loc?.parent) return nodes
  const clone = cloneMenuTree(nodes)
  const fresh = locateMenuItem(clone, id)
  if (!fresh?.parent) return nodes
  const parentLoc = locateMenuItem(clone, fresh.parent.id)
  if (!parentLoc) return nodes
  const [moving] = fresh.list.splice(fresh.index, 1)
  if (!moving) return nodes
  parentLoc.list.splice(parentLoc.index + 1, 0, moving)
  return clone
}

export function visibleMenuItems(nodes: MenuItem[]): MenuItem[] {
  return (nodes ?? []).filter((item) => !item.hidden)
}

export function countDescendants(node: MenuItem): number {
  let count = 0
  walkMenuItems(node.children ?? [], () => {
    count += 1
  })
  return count
}

function isDescendantOf(root: MenuItem, id: string): boolean {
  let hit = false
  walkMenuItems(root.children ?? [], (item) => {
    if (item.id === id) hit = true
  })
  return hit
}

export type MenuDropPosition = 'before' | 'after' | 'inside'

export function canDropMenuItem(
  nodes: MenuItem[],
  sourceId: string,
  targetId: string,
  position: MenuDropPosition,
): boolean {
  if (!sourceId || !targetId || sourceId === targetId) return false
  const source = findMenuItem(nodes, sourceId)
  const target = findMenuItem(nodes, targetId)
  if (!source || !target) return false
  if (isDescendantOf(source, targetId)) return false

  const sourceLoc = locateMenuItem(nodes, sourceId)
  const targetLoc = locateMenuItem(nodes, targetId)
  if (!sourceLoc || !targetLoc) return false

  const subtree = maxRelativeDepth(source)
  const targetDepth = itemDepth(nodes, targetId)

  if (position === 'inside') {
    return targetDepth + subtree <= MAX_MENU_DEPTH
  }

  const sameParent = (sourceLoc.parent?.id ?? null) === (targetLoc.parent?.id ?? null)
  if (sameParent) {
    return targetDepth + subtree - 1 <= MAX_MENU_DEPTH
  }

  return targetDepth + subtree - 1 <= MAX_MENU_DEPTH
}

export function moveMenuItemDrop(
  nodes: MenuItem[],
  sourceId: string,
  targetId: string,
  position: MenuDropPosition,
): MenuItem[] {
  if (!canDropMenuItem(nodes, sourceId, targetId, position)) return nodes
  const clone = cloneMenuTree(nodes)
  const sourceLoc = locateMenuItem(clone, sourceId)
  if (!sourceLoc) return nodes
  const [moving] = sourceLoc.list.splice(sourceLoc.index, 1)
  if (!moving) return nodes

  const targetLoc = locateMenuItem(clone, targetId)
  if (!targetLoc) {
    sourceLoc.list.splice(sourceLoc.index, 0, moving)
    return nodes
  }

  if (position === 'inside') {
    const parent = targetLoc.list[targetLoc.index]
    if (parent) parent.children = [...(parent.children ?? []), moving]
  } else if (position === 'before') {
    targetLoc.list.splice(targetLoc.index, 0, moving)
  } else {
    targetLoc.list.splice(targetLoc.index + 1, 0, moving)
  }
  return clone
}

function treeMaxDepth(nodes: MenuItem[], depth = 1): number {
  let max = depth
  for (const node of nodes) {
    if (node.children?.length) {
      max = Math.max(max, treeMaxDepth(node.children, depth + 1))
    }
  }
  return max
}

/**
 * Insert `source` before/after `target` in the target's sibling list (flat-list drag reorder).
 * Does not use the "inside" nest position — use Indent for nesting.
 */
export function moveMenuItemSibling(
  nodes: MenuItem[],
  sourceId: string,
  targetId: string,
  position: 'before' | 'after',
): MenuItem[] {
  if (!sourceId || !targetId || sourceId === targetId) return nodes
  const source = findMenuItem(nodes, sourceId)
  if (!source) return nodes
  if (isDescendantOf(source, targetId)) return nodes

  const clone = cloneMenuTree(nodes)
  const sourceLoc = locateMenuItem(clone, sourceId)
  if (!sourceLoc) return nodes
  const [moving] = sourceLoc.list.splice(sourceLoc.index, 1)
  if (!moving) return nodes

  const targetLoc = locateMenuItem(clone, targetId)
  if (!targetLoc) {
    sourceLoc.list.splice(sourceLoc.index, 0, moving)
    return nodes
  }

  const insertAt = targetLoc.index + (position === 'after' ? 1 : 0)
  targetLoc.list.splice(insertAt, 0, moving)

  if (treeMaxDepth(clone) > MAX_MENU_DEPTH) return nodes
  return clone
}

/** Try before/after (and inside last) until one succeeds — used by drag-and-drop UI. */
export function moveMenuItemDropWithFallback(
  nodes: MenuItem[],
  sourceId: string,
  targetId: string,
  position: MenuDropPosition,
): MenuItem[] {
  const attempts: MenuDropPosition[] =
    position === 'inside'
      ? ['before', 'after', 'inside']
      : [position, position === 'before' ? 'after' : 'before']
  for (const attempt of attempts) {
    const next = moveMenuItemDrop(nodes, sourceId, targetId, attempt)
    if (next !== nodes) return next
  }
  return nodes
}

export function setMenuItemsHidden(nodes: MenuItem[], ids: string[], hidden: boolean): MenuItem[] {
  const idSet = new Set(ids)
  function mapList(list: MenuItem[]): MenuItem[] {
    return list.map((item) => ({
      ...item,
      hidden: idSet.has(item.id) ? hidden : item.hidden,
      children: mapList(item.children ?? []),
    }))
  }
  return mapList(nodes)
}

export function removeMenuItems(nodes: MenuItem[], ids: string[]): MenuItem[] {
  return ids.reduce((acc, id) => removeMenuItem(acc, id), nodes)
}
