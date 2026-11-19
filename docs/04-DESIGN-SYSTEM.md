# 04 — Design System

## 1. Design direction

**Modern Light Neumorphism × O!Save Brand Identity × Map-first Interface.**

Tujuannya adalah interface yang clean, tenang, profesional, dan terasa dirancang khusus. Neumorphism digunakan secara ringan untuk beberapa surface, bukan diaplikasikan pada setiap elemen.

## 2. Brand palette status

Situs dan identitas publik O!Save menjadi referensi brand. Kode warna di bawah adalah **draft UI token**, bukan warna resmi yang terverifikasi dari brand manual. Sebelum final, cocokkan dengan logo/vector asset dan panduan brand resmi yang diberikan organisasi.

### Draft brand tokens

| Token | Hex draft | Penggunaan |
|---|---|---|
| `brand` | `#E60012` | Primary action, selected accents |
| `brand-strong` | `#C90016` | Hover/pressed, hanya jika contrast cukup |
| `brand-soft` | `#FCE8EA` | Soft highlight, subtle selected surface |
| `background` | `#F4F5F6` | App canvas |
| `surface` | `#FFFFFF` | Panel, dialog, popup |
| `surface-muted` | `#EEF0F2` | Secondary surface |
| `foreground` | `#252A30` | Primary text |
| `muted` | `#68727D` | Secondary text |
| `border` | `#E0E4E8` | Hairline borders |

### Functional status tokens

| Status | Hex | Meaning |
|---|---|---|
| Online | `#16834A` | Source/gateway health confirmed |
| Unstable | `#B7791F` | Intermittent failure/degraded |
| Offline | `#C62828` | Repeated failure threshold met |
| Unknown | `#68727D` | Not yet checked / cannot determine |

Status color must be accompanied by icon and text. Do not rely on color alone.

## 3. Typography

- Primary recommendation: Geist Sans; fallback: Inter, system sans-serif.
- Use a restrained type scale: page title, section title, body, caption, metadata.
- Do not use oversized hero typography inside operational views.
- Numeric status values may use tabular numbers.
- Minimum body text target: 14px for dense desktop UI; essential labels should not become tiny.

## 4. Spacing and layout

Use an 4px base spacing scale. Common values: 4, 8, 12, 16, 20, 24, 32, 40, 48.

- Main map canvas: flexible, dominant.
- Header: compact and consistent.
- Floating panels: consistent inset padding and clear header/content/footer.
- Avoid excessive card nesting.
- Use alignment and whitespace rather than decorative separators.

## 5. Shape and radius

- Small controls: 8–10px.
- Standard surfaces: 12–16px.
- Large modal/panel: 16–20px.
- Do not round every nested element.

## 6. Neumorphism rules

### Raised surface

Use a very subtle paired shadow to make floating surfaces feel lifted. Use with border to preserve separation.

### Inset surface

Use sparingly for input wells or map tool groups. Inputs must remain clearly identifiable and have visible focus states.

### Flat surface

Use for most content. Text, tables, video, and map should not be forced into neumorphic containers.

### Accessibility constraint

Shadow cannot be the only boundary indicator. Use visible border, clear background difference, and focus outline. Verify text contrast; do not lighten text merely to fit a soft aesthetic.

## 7. Component states

Every interactive component defines: default, hover, focus-visible, active/pressed, disabled, loading, and error where relevant.

## 8. Iconography

- Use Lucide icons consistently.
- Prefer 16px, 18px, 20px, and 24px sizes.
- Avoid mixing emoji, filled illustrations, and unrelated icon sets in the same interface.
- Status icons: check-circle, activity/alert-triangle, x-circle, help-circle or equivalents.

## 9. Video surface

- Video player canvas uses dark neutral background (`#15191D` or similar draft).
- Player controls are visible on hover/focus and remain keyboard accessible.
- Do not apply neumorphic shadow to the video itself.
- Offline placeholder is calm and informative, not a black empty rectangle.

## 10. Loading identity

Brand loading should use logo/brand assets supplied by O!Save. Do not recreate or distort the logo. A small red route line/node motif can visually connect to the map experience.

- Initial app bootstrap may show branded loading.
- Map refresh uses skeleton/placeholder.
- Camera load uses player-level connecting state.
- Never fake progress or impose an artificial minimum wait.

## 11. Theme

MVP is light theme. A dark player surface is a local component context, not a full dark theme requirement. Full application dark mode is out of scope unless requested later.

## 12. CSS token starting point

```css
:root {
  --brand: #E60012; /* draft; verify against official O!Save brand assets */
  --brand-strong: #C90016;
  --brand-soft: #FCE8EA;
  --background: #F4F5F6;
  --surface: #FFFFFF;
  --surface-muted: #EEF0F2;
  --foreground: #252A30;
  --muted-foreground: #68727D;
  --border: #E0E4E8;
  --status-online: #16834A;
  --status-unstable: #B7791F;
  --status-offline: #C62828;
  --status-unknown: #68727D;
  --radius-control: 0.625rem;
  --radius-card: 0.875rem;
  --radius-panel: 1rem;
  --shadow-raised:
    0 5px 16px rgba(24, 32, 40, 0.06),
    0 1px 3px rgba(24, 32, 40, 0.04);
  --shadow-inset:
    inset 0 1px 3px rgba(24, 32, 40, 0.06);
}
```

Token values are starting values. Validate them with the official brand palette and actual visual implementation.
