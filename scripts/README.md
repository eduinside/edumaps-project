# WebP Conversion Script (convert-webp.js)

We have created an automated Node.js utility script designed to process PNG files (e.g. exported from Canva at 360*180px) and generate highly optimized WebP images ready for hosting on Cloudflare R2 or CDN delivery.

## How to Run

You can run the script by targeting any folder that contains your PNG files.

```bash
npm run convert-webp <folder-path>
```

For example, if you place your Canva PNG files in a folder called `D:\CanvaThumbnails`, you can run:

```bash
npm run convert-webp "D:\CanvaThumbnails"
```

### Script Execution Behavior:
- The script scans the target directory for any `.png` files (case-insensitive).
- It creates an `output` folder inside that target directory (e.g., `D:\CanvaThumbnails\output`).
- It resizes each PNG to exactly **360x180 px** (default configuration) preserving transparency.
- It converts and compresses them into optimized WebP format (`quality: 82`).
- It outputs detailed logs showing original size, new size, and the percentage reduction for each file, followed by a summary of overall size savings.

---

## Configuration Settings

You can customize the script behavior by editing the `CONFIG` block at the top of the [convert-webp.js](file:///d:/Hwan/Documents/Web/edumaps/scripts/convert-webp.js#L5-L12) file:

```javascript
const CONFIG = {
  width: 360,           // Target width (set to null to keep original width)
  height: 180,          // Target height (set to null to keep original height)
  fit: 'cover',         // How to fit the image: 'cover', 'contain', 'fill', 'inside', 'outside'
  quality: 82,          // WebP compression quality (0-100). 82 is optimized for R2/web.
  effort: 6,            // CPU effort for compression (0-6, 6 is slowest but yields smallest size)
  lossless: false,      // Use lossless compression (true/false)
};
```

- **Dimensions**: If you ever want to keep the original image dimensions without resizing, change `width` and `height` to `null`.
- **Quality**: Adjust `quality` to balance file size and visual fidelity. `82` is a standard recommendation for high quality with minimal file footprint.
