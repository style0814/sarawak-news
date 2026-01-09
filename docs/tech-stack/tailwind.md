# Tailwind CSS

## What is Tailwind?

Tailwind is a **utility-first CSS framework**. Instead of writing CSS classes, you use pre-built utility classes directly in HTML.

## Traditional CSS vs Tailwind

### Traditional CSS
```css
/* styles.css */
.button {
  background-color: #f97316;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
}
.button:hover {
  background-color: #ea580c;
}
```
```html
<button class="button">Click me</button>
```

### Tailwind
```html
<!-- No separate CSS file needed! -->
<button class="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
  Click me
</button>
```

## Why We Use It

### 1. Faster Development
No switching between HTML and CSS files. Style directly in components.

### 2. Consistent Design
Pre-defined spacing, colors, and sizes:
```
Spacing: p-1 p-2 p-4 p-8 (4px, 8px, 16px, 32px)
Colors: gray-100 gray-200 ... gray-900
Text: text-sm text-base text-lg text-xl
```

### 3. Responsive Design Made Easy
```html
<!-- Mobile: 1 column, Desktop: 3 columns -->
<div class="grid grid-cols-1 md:grid-cols-3">
```

| Prefix | Screen Size |
|--------|-------------|
| (none) | All screens |
| `sm:` | ≥640px |
| `md:` | ≥768px |
| `lg:` | ≥1024px |
| `xl:` | ≥1280px |

### 4. Small Bundle Size
Tailwind removes unused CSS automatically. Only classes you use are included.

## Common Classes We Use

### Spacing
```
p-4     → padding: 16px (all sides)
px-4    → padding-left & right: 16px
py-2    → padding-top & bottom: 8px
m-4     → margin: 16px
mt-2    → margin-top: 8px
gap-4   → gap between flex/grid items: 16px
```

### Flexbox
```html
<div class="flex items-center justify-between gap-4">
  <!-- flex: display flex -->
  <!-- items-center: vertical center -->
  <!-- justify-between: space between items -->
  <!-- gap-4: 16px gap between children -->
</div>
```

### Colors (Our Orange Theme)
```
bg-orange-500    → Background orange
text-orange-600  → Text orange
hover:bg-orange-600 → Orange on hover
bg-orange-50     → Very light orange (background)
```

### Text
```
text-sm    → 14px
text-base  → 16px
text-xl    → 20px
font-bold  → Bold
text-gray-500 → Gray color
```

### Borders & Rounded
```
rounded       → Small border radius
rounded-lg    → Larger radius
border        → 1px border
shadow-sm     → Small shadow
```

## Examples From Our Code

### Header Component
```tsx
<header className="bg-orange-500 text-white">
  <div className="max-w-4xl mx-auto px-4 py-3">
```
- `bg-orange-500 text-white`: Orange background, white text
- `max-w-4xl`: Max width 896px
- `mx-auto`: Center horizontally
- `px-4 py-3`: Padding x=16px, y=12px

### Button
```tsx
<button className="px-4 py-1.5 rounded text-sm font-medium bg-white text-orange-500 hover:bg-orange-50">
```

### News Item Hover
```tsx
<div className="py-2 hover:bg-orange-50 transition-colors">
```
- `hover:bg-orange-50`: Light orange on hover
- `transition-colors`: Smooth color transition

## Configuration

Tailwind config is in `tailwind.config.ts` (or `postcss.config.mjs` for Next.js 14+).

## Learn More

- [Tailwind Docs](https://tailwindcss.com/docs)
- [Tailwind Cheat Sheet](https://nerdcave.com/tailwind-cheat-sheet)
