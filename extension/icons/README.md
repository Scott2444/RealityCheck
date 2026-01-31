# Extension Icons

Create PNG icons at the following sizes:

- icon16.png (16x16)
- icon48.png (48x48)
- icon128.png (128x128)

You can use any image editing tool or generate them from an SVG.

## Quick Icon Generation (Optional)

If you have ImageMagick installed:

```bash
# Create a simple green eye icon
convert -size 128x128 xc:transparent \
  -fill "#22c55e" -draw "circle 64,64 64,20" \
  -fill "#11111b" -draw "circle 64,64 64,44" \
  -fill "#22c55e" -draw "circle 64,64 64,54" \
  icon128.png

convert icon128.png -resize 48x48 icon48.png
convert icon128.png -resize 16x16 icon16.png
```

Or use any logo/icon you prefer.
