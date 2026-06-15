# Cognis Brand Colors

High-contrast dark/light system anchored by a bright lime-green accent.
Extracted from the Framer site color tokens (`framer-runtime/sites/3RYFpGbtMJS5XyuENcvikD/`).

## Core Brand

| Role | Hex | RGB |
|------|-----|-----|
| Dark / Ink (primary dark) | `#131313` | `19, 19, 19` |
| White (primary light) | `#ffffff` | `255, 255, 255` |
| Lime — signature accent | `#d6fd70` | `214, 253, 112` |
| Lime — bright variant | `#cdfb56` | `205, 251, 86` |
| Sky Blue — secondary accent | `#38c6f6` | `56, 198, 246` |

## Neutral / Gray Scale

| Role | Hex | RGB |
|------|-----|-----|
| Light surface | `#f2f2f2` | `242, 242, 242` |
| Lightest gray | `#ececec` | `237, 237, 237` |
| Mid-gray (muted text) | `#7b7b7b` | `123, 123, 123` |
| Charcoal | `#3d3d3d` | `61, 61, 61` |
| Dark gray | `#2f2f2f` | `47, 47, 47` |
| True black | `#000000` | `0, 0, 0` |

## Transparency Variants

- `rgba(19, 19, 19, 0.5)` — dark 50% (overlays / scrims)
- `rgba(255, 255, 255, 0.8)` — white 80%
- `rgba(255, 255, 255, 0.75)` — white 75%
- `rgba(255, 255, 255, 0.2)` — white 20%

## Signature Gradient (fade-to-dark overlay)

```css
linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.15) 5%, rgba(0,0,0,1) 28%);
```

## CSS Custom Properties

```css
:root {
  /* Core brand */
  --color-ink:        #131313;
  --color-white:      #ffffff;
  --color-lime:       #d6fd70; /* signature accent */
  --color-lime-bright:#cdfb56;
  --color-sky:        #38c6f6; /* secondary accent */

  /* Neutrals */
  --color-surface:    #f2f2f2;
  --color-gray-100:   #ececec;
  --color-gray-500:   #7b7b7b;
  --color-charcoal:   #3d3d3d;
  --color-gray-800:   #2f2f2f;
  --color-black:      #000000;

  /* Transparency */
  --color-ink-50:     rgba(19, 19, 19, 0.5);
  --color-white-80:   rgba(255, 255, 255, 0.8);
  --color-white-75:   rgba(255, 255, 255, 0.75);
  --color-white-20:   rgba(255, 255, 255, 0.2);
}
```
