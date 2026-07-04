const fs = require('fs');
const path = require('path');

// ==========================================
// CONFIGURATION SETTINGS
// ==========================================
const CONFIG = {
  width: 360,           // Target width (set to null to keep original width)
  height: 180,          // Target height (set to null to keep original height)
  fit: 'cover',         // How to fit the image: 'cover', 'contain', 'fill', 'inside', 'outside'
  quality: 82,          // WebP compression quality (0-100). 82 is optimized for R2/web.
  effort: 6,            // CPU effort for compression (0-6, 6 is slowest but yields smallest size)
  lossless: false,      // Use lossless compression (true/false)
};

let sharp;
try {
  sharp = require('sharp');
} catch (err) {
  console.error('\n\x1b[31mError: The "sharp" library is not installed.\x1b[0m');
  console.error('This script requires the "sharp" package to process images.');
  console.error('Please install it by running the following command in your terminal:\n');
  console.error('\x1b[36m   npm install --save-dev sharp\x1b[0m\n');
  process.exit(1);
}

// Get directory path from command line arguments
const targetFolder = process.argv[2];

if (!targetFolder) {
  console.log('\n\x1b[33mUsage: node scripts/convert-webp.js <folder-path>\x1b[0m');
  console.log('Example: node scripts/convert-webp.js ./public/images/raw\n');
  console.log('Configuration:');
  console.log(`- Dimensions: ${CONFIG.width ?? 'Original'} x ${CONFIG.height ?? 'Original'} px (${CONFIG.fit})`);
  console.log(`- WebP Quality: ${CONFIG.quality}`);
  console.log(`- Lossless: ${CONFIG.lossless}\n`);
  process.exit(0);
}

const absoluteFolderPath = path.resolve(targetFolder);

// Check if directory exists
if (!fs.existsSync(absoluteFolderPath)) {
  console.error(`\n\x1b[31mError: Folder "${absoluteFolderPath}" does not exist.\x1b[0m\n`);
  process.exit(1);
}

const stats = fs.statSync(absoluteFolderPath);
if (!stats.isDirectory()) {
  console.error(`\n\x1b[31mError: Path "${absoluteFolderPath}" is not a directory.\x1b[0m\n`);
  process.exit(1);
}

// Create output folder in the same directory
const outputFolder = path.join(absoluteFolderPath, 'output');

if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder, { recursive: true });
}

async function convertPngToWebp() {
  try {
    const files = fs.readdirSync(absoluteFolderPath);
    const pngFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ext === '.png';
    });

    if (pngFiles.length === 0) {
      console.log(`\nNo PNG files found in "${absoluteFolderPath}".`);
      return;
    }

    console.log('\n==================================================');
    console.log(`Converting ${pngFiles.length} PNG thumbnail(s) to WebP...`);
    console.log(`Target Dimensions: ${CONFIG.width ?? 'Original'}x${CONFIG.height ?? 'Original'}px`);
    console.log(`Output Directory:  ${outputFolder}`);
    console.log('==================================================\n');

    let totalOriginalSize = 0;
    let totalWebpSize = 0;
    let successCount = 0;

    for (const file of pngFiles) {
      const inputFilePath = path.join(absoluteFolderPath, file);
      const fileWithoutExt = path.basename(file, path.extname(file));
      const outputFilePath = path.join(outputFolder, `${fileWithoutExt}.webp`);

      const originalSize = fs.statSync(inputFilePath).size;
      totalOriginalSize += originalSize;

      try {
        let pipeline = sharp(inputFilePath);

        // Apply resize if width or height is configured
        if (CONFIG.width || CONFIG.height) {
          pipeline = pipeline.resize({
            width: CONFIG.width || undefined,
            height: CONFIG.height || undefined,
            fit: CONFIG.fit,
            background: { r: 0, g: 0, b: 0, alpha: 0 } // transparent background for PNG alpha channels
          });
        }

        // Convert to WebP
        await pipeline
          .webp({
            quality: CONFIG.quality,
            effort: CONFIG.effort,
            lossless: CONFIG.lossless
          })
          .toFile(outputFilePath);

        const webpSize = fs.statSync(outputFilePath).size;
        totalWebpSize += webpSize;
        successCount++;

        const reduction = ((originalSize - webpSize) / originalSize * 100).toFixed(1);
        console.log(`✓ \x1b[32mConverted:\x1b[0m ${file}`);
        console.log(`  Size: ${(originalSize / 1024).toFixed(1)} KB -> ${(webpSize / 1024).toFixed(1)} KB (-${reduction}%)\n`);
      } catch (err) {
        console.error(`✗ \x1b[31mFailed to convert "${file}":\x1b[0m`, err.message, '\n');
      }
    }

    console.log('==================================================');
    console.log(`\x1b[32mConversion Complete!\x1b[0m Successfully converted ${successCount}/${pngFiles.length} file(s).`);
    
    if (successCount > 0) {
      const overallReduction = ((totalOriginalSize - totalWebpSize) / totalOriginalSize * 100).toFixed(1);
      console.log(`Total Original Size: ${(totalOriginalSize / 1024).toFixed(1)} KB`);
      console.log(`Total WebP Size:     \x1b[36m${(totalWebpSize / 1024).toFixed(1)} KB\x1b[0m`);
      console.log(`Overall Savings:     \x1b[32m-${overallReduction}%\x1b[0m`);
      console.log(`Saved files:         \x1b[34m${outputFolder}\x1b[0m`);
    }
    console.log('==================================================\n');
  } catch (err) {
    console.error('An error occurred during execution:', err);
  }
}

convertPngToWebp();
