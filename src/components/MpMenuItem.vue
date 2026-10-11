<script setup lang="ts">
// The one action-menu item (GAPS §1, closed 2026-08-30).
//
// `role="menuitem"` inside MpRowActionsMenu's `role="menu"` panel used to be a
// call-site convention — written by hand on ~200 v-list-items and forgotten on
// the next new menu. This wrapper owns the contract instead: the role, the
// verb-first title, an optional leading icon, and the one danger treatment
// (`text-error`; the separating divider stays explicit in the menu, before the
// destructive group).
//
// Everything else v-list-item accepts (disabled, subtitle, @click, to, …) falls
// through via attrs; slots pass through untouched.
withDefaults(defineProps<{
  /** Verb-first label ("Edit", "Duplicate", "Delete"). */
  title: string
  /** Optional leading Lucide icon name. */
  icon?: string
  /** Destructive action: renders the error treatment. Place last, after a `<v-divider class="my-1" />`. */
  danger?: boolean
  disabled?: boolean
}>(), {
  danger: false,
  disabled: false,
})

defineEmits<{
  click: [event: MouseEvent | KeyboardEvent]
}>()
</script>

<template>
  <v-list-item
    role="menuitem"
    :title="title"
    :prepend-icon="icon"
    :disabled="disabled"
    :class="{ 'text-error': danger }"
    @click="$emit('click', $event)"
  >
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps" />
    </template>
  </v-list-item>
</template>
