<script setup lang="ts">
import { computed, ref } from 'vue'
import DvOrbitOrb from '@/components/copilot/voice/DvOrbitOrb.vue'

export interface RovoRecentThread {
  id: string
  title: string
  updatedLabel: string
}

const props = withDefaults(
  defineProps<{
    /** Panel title / recents trigger label */
    recentsLabel?: string
    /** Empty-state headline (Sidekick-style) */
    emptyPrompt?: string
    /** Optional context line under the headline */
    emptyHint?: string
    /** Quick-start chips shown under empty state */
    suggestions?: string[]
    recentThreads?: RovoRecentThread[]
    expanded?: boolean
    composerPlaceholder?: string
  }>(),
  {
    recentsLabel: 'Recents',
    emptyPrompt: 'Where should we begin?',
    emptyHint: 'Ask about menus, collections, or storefront navigation.',
    suggestions: () => [],
    recentThreads: () => [],
    expanded: false,
    composerPlaceholder: 'Ask Da Vinci anything…',
  },
)

const emit = defineEmits<{
  close: []
  expand: []
  send: [message: string]
  suggestion: [text: string]
  selectRecent: [id: string]
}>()

const composer = ref('')
const recentsOpen = ref(false)

const panelWidth = computed(() => (props.expanded ? 560 : 400))

function submitComposer() {
  const text = composer.value.trim()
  if (!text) return
  emit('send', text)
  composer.value = ''
}

function onSuggestion(text: string) {
  emit('suggestion', text)
  composer.value = text
}
</script>

<template>
  <aside
    class="rovo-panel"
    :style="{ width: `${panelWidth}px` }"
    aria-label="Da Vinci assistant"
  >
    <header class="rovo-panel__head">
      <v-menu v-model="recentsOpen" location="bottom start" :close-on-content-click="true">
        <template #activator="{ props: menuProps }">
          <button type="button" class="rovo-panel__recents text-none" v-bind="menuProps">
            {{ recentsLabel }}
            <v-icon size="16" class="ms-1">chevron-down</v-icon>
          </button>
        </template>
        <v-list density="compact" min-width="260" role="menu">
          <v-list-subheader>Recent conversations</v-list-subheader>
          <v-list-item
            v-for="thread in recentThreads"
            :key="thread.id"
            role="menuitem"
            @click="emit('selectRecent', thread.id)"
          >
            <v-list-item-title>{{ thread.title }}</v-list-item-title>
            <v-list-item-subtitle>{{ thread.updatedLabel }}</v-list-item-subtitle>
          </v-list-item>
          <v-list-item v-if="!recentThreads.length" disabled>
            <v-list-item-title class="text-medium-emphasis">No recents yet</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <div class="rovo-panel__head-actions">
        <v-btn
          icon
          variant="text"
          size="small"
          aria-label="Conversation history"
          class="appbar-action-btn"
        >
          <v-icon size="18">history</v-icon>
        </v-btn>
        <v-btn
          icon
          variant="text"
          size="small"
          :aria-label="expanded ? 'Collapse panel' : 'Expand panel'"
          class="appbar-action-btn"
          @click="emit('expand')"
        >
          <v-icon size="18">{{ expanded ? 'minimize-2' : 'maximize-2' }}</v-icon>
        </v-btn>
        <v-btn
          icon
          variant="text"
          size="small"
          aria-label="Close assistant"
          class="appbar-action-btn"
          @click="emit('close')"
        >
          <v-icon size="18">x</v-icon>
        </v-btn>
      </div>
    </header>

    <div class="rovo-panel__body">
      <div class="rovo-panel__empty">
        <DvOrbitOrb :size="56" />
        <h2 class="rovo-panel__prompt">{{ emptyPrompt }}</h2>
        <p v-if="emptyHint" class="rovo-panel__hint text-body-2 text-medium-emphasis">
          {{ emptyHint }}
        </p>
        <div v-if="suggestions.length" class="rovo-panel__chips">
          <button
            v-for="text in suggestions"
            :key="text"
            type="button"
            class="rovo-panel__chip text-none"
            @click="onSuggestion(text)"
          >
            {{ text }}
          </button>
        </div>
      </div>
    </div>

    <footer class="rovo-panel__foot">
      <v-text-field
        v-model="composer"
        :placeholder="composerPlaceholder"
        hide-details
        density="comfortable"
        class="rovo-panel__composer"
        aria-label="Message Da Vinci"
        @keydown.enter.prevent="submitComposer"
      >
        <template #append-inner>
          <v-btn
            icon
            variant="text"
            size="small"
            aria-label="Send message"
            :disabled="!composer.trim()"
            @click="submitComposer"
          >
            <v-icon size="18">send</v-icon>
          </v-btn>
        </template>
      </v-text-field>
      <p class="rovo-panel__disclaimer text-caption text-medium-emphasis">
        Da Vinci can make mistakes. Review suggestions before publishing to your storefront.
      </p>
    </footer>
  </aside>
</template>

<style scoped lang="scss">
.rovo-panel {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgb(var(--v-theme-surface));
  border-left: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  box-shadow: var(--mp-shadow-sm);
}

.rovo-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-space-8);
  min-height: var(--mp-component-control-height);
  padding: var(--mp-space-8) var(--mp-space-12);
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.rovo-panel__recents {
  border: 0;
  background: none;
  font: inherit;
  font-size: var(--mp-fontSize-14);
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  display: inline-flex;
  align-items: center;
  padding: var(--mp-space-6) var(--mp-space-4);
  border-radius: var(--mp-radius-8);
  cursor: pointer;
}

.rovo-panel__recents:hover {
  background: rgb(var(--v-theme-surface-container-low));
}

.rovo-panel__head-actions {
  display: flex;
  align-items: center;
  gap: var(--mp-space-2);
}

.rovo-panel__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--mp-space-24) var(--mp-space-16);
  display: flex;
  align-items: center;
  justify-content: center;
}

.rovo-panel__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 320px;
}

.rovo-panel__prompt {
  margin: var(--mp-space-20) 0 0;
  font-size: var(--mp-fontSize-20);
  font-weight: 700;
  line-height: 1.25;
  color: rgb(var(--v-theme-on-surface));
}

.rovo-panel__hint {
  margin: var(--mp-space-8) 0 0;
}

.rovo-panel__chips {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-8);
  width: 100%;
  margin-top: var(--mp-space-24);
}

.rovo-panel__chip {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: var(--mp-radius-full);
  background: rgb(var(--v-theme-surface));
  padding: var(--mp-space-10) var(--mp-space-16);
  font-size: var(--mp-fontSize-13);
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
  cursor: pointer;
  text-align: left;
}

.rovo-panel__chip:hover {
  background: rgb(var(--v-theme-surface-container-low));
}

.rovo-panel__foot {
  padding: var(--mp-space-12) var(--mp-space-16) var(--mp-space-16);
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.rovo-panel__composer :deep(.v-field) {
  border-radius: var(--mp-radius-full);
}

.rovo-panel__disclaimer {
  margin: var(--mp-space-8) 0 0;
  text-align: center;
}
</style>
