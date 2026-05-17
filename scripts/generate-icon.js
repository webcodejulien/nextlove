const sharp = require('sharp');
const path = require('path');

const SIZE = 1024;

// SVG icon : fond dégradé violet/rose, double cœur stylisé + étoile IA
const svg = `
<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Fond principal : dégradé dark violet → purple -->
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0F0520"/>
      <stop offset="100%" stop-color="#1E0835"/>
    </linearGradient>

    <!-- Dégradé cœur principal rose → magenta -->
    <linearGradient id="heart1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FF6B9D"/>
      <stop offset="100%" stop-color="#FF1F7A"/>
    </linearGradient>

    <!-- Dégradé cœur secondaire violet -->
    <linearGradient id="heart2" x1="1" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#C44DFF"/>
      <stop offset="100%" stop-color="#7B2FFF"/>
    </linearGradient>

    <!-- Lueur -->
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FF6B9D" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#FF6B9D" stop-opacity="0"/>
    </radialGradient>

    <!-- Filtre ombre portée -->
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="20" flood-color="#FF1F7A" flood-opacity="0.45"/>
    </filter>

    <!-- Filtre lueur douce sur l'étoile -->
    <filter id="starGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="0" stdDeviation="12" flood-color="#FFD700" flood-opacity="0.9"/>
    </filter>
  </defs>

  <!-- Fond arrondi -->
  <rect width="${SIZE}" height="${SIZE}" rx="220" fill="url(#bg)"/>

  <!-- Cercle de lueur derrière le cœur -->
  <ellipse cx="512" cy="490" rx="300" ry="280" fill="url(#glow)"/>

  <!-- Cœur secondaire (violet, légèrement décalé, semi-transparent) -->
  <g transform="translate(512, 480)" filter="url(#shadow)" opacity="0.55">
    <path d="
      M 30 -120
      C 100 -200, 240 -180, 240 -80
      C 240 0, 160 80, 30 175
      C -100 80, -180 0, -180 -80
      C -180 -180, -40 -200, 30 -120 Z
    " fill="url(#heart2)" transform="scale(0.88) translate(30, 20)"/>
  </g>

  <!-- Cœur principal (rose/magenta) -->
  <g transform="translate(512, 465)" filter="url(#shadow)">
    <path d="
      M 0 -110
      C 70 -195, 230 -175, 230 -70
      C 230 10, 145 90, 0 185
      C -145 90, -230 10, -230 -70
      C -230 -175, -70 -195, 0 -110 Z
    " fill="url(#heart1)"/>
  </g>

  <!-- Highlight blanc sur le cœur (brillance) -->
  <ellipse cx="440" cy="385" rx="52" ry="34" fill="white" opacity="0.18" transform="rotate(-30, 440, 385)"/>

  <!-- Étoile IA dorée (sparkle) en haut à droite du cœur -->
  <g transform="translate(695, 290)" filter="url(#starGlow)">
    <!-- Étoile à 4 branches -->
    <path d="
      M 0 -34
      L 8 -8
      L 34 0
      L 8 8
      L 0 34
      L -8 8
      L -34 0
      L -8 -8 Z
    " fill="#FFD700"/>
    <!-- Petit cercle central -->
    <circle cx="0" cy="0" r="7" fill="white" opacity="0.9"/>
  </g>

  <!-- Petite étoile secondaire -->
  <g transform="translate(338, 310)" opacity="0.75">
    <path d="
      M 0 -18
      L 4 -4
      L 18 0
      L 4 4
      L 0 18
      L -4 4
      L -18 0
      L -4 -4 Z
    " fill="#FFD700" filter="url(#starGlow)"/>
  </g>

  <!-- Texte "NL" en bas (optionnel, commenté) -->
  <!-- <text x="512" y="890" text-anchor="middle" fill="white" opacity="0.5"
    font-size="72" font-family="Georgia" font-weight="bold" letter-spacing="8">
    NEXTLOVE
  </text> -->
</svg>
`;

async function generate() {
  const assetsDir = path.join(__dirname, '..', 'assets');
  const buf = Buffer.from(svg);

  // Icon 1024x1024
  await sharp(buf)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));
  console.log('✅ icon.png (1024x1024)');

  // Adaptive icon (Android) — fond plein, cœur centré
  await sharp(buf)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(assetsDir, 'adaptive-icon.png'));
  console.log('✅ adaptive-icon.png (1024x1024)');

  // Favicon 48x48
  await sharp(buf)
    .resize(48, 48)
    .png()
    .toFile(path.join(assetsDir, 'favicon.png'));
  console.log('✅ favicon.png (48x48)');

  // Splash screen 1284x2778 (iPhone 14 Pro Max)
  const splashSvg = `
  <svg width="1284" height="2778" viewBox="0 0 1284 2778" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0%" stop-color="#0F0520"/>
        <stop offset="50%" stop-color="#1A0830"/>
        <stop offset="100%" stop-color="#0A0318"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="42%" r="35%">
        <stop offset="0%" stop-color="#FF6B9D" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="#FF6B9D" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="heart1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#FF6B9D"/>
        <stop offset="100%" stop-color="#FF1F7A"/>
      </linearGradient>
      <filter id="shadow">
        <feDropShadow dx="0" dy="12" stdDeviation="28" flood-color="#FF1F7A" flood-opacity="0.5"/>
      </filter>
      <filter id="starGlow">
        <feDropShadow dx="0" dy="0" stdDeviation="14" flood-color="#FFD700" flood-opacity="0.9"/>
      </filter>
    </defs>

    <rect width="1284" height="2778" fill="url(#bg)"/>
    <ellipse cx="642" cy="1160" rx="420" ry="380" fill="url(#glow)"/>

    <!-- Cœur -->
    <g transform="translate(642, 1100)" filter="url(#shadow)">
      <path d="
        M 0 -155
        C 98 -274, 322 -246, 322 -98
        C 322 14, 203 126, 0 260
        C -203 126, -322 14, -322 -98
        C -322 -246, -98 -274, 0 -155 Z
      " fill="url(#heart1)"/>
    </g>

    <!-- Étoile -->
    <g transform="translate(920, 900)" filter="url(#starGlow)">
      <path d="M0-46 L11-11 L46 0 L11 11 L0 46 L-11 11 L-46 0 L-11-11 Z" fill="#FFD700"/>
    </g>
    <g transform="translate(378, 940)" filter="url(#starGlow)" opacity="0.7">
      <path d="M0-26 L6-6 L26 0 L6 6 L0 26 L-6 6 L-26 0 L-6-6 Z" fill="#FFD700"/>
    </g>

    <!-- Nom -->
    <text x="642" y="1460" text-anchor="middle" fill="white"
      font-size="88" font-family="-apple-system, SF Pro Display, Helvetica Neue" font-weight="800" letter-spacing="-2">
      NextLove
    </text>
    <text x="642" y="1540" text-anchor="middle" fill="rgba(255,255,255,0.45)"
      font-size="36" font-family="-apple-system, SF Pro Display, Helvetica Neue" font-weight="400" letter-spacing="2">
      Trouve ton match idéal
    </text>
  </svg>`;

  await sharp(Buffer.from(splashSvg))
    .resize(1284, 2778)
    .png()
    .toFile(path.join(assetsDir, 'splash.png'));
  console.log('✅ splash.png (1284x2778)');

  console.log('\n🎨 Tous les assets générés !');
}

generate().catch(console.error);
