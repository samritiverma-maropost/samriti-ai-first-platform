<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpOptionCard from '@/components/MpOptionCard.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'

const route = useRoute()
const salesChannelsStore = useSalesChannelsStore()

const accountId = computed(() => {
  const value = route.params.accountId
  return (Array.isArray(value) ? value[0] : value) ?? '2000290'
})

const channelId = computed(() => {
  const value = route.params.channelId
  return (Array.isArray(value) ? value[0] : value) ?? ''
})

const channel = computed(() => salesChannelsStore.getChannel(accountId.value, channelId.value))

const tiles = computed(() => [
  {
    id: 'website',
    title: 'Website Configuration',
    description: 'Cookie banner, homepage SEO, and sitemap.',
    icon: 'globe',
    to: { name: 'StoreWebsiteConfiguration', params: { accountId: accountId.value, channelId: channelId.value } },
  },
  {
    id: 'abandoned-cart',
    title: 'Abandoned Cart',
    description: 'Recovery timing and reminder emails.',
    icon: 'shopping-cart',
    to: { name: 'StoreAbandonedCartSettings', params: { accountId: accountId.value, channelId: channelId.value } },
  },
  {
    id: 'payments',
    title: 'Payments',
    description: 'Checkout gateway and Maropay connection.',
    icon: 'credit-card',
    to: { name: 'StorePaymentsGateway', params: { accountId: accountId.value, channelId: channelId.value } },
  },
])
</script>

<template>
  <div v-if="!channel" class="h-100 d-flex align-center justify-center">
    <v-card variant="flat" border rounded="lg" class="pa-6" max-width="420">
      <MpEmptyState
        icon="store"
        title="Sales channel not found"
        description="The store you're trying to manage doesn't exist or was removed."
        action-label="Back to sales channels"
        @action="$router.push({ name: 'SalesChannels', params: { accountId } })"
      />
    </v-card>
  </div>

  <div v-else class="d-flex flex-column ga-6">
    <MpPageHeader
      :eyebrow="`Sales channels · ${channel.name}`"
      title="Store Settings"
      subtitle="Configure website behaviour, cart recovery, and checkout payments for this store."
    />

    <div class="store-settings-grid">
      <MpOptionCard
        v-for="tile in tiles"
        :key="tile.id"
        :to="tile.to"
        :title="tile.title"
        :description="tile.description"
        :icon="tile.icon"
        :heading-level="2"
        class="h-100"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.store-settings-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--mp-space-20);
  max-width: var(--mp-layout-contentMaxWidth);
}

@media (max-width: $mp-layout-breakpointCompact) {
  .store-settings-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
