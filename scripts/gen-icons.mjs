#!/usr/bin/env node
// Génère les icônes PWA + favicon + logo web à partir du logo « Pêche au Bar ».
// Source : static/branding/logo.png (badge rond bar + phare, fond marine #082739).
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const SRC = path.resolve(root, 'static/branding/logo.png');
const iconsDir = path.resolve(root, 'static/icons');
const brandingDir = path.resolve(root, 'static/branding');
const NAVY = '#082739'; // fond du logo (échantillonné) — pour padding/splash sans raccord visible

fs.mkdirSync(iconsDir, { recursive: true });

async function contain(size, out) {
	await sharp(SRC)
		.resize(size, size, { fit: 'contain', background: NAVY })
		.flatten({ background: NAVY })
		.png()
		.toFile(out);
	console.log(`✓ ${path.relative(root, out)} (${size}×${size})`);
}

async function maskable(size, out, safe = 0.8) {
	const inner = Math.round(size * safe);
	const emblem = await sharp(SRC).resize(inner, inner, { fit: 'contain', background: NAVY }).toBuffer();
	await sharp({ create: { width: size, height: size, channels: 3, background: NAVY } })
		.composite([{ input: emblem, gravity: 'center' }])
		.png()
		.toFile(out);
	console.log(`✓ ${path.relative(root, out)} (${size}×${size}, maskable safe ${safe})`);
}

await contain(192, path.resolve(iconsDir, 'icon-192.png'));
await contain(512, path.resolve(iconsDir, 'icon-512.png'));
await maskable(512, path.resolve(iconsDir, 'maskable-512.png'));
await contain(180, path.resolve(iconsDir, 'apple-touch-icon.png'));
await contain(64, path.resolve(iconsDir, 'favicon-64.png'));
await contain(384, path.resolve(brandingDir, 'logo-web.png')); // logo optimisé pour l'UI
console.log('\nIcônes générées depuis le logo « Pêche au Bar ».');
