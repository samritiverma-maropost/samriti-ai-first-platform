<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { STORE_EDITOR_ITEMS } from './storeEditorMenu'
import type { SalesChannel } from '@/stores/useSalesChannels'

const props = defineProps<{
  channel: SalesChannel
}>()

const route = useRoute()

const accountId = computed(() => {
  const id = Array.isArray(route.params.accountId) ? route.params.accountId[0] : route.params.accountId
  return id ?? '2000290'
})

const items = computed(() =>
  STORE_EDITOR_ITEMS.map((item) => ({
    slug: item.slug,
    label: item.label,
    icon: item.icon,
    to: { name: item.routeName, params: { accountId: accountId.value, channelId: props.channel.id } },
    match: item.match,
  })),
)

function isActive(match: string[]) {
  return typeof route.name === 'string' && match.includes(route.name)
}
</script>

<template>
  <aside class="store-icon-rail" aria-label="Store editor navigation">
    <router-link
      class="store-icon-rail__back"
      :to="{ name: 'SalesChannels', params: { accountId } }"
      aria-label="All sales channels"
    >
      <v-icon size="16">arrow-left</v-icon>
    </router-link>

    <nav class="store-icon-rail__nav">
      <v-tooltip v-for="item in items" :key="item.slug" :text="item.label" location="end">
        <template #activator="{ props: tipProps }">
          <router-link
            v-bind="tipProps"
            :to="item.to"
            class="store-icon-rail__item"
            :class="{ 'store-icon-rail__item--active': isActive(item.match) }"
            :aria-label="item.label"
            :aria-current="isActive(item.match) ? 'page' : undefined"
          >
            <v-icon size="22">{{ item.icon }}</v-icon>
          </router-link>
        </template>
      </v-tooltip>
    </nav>
  </aside>
</template>

<style scoped lang="scss">
.store-icon-rail {
  flex-shrink: 0;
  width: var(--mp-layout-sidebarRailWidth);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--mp-space-12);
  padding: var(--mp-space-12) var(--mp-space-8);
  border-right: 1px solid var(--border-subtle);
  background: var(--surface-primary);
  min-height: 0;
  align-self: stretch;
}

.store-icon-rail__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--mp-component-control-height);
  height: var(--mp-component-control-height);
  border-radius: var(--mp-component-nav-itemRadius);
  color: var(--muted);
  text-decoration: none;
  transition: background 120ms ease, color 120ms ease;
}

.store-icon-rail__back:hover {
  background: var(--surface-secondary);
  color: var(--text-primary);
}

.store-icon-rail__nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--mp-space-4);
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  width: 100%;
}

.store-icon-rail__item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--mp-component-control-height);
  height: var(--mp-component-control-height);
  border-radius: var(--mp-component-nav-itemRadius);
  color: var(--muted);
  text-decoration: none;
  transition: background 120ms ease, color 120ms ease;
}

.store-icon-rail__item:hover {
  background: var(--surface-secondary);
  color: var(--text-primary);
}

.store-icon-rail__item--active {
  background: var(--surface-secondary);
  color: rgb(var(--v-theme-primary));
}

.store-icon-rail__item--active::before {
  content: '';
  position: absolute;
  top: var(--mp-component-nav-activeBarInset);
  bottom: var(--mp-component-nav-activeBarInset);
  left: 0;
  width: 2px;
  border-radius: 0 2px 2px 0;
  background: rgb(var(--v-theme-primary));
}

@media (max-width: 900px) {
  .store-icon-rail {
    flex-direction: row;
    width: 100%;
    max-height: var(--mp-component-control-height);
    overflow-x: auto;
    overflow-y: hidden;
    border-right: 0;
    border-bottom: 1px solid var(--border-subtle);
  }

  .store-icon-rail__nav {
    flex-direction: row;
    flex: 1;
  }
}
</style>
