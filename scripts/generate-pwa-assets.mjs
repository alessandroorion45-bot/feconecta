// Gera ícones e splash screens do PWA a partir do logo da Arca (1024x1024).
// Rode com: node scripts/generate-pwa-assets.mjs
// Saída: public/icons/* e public/splash/* (assets estáticos, sem dep em runtime).
import sharp from 'sharp';
import { mkdirSync } from 'fs';

const SRC = 'public/alianca-logo.png';
const BG = { r: 10, g: 16, b: 32, alpha: 1 }; // azul-marinho profundo do app (#0a1020)
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

mkdirSync('public/icons', { recursive: true });
mkdirSync('public/splash', { recursive: true });

const resizedLogo = (size) =>
  sharp(SRC).resize(size, size, { fit: 'contain', background: TRANSPARENT }).png().toBuffer();

const onDarkBg = (w, h, logoBuf) =>
  sharp({ create: { width: w, height: h, channels: 4, background: BG } })
    .composite([{ input: logoBuf, gravity: 'center' }])
    .png();

// 1) Ícones "any" (transparentes) — 192 e 512
for (const size of [192, 512]) {
  await sharp(SRC).resize(size, size, { fit: 'contain', background: TRANSPARENT })
    .png().toFile(`public/icons/icon-${size}.png`);
}

// 2) Ícones maskable (logo ~72% centralizada sobre fundo escuro → safe zone)
for (const size of [192, 512]) {
  const logo = await resizedLogo(Math.round(size * 0.72));
  await onDarkBg(size, size, logo).toFile(`public/icons/maskable-${size}.png`);
}

// 3) apple-touch-icon (180, opaco — iOS não gosta de transparência)
{
  const logo = await resizedLogo(Math.round(180 * 0.78));
  await onDarkBg(180, 180, logo).toFile('public/icons/apple-touch-icon.png');
}

// 4) Splash screens iOS (logo centralizada sobre fundo escuro)
const splashes = [
  [1170, 2532], [1284, 2778], [1179, 2556], [1290, 2796], [1125, 2436],
  [828, 1792], [1242, 2688], [750, 1334], [1536, 2048], [1668, 2388], [2048, 2732],
];
for (const [w, h] of splashes) {
  const logo = await resizedLogo(Math.round(Math.min(w, h) * 0.42));
  await onDarkBg(w, h, logo).toFile(`public/splash/splash-${w}x${h}.png`);
}

console.log(`✓ ${2 + 2 + 1} ícones + ${splashes.length} splash gerados.`);
