/**
 * Downloads face-api.js tiny model weights into public/models/.
 * Run once: node scripts/download-face-models.mjs
 *
 * Models used (~2MB total):
 *   - tiny_face_detector_model  (face detection)
 *   - face_landmark_68_tiny_model (landmark points for gaze)
 */
import { createWriteStream, mkdirSync } from 'fs';
import { pipeline } from 'stream/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEST = join(__dirname, '..', 'public', 'models');

const BASE = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model';

const FILES = [
  'tiny_face_detector_model.bin',
  'tiny_face_detector_model-weights_manifest.json',
  'face_landmark_68_tiny_model.bin',
  'face_landmark_68_tiny_model-weights_manifest.json',
];

mkdirSync(DEST, { recursive: true });

for (const file of FILES) {
  const url  = `${BASE}/${file}`;
  const dest = join(DEST, file);
  process.stdout.write(`Downloading ${file}... `);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await pipeline(res.body, createWriteStream(dest));
    console.log('✓');
  } catch (e) {
    console.error(`FAILED: ${e.message}`);
    process.exit(1);
  }
}

console.log('\n✅  Face-api models downloaded to public/models/');
console.log('Add this folder to git or your CDN before deploying.');
