const sharp = require('sharp');
const path = require('path');

// Notification icon : blanc sur transparent (requis Android)
const svg = `
<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <path d="
    M 48 82
    C 30 68, 8 50, 8 30
    C 8 18, 18 8, 30 8
    C 38 8, 44 12, 48 18
    C 52 12, 58 8, 66 8
    C 78 8, 88 18, 88 30
    C 88 50, 66 68, 48 82 Z
  " fill="white"/>
</svg>`;

sharp(Buffer.from(svg))
  .resize(96, 96)
  .png()
  .toFile(path.join(__dirname, '..', 'assets', 'notification-icon.png'))
  .then(() => console.log('✅ notification-icon.png'))
  .catch(console.error);
