<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import DvToolSteps from '@/components/copilot/DvToolSteps.vue'
import { useTicketDaVinciDraft } from '@/composables/useTicketDaVinciDraft'
import type { Ticket } from '@/stores/useTickets'
import type { TicketStatus } from '@/stores/useTickets'

export type TicketComposerMode = 'Reply' | 'Forward' | 'Note'

const MODES: { key: TicketComposerMode; label: string }[] = [
  { key: 'Reply', label: 'Reply' },
  { key: 'Forward', label: 'Forward' },
  { key: 'Note', label: 'Internal note' },
]

const props = defineProps<{
  ticket: Ticket
  mode: TicketComposerMode
  agentName?: string
}>()

const emit = defineEmits<{
  'update:mode': [mode: TicketComposerMode]
  send: [payload: { body: string; to: string; cc: string; setStatus?: TicketStatus }]
  cancel: []
}>()

const to = ref('')
const cc = ref('')
const message = ref('')
const dvHover = ref(false)
const { generating, steps, generateReplyDraft, reset: resetDraft } = useTicketDaVinciDraft()

const initials = computed(() =>
  (props.agentName ?? 'Sam Jones')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase(),
)

const signatureLines = computed(() => {
  const name = props.agentName ?? 'Sam Jones'
  return ['Best regards,', name, 'Customer Support']
})

const canSend = computed(() => {
  if (!message.value.trim()) return false
  if (props.mode !== 'Note' && !to.value.trim()) return false
  return !generating.value
})

function syncRecipients() {
  if (props.mode === 'Reply') {
    to.value = props.ticket.customerEmail
    cc.value = ''
  } else if (props.mode === 'Forward') {
    to.value = ''
    cc.value = ''
  }
}

watch(
  () => props.mode,
  () => {
    syncRecipients()
    if (props.mode === 'Note') message.value = ''
  },
  { immediate: true },
)

function selectMode(mode: TicketComposerMode) {
  emit('update:mode', mode)
}

async function runDaVinciDraft() {
  if (props.mode === 'Note' || generating.value) return
  const draft = await generateReplyDraft(props.ticket)
  message.value = draft
}

function onDraftKeydown(event: KeyboardEvent) {
  if (event.altKey && event.key.toLowerCase() === 'd') {
    event.preventDefault()
    void runDaVinciDraft()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onDraftKeydown)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onDraftKeydown)
  resetDraft()
})

function fullBody(): string {
  if (props.mode === 'Note') return message.value.trim()
  const sig = signatureLines.value.join('\n')
  return `${message.value.trim()}\n\n${sig}`
}

function onSend(setStatus?: TicketStatus) {
  if (!canSend.value) return
  emit('send', {
    body: fullBody(),
    to: to.value.trim(),
    cc: cc.value.trim(),
    setStatus,
  })
}
</script>

<template>
  <v-card flat border rounded="lg" class="trc ma-4">
    <div class="trc__agent border-b d-flex align-center">
      <v-avatar size="32" color="secondary" class="flex-shrink-0">
        <span class="text-caption font-weight-medium">{{ initials }}</span>
      </v-avatar>
    </div>

    <nav class="trc__tabs border-b d-flex align-center ga-6" aria-label="Message type">
      <button
        v-for="tab in MODES"
        :key="tab.key"
        type="button"
        class="trc__tab text-caption font-weight-medium"
        :class="{ 'trc__tab--active': mode === tab.key }"
        @click="selectMode(tab.key)"
      >
        {{ tab.label }}
      </button>
    </nav>

    <template v-if="mode !== 'Note'">
      <div class="trc__row border-b d-flex align-center ga-2">
        <span class="trc__row-label text-body-2 text-medium-emphasis">To</span>
        <v-text-field
          v-model="to"
          hide-details
          density="compact"
          variant="plain"
          class="trc__row-field flex-grow-1"
          aria-label="To"
        />
      </div>
      <div class="trc__row border-b d-flex align-center ga-2">
        <span class="trc__row-label text-body-2 text-medium-emphasis">Cc</span>
        <v-text-field
          v-model="cc"
          hide-details
          density="compact"
          variant="plain"
          class="trc__row-field flex-grow-1"
          aria-label="Cc"
        />
      </div>
      <div class="trc__dv border-b">
        <button
          type="button"
          class="trc__dv-btn text-body-2"
          :class="{ 'trc__dv-btn--hover': dvHover, 'trc__dv-btn--busy': generating }"
          :disabled="generating"
          @mouseenter="dvHover = true"
          @mouseleave="dvHover = false"
          @click="runDaVinciDraft"
        >
          <v-icon size="16" class="trc__dv-icon">sparkles</v-icon>
          <span>Draft with Da Vinci (Alt+D)</span>
        </button>
        <DvToolSteps v-if="steps.length" :steps="steps" default-open class="trc__dv-steps" />
      </div>
    </template>

    <v-textarea
      v-model="message"
      :placeholder="mode === 'Note' ? 'Write an internal note…' : 'Write your message…'"
      :aria-label="mode === 'Note' ? 'Internal note' : 'Message body'"
      rows="5"
      hide-details
      class="trc__body"
      :disabled="generating"
    />

    <div v-if="mode !== 'Note'" class="trc__sig text-body-2">
      <p v-for="(line, i) in signatureLines" :key="i" class="mb-0">{{ line }}</p>
    </div>

    <div class="trc__foot d-flex align-center flex-wrap ga-2 pa-3">
      <template v-if="mode === 'Note'">
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!canSend" @click="onSend()">
          Add note
        </v-btn>
      </template>
      <template v-else>
        <div class="d-inline-flex">
          <v-btn color="primary" variant="flat" class="text-none trc__send" :disabled="!canSend" @click="onSend()">
            Send
          </v-btn>
          <v-menu location="top end">
            <template #activator="{ props: menuProps }">
              <v-btn
                v-bind="menuProps"
                color="primary"
                variant="flat"
                icon="chevron-down"
                size="small"
                class="trc__send-caret"
                :disabled="!canSend"
                aria-label="Send and set status"
              />
            </template>
            <v-list density="compact" role="menu">
              <v-list-item role="menuitem" title="Send and set as Pending" @click="onSend('Pending')" />
              <v-list-item role="menuitem" title="Send and set as On Hold" @click="onSend('On Hold')" />
              <v-list-item role="menuitem" title="Send and set as Closed" @click="onSend('Closed')" />
            </v-list>
          </v-menu>
        </div>
      </template>
      <v-btn variant="outlined" class="text-none" @click="emit('cancel')">Cancel</v-btn>
      <v-btn
        v-if="mode !== 'Note'"
        variant="outlined"
        class="text-none"
        @click="selectMode('Note')"
      >
        Note
      </v-btn>
    </div>
  </v-card>
</template>

<style scoped lang="scss">
.trc {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
}

.trc__agent {
  padding: var(--mp-space-12);
}

.trc__tabs {
  padding-inline: var(--mp-space-12);
  min-height: var(--mp-component-control-height);
}

.trc__tab {
  position: relative;
  border: 0;
  background: transparent;
  padding: var(--mp-space-8) 0;
  color: var(--on-surface-muted);
  cursor: pointer;
}

.trc__tab--active {
  color: var(--on-surface);
}

.trc__tab--active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: rgb(var(--v-theme-primary));
  border-radius: var(--mp-radius-full);
}

.trc__row {
  padding: var(--mp-space-8) var(--mp-space-12);
  min-height: var(--mp-component-control-height);
}

.trc__row-label {
  flex: 0 0 var(--mp-space-32);
}

.trc__row-field :deep(.v-field) {
  padding-inline: var(--mp-space-4);
}

.trc__dv {
  padding: var(--mp-space-8) var(--mp-space-12);
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-8);
}

.trc__dv-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-6);
  border: 0;
  background: transparent;
  padding: 0;
  color: var(--on-surface-muted);
  cursor: pointer;
  transition: color var(--mp-motion-duration-fast) var(--mp-motion-easing-standard);
}

.trc__dv-btn--hover:not(:disabled),
.trc__dv-btn:focus-visible {
  color: var(--dv-text-primary, rgb(var(--v-theme-primary)));
}

.trc__dv-btn--busy {
  opacity: 0.7;
  cursor: wait;
}

.trc__dv-icon {
  color: var(--dv-accent, rgb(var(--v-theme-primary)));
}

.trc__body :deep(.v-field__outline) {
  display: none;
}

.trc__body {
  padding: var(--mp-space-8) var(--mp-space-12) 0;
}

.trc__sig {
  padding: var(--mp-space-8) var(--mp-space-12) var(--mp-space-12);
  color: var(--on-surface-muted);
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-2);
}

.trc__foot {
  border-top: 1px solid var(--border-subtle);
}

.trc__send {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.trc__send-caret {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  height: auto;
}
</style>
