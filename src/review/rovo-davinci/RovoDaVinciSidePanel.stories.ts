import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import RovoDaVinciSidePanel from './RovoDaVinciSidePanel.vue'

const meta = {
  title: 'Product/Sales Channels/Review/Rovo DaVinci Side Panel',
  component: RovoDaVinciSidePanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Shopify Sidekick–style docked assistant shell for Maropost Da Vinci. Review-only — not merged into Navigation until approved.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RovoDaVinciSidePanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { RovoDaVinciSidePanel },
    setup() {
      const expanded = ref(false)
      return {
        expanded,
        suggestions: [
          'Generate a main menu from my top collections',
          'Draft footer links for shipping and returns',
        ],
        recentThreads: [
          { id: '1', title: 'Main menu draft', updatedLabel: 'Today' },
          { id: '2', title: 'Sale-first navigation', updatedLabel: 'Yesterday' },
        ],
      }
    },
    template: `
      <div style="display:flex;height:640px;background:var(--v-theme-background)">
        <div style="flex:1;padding:24px" class="text-medium-emphasis">
          Main workspace (Navigation list, editor, etc.)
        </div>
        <RovoDaVinciSidePanel
          :expanded="expanded"
          :suggestions="suggestions"
          :recent-threads="recentThreads"
          @expand="expanded = !expanded"
        />
      </div>
    `,
  }),
}

export const Expanded: Story = {
  ...Default,
  render: () => ({
    components: { RovoDaVinciSidePanel },
    setup() {
      return { expanded: true, suggestions: [], recentThreads: [] }
    },
    template: `
      <div style="display:flex;height:640px">
        <div style="flex:1" />
        <RovoDaVinciSidePanel expanded @expand="" />
      </div>
    `,
  }),
}
