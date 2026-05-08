import sharp from 'sharp'
import { createICO, createICNS } from '@ctjs/png2icons'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BICUBIC = 2

const variants = ['a', 'b', 'c', 'd', 'e']
const variantNames = {
  a: 'API Bot',
  b: 'Rocket API',
  c: 'Code Wave',
  d: 'Lightning Bolt',
  e: 'NEXUS',
}

const sizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024]

async function getPngBuffer(svgBuffer, size) {
  return await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toBuffer()
}

async function generateForVariant(variant) {
  const svgPath = path.join(__dirname, `icon-${variant}.svg`)
  if (!fs.existsSync(svgPath)) {
    console.log(`Skipping variant ${variant}: ${svgPath} not found`)
    return
  }

  const svgBuffer = fs.readFileSync(svgPath)
  const outDir = path.join(__dirname, `variant-${variant}`)
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  console.log(`\n=== Generating icons for variant ${variant.toUpperCase()}: ${variantNames[variant]} ===`)

  for (const size of sizes) {
    const outputPath = path.join(outDir, `${size}x${size}.png`)
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath)
    console.log(`  Generated ${size}x${size}.png`)
  }

  const input1024 = await getPngBuffer(svgBuffer, 1024)

  const icoBuffer = createICO(input1024, BICUBIC, 0, false, true)
  const icoPath = path.join(outDir, 'icon.ico')
  fs.writeFileSync(icoPath, Buffer.from(icoBuffer))
  console.log(`  Generated icon.ico (Windows Executable format)`)

  const icnsBuffer = createICNS(input1024, BICUBIC, 0)
  const icnsPath = path.join(outDir, 'icon.icns')
  fs.writeFileSync(icnsPath, Buffer.from(icnsBuffer))
  console.log(`  Generated icon.icns (macOS)`)
}

async function applyVariant(variant) {
  const srcDir = path.join(__dirname, `variant-${variant}`)
  if (!fs.existsSync(srcDir)) {
    console.error(`Variant ${variant} not generated yet. Run with --all first.`)
    process.exit(1)
  }

  console.log(`\n=== Applying variant ${variant.toUpperCase()} as active icon ===`)

  const icoSrc = path.join(srcDir, 'icon.ico')
  const icnsSrc = path.join(srcDir, 'icon.icns')

  fs.copyFileSync(icoSrc, path.join(__dirname, 'icon.ico'))
  console.log('  Copied icon.ico -> build/icon.ico')

  if (fs.existsSync(icnsSrc)) {
    fs.copyFileSync(icnsSrc, path.join(__dirname, 'icon.icns'))
    console.log('  Copied icon.icns -> build/icon.icns')
  }

  for (const size of sizes) {
    const src = path.join(srcDir, `${size}x${size}.png`)
    const dst = path.join(__dirname, `${size}x${size}.png`)
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dst)
    }
  }
  console.log('  Copied all PNG sizes -> build/')

  const publicDir = path.join(__dirname, '..', 'public')
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }

  const favicon32Src = path.join(srcDir, '32x32.png')
  fs.copyFileSync(favicon32Src, path.join(publicDir, 'favicon-32x32.png'))
  console.log('  Copied favicon-32x32.png -> public/')

  const faviconIcoSrc = path.join(srcDir, 'icon.ico')
  fs.copyFileSync(faviconIcoSrc, path.join(publicDir, 'favicon.ico'))
  console.log('  Copied favicon.ico -> public/')

  const svgSrc = path.join(__dirname, `icon-${variant}.svg`)
  fs.copyFileSync(svgSrc, path.join(__dirname, 'icon.svg'))
  console.log('  Copied icon.svg -> build/icon.svg')

  console.log(`\nVariant ${variant.toUpperCase()} is now the active icon!`)
}

async function main() {
  const args = process.argv.slice(2)

  try {
    if (args.length === 0 || args.includes('--all')) {
      for (const v of variants) {
        await generateForVariant(v)
      }
      await applyVariant('a')
      console.log('\nAll variants generated! Variant A is active by default.')
      console.log('Use "npm run generate-icons -- --use b" to switch to variant B, etc.')
    } else if (args[0] === '--use' && args[1]) {
      const v = args[1].toLowerCase()
      if (!variants.includes(v)) {
        console.error(`Unknown variant: ${v}. Available: ${variants.join(', ')}`)
        process.exit(1)
      }
      if (!fs.existsSync(path.join(__dirname, `variant-${v}`))) {
        console.log(`Variant ${v} not yet generated. Generating now...`)
        await generateForVariant(v)
      }
      await applyVariant(v)
    } else {
      console.log('Usage:')
      console.log('  node build/generate-icons.mjs          Generate all variants, apply A')
      console.log('  node build/generate-icons.mjs --all    Generate all variants, apply A')
      console.log('  node build/generate-icons.mjs --use b  Switch to variant B')
    }

    console.log('\nDone!')
  } catch (err) {
    console.error('Error generating icons:', err)
    process.exit(1)
  }
}

main()
