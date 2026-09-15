// Rasterize the existing LogoMark geometry for email clients that cannot show SVG.
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="108" height="108" viewBox="0 0 36 36">
  <rect width="36" height="36" rx="12" fill="#ffffff"/>
  <svg x="8" y="8" width="20" height="20" viewBox="0 0 24 24">
    <path d="M2.5 14h19" stroke="#C24500" stroke-width="2" stroke-linecap="round"/>
    <path d="M3 14c3.2-6.2 14.8-6.2 18 0" stroke="#C24500" stroke-width="1.7" stroke-linecap="round" fill="none" opacity="0.75"/>
    <path d="M7 14v5M17 14v5" stroke="#C24500" stroke-width="1.7" stroke-linecap="round" opacity="0.55"/>
    <rect x="9.5" y="8.6" width="5" height="3.6" rx="1" fill="#C24500"/>
  </svg>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(
  fileURLToPath(new URL('../public/images/email-logo.png', import.meta.url)),
);
