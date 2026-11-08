# Record panel and CRM surfaces

Company records use a floating desktop panel with a maximum width of 1280px and a 12px inset. Opening it leaves the pipeline width intact. Closing the record restores the existing saved drawer width; other drawers retain their resizing behavior.

Record details and activity have independent keyboard-accessible scroll regions. Cards retain their natural height, including long custom fields and all loaded tasks. Header actions and section tabs remain above the scroll regions. At container widths of 760px or less, Record details and Activity tabs switch between full-width panes; opening an email, note, or task composer selects Activity.

The reference dashboard informs the rounded surfaces, restrained blur, borders, spacing, and accent treatment. The CRM keeps its existing Linaria, Jotai, translation, and light/dark theme system. Its shared surface is `src/modules/components/ui/crm-glass-surface.tsx` (`@/components/ui/crm-glass-surface`), rather than introducing a finance dashboard with sample balances or a second animation framework. Reduced-transparency preferences use solid surfaces.

Validation: isolated Chromium fixtures render the actual account view, timeline card, desktop panel, and overlay lifecycle effect with mocked CRM data/hooks and a CSS adapter. They check long-content scrolling, contacts at the bottom, activity filtering, narrow-screen tabs, composer navigation, horizontal overflow, overlay width, and restoration of the saved drawer width. These fixtures do not establish authenticated live-workspace behavior. Production compilation is checked separately by the Pulse deployment workflow.
