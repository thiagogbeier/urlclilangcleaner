#!/usr/bin/env node

/**
 * Simple script to convert SVG icon to PNG files at required sizes.
 * 
 * Installation:
 *   npm install sharp
 * 
 * Usage:
 *   node convert-icons.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svgPath = path.join(__dirname, 'extension', 'icons', 'icon.svg');
const iconDir = path.join(__dirname, 'extension', 'icons');

const sizes = [16, 32, 48, 128];

async function convertIcon() {
  try {
    const svg = fs.readFileSync(svgPath);

    for (const size of sizes) {
      await sharp(svg)
        .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toFile(path.join(iconDir, `icon-${size}.png`));

      console.log(`✓ Created icon-${size}.png`);
    }

    console.log('\nAll icons generated successfully!');
  } catch (error) {
    console.error('Error converting icon:', error.message);
    console.log('\nAlternative: Use an online SVG to PNG converter:');
    console.log('  1. Visit https://cloudconvert.com/svg-to-png');
    console.log('  2. Upload extension/icons/icon.svg');
    console.log('  3. Convert to PNG at each size (16x16, 32x32, 48x48, 128x128)');
    console.log('  4. Save as icon-{size}.png in extension/icons/');
  }
}

convertIcon();
