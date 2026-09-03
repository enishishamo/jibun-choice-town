#!/usr/bin/env node

import { spawn } from 'child_process';
import { mkdir, readdir, writeFile } from 'fs/promises';
import { dirname, basename, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SHOTS_DIR = join(__dirname, '../state/art/shots');
const THUMBS_DIR = join(SHOTS_DIR, '.thumbs');
const OUTPUT_HTML = join(__dirname, '../state/art/contact-sheet-expansion.html');
const THUMB_WIDTH = 260;

// Parse world from filename: mobile/desktop-{world}-{type}
// Extract the world part (everything between the first hyphen and the second hyphen, or the first hyphen and end)
function extractWorld(filename) {
  const match = filename.match(/^(?:mobile|desktop)-([a-z0-9]+)(?:-|$)/);
  if (!match) return 'other';

  const worldPart = match[1];

  // Map common world names
  const worldMap = {
    'library': 'library',
    'port': 'port',
    'river': 'river',
    'studio': 'studio',
    'zoo': 'zoo',
    'forest': 'forest',
    'waste': 'waste',
    'newhome': 'region',
    'region': 'region',
    'town': 'other',
    'shop': 'other',
    'world': 'other',
  };

  return worldMap[worldPart] || 'other';
}

// Promisified sips resize
function resizeImage(source, dest, width) {
  return new Promise((resolve, reject) => {
    const proc = spawn('sips', ['-Z', String(width), source, '--out', dest]);
    proc.on('close', (code) => {
      if (code !== 0) reject(new Error(`sips failed with code ${code}`));
      else resolve();
    });
    proc.on('error', reject);
  });
}

async function main() {
  try {
    // Create .thumbs directory
    await mkdir(THUMBS_DIR, { recursive: true });

    // Read all PNG files from shots directory
    const files = await readdir(SHOTS_DIR);
    const pngFiles = files.filter(f => f.endsWith('.png') && /^(mobile|desktop)-/.test(f)).sort();

    console.log(`Found ${pngFiles.length} PNG files to process`);

    // Group by world
    const byWorld = {};
    const imagesByWorld = {};

    for (const file of pngFiles) {
      const world = extractWorld(file);
      if (!byWorld[world]) byWorld[world] = 0;
      if (!imagesByWorld[world]) imagesByWorld[world] = [];
      byWorld[world]++;
      imagesByWorld[world].push(file);
    }

    // Output world summary
    console.log('\n=== World 別枚数一覧 ===');
    const worldOrder = ['port', 'forest', 'river', 'library', 'studio', 'zoo', 'waste', 'region', 'other'];
    for (const world of worldOrder) {
      if (byWorld[world]) {
        console.log(`${world}: ${byWorld[world]} 枚`);
      }
    }
    console.log('');

    // Resize images to thumbnails
    console.log('Generating thumbnails...');
    for (const file of pngFiles) {
      const source = join(SHOTS_DIR, file);
      const dest = join(THUMBS_DIR, file);
      await resizeImage(source, dest, THUMB_WIDTH);
      process.stdout.write('.');
    }
    console.log('\n✓ Thumbnails generated\n');

    // Generate HTML contact sheet
    let html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contact Sheet - Expansion</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      padding: 40px 20px;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
    }

    h1 {
      font-size: 24px;
      margin-bottom: 40px;
      text-align: center;
      color: #333;
    }

    .world-section {
      margin-bottom: 60px;
    }

    .world-title {
      font-size: 18px;
      font-weight: 600;
      color: #555;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #ddd;
    }

    .grid {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      justify-content: flex-start;
    }

    .item {
      flex: 0 0 auto;
      text-align: center;
      background: white;
      padding: 12px;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .item img {
      width: 260px;
      height: auto;
      border-radius: 4px;
      margin-bottom: 8px;
      display: block;
    }

    .item-label {
      font-size: 12px;
      color: #666;
      word-break: break-all;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Contact Sheet - Expansion</h1>
`;

    // Group images by world and render (use same worldOrder from above)
    for (const world of worldOrder) {
      if (!imagesByWorld[world]) continue;

      const images = imagesByWorld[world];
      const worldLabel = world.charAt(0).toUpperCase() + world.slice(1);

      html += `    <div class="world-section">
      <div class="world-title">${worldLabel}</div>
      <div class="grid">
`;

      // Sort: mobile first, then desktop
      const sorted = images.sort((a, b) => {
        const aPrefix = a.startsWith('mobile') ? 0 : 1;
        const bPrefix = b.startsWith('mobile') ? 0 : 1;
        if (aPrefix !== bPrefix) return aPrefix - bPrefix;
        return a.localeCompare(b);
      });

      for (const img of sorted) {
        const thumbPath = `.thumbs/${img}`;
        html += `        <div class="item">
          <img src="${thumbPath}" alt="${img}">
          <div class="item-label">${img}</div>
        </div>
`;
      }

      html += `      </div>
    </div>
`;
    }

    html += `  </div>
</body>
</html>`;

    // Write HTML file
    await writeFile(OUTPUT_HTML, html, 'utf-8');
    console.log(`✓ HTML contact sheet generated: ${OUTPUT_HTML}`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
