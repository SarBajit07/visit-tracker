const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

async function gen(svgName, outName, size) {
  const svgPath = path.join(__dirname, '..', 'public', 'icons', svgName)
  const outPath = path.join(__dirname, '..', 'public', 'icons', outName)
  if (!fs.existsSync(svgPath)) {
    console.error('Missing', svgPath)
    return
  }
  await sharp(svgPath).resize(size, size).png().toFile(outPath)
  console.log('Wrote', outPath)
}

(async function() {
  try {
    await gen('icon-192.svg', 'icon-192.png', 192)
    await gen('icon-512.svg', 'icon-512.png', 512)
    console.log('Icons generated')
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
})()
