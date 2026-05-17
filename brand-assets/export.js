const puppeteer = require('puppeteer');
const path = require('path');

async function exportToPng(htmlFile, outputFile, width, height) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2 });
  await page.goto(`file://${path.resolve(htmlFile)}`);
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({
    path: outputFile,
    fullPage: false,
    clip: { x: 0, y: 0, width, height }
  });
  await browser.close();
  console.log(`✅ Exported: ${outputFile} (${width}x${height})`);
}

(async () => {
  const dir = path.dirname(__filename);
  await exportToPng(`${dir}/profile-pic.html`,    `${dir}/nextlove-profile-pic.png`,   800, 800);
  await exportToPng(`${dir}/facebook-cover.html`, `${dir}/nextlove-facebook-cover.png`, 1640, 624);
  console.log('\n🎉 Tous les assets exportés dans /brand-assets/');
})();
