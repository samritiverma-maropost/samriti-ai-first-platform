import {
  catalogSubtreeSize,
  catalogToMenuItems,
  findCatalogNode,
} from '@/constants/navigationCatalog'
import { createMenuItem, type MenuItem } from '@/stores/useStoreNavigation'

export type DaVinciMenuStyle = 'simple' | 'collection-led' | 'brand-led' | 'promotional'

export interface DaVinciMenuPrefs {
  menuType: 'main' | 'mega'
  style: DaVinciMenuStyle
  depth: 2 | 3
  source: 'collections'
}

export const DEFAULT_DAVINCI_PREFS: DaVinciMenuPrefs = {
  menuType: 'main',
  style: 'collection-led',
  depth: 3,
  source: 'collections',
}

/** Prototype catalog roots mapped onto the playground collection tree. */
const STYLE_ROOT_IDS: Record<DaVinciMenuStyle, string[]> = {
  'brand-led': ['col-furn', 'col-best-sellers', 'col-sale', 'col-new-arrivals'],
  promotional: ['col-sale', 'col-new-arrivals', 'col-best-sellers', 'col-furn'],
  simple: ['col-summer', 'col-furn', 'col-sale'],
  'collection-led': ['col-summer', 'col-sale', 'col-new-arrivals', 'col-furn'],
}

function collectionRootOnly(nodeId: string): MenuItem | null {
  const node = findCatalogNode('collection', nodeId)
  if (!node) return null
  return createMenuItem({
    title: node.label,
    resourceType: 'collection',
    target: node.id,
    linkedLabel: node.label,
    linkedIds: [node.id],
    includeChildren: false,
    imageSource: 'collection',
    childTotal: catalogSubtreeSize('collection', node.id),
    children: [],
    aiDraft: true,
  })
}

function markAiDraftTree(items: MenuItem[]): MenuItem[] {
  return items.map((item) => ({
    ...item,
    aiDraft: true,
    imageSource: item.target === 'col-summer' ? 'collection' : item.imageSource,
    children: markAiDraftTree(item.children ?? []),
  }))
}

function capDepthTwo(items: MenuItem[]): MenuItem[] {
  return items.map((item) => ({
    ...item,
    children: (item.children ?? []).map((child) => ({
      ...child,
      children: [],
    })),
  }))
}

/** Sample Da Vinci draft from catalog + preferences (design-ready NavProto parity). */
export function buildDaVinciDraft(prefs: DaVinciMenuPrefs): MenuItem[] {
  const depth = prefs.depth === 2 ? 2 : 3
  const includeChildren = prefs.style !== 'simple' && depth >= 3
  const rootIds = STYLE_ROOT_IDS[prefs.style] ?? STYLE_ROOT_IDS['collection-led']

  let items: MenuItem[] = []
  for (const id of rootIds) {
    const node = findCatalogNode('collection', id)
    if (!node) continue
    if (includeChildren && (node.children?.length ?? 0) > 0) {
      const built = catalogToMenuItems([node], 'collection', 1)
      if (built[0]) items.push(built[0])
    } else {
      const flat = collectionRootOnly(id)
      if (flat) items.push(flat)
    }
  }

  if (depth === 2) items = capDepthTwo(items)
  return markAiDraftTree(items)
}

export const NAVIGATION_E2E_STEPS = [
  { id: 1, title: 'Navigation list', now: 'Click Create a menu to open the Phase 1 editor (empty).' },
  {
    id: 2,
    title: 'Create menu',
    now: 'Enter a menu name, then click Generate with Da Vinci (secondary) or Add new for a single item.',
  },
  { id: 3, title: 'Da Vinci setup', now: 'Choose menu type, style, and depth → Create draft.' },
  {
    id: 4,
    title: 'Review & edit',
    now: 'Same tree as manual build — select rows, edit label/link in Item details.',
  },
  {
    id: 5,
    title: 'Refine (optional)',
    now: 'With nothing selected, use quick chips or a prompt in the right panel.',
  },
  { id: 6, title: 'Preview', now: 'Preview desktop/mobile mega menu (no save required).' },
  { id: 7, title: 'Save & publish', now: 'Save — confirm if Active. Draft never goes live without this step.' },
] as const

export function computeNavigationE2eStep(input: {
  journeyE2e: boolean
  view: 'listing' | 'editor'
  e2eJustSaved: boolean
  saveConfirmOpen: boolean
  previewOpen: boolean
  e2eRefined: boolean
  fromDaVinci: boolean
  hasItems: boolean
  davinciModalOpen: boolean
  davinciGenerating: boolean
}): number {
  if (!input.journeyE2e) return 1
  if (input.e2eJustSaved && input.view === 'listing') return 7
  if (input.view === 'listing') return 1
  if (input.saveConfirmOpen) return 7
  if (input.previewOpen) return 6
  if (input.e2eRefined && input.fromDaVinci && input.hasItems) return 5
  if (input.fromDaVinci && input.hasItems) return 4
  if (input.davinciModalOpen || input.davinciGenerating) return 3
  if (input.view === 'editor') return 2
  return 1
}
