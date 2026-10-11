<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { useStoreSettingsStore } from '@/stores/useStoreSettings'
import { useToast } from '@/composables/useToast'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'

const route = useRoute()
const toast = useToast()
const salesChannelsStore = useSalesChannelsStore()
const settingsStore = useStoreSettingsStore()

const accountId = computed(() => {
  const value = route.params.accountId
  return (Array.isArray(value) ? value[0] : value) ?? '2000290'
})

const channelId = computed(() => {
  const value = route.params.channelId
  return (Array.isArray(value) ? value[0] : value) ?? ''
})

const channel = computed(() => salesChannelsStore.getChannel(accountId.value, channelId.value))
const domain = computed(() => channel.value?.webStore?.domain)

const settings = computed(() => settingsStore.bundleFor(channelId.value, domain.value).website)

const backTo = computed(() => ({
  name: 'StoreSettingsLanding',
  params: { accountId: accountId.value, channelId: channelId.value },
}))

function save() {
  toast.success('Website configuration saved')
}
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

  <div v-else class="d-flex flex-column ga-5">
    <MpPageHeader
      eyebrow="Store settings"
      title="Website Configuration"
      :subtitle="`Cookie banner, SEO, and sitemap for ${channel.name}.`"
      :back-to="backTo"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" class="text-none" @click="save">Save</v-btn>
      </template>
    </MpPageHeader>

    <v-card flat border rounded="lg" class="store-settings-card">
      <MpSectionHeader title="Cookie banner" />
      <MpFormGrid :cols="2">
        <v-switch
          :model-value="settings.cookieBannerEnabled"
          label="Show cookie consent banner"
          class="mp-form-grid__full"
          @update:model-value="(v) => settingsStore.updateWebsite(channelId, { cookieBannerEnabled: !!v }, domain)"
        />
        <v-textarea
          :model-value="settings.cookieBannerText"
          label="Banner message"
          rows="3"
          class="mp-form-grid__full"
          :disabled="!settings.cookieBannerEnabled"
          @update:model-value="(v) => settingsStore.updateWebsite(channelId, { cookieBannerText: String(v) }, domain)"
        />
      </MpFormGrid>
    </v-card>

    <v-card flat border rounded="lg" class="store-settings-card">
      <MpSectionHeader title="Homepage SEO" />
      <MpFormGrid :cols="2">
        <v-text-field
          :model-value="settings.homepageSeoTitle"
          label="SEO title"
          class="mp-form-grid__full"
          @update:model-value="(v) => settingsStore.updateWebsite(channelId, { homepageSeoTitle: String(v) }, domain)"
        />
        <v-textarea
          :model-value="settings.homepageSeoDescription"
          label="SEO description"
          rows="3"
          class="mp-form-grid__full"
          @update:model-value="(v) => settingsStore.updateWebsite(channelId, { homepageSeoDescription: String(v) }, domain)"
        />
      </MpFormGrid>
    </v-card>

    <v-card flat border rounded="lg" class="store-settings-card">
      <MpSectionHeader title="Sitemap" />
      <MpFormGrid :cols="2">
        <v-text-field
          :model-value="settings.sitemapUrl"
          label="Sitemap URL"
          class="mp-form-grid__full"
          placeholder="https://your-store.example/sitemap.xml"
          @update:model-value="(v) => settingsStore.updateWebsite(channelId, { sitemapUrl: String(v) }, domain)"
        />
      </MpFormGrid>
    </v-card>
  </div>
</template>

<style scoped>
.store-settings-card {
  padding: var(--mp-component-card-padding);
}
</style>
