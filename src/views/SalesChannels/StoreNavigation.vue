<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { computeNavigationE2eStep } from '@/constants/navigationDaVinci'
import NavigationDaVinciE2eBanner from '@/components/saleschannels/navigation/NavigationDaVinciE2eBanner.vue'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { flattenMenuItemTitles, useStoreNavigationStore, type StoreMenu } from '@/stores/useStoreNavigation'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'

const route = useRoute()
const router = useRouter()
const salesChannelsStore = useSalesChannelsStore()
const navigationStore = useStoreNavigationStore()

const accountId = computed(() => {
  const value = route.params.accountId
  return (Array.isArray(value) ? value[0] : value) ?? '2000290'
})

const channelId = computed(() => {
  const value = route.params.channelId
  return (Array.isArray(value) ? value[0] : value) ?? ''
})

const channel = computed(() => salesChannelsStore.getChannel(accountId.value, channelId.value))

const search = ref('')
const page = ref(1)
const rowsPerPage = ref(10)

const journeyE2e = computed(() => route.query.journey === 'e2e')
const e2eJustSaved = ref(route.query.saved === '1')

watch(
  () => route.query.saved,
  (value) => {
    e2eJustSaved.value = value === '1'
  },
)

const e2eStep = computed(() =>
  computeNavigationE2eStep({
    journeyE2e: journeyE2e.value,
    view: 'listing',
    e2eJustSaved: e2eJustSaved.value,
    saveConfirmOpen: false,
    previewOpen: false,
    e2eRefined: false,
    fromDaVinci: false,
    hasItems: false,
    davinciModalOpen: false,
    davinciGenerating: false,
  }),
)

const journeyQuery = computed(() => (journeyE2e.value ? { journey: 'e2e' as const } : {}))

const menus = computed(() => navigationStore.menusForChannel(channelId.value))

const filteredMenus = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return menus.value
  return menus.value.filter((menu) => {
    const titles = flattenMenuItemTitles(menu.items)
    return menu.name.toLowerCase().includes(term) || titles.some((t) => t.toLowerCase().includes(term))
  })
})

const pageCount = computed(() => Math.max(1, Math.ceil(filteredMenus.value.length / rowsPerPage.value)))

const pagedMenus = computed(() => {
  const start = (page.value - 1) * rowsPerPage.value
  return filteredMenus.value.slice(start, start + rowsPerPage.value)
})

const rangeLabel = computed(() => {
  if (!filteredMenus.value.length) return '0–0 of 0'
  const start = (page.value - 1) * rowsPerPage.value + 1
  const end = Math.min(page.value * rowsPerPage.value, filteredMenus.value.length)
  return `${start}–${end} of ${filteredMenus.value.length}`
})

function chipPreview(menu: StoreMenu) {
  const titles = flattenMenuItemTitles(menu.items)
  return {
    first: titles[0],
    more: Math.max(0, titles.length - 1),
  }
}

function openEditor(menu: StoreMenu) {
  router.push({
    name: 'StoreNavigationMenuEdit',
    params: { accountId: accountId.value, channelId: channelId.value, menuId: menu.id },
    query: { ...journeyQuery.value },
  })
}

function openCreate() {
  router.push({
    name: 'StoreNavigationMenuCreate',
    params: { accountId: accountId.value, channelId: channelId.value },
    query: { ...journeyQuery.value },
  })
}

function restartE2eJourney() {
  e2eJustSaved.value = false
  router.replace({
    name: 'StoreNavigation',
    params: { accountId: accountId.value, channelId: channelId.value },
    query: { journey: 'e2e' },
  })
}

const deleteDialog = ref(false)
const menuPendingDelete = ref<StoreMenu | null>(null)

function askDelete(menu: StoreMenu) {
  menuPendingDelete.value = menu
  deleteDialog.value = true
}

function confirmDelete() {
  if (menuPendingDelete.value) navigationStore.deleteMenu(menuPendingDelete.value.id)
  menuPendingDelete.value = null
}

const deleteMessage = computed(() => {
  const menu = menuPendingDelete.value
  if (!menu) return ''
  const count = flattenMenuItemTitles(menu.items).length
  return `"${menu.name}" and its ${count} menu item${count === 1 ? '' : 's'} will be removed. Theme sections referencing the "${menu.handle}" handle will stop showing this menu.`
})
</script>

<template>
  <div v-if="!channel" class="h-100 d-flex align-center justify-center">
    <v-card variant="flat" border rounded="lg" class="pa-6" max-width="420">
      <MpEmptyState
        icon="store"
        title="Sales channel not found"
        description="The store you're trying to manage doesn't exist or was removed."
        action-label="Back to sales channels"
        @action="router.push({ name: 'SalesChannels', params: { accountId } })"
      />
    </v-card>
  </div>

  <div v-else class="d-flex flex-column ga-5 pb-8">
    <NavigationDaVinciE2eBanner
      v-if="journeyE2e"
      :step="e2eStep"
      :show-complete="e2eJustSaved"
      @restart="restartE2eJourney"
    />

    <nav class="nav-crumb" aria-label="Breadcrumb">
      <router-link :to="{ name: 'SalesChannels', params: { accountId } }">Sales channel</router-link>
      <span class="nav-crumb__sep">&gt;</span>
      <router-link :to="{ name: 'SalesChannelDetail', params: { accountId, channelId } }">
        {{ channel.name }}
      </router-link>
      <span class="nav-crumb__sep">&gt;</span>
      <span class="text-medium-emphasis">Navigation</span>
    </nav>

    <div class="nav-list-head d-flex align-center flex-wrap ga-3">
      <h1 class="text-h5 font-weight-bold ma-0 flex-grow-1">Navigation</h1>
      <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">
        Create a menu
      </v-btn>
    </div>

    <v-card flat border rounded="lg" class="nav-list-card overflow-hidden">
      <div class="nav-list-toolbar d-flex align-center flex-wrap ga-3 pa-4">
        <v-text-field
          v-model="search"
          placeholder="Search menus or items…"
          prepend-inner-icon="search"
          hide-details
          density="compact"
          class="nav-search"
          aria-label="Search menus"
        />
      </div>

      <v-table class="nav-table" hover>
        <thead>
          <tr>
            <th>Menu name</th>
            <th>Menu items</th>
            <th class="text-center">Status</th>
            <th class="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="menu in pagedMenus"
            :key="menu.id"
            :class="{ 'nav-row--inactive': menu.status === 'Inactive' }"
          >
            <td>
              <button type="button" class="nav-menu-name text-none" @click="openEditor(menu)">
                {{ menu.name }}
              </button>
            </td>
            <td>
              <div class="d-flex align-center flex-wrap ga-2">
                <v-chip
                  v-if="chipPreview(menu).first"
                  size="small"
                  variant="tonal"
                  color="primary"
                  class="font-weight-medium"
                >
                  {{ chipPreview(menu).first }}
                </v-chip>
                <button
                  v-if="chipPreview(menu).more"
                  type="button"
                  class="nav-more text-none"
                >
                  +{{ chipPreview(menu).more }} more
                </button>
                <span v-if="!chipPreview(menu).first" class="text-caption text-medium-emphasis">No items yet</span>
              </div>
            </td>
            <td class="text-center">
              <span
                class="nav-status"
                :class="menu.status === 'Active' ? 'nav-status--active' : 'nav-status--inactive'"
              >
                {{ menu.status }}
              </span>
            </td>
            <td class="text-end">
              <MpRowActionsMenu ariaLabel="Menu actions" :itemLabel="menu.name">
                <MpMenuItem title="Edit" icon="pencil" @click="openEditor(menu)" />
                <v-divider class="my-1" />
                <MpMenuItem title="Delete" icon="trash-2" danger @click="askDelete(menu)" />
              </MpRowActionsMenu>
            </td>
          </tr>
        </tbody>
      </v-table>

      <MpEmptyState
        v-if="!filteredMenus.length"
        class="pa-8"
        icon="list-tree"
        title="No menus yet"
        description="Create a menu to control the links shoppers see in your storefront header and footer."
        action-label="Create a menu"
        action-icon="plus"
        @action="openCreate"
      />

      <div v-if="filteredMenus.length" class="nav-footer d-flex align-center flex-wrap ga-3 pa-4">
        <span class="text-body-2 text-medium-emphasis">Rows per page:</span>
        <v-select
          v-model="rowsPerPage"
          :items="[10, 25, 50]"
          density="compact"
          hide-details
          class="nav-rows-select"
        />
        <span class="text-body-2 text-medium-emphasis ms-auto">{{ rangeLabel }}</span>
        <v-btn
          icon="chevron-left"
          variant="text"
          size="small"
          :disabled="page <= 1"
          aria-label="Previous page"
          @click="page = Math.max(1, page - 1)"
        />
        <v-btn
          icon="chevron-right"
          variant="text"
          size="small"
          :disabled="page >= pageCount"
          aria-label="Next page"
          @click="page = Math.min(pageCount, page + 1)"
        />
      </div>
    </v-card>

    <MpConfirmDialog
      v-model="deleteDialog"
      title="Delete menu?"
      :message="deleteMessage"
      confirm-label="Delete menu"
      danger
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/components/saleschannels/navigation/navigationMenuShared.scss';

.nav-search {
  max-width: var(--mp-component-toolbar-searchWidth);
  min-width: var(--mp-component-toolbar-searchMinWidth);
}

.nav-table th {
  font-size: var(--mp-fontSize-12);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgb(var(--v-theme-on-surface-muted));
}

.nav-menu-name {
  border: 0;
  background: none;
  padding: 0;
  font-size: var(--mp-fontSize-14);
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  cursor: pointer;
}

.nav-row--inactive .nav-menu-name,
.nav-row--inactive .nav-more {
  opacity: 0.55;
}

.nav-more {
  border: 0;
  background: none;
  padding: 0;
  font-size: var(--mp-fontSize-13);
  font-weight: 500;
  color: rgb(var(--v-theme-primary));
  cursor: default;
}

.nav-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  padding: var(--mp-space-2) var(--mp-space-10);
  border-radius: var(--mp-radius-full);
  font-size: var(--mp-fontSize-12);
  font-weight: 600;
  border: 1px solid transparent;
}

.nav-status--active {
  color: rgb(var(--v-theme-success));
  border-color: rgb(var(--v-theme-success));
  background: rgba(var(--v-theme-success), 0.08);
}

.nav-status--inactive {
  color: rgb(var(--v-theme-error));
  border-color: rgb(var(--v-theme-error));
  background: rgba(var(--v-theme-error), 0.06);
}

.nav-footer {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.nav-rows-select {
  max-width: 88px;
}
</style>
