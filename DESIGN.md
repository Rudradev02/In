# InvLab Design System (DESIGN.md)

This document establishes the authoritative design tokens, typography rules, motion parameters, and component specifications for the **InvLab** web application.

---

## 1. Color Palette & Tokens

### Neutral & Foundation Tokens
* **Background (Ivory)**: `#F8F8F5` — Warm, premium canvas avoiding stark clinical white.
* **Surface (Pure White)**: `#FFFFFF` — Elevated cards, dialog panels, inputs.
* **Primary (Deep Forest Green)**: `#173D32` — Dominant brand color, buttons, active navigation, key icons.
  * *Hover*: `#123027`
* **Secondary (Sage Tint)**: `#D9E8DB` — Subtle badge backgrounds, active pill highlights, secondary buttons.
* **Text (Charcoal)**: `#202521` — High-contrast primary readable text (12.5:1 contrast against ivory).
* **Muted Text (Gray-Green)**: `#526058` — Secondary text, labels, timestamps (6.2:1 contrast against ivory, meeting WCAG AA).
* **Borders (Subtle Warm Gray)**: `#E2E6E3` — 1px clean separators and card borders.
  * *Darker Border*: `#CCD3CE` — Hover card borders and focus rings.

### Accent Tokens
* **Accent (Terracotta)**: `#C77B55` — Used selectively for primary chart trend series, badges, and large stat icons.
* **Accent Dark (Terracotta Text)**: `#A85F3B` — High-contrast variation for small text or critical alerts meeting WCAG AA (4.8:1 contrast).

### Semantic Status Tokens
* **Success**: `#1F6E43` on `#EBF7EE` (Border: `#C8E8D0`) — Healthy stock levels, positive revenue deltas.
* **Warning / Low Stock**: `#A66208` on `#FEF5E7` (Border: `#FBE3BA`) — Items below low stock threshold.
* **Error / Out of Stock**: `#B43428` on `#FDF0ED` (Border: `#F7CCC5`) — Zero inventory, validation errors, delete alerts.
* **Info**: `#255D83` on `#EDF6FC` (Border: `#CCE3F4`) — Informational callouts.

---

## 2. Typography & Formatting

* **Font Family**: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
* **Type Scale**:
  * **Page Titles (`h1`)**: 28px, font-weight 700, letter-spacing -0.6px
  * **Section Headings (`h2`)**: 18px, font-weight 600, letter-spacing -0.4px
  * **Subheadings / Modals (`h3`)**: 16px, font-weight 600
  * **Body Text**: 14px, line-height 1.5, font-weight 400
  * **Metadata / Labels**: 12px, font-weight 500, letter-spacing +0.2px
  * **Table Headers**: 11px, text-transform uppercase, font-weight 600, letter-spacing +0.8px
* **Tabular Numerals**: Class `.tabular-nums` applied to financial figures, SKU numbers, dates, and inventory quantities (`font-variant-numeric: tabular-nums`).
* **Currency**: Indian Rupee (`₹`) formatted via `Intl.NumberFormat('en-IN')` with standard lakh/crore commas.

---

## 3. Style & Layout Rules

* **Borders & Shadows**: Strict 1px borders (`#E2E6E3`) with minimal elevation (`shadow-xs` / `shadow-sm`). No heavy blurry shadows or decorative background blobs.
* **Corner Radius**: Maximum `8px` (`rounded-lg`), `6px` (`rounded-md`), `4px` (`rounded-sm`).
* **Dense Tables**: Row heights between 40px and 44px for maximum operational information density.
* **Iconography**: Exclusively `lucide-react` with 16px-20px uniform stroke width.
* **Form Feedback**: Inline validation errors beneath fields, button loading spinners, and Sonner toasts.

---

## 4. Motion Tokens (`framer-motion`)

* **Durations**:
  * Fast (`150ms`): Button press states, tooltips, dropdowns.
  * Base (`220ms`): Tab switches, row insertions, modal exits.
  * Slow (`400ms`): Route transitions, chart entrances.
* **Easings & Spring**:
  * Modal / Drawer Spring: `stiffness: 300`, `damping: 30`.
  * Smooth Easing: `[0.16, 1, 0.3, 1]`.
* **Stagger**: Container stagger `40ms` per item, capped at 8 items.
* **Reduced Motion Compliance**: Centrally honors `@media (prefers-reduced-motion: reduce)` by bypassing positional movement and count-up loops.

---

## 5. Reusable Component Inventory

1. `Button`: Variants (`primary`, `secondary`, `destructive`, `ghost`, `outline`), size options, loading spinner.
2. `Input` & `Select`: Clean warm-gray borders, visible focus rings, label & error support.
3. `Badge`: Variants (`default`, `success`, `warning`, `destructive`, `outline`) for stock & sales statuses.
4. `Card` & `StatCard`: Surface card with animated KPI counters, icons, and trend indicators.
5. `Dialog` & `Drawer`: Radix UI accessible modal and mobile sheet with spring animations.
6. `Table`: Dense sortable data table with loading skeletons and empty states.
7. `Tabs`: Sliding pill underline navigation.
8. `Toast`: Sonner toast notifications with progress and action buttons.
9. `ConfirmDialog`: Action protection modal for destructive operations.
