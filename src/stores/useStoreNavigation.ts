import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { NavResourceType } from '@/constants/navigationCatalog'
import { findCatalogNode } from '@/constants/navigationCatalog'

export type MenuLinkType =
  | 'homepage'
  | 'search'
  | 'collection-list'
  | 'blog'
  | 'collection'
  | 'product'
  | 'page'
  | 'url'

export interface MenuLinkTypeDef {
  value: MenuLinkType
  label: string
  icon: string
  requiresResource: boolean
}

/** @deprecated Prefer NAV_RESOURCE_TYPE_OPTIONS — kept for campaign targets. */
export const MENU_LINK_TYPES: MenuLinkTypeDef[] = [
  { value: 'homepage', label: 'Homepage', icon: 'home', requiresResource: false },
  { value: 'search', label: 'Search', icon: 'search', requiresResource: false },
  { value: 'collection-list', label: 'Collection list', icon: 'layout-grid', requiresResource: false },
  { value: 'blog', label: 'Blog', icon: 'rss', requiresResource: false },
  { value: 'collection', label: 'Collection', icon: 'shapes', requiresResource: true },
  { value: 'product', label: 'Product', icon: 'package', requiresResource: true },
  { value: 'page', label: 'Page', icon: 'file-text', requiresResource: true },
  { value: 'url', label: 'Custom URL', icon: 'link', requiresResource: false },
]

export interface LinkResource {
  id: string
  label: string
  url: string
}

export const LINK_RESOURCES: Partial<Record<MenuLinkType, LinkResource[]>> = {
  collection: [
    { id: 'col-new-arrivals', label: 'New Arrivals', url: '/collections/new-arrivals' },
    { id: 'col-best-sellers', label: 'Best Sellers', url: '/collections/best-sellers' },
    { id: 'col-summer', label: 'Summer Essentials', url: '/collections/summer-essentials' },
    { id: 'col-outerwear', label: 'Outerwear', url: '/collections/outerwear' },
    { id: 'col-accessories', label: 'Accessories', url: '/collections/accessories' },
    { id: 'col-sale', label: 'Sale', url: '/collections/sale' },
  ],
  product: [
    { id: 'prod-atlas-parka', label: 'Atlas Parka', url: '/products/atlas-parka' },
    { id: 'prod-trail-runner', label: 'Trail Runner Sneaker', url: '/products/trail-runner-sneaker' },
    { id: 'prod-canvas-tote', label: 'Canvas Tote', url: '/products/canvas-tote' },
    { id: 'prod-merino-beanie', label: 'Merino Beanie', url: '/products/merino-beanie' },
  ],
  page: [
    { id: 'page-terms', label: 'Terms and conditions', url: '/pages/terms-and-conditions' },
    { id: 'page-privacy', label: 'Privacy policy', url: '/pages/privacy-policy' },
    { id: 'page-about', label: 'About us', url: '/pages/about-us' },
    { id: 'page-shipping', label: 'Shipping & returns', url: '/pages/shipping-returns' },
  ],
}

const FIXED_LINK_URLS: Partial<Record<NavResourceType, string>> = {
  homepage: '/',
  search: '/search',
  collection_list: '/collections',
  blog: '/blog',
}

export type MenuStatus = 'Active' | 'Inactive'

export type MenuImageSource = 'none' | 'collection' | 'custom'

export interface MenuItem {
  id: string
  title: string
  resourceType: NavResourceType
  target: string
  linkedLabel?: string
  linkedIds?: string[]
  includeChildren?: boolean
  hidden?: boolean
  imageSource?: MenuImageSource
  /** Catalog subtree size — drives “Included” copy (e.g. 2 of 15). */
  childTotal?: number
  children: MenuItem[]
  /** Da Vinci draft row — design-ready menu builder. */
  aiDraft?: boolean
  /** Legacy flat-editor field — migrated to resourceType on read. */
  linkType?: MenuLinkType
}

export interface StoreMenu {
  id: string
  channelId: string
  name: string
  handle: string
  status: MenuStatus
  updatedAt: string
  items: MenuItem[]
}

let itemIdCounter = 0

function linkTypeToResource(type: MenuLinkType): NavResourceType {
  if (type === 'url') return 'custom_url'
  if (type === 'collection-list') return 'collection_list'
  if (type === 'blog') return 'blog'
  if (type === 'page') return 'page'
  if (type === 'collection') return 'collection'
  if (type === 'product') return 'product'
  if (type === 'search') return 'search'
  return 'homepage'
}

function normalizeItem(raw: Partial<MenuItem> & { linkType?: MenuLinkType }): MenuItem {
  const resourceType = raw.resourceType ?? (raw.linkType ? linkTypeToResource(raw.linkType) : 'custom_url')
  const linkedLabel =
    raw.linkedLabel ??
    (resourceType === 'collection' || resourceType === 'page' || resourceType === 'product'
      ? LINK_RESOURCES[resourceType === 'product' ? 'product' : resourceType === 'page' ? 'page' : 'collection']?.find(
          (r) => r.id === raw.target,
        )?.label
      : resourceType === 'category'
        ? findCatalogNode('category', raw.target ?? '')?.label
        : undefined)

  return {
    id: raw.id ?? createMenuItemId(),
    title: raw.title ?? '',
    resourceType,
    target: raw.target ?? '',
    linkedLabel,
    linkedIds: raw.linkedIds ?? (raw.target ? [raw.target] : []),
    includeChildren: raw.includeChildren ?? false,
    hidden: raw.hidden ?? false,
    imageSource: raw.imageSource ?? 'none',
    childTotal: raw.childTotal,
    aiDraft: raw.aiDraft ?? false,
    children: (raw.children ?? []).map((child) => normalizeItem(child)),
  }
}

function createMenuItemId(): string {
  itemIdCounter += 1
  return `mi-${Date.now().toString(36)}-${itemIdCounter}`
}

export function createMenuItem(overrides: Partial<Omit<MenuItem, 'id'>> = {}, id?: string): MenuItem {
  return normalizeItem({
    id: id ?? createMenuItemId(),
    title: '',
    resourceType: 'custom_url',
    target: '/',
    children: [],
    ...overrides,
  })
}

export function createMenuDraft(channelId: string): StoreMenu {
  itemIdCounter += 1
  return {
    id: `menu-${Date.now().toString(36)}-${itemIdCounter}`,
    channelId,
    name: '',
    handle: '',
    status: 'Inactive',
    updatedAt: '',
    items: [],
  }
}

/** @deprecated Use navigationTreeUtils.moveMenuItemFlat in the tree editor. */
export function moveItem(items: MenuItem[], id: string, offset: -1 | 1): void {
  const index = items.findIndex((item) => item.id === id)
  const next = index + offset
  if (index === -1 || next < 0 || next >= items.length) return
  const [item] = items.splice(index, 1)
  if (item) items.splice(next, 0, item)
}

/** @deprecated Use navigationTreeUtils.removeMenuItem. */
export function removeItem(items: MenuItem[], id: string): void {
  const index = items.findIndex((item) => item.id === id)
  if (index !== -1) items.splice(index, 1)
}

export function slugifyHandle(name: string, taken: string[] = []): string {
  const base =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'menu'
  let handle = base
  let n = 2
  while (taken.includes(handle)) {
    handle = `${base}-${n}`
    n += 1
  }
  return handle
}

export function resolveItemUrl(item: MenuItem): string {
  const fixed = FIXED_LINK_URLS[item.resourceType]
  if (fixed) return fixed
  if (item.resourceType === 'custom_url') return item.target
  if (item.resourceType === 'category') {
    const node = findCatalogNode('category', item.target)
    return node ? `/collections/${node.label.toLowerCase().replace(/\s+/g, '-')}` : '/collections'
  }
  if (item.resourceType === 'blog') {
    const node = findCatalogNode('blog', item.target)
    return node ? `/blogs/${node.label.toLowerCase().replace(/\s+/g, '-')}` : '/blog'
  }
  const legacyKey =
    item.resourceType === 'collection' ? 'collection' : item.resourceType === 'page' ? 'page' : item.resourceType === 'product' ? 'product' : undefined
  if (legacyKey) {
    const resource = LINK_RESOURCES[legacyKey]?.find((r) => r.id === item.target)
    return resource?.url ?? ''
  }
  return item.target
}

const FALLBACK_LINK_TYPE: MenuLinkTypeDef = { value: 'homepage', label: 'Homepage', icon: 'home', requiresResource: false }

export function linkTypeDef(type: MenuLinkType): MenuLinkTypeDef {
  return MENU_LINK_TYPES.find((def) => def.value === type) ?? FALLBACK_LINK_TYPE
}

export function itemLinkLabel(item: MenuItem): string {
  if (item.resourceType === 'custom_url') return item.target || 'Custom URL'
  const typeLabel = NAV_LABELS[item.resourceType] ?? item.resourceType
  if (item.linkedLabel) return `${typeLabel} · ${item.linkedLabel}`
  if (FIXED_LINK_URLS[item.resourceType]) return typeLabel
  return typeLabel
}

/** Subtitle under each row in the menu structure tree (design-ready breadcrumbs). */
export function itemTreeSubtitle(item: MenuItem, depth: number, ancestorLabels: string[]): string {
  const typeLabel =
    item.resourceType === 'category' || item.resourceType === 'collection'
      ? 'Collection'
      : NAV_LABELS[item.resourceType] ?? item.resourceType
  const name = (item.linkedLabel?.split(',')[0] ?? item.linkedLabel)?.trim() || item.title
  if (depth === 1) return `${typeLabel} - ${name}`
  return `${typeLabel} ${[...ancestorLabels, name].join(' → ')}`
}

export function linkedResourceSummary(item: MenuItem): string {
  const typeLabel =
    item.resourceType === 'category' || item.resourceType === 'collection'
      ? 'Collection'
      : NAV_LABELS[item.resourceType] ?? item.resourceType
  const name = (item.linkedLabel?.split(',')[0] ?? item.linkedLabel)?.trim() || item.title
  return `${typeLabel} - ${name}`
}

const NAV_LABELS: Partial<Record<NavResourceType, string>> = {
  homepage: 'Home page',
  search: 'Search',
  collection_list: 'Collection list',
  blog: 'Blog',
  collection: 'Collection',
  category: 'Category',
  page: 'Page',
  product: 'Product',
}

export function itemIsComplete(item: MenuItem): boolean {
  if (!item.title.trim()) return false
  if (item.resourceType === 'custom_url') return item.target.trim().length > 0
  if (['collection', 'category', 'page', 'blog', 'product'].includes(item.resourceType)) {
    return item.target.trim().length > 0 || Boolean(item.linkedIds?.length)
  }
  return true
}

export function flattenMenuItemTitles(items: MenuItem[]): string[] {
  const titles: string[] = []
  function walk(nodes: MenuItem[]) {
    for (const node of nodes) {
      if (node.title.trim()) titles.push(node.title.trim())
      if (node.children?.length) walk(node.children)
    }
  }
  walk(items)
  return titles
}

function seedMenus(): StoreMenu[] {
  return [
    {
      id: 'menu-atlas-main',
      channelId: 'retest-sales-notification',
      name: 'Main Menu',
      handle: 'main-menu',
      status: 'Active',
      updatedAt: 'Jul 8, 2026',
      items: [
        createMenuItem(
          {
            title: 'Furniture',
            resourceType: 'collection',
            target: 'col-furn',
            linkedLabel: 'Furniture',
            linkedIds: ['col-furn', 'col-sofas', 'col-seats', 'col-3s'],
            includeChildren: true,
            imageSource: 'collection',
            childTotal: 15,
            children: [
              createMenuItem(
                {
                  title: 'Sofas',
                  resourceType: 'collection',
                  target: 'col-sofas',
                  linkedLabel: 'Sofas',
                  linkedIds: ['col-sofas', 'col-seats', 'col-3s'],
                  imageSource: 'collection',
                  childTotal: 4,
                  children: [
                    createMenuItem(
                      {
                        title: 'Seats',
                        resourceType: 'collection',
                        target: 'col-seats',
                        linkedLabel: 'Seats',
                        linkedIds: ['col-seats'],
                        imageSource: 'collection',
                      },
                      'mi-furn-seats',
                    ),
                    createMenuItem(
                      {
                        title: '3 Seater',
                        resourceType: 'collection',
                        target: 'col-3s',
                        linkedLabel: '3 Seater',
                        linkedIds: ['col-3s'],
                        imageSource: 'collection',
                      },
                      'mi-furn-3s',
                    ),
                  ],
                },
                'mi-furn-sofas',
              ),
              createMenuItem(
                {
                  title: 'Tables',
                  resourceType: 'collection',
                  target: 'col-tables',
                  linkedLabel: 'Tables',
                  linkedIds: ['col-tables'],
                  imageSource: 'collection',
                  childTotal: 3,
                  children: [],
                },
                'mi-furn-tables',
              ),
            ],
          },
          'mi-furn-root',
        ),
      ],
    },
    {
      id: 'menu-atlas-footer',
      channelId: 'retest-sales-notification',
      name: 'Footer Menu',
      handle: 'footer-menu',
      status: 'Active',
      updatedAt: 'Jul 2, 2026',
      items: [
        createMenuItem({ title: 'Search', resourceType: 'search' }, 'mi-atlas-search'),
        createMenuItem({ title: 'Privacy policy', resourceType: 'page', target: 'page-privacy', linkedLabel: 'Privacy policy' }, 'mi-atlas-privacy'),
        createMenuItem({ title: 'Terms and conditions', resourceType: 'page', target: 'page-terms', linkedLabel: 'Terms and conditions' }, 'mi-atlas-terms'),
        createMenuItem({ title: 'Shipping & returns', resourceType: 'page', target: 'page-shipping', linkedLabel: 'Shipping & returns' }, 'mi-atlas-shipping'),
        createMenuItem({ title: 'Contact', resourceType: 'custom_url', target: 'https://atlas-outfitters.com/contact' }, 'mi-atlas-contact'),
      ],
    },
    {
      id: 'menu-atlas-holiday',
      channelId: 'retest-sales-notification',
      name: 'Holiday menu',
      handle: 'holiday-menu',
      status: 'Inactive',
      updatedAt: 'Jun 24, 2026',
      items: [
        createMenuItem({ title: 'Gift guide', resourceType: 'collection', target: 'col-sale', linkedLabel: 'Sale' }, 'mi-atlas-gifts'),
        createMenuItem({ title: 'Sale', resourceType: 'collection', target: 'col-sale', linkedLabel: 'Sale' }, 'mi-atlas-sale'),
      ],
    },
    {
      id: 'menu-beta-main',
      channelId: 'beta-sales-channel',
      name: 'Main menu',
      handle: 'main-menu',
      status: 'Active',
      updatedAt: 'Jul 5, 2026',
      items: [
        createMenuItem({ title: 'Home', resourceType: 'homepage' }, 'mi-beta-home'),
        createMenuItem({ title: 'Shop', resourceType: 'collection_list' }, 'mi-beta-shop'),
      ],
    },
  ]
}

export const useStoreNavigationStore = defineStore('storeNavigation', () => {
  const menus = ref<StoreMenu[]>(seedMenus())

  function menusForChannel(channelId: string): StoreMenu[] {
    return menus.value.filter((menu) => menu.channelId === channelId)
  }

  function getMenu(menuId: string): StoreMenu | undefined {
    return menus.value.find((menu) => menu.id === menuId)
  }

  function saveMenu(draft: StoreMenu): StoreMenu {
    const taken = menus.value.filter((m) => m.id !== draft.id && m.channelId === draft.channelId).map((m) => m.handle)
    const saved: StoreMenu = {
      ...draft,
      handle: draft.handle || slugifyHandle(draft.name, taken),
      updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      items: draft.items.map((item) => normalizeItem(item)),
    }
    const index = menus.value.findIndex((menu) => menu.id === draft.id)
    if (index === -1) menus.value.push(saved)
    else menus.value[index] = saved
    return saved
  }

  function setMenuStatus(menuId: string, status: MenuStatus): void {
    const menu = getMenu(menuId)
    if (menu) menu.status = status
  }

  function deleteMenu(menuId: string): void {
    menus.value = menus.value.filter((menu) => menu.id !== menuId)
  }

  return { menus, menusForChannel, getMenu, saveMenu, setMenuStatus, deleteMenu }
})
