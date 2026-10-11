<script setup lang="ts">
import { computed, ref } from 'vue'
import MpAlert from '@/components/MpAlert.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import RovoDaVinciSidePanel from '@/review/rovo-davinci/RovoDaVinciSidePanel.vue'
import { flattenMenuItemTitles, useStoreNavigationStore } from '@/stores/useStoreNavigation'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'

const DEMO_ACCOUNT = '2000290'
const DEMO_CHANNEL = 'retest-sales-notification'

const navigationStore = useStoreNavigationStore()
const salesChannelsStore = useSalesChannelsStore()

const channel = computed(() => salesChannelsStore.getChannel(DEMO_ACCOUNT, DEMO_CHANNEL))
const menus = computed(() => navigationStore.menusForChannel(DEMO_CHANNEL))

const panelOpen = ref(true)
const panelExpanded = ref(false)
const toast = ref('')

const navSuggestions = [
  'Generate a main menu from my top collections',
  'Draft footer links for shipping and returns',
  'Suggest a simpler mobile navigation',
]

const recentThreads = [
  { id: 't1', title: 'Main menu from catalog', updatedLabel: '2 hours ago' },
  { id: 't2', title: 'Footer policy links', updatedLabel: 'Yesterday' },
]

function chipPreview(menu: (typeof menus.value)[number]) {
  const titles = flattenMenuItemTitles(menu.items)
  return { first: titles[0], more: Math.max(0, titles.length - 1) }
}

function onSend(message: string) {
  toast.value = `Review prototype — would send: “${message}”`
}

function onSuggestion(text: string) {
  toast.value = `Review prototype — suggestion: “${text}”`
}
</script>

<template>
  <div class="rovo-review d-flex flex-column h-100">
    <MpAlert
      tone="info"
      title="Review prototype — not merged"
      dismissible
      class="rovo-review__banner ma-4 mb-0"
      @dismiss="toast = ''"
    >
      ROVO / Da Vinci side panel for Sales Channel → Navigation. Route:
      <code class="text-body-2">/review/rovo-davinci-navigation</code>
      · See
      <code class="text-body-2">src/review/rovo-davinci/README.md</code>
    </MpAlert>

    <v-snackbar :model-value="Boolean(toast)" location="bottom" timeout="3200" @update:model-value="toast = ''">
      {{ toast }}
    </v-snackbar>

    <div class="rovo-review__shell d-flex flex-grow-1 min-height-0">
      <div class="rovo-review__main d-flex flex-column flex-grow-1 min-width-0 pa-4 pt-2">
        <nav class="text-body-2 mb-3" aria-label="Breadcrumb">
          <span class="text-medium-emphasis">Sales channel</span>
          <span class="mx-2 text-medium-emphasis">&gt;</span>
          <span class="text-medium-emphasis">{{ channel?.name ?? 'Store' }}</span>
          <span class="mx-2 text-medium-emphasis">&gt;</span>
          <span>Navigation</span>
        </nav>

        <div class="d-flex align-center flex-wrap ga-3 mb-4">
          <h1 class="text-h5 font-weight-bold ma-0 flex-grow-1">Navigation</h1>
          <v-btn
            v-if="!panelOpen"
            variant="outlined"
            class="text-none"
            prepend-icon="sparkles"
            @click="panelOpen = true"
          >
            Da Vinci
          </v-btn>
          <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none">
            Create a menu
          </v-btn>
        </div>

        <v-card flat border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
          <v-table hover class="flex-grow-1">
            <thead>
              <tr>
                <th>Menu name</th>
                <th>Menu items</th>
                <th class="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="menu in menus" :key="menu.id">
                <td class="font-weight-medium">{{ menu.name }}</td>
                <td>
                  <v-chip v-if="chipPreview(menu).first" size="small" variant="tonal" color="primary">
                    {{ chipPreview(menu).first }}
                  </v-chip>
                  <span v-if="chipPreview(menu).more" class="text-caption text-medium-emphasis ms-2">
                    +{{ chipPreview(menu).more }} more
                  </span>
                </td>
                <td class="text-center text-body-2">{{ menu.status }}</td>
              </tr>
            </tbody>
          </v-table>
          <MpEmptyState
            v-if="!menus.length"
            class="pa-8"
            icon="list-tree"
            title="No menus yet"
            description="Create a menu to control storefront header and footer links."
          />
        </v-card>
      </div>

      <RovoDaVinciSidePanel
        v-if="panelOpen"
        :expanded="panelExpanded"
        :suggestions="navSuggestions"
        :recent-threads="recentThreads"
        empty-hint="Maropost Da Vinci for storefront navigation (Shopify Sidekick pattern)."
        @close="panelOpen = false"
        @expand="panelExpanded = !panelExpanded"
        @send="onSend"
        @suggestion="onSuggestion"
      />
    </div>
  </div>
</template>

<style scoped>
.rovo-review {
  min-height: calc(100vh - var(--mp-layout-appbarHeight, 60px));
  background: rgb(var(--v-theme-background));
}

.rovo-review__shell {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.rovo-review__main {
  max-width: 1280px;
}

code {
  font-size: 0.85em;
}
</style>
