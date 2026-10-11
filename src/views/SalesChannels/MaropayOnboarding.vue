<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import {
  canAccessMaropayOnboardingForm,
  isMaropayAccountVerified,
  useMaropayOnboardingStore,
  type MaropayBusinessType,
} from '@/stores/useMaropayOnboarding'
import { useToast } from '@/composables/useToast'
import { showMaropayToast } from '@/composables/useMaropayToast'
import MpAlert from '@/components/MpAlert.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const salesChannelsStore = useSalesChannelsStore()
const maropayStore = useMaropayOnboardingStore()

const accountId = computed(() => {
  const value = route.params.accountId
  return (Array.isArray(value) ? value[0] : value) ?? '2000290'
})

const channelId = computed(() => {
  const value = route.params.channelId
  return (Array.isArray(value) ? value[0] : value) ?? ''
})

const channel = computed(() => salesChannelsStore.getChannel(accountId.value, channelId.value))
const maropay = computed(() => maropayStore.stateFor(channelId.value))
const form = computed(() => maropay.value.onboarding)

const editFromManage = computed(() => route.query.from === 'manage')

const isVerifiedEditMode = computed(() => isMaropayAccountVerified(maropay.value.status))

const backTo = computed(() => {
  if (editFromManage.value || isVerifiedEditMode.value) {
    return {
      name: 'MaropayManageSettings',
      params: { accountId: accountId.value, channelId: channelId.value },
    }
  }
  return {
    name: 'StorePaymentsGateway',
    params: { accountId: accountId.value, channelId: channelId.value },
  }
})

const entityTypes = ['Private corporation', 'Public corporation', 'Partnership', 'Sole proprietorship']
const countries = ['United States', 'Canada', 'Australia', 'United Kingdom', 'New Zealand']

const businessTypeOptions: { value: MaropayBusinessType; title: string; description: string }[] = [
  {
    value: 'individual',
    title: 'An individual',
    description: "I am not registered with any legal entities and I'm running the store in my own name.",
  },
  {
    value: 'registered_business',
    title: 'A registered business',
    description: 'I have a business registered with the government that will own this store.',
  },
  {
    value: 'non_profit',
    title: 'A non-profit',
    description: 'I have a non-profit entity registered with the government that will own this store.',
  },
]

const submitting = ref(false)

const canAccessForm = computed(() => canAccessMaropayOnboardingForm(maropay.value.status))

const blockedReason = computed(() => {
  if (maropay.value.status === 'under_review') {
    return 'Your Maropay application is under review. Business details cannot be edited until a decision is made.'
  }
  if (maropay.value.status === 'connecting') {
    return 'Maropay is still connecting. Try again in a moment.'
  }
  return 'Connect Maropay from the payments gateway before completing your business application.'
})

onMounted(() => {
  if (maropay.value.status === 'action_required') {
    showMaropayToast('verification_failed')
  }
})

function patch(patch: Partial<typeof form.value>) {
  maropayStore.updateOnboarding(channelId.value, patch)
}

function saveDraft() {
  maropayStore.saveDraft(channelId.value)
  showMaropayToast('draft_saved')
}

async function submitApplication() {
  if (!form.value.agreedToTerms) {
    toast.warning('Accept the Maropay Terms of Service to continue')
    return
  }
  submitting.value = true
  await new Promise((resolve) => window.setTimeout(resolve, 600))
  maropayStore.submitOnboarding(channelId.value)
  submitting.value = false
  router.push(backTo.value)
}

async function saveVerifiedProfile() {
  submitting.value = true
  await new Promise((resolve) => window.setTimeout(resolve, 400))
  submitting.value = false
  showMaropayToast('profile_updated')
  router.push(backTo.value)
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
        @action="router.push({ name: 'SalesChannels', params: { accountId } })"
      />
    </v-card>
  </div>

  <div v-else-if="!canAccessForm" class="h-100 d-flex align-center justify-center">
    <v-card variant="flat" border rounded="lg" class="pa-6" max-width="480">
      <MpEmptyState
        icon="credit-card"
        title="Maropay setup not available"
        :description="blockedReason"
        action-label="Back to payments"
        @action="router.push({ name: 'StorePaymentsGateway', params: { accountId, channelId } })"
      />
    </v-card>
  </div>

  <div v-else class="d-flex flex-column ga-5 pb-8">
    <MpPageHeader
      :eyebrow="isVerifiedEditMode ? 'Store settings · Payments · MaroPay · Edit details' : 'Store settings · Payments · Maropay'"
      :title="isVerifiedEditMode ? 'Edit business details' : 'Tell us about your business'"
      :subtitle="
        isVerifiedEditMode
          ? 'Update your verified business, address, and bank information on file with MaroPay.'
          : 'Complete verification so Maropay can send payouts to your bank account.'
      "
      :back-to="backTo"
    />

    <MpAlert
      v-if="isVerifiedEditMode"
      tone="info"
      title="Verified MaroPay account"
    >
      Changes to identity or bank details may trigger a brief re-verification before your next payout.
    </MpAlert>

    <v-card flat border rounded="lg" class="onboarding-card">
      <MpFormSection
        title="Business type"
        description="Verify that your business type matches your legal registration."
      >
        <div class="d-flex flex-column ga-3">
          <v-card
            v-for="option in businessTypeOptions"
            :key="option.value"
            flat
            border
            rounded="lg"
            class="business-type-row pa-4"
            :class="{ 'business-type-row--active': form.businessType === option.value }"
            role="button"
            tabindex="0"
            @click="patch({ businessType: option.value })"
            @keydown.enter="patch({ businessType: option.value })"
          >
            <div class="d-flex ga-4">
              <v-radio
                :model-value="form.businessType"
                :value="option.value"
                hide-details
                @update:model-value="patch({ businessType: $event as MaropayBusinessType })"
              />
              <div class="flex-grow-1">
                <div class="text-body-1 font-weight-bold">{{ option.title }}</div>
                <div class="text-body-2 text-medium-emphasis">{{ option.description }}</div>
                <v-select
                  v-if="option.value === 'registered_business' && form.businessType === 'registered_business'"
                  :model-value="form.entityType"
                  :items="entityTypes"
                  label="Entity type"
                  class="mt-3"
                  @update:model-value="patch({ entityType: String($event) })"
                  @click.stop
                />
              </div>
            </div>
          </v-card>
        </div>
      </MpFormSection>
    </v-card>

    <v-card flat border rounded="lg" class="onboarding-card">
      <MpFormSection
        title="Personal details"
        description="We need your official registration information to verify your business."
      >
        <MpFormGrid :cols="2">
          <v-text-field
            :model-value="form.firstName"
            label="First name"
            @update:model-value="patch({ firstName: String($event) })"
          />
          <v-text-field
            :model-value="form.lastName"
            label="Last name"
            @update:model-value="patch({ lastName: String($event) })"
          />
          <v-text-field
            :model-value="form.dateOfBirth"
            label="Date of birth"
            type="date"
            @update:model-value="patch({ dateOfBirth: String($event) })"
          />
          <v-text-field
            :model-value="form.taxId"
            label="SSN or ITIN"
            @update:model-value="patch({ taxId: String($event) })"
          />
        </MpFormGrid>
      </MpFormSection>
    </v-card>

    <v-card flat border rounded="lg" class="onboarding-card">
      <MpFormSection
        title="Business detail"
        description="You can use your home address if you don't have a business address."
      >
        <MpFormGrid :cols="2">
          <v-textarea
            :model-value="form.businessDescription"
            label="Business description"
            rows="3"
            class="mp-form-grid__full"
            @update:model-value="patch({ businessDescription: String($event) })"
          />
          <v-select
            :model-value="form.country"
            :items="countries"
            label="Country"
            @update:model-value="patch({ country: String($event) })"
          />
          <v-text-field
            :model-value="form.registrationNumber"
            label="Business registration number"
            @update:model-value="patch({ registrationNumber: String($event) })"
          />
          <v-text-field
            :model-value="form.addressLine1"
            label="Business address"
            class="mp-form-grid__full"
            @update:model-value="patch({ addressLine1: String($event) })"
          />
          <v-text-field
            :model-value="form.city"
            label="City"
            @update:model-value="patch({ city: String($event) })"
          />
          <v-text-field
            :model-value="form.state"
            label="State / Province"
            @update:model-value="patch({ state: String($event) })"
          />
          <v-text-field
            :model-value="form.postalCode"
            label="Postal code"
            @update:model-value="patch({ postalCode: String($event) })"
          />
        </MpFormGrid>
      </MpFormSection>
    </v-card>

    <v-card flat border rounded="lg" class="onboarding-card">
      <MpFormSection
        title="Bank details"
        description="Funds from your sales will be paid out to this bank account."
      >
        <MpFormGrid :cols="2">
          <v-text-field
            :model-value="form.bankAccountName"
            label="Account holder name"
            class="mp-form-grid__full"
            @update:model-value="patch({ bankAccountName: String($event) })"
          />
          <v-text-field
            :model-value="form.routingNumber"
            label="Routing number"
            @update:model-value="patch({ routingNumber: String($event) })"
          />
          <v-text-field
            :model-value="form.accountNumber"
            label="Account number"
            type="password"
            @update:model-value="patch({ accountNumber: String($event) })"
          />
        </MpFormGrid>
      </MpFormSection>
    </v-card>

    <v-checkbox
      v-if="!isVerifiedEditMode"
      :model-value="form.agreedToTerms"
      hide-details
      @update:model-value="patch({ agreedToTerms: !!$event })"
    >
      <template #label>
        <span class="text-body-2">I agree to Maropay's Terms of Service and service fees.</span>
      </template>
    </v-checkbox>

    <div class="d-flex flex-wrap justify-end ga-3">
      <v-btn variant="outlined" class="text-none" @click="router.push(backTo)">
        {{ isVerifiedEditMode ? 'Cancel' : 'Back' }}
      </v-btn>
      <v-btn
        v-if="!isVerifiedEditMode"
        variant="outlined"
        class="text-none"
        @click="saveDraft"
      >
        Save as draft
      </v-btn>
      <v-btn
        color="primary"
        variant="flat"
        class="text-none"
        :loading="submitting"
        @click="isVerifiedEditMode ? saveVerifiedProfile() : submitApplication()"
      >
        {{ isVerifiedEditMode ? 'Save changes' : 'Submit application' }}
      </v-btn>
    </div>
  </div>
</template>

<style scoped>
.onboarding-card {
  padding: var(--mp-component-card-padding);
}

.business-type-row {
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.business-type-row--active {
  border-color: rgb(var(--v-theme-primary));
}
</style>
