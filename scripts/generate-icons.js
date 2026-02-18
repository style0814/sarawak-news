/**
 * PWA Icon Generator Script
 *
 * This script generates PNG icons from the SVG icon.
 *
 * Prerequisites:
 * npm install sharp
 *
 * Usage:
 * node scripts/generate-icons.js
 *
 * Or manually create icons using an online tool:
 * 1. Go to https://realfavicongenerator.net/
 * 2. Upload your icon image
 * 3. Download the generated icons
 * 4. Place them in public/icons/
 */
/* eslint-disable @typescript-eslint/no-require-imports */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputSvg = path.join(__dirname, '../public/icons/icon.svg');
const outputDir = path.join(__dirname, '../public/icons');

async function generateIcons() {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Generating PWA icons...\n');

  for (const size of sizes) {
    const outputFile = path.join(outputDir, `icon-${size}x${size}.png`);

    try {
      await sharp(inputSvg)
        .resize(size, size)
        .png()
        .toFile(outputFile);

      console.log(`✓ Generated: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`✗ Failed to generate icon-${size}x${size}.png:`, error.message);
    }
  }

  console.log('\nDone! Icons are in public/icons/');
}

// Check if sharp is installed
try {
  require.resolve('sharp');
  generateIcons();
} catch {
  console.log(`
====================================
PWA Icon Generator
====================================

To generate icons automatically, install sharp:
  npm install sharp --save-dev

Then run:
  node scripts/generate-icons.js

====================================
Manual Alternative:
====================================

1. Open public/icons/icon.svg in a browser
2. Take a screenshot or use an online converter
3. Create PNG files at these sizes:
   - icon-72x72.png
   - icon-96x96.png
   - icon-128x128.png
   - icon-144x144.png
   - icon-152x152.png
   - icon-192x192.png
   - icon-384x384.png
   - icon-512x512.png

Or use: https://realfavicongenerator.net/

Place all icons in: public/icons/
`);
}
