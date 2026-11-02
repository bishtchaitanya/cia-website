# Brand font: Neue Plak

Neue Plak is a commercial Monotype typeface. Use the licensed web font files from
your brand team; it must not be downloaded from elsewhere.

1. Put these `.woff2` files in this folder (or edit the names in `neue-plak.css`):

   | File | Used for |
   |---|---|
   | `NeuePlak-Regular.woff2` | body text |
   | `NeuePlak-SemiBold.woff2` | labels, names, stat values |
   | `NeuePlak-Bold.woff2` | strong text |
   | `NeuePlak-CondensedBold.woff2` | headlines (fallback weight) |
   | `NeuePlak-CondensedBlack.woff2` | headlines |

2. Rebuild with `npm run build`; `npm run watch` won't notice new font files. The build
   prints "Brand font: Neue Plak linked" when it finds them.

Until the files exist, the stylesheet isn't linked at all, so there are no 404s. The
page uses Barlow Condensed for headlines and Jost for text.

After adding the fonts, check the hero headline, the org chart and the deck list.
Neue Plak's widths differ from the fallbacks.
