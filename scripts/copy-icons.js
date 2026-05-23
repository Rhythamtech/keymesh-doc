import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const home = os.homedir();
const srcDir = path.join(
  home,
  '.gemini/antigravity-ide/brain/1fa0bd69-785d-4f92-a38a-629fedd3816c',
);
const destDir = path.join(process.cwd(), 'public');

const darkSrc = path.join(srcDir, 'media__1779526506091.jpg');
const lightSrc = path.join(srcDir, 'media__1779526510842.jpg');

const darkDest = path.join(destDir, 'icon-dark.jpg');
const lightDest = path.join(destDir, 'icon-light.jpg');

try {
  fs.copyFileSync(darkSrc, darkDest);
  console.log('Successfully copied dark icon to public/icon-dark.jpg');
  fs.copyFileSync(lightSrc, lightDest);
  console.log('Successfully copied light icon to public/icon-light.jpg');
} catch (err) {
  console.error('Error copying icons:', err);
  process.exit(1);
}
