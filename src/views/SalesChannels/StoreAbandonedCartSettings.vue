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

const settings = computed(() => settingsStore.bundleFor(channelId.value, domain.value).abandonedCart)

const backTo = computed(() => ({
  name: 'StoreSettingsLanding',
  params: { accountId: accountId.value, channelId: channelId.value },
}))

function save() {
  toast.success('Abandoned cart settings saved')
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
      title="Abandoned Cart"
      :subtitle="`Recovery rules for carts left on ${channel.name}.`"
      :back-to="backTo"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" class="text-none" @click="save">Save</v-btn>
      </template>
    </MpPageHeader>

    <v-card flat border rounded="lg" class="store-settings-card">
      <MpSectionHeader title="Recovery" />
      <MpFormGrid :cols="2">
        <v-switch
          :model-value="settings.enabled"
          label="Enable abandoned cart recovery"
          class="mp-form-grid__full"
          @update:model-value="(v) => settingsStore.updateAbandonedCart(channelId, { enabled: !!v }, domain)"
        />
        <v-text-field
          :model-value="settings.delayHours"
          label="First reminder delay"
          type="number"
          min="1"
          suffix="hours"
          :disabled="!settings.enabled"
          @update:model-value="(v) => settingsStore.updateAbandonedCart(channelId, { delayHours: Number(v) }, domain)"
        />
        <v-text-field
          :model-value="settings.maxReminders"
          label="Maximum reminders"
          type="number"
          min="1"
          max="5"
          :disabled="!settings.enabled"
          @update:model-value="(v) => settingsStore.updateAbandonedCart(channelId, { maxReminders: Number(v) }, domain)"
        />
        <v-switch
          :model-value="settings.sendReminderEmail"
          label="Send reminder email"
          class="mp-form-grid__full"
          :disabled="!settings.enabled"
          @update:model-value="(v) => settingsStore.updateAbandonedCart(channelId, { sendReminderEmail: !!v }, domain)"
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
