#!/usr/bin/env node

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const svgPath = path.resolve(projectRoot, 'static/icons/icon.svg');
const iconsDir = path.resolve(projectRoot, 'static/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const abyss = '#0A1722';
const iconSvg = fs.readFileSync(svgPath, 'utf-8');

/**
 * Generate rasterized icons from SVG source.
 * Output: icon-192.png, icon-512.png, maskable-512.png, apple-touch-icon.png
 */

async function generateIcons() {
  try {
    console.log('Generating PWA icons from SVG...');

    // 1. icon-192.png: standard 192x192
    await sharp(Buffer.from(iconSvg))
      .resize(192, 192, { fit: 'contain', background: abyss })
      .png()
      .toFile(path.resolve(iconsDir, 'icon-192.png'));
    console.log('✓ icon-192.png (192×192)');

    // 2. icon-512.png: standard 512x512
    await sharp(Buffer.from(iconSvg))
      .resize(512, 512, { fit: 'contain', background: abyss })
      .png()
      .toFile(path.resolve(iconsDir, 'icon-512.png'));
    console.log('✓ icon-512.png (512×512)');

    // 3. maskable-512.png: emblem inset ~10% safe-zone, full-bleed abyss background for circular/rounded masks
    // Create a 512x512 canvas with abyss background, then place the SVG emblem centered with safe margins
    const svg512Maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${abyss}" />
  <g transform="translate(256, 256)">
    <g transform="scale(0.9)">
      <!-- Scaled-down version of emblem to fit safe zone -->
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" x="-256" y="-256" width="512" height="512">
        ${iconSvg.match(/<defs>[\s\S]*?<\/defs>/)[0]}
        <rect width="512" height="512" fill="url(#bg-gradient)" />
        ${iconSvg.match(/<g transform="translate\(256, 256\)"[\s\S]*?<\/g>/)}
      </svg>
    </g>
  </g>
</svg>`;

    await sharp(Buffer.from(svg512Maskable))
      .resize(512, 512, { fit: 'contain', background: abyss })
      .png()
      .toFile(path.resolve(iconsDir, 'maskable-512.png'));
    console.log('✓ maskable-512.png (512×512)');

    // 4. apple-touch-icon.png: 180x180, full-bleed background (iOS adds its own rounding)
    await sharp(Buffer.from(iconSvg))
      .resize(180, 180, { fit: 'contain', background: abyss })
      .png()
      .toFile(path.resolve(iconsDir, 'apple-touch-icon.png'));
    console.log('✓ apple-touch-icon.png (180×180)');

    console.log('\nIcon generation complete. All PNGs created successfully.');
  } catch (err) {
    console.error('Error generating icons:', err);
    process.exit(1);
  }
}

generateIcons();
