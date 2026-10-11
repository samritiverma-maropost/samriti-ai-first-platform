import { ref } from 'vue'
import { defineStore } from 'pinia'

/** Web checkout gateway provider (UAT store settings ▸ Payments). */
export type StorePaymentProvider = 'maropay' | 'stripe' | 'paypal'

export interface StorePaymentGatewaySettings {
  provider: StorePaymentProvider
  connected: boolean
  merchantId: string
  publicKey: string
  secretKey: string
  environment: 'test' | 'live'
  acceptCards: boolean
  acceptApplePay: boolean
  acceptGooglePay: boolean
  acceptBnpl: boolean
  webhookUrl: string
}

export interface StoreWebsiteConfiguration {
  cookieBannerEnabled: boolean
  cookieBannerText: string
  homepageSeoTitle: string
  homepageSeoDescription: string
  sitemapUrl: string
}

export interface StoreAbandonedCartSettings {
  enabled: boolean
  delayHours: number
  sendReminderEmail: boolean
  maxReminders: number
}

export interface StoreSettingsBundle {
  website: StoreWebsiteConfiguration
  abandonedCart: StoreAbandonedCartSettings
  payments: StorePaymentGatewaySettings
}

const DEFAULT_WEBSITE: StoreWebsiteConfiguration = {
  cookieBannerEnabled: true,
  cookieBannerText: 'We use cookies to improve your experience and analyze site traffic.',
  homepageSeoTitle: '',
  homepageSeoDescription: '',
  sitemapUrl: '',
}

const DEFAULT_ABANDONED_CART: StoreAbandonedCartSettings = {
  enabled: false,
  delayHours: 24,
  sendReminderEmail: true,
  maxReminders: 3,
}

function defaultPayments(domain?: string): StorePaymentGatewaySettings {
  const slug = domain?.replace(/\./g, '-') ?? 'store'
  return {
    provider: 'maropay',
    connected: false,
    merchantId: '',
    publicKey: '',
    secretKey: '',
    environment: 'test',
    acceptCards: true,
    acceptApplePay: true,
    acceptGooglePay: true,
    acceptBnpl: false,
    webhookUrl: `https://api.maropost.com/webhooks/payments/${slug}`,
  }
}

function seedSettings(): Record<string, StoreSettingsBundle> {
  return {
    'retest-sales-notification': {
      website: {
        ...DEFAULT_WEBSITE,
        homepageSeoTitle: 'Atlas Outfitters — Premium outdoor apparel',
        homepageSeoDescription: 'Shop curated outerwear, trail gear, and everyday layers.',
        sitemapUrl: 'https://atlas-outfitters.uat.maropost.store/sitemap.xml',
      },
      abandonedCart: { ...DEFAULT_ABANDONED_CART, enabled: true, delayHours: 12 },
      payments: defaultPayments('atlas-outfitters.uat.maropost.store'),
    },
    'beta-sales-channel': {
      website: { ...DEFAULT_WEBSITE },
      abandonedCart: { ...DEFAULT_ABANDONED_CART },
      payments: {
        ...defaultPayments('beta-2000290.uat.maropost.store'),
        provider: 'maropay',
        connected: true,
        merchantId: 'mp_mer_beta_channel',
        publicKey: 'pk_test_beta_••••',
        secretKey: 'sk_test_beta_••••',
      },
    },
    'max-test-store': {
      website: {
        ...DEFAULT_WEBSITE,
        homepageSeoTitle: 'Max Test Store',
        sitemapUrl: 'https://max-test.uat.maropost.store/sitemap.xml',
      },
      abandonedCart: { ...DEFAULT_ABANDONED_CART, enabled: true },
      payments: {
        provider: 'maropay',
        connected: true,
        merchantId: 'mp_mer_8f2a91c4',
        publicKey: 'pk_live_atlas_••••4242',
        secretKey: 'sk_live_atlas_••••9x7k',
        environment: 'live',
        acceptCards: true,
        acceptApplePay: true,
        acceptGooglePay: true,
        acceptBnpl: true,
        webhookUrl: 'https://api.maropost.com/webhooks/payments/max-test',
      },
    },
  }
}

export const PAYMENT_PROVIDER_LABELS: Record<StorePaymentProvider, string> = {
  maropay: 'Maropay',
  stripe: 'Stripe',
  paypal: 'PayPal',
}

export const useStoreSettingsStore = defineStore('storeSettings', () => {
  const byChannel = ref<Record<string, StoreSettingsBundle>>(seedSettings())

  function bundleFor(channelId: string, domain?: string): StoreSettingsBundle {
    if (!byChannel.value[channelId]) {
      byChannel.value[channelId] = {
        website: { ...DEFAULT_WEBSITE },
        abandonedCart: { ...DEFAULT_ABANDONED_CART },
        payments: defaultPayments(domain),
      }
    }
    return byChannel.value[channelId]!
  }

  function updateWebsite(channelId: string, patch: Partial<StoreWebsiteConfiguration>, domain?: string) {
    const bundle = bundleFor(channelId, domain)
    bundle.website = { ...bundle.website, ...patch }
  }

  function updateAbandonedCart(channelId: string, patch: Partial<StoreAbandonedCartSettings>, domain?: string) {
    const bundle = bundleFor(channelId, domain)
    bundle.abandonedCart = { ...bundle.abandonedCart, ...patch }
  }

  function updatePayments(channelId: string, patch: Partial<StorePaymentGatewaySettings>, domain?: string) {
    const bundle = bundleFor(channelId, domain)
    bundle.payments = { ...bundle.payments, ...patch }
  }

  function connectMaropay(channelId: string, domain?: string) {
    const bundle = bundleFor(channelId, domain)
    bundle.payments = {
      ...bundle.payments,
      provider: 'maropay',
      connected: true,
      merchantId: bundle.payments.merchantId || `mp_mer_${channelId.slice(0, 8)}`,
      publicKey: bundle.payments.publicKey || `pk_${bundle.payments.environment}_${channelId.slice(0, 6)}_••••`,
      secretKey: bundle.payments.secretKey || `sk_${bundle.payments.environment}_${channelId.slice(0, 6)}_••••`,
    }
  }

  function disconnectMaropay(channelId: string, domain?: string) {
    const bundle = bundleFor(channelId, domain)
    bundle.payments = {
      ...bundle.payments,
      connected: false,
      merchantId: '',
      publicKey: '',
      secretKey: '',
    }
  }

  return {
    byChannel,
    bundleFor,
    updateWebsite,
    updateAbandonedCart,
    updatePayments,
    connectMaropay,
    disconnectMaropay,
  }
})
