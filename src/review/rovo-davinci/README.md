# ROVO / Da Vinci side panel — local review (pre-merge)

Shopify **Sidekick**–style docked assistant for Maropost **Da Vinci**, scoped to Sales Channel workflows. This folder is **not wired into production navigation** until you merge it.

## Preview locally

```bash
npm run dev
```

Open:

**http://localhost:5173/review/rovo-davinci-navigation**

Storybook (panel only + full shell):

```bash
npm run storybook
```

→ **Product → Sales Channels → Review → Rovo Da Vinci Side Panel**

## Files (merge boundary)

| File | Purpose |
|------|---------|
| `RovoDaVinciSidePanel.vue` | Reusable right-rail assistant (Recents, empty state, composer) |
| `../views/review/RovoDaVinciNavigationReview.vue` | Navigation list + docked panel demo |
| `RovoDaVinciSidePanel.stories.ts` | Storybook review |
| `src/router/index.ts` | Route `/review/rovo-davinci-navigation` only |

## Integration notes (after review)

- Open from **Generate with Da Vinci** or a global sparkle affordance (mirror App.vue copilot drawer).
- Reuse `MpDaVinciBot` for full chat history, or keep this lighter shell for context-specific tasks.
- Panel width defaults to `layout.drawerWidth` (480); expanded state is for stakeholder review only.
