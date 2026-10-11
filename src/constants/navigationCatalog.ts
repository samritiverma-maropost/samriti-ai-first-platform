/** Catalog trees for navigation resource pickers (subset of design-ready prototype). */

import { MAX_MENU_DEPTH } from '@/stores/navigationTreeUtils'
import { createMenuItem, type MenuItem } from '@/stores/useStoreNavigation'

export interface CatalogNode {
  id: string
  label: string
  children?: CatalogNode[]
}

export const NAVIGATION_CATALOG: Record<'collection' | 'category' | 'page' | 'blog', CatalogNode[]> = {
  collection: [
    {
      id: 'col-furn',
      label: 'Furniture',
      children: [
        {
          id: 'col-sofas',
          label: 'Sofas',
          children: [
            { id: 'col-seats', label: 'Seats', children: [] },
            { id: 'col-3s', label: '3 Seater', children: [] },
            { id: 'col-2s', label: '2 Seater', children: [] },
            { id: 'col-sect', label: 'Sectional', children: [] },
          ],
        },
        {
          id: 'col-tables',
          label: 'Tables',
          children: [
            { id: 'col-coffee', label: 'Coffee tables', children: [] },
            { id: 'col-dine', label: 'Dining tables', children: [] },
            { id: 'col-side', label: 'Side tables', children: [] },
          ],
        },
        {
          id: 'col-beds',
          label: 'Beds',
          children: [
            { id: 'col-plat', label: 'Platform beds', children: [] },
            { id: 'col-uph', label: 'Upholstered beds', children: [] },
          ],
        },
      ],
    },
    {
      id: 'col-new-arrivals',
      label: 'New Arrivals',
      children: [
        { id: 'col-new-sofas', label: 'Sofas', children: [] },
        { id: 'col-new-tables', label: 'Tables', children: [] },
      ],
    },
    {
      id: 'col-best-sellers',
      label: 'Best Sellers',
      children: [{ id: 'col-best-outer', label: 'Outerwear', children: [] }],
    },
    {
      id: 'col-summer',
      label: 'Summer Essentials',
      children: [],
    },
    {
      id: 'col-sale',
      label: 'Sale',
      children: [],
    },
  ],
  category: [
    {
      id: 'cat-furniture',
      label: 'Furniture',
      children: [
        {
          id: 'cat-sofas',
          label: 'Sofas',
          children: [
            { id: 'cat-3-seater', label: '3 Seater', children: [] },
            { id: 'cat-2-seater', label: '2 Seater', children: [] },
          ],
        },
        {
          id: 'cat-tables',
          label: 'Tables',
          children: [
            { id: 'cat-coffee', label: 'Coffee Table', children: [] },
            { id: 'cat-dining', label: 'Dining Table', children: [] },
          ],
        },
      ],
    },
    {
      id: 'cat-outdoor',
      label: 'Outdoor',
      children: [{ id: 'cat-patio', label: 'Patio', children: [] }],
    },
  ],
  page: [
    { id: 'page-about', label: 'About us', children: [] },
    { id: 'page-contact', label: 'Contact', children: [] },
    { id: 'page-faq', label: 'FAQs', children: [] },
    { id: 'page-shipping', label: 'Shipping & returns', children: [] },
  ],
  blog: [
    {
      id: 'blog-style',
      label: 'Design Style',
      children: [
        { id: 'blog-patio', label: 'Patio to Pantry', children: [] },
        { id: 'blog-canvas', label: 'The Living Canvas', children: [] },
      ],
    },
    { id: 'blog-trend', label: 'Latest Trend', children: [] },
  ],
}

export const NAV_RESOURCE_TYPE_OPTIONS = [
  { value: 'custom_url', label: 'Custom URL', icon: 'link' },
  { value: 'collection', label: 'Collection', icon: 'shapes' },
  { value: 'category', label: 'Category', icon: 'layout-grid' },
  { value: 'homepage', label: 'Home page', icon: 'home' },
  { value: 'page', label: 'Pages', icon: 'file-text' },
  { value: 'blog', label: 'Blogs', icon: 'rss' },
  { value: 'search', label: 'Search', icon: 'search' },
  { value: 'product', label: 'Products', icon: 'package' },
  { value: 'collection_list', label: 'Collection list', icon: 'layout-list' },
] as const

export type NavResourceType = (typeof NAV_RESOURCE_TYPE_OPTIONS)[number]['value']

export const PICKER_RESOURCE_TYPES: NavResourceType[] = ['collection', 'category', 'page', 'blog']

export function findCatalogNode(kind: keyof typeof NAVIGATION_CATALOG, id: string): CatalogNode | undefined {
  let found: CatalogNode | undefined
  function walk(nodes: CatalogNode[]) {
    for (const node of nodes) {
      if (node.id === id) {
        found = node
        return
      }
      if (node.children?.length) walk(node.children)
      if (found) return
    }
  }
  walk(NAVIGATION_CATALOG[kind] ?? [])
  return found
}

export function walkCatalog(
  kind: keyof typeof NAVIGATION_CATALOG,
  visitor: (node: CatalogNode, depth: number) => void,
  depth = 1,
) {
  function walk(nodes: CatalogNode[], d: number) {
    for (const node of nodes) {
      visitor(node, d)
      if (node.children?.length) walk(node.children, d + 1)
    }
  }
  walk(NAVIGATION_CATALOG[kind] ?? [], depth)
}

export function catalogAncestorIds(kind: keyof typeof NAVIGATION_CATALOG, id: string): string[] {
  const chain: string[] = []
  function search(nodes: CatalogNode[], parents: string[]): boolean {
    for (const node of nodes) {
      if (node.id === id) {
        chain.push(...parents)
        return true
      }
      if (node.children?.length && search(node.children, [...parents, node.id])) return true
    }
    return false
  }
  search(NAVIGATION_CATALOG[kind] ?? [], [])
  return chain
}

export function catalogDescendantIds(kind: keyof typeof NAVIGATION_CATALOG, id: string): string[] {
  const root = findCatalogNode(kind, id)
  const out: string[] = []
  function walk(nodes: CatalogNode[]) {
    for (const node of nodes) {
      out.push(node.id)
      if (node.children?.length) walk(node.children)
    }
  }
  if (root?.children?.length) walk(root.children)
  return out
}

export function catalogSubtreeSize(kind: keyof typeof NAVIGATION_CATALOG, id: string): number {
  const root = findCatalogNode(kind, id)
  if (!root?.children?.length) return 0
  let count = 0
  function walk(nodes: CatalogNode[]) {
    for (const node of nodes) {
      count += 1
      if (node.children?.length) walk(node.children)
    }
  }
  walk(root.children)
  return count
}

export function catalogNodeDepth(kind: keyof typeof NAVIGATION_CATALOG, id: string): number {
  let depth = 1
  walkCatalog(kind, (node, d) => {
    if (node.id === id) depth = d
  })
  return depth
}

/** Shallowest catalog node in a multi-select (anchor for the linked resource row). */
export function catalogShallowestPickedId(
  kind: keyof typeof NAVIGATION_CATALOG,
  pickedIds: string[],
): string | null {
  if (!pickedIds.length) return null
  let rootId = pickedIds[0]!
  let minDepth = Infinity
  for (const id of pickedIds) {
    const depth = catalogNodeDepth(kind, id)
    if (depth < minDepth) {
      minDepth = depth
      rootId = id
    }
  }
  return rootId
}

/**
 * Build nested menu children from a catalog multi-select (design-ready apply behavior).
 * Only nodes in `pickedIds` appear; `includeById` expands full catalog subtrees.
 */
export function catalogSelectionToMenuChildren(
  kind: keyof typeof NAVIGATION_CATALOG,
  rootId: string,
  pickedIds: string[],
  includeById: Record<string, boolean>,
  resourceType: NavResourceType,
  menuItemDepth: number,
): MenuItem[] {
  const picked = new Set(pickedIds)
  const root = findCatalogNode(kind, rootId)
  if (!root?.children?.length || menuItemDepth >= MAX_MENU_DEPTH) return []

  function walk(nodes: CatalogNode[], depth: number): MenuItem[] {
    const items: MenuItem[] = []
    for (const node of nodes) {
      if (!picked.has(node.id)) continue
      const includeKids = Boolean(includeById[node.id])
      let children: MenuItem[] = []
      if (node.children?.length && depth < MAX_MENU_DEPTH) {
        children = includeKids
          ? catalogToMenuItems(node.children, resourceType, depth + 1, kind)
          : walk(node.children, depth + 1)
      }
      items.push(
        createMenuItem({
          title: node.label,
          resourceType,
          target: node.id,
          linkedLabel: node.label,
          linkedIds: [node.id],
          includeChildren: includeKids,
          imageSource: 'collection',
          childTotal: catalogSubtreeSize(kind, node.id),
          children,
        }),
      )
    }
    return items
  }

  return walk(root.children, menuItemDepth + 1)
}

/** Mock product list for the Products resource picker. */
export const NAVIGATION_PRODUCTS: { id: string; label: string }[] = [
  { id: 'prod-atlas-parka', label: 'Atlas Parka' },
  { id: 'prod-trail-runner', label: 'Trail Runner Sneaker' },
  { id: 'prod-canvas-tote', label: 'Canvas Tote' },
  { id: 'prod-merino-beanie', label: 'Merino Beanie' },
  { id: 'prod-linen-duvet', label: 'Linen Duvet Cover' },
  { id: 'prod-oak-sideboard', label: 'Oak Sideboard' },
]

export function catalogToMenuItems(
  nodes: CatalogNode[],
  resourceType: NavResourceType,
  depth: number,
  catalogKind: keyof typeof NAVIGATION_CATALOG = 'collection',
): MenuItem[] {
  if (depth > MAX_MENU_DEPTH || !nodes.length) return []
  return nodes.map((node) =>
    createMenuItem({
      title: node.label,
      resourceType,
      target: node.id,
      linkedLabel: node.label,
      linkedIds: [node.id],
      imageSource: 'collection',
      childTotal: catalogSubtreeSize(catalogKind, node.id),
      children:
        node.children?.length && depth < MAX_MENU_DEPTH
          ? catalogToMenuItems(node.children, resourceType, depth + 1, catalogKind)
          : [],
    }),
  )
}

export function flattenCatalog(kind: keyof typeof NAVIGATION_CATALOG): CatalogNode[] {
  const out: CatalogNode[] = []
  function walk(nodes: CatalogNode[], depth: number) {
    for (const node of nodes) {
      out.push({ ...node, children: node.children })
      if (node.children?.length) walk(node.children, depth + 1)
    }
  }
  walk(NAVIGATION_CATALOG[kind] ?? [], 1)
  return out
}
