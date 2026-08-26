import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const svg = join(root, 'public', 'icon.svg')

await sharp(svg).resize(192, 192).png().toFile(join(root, 'public', 'pwa-192x192.png'))
await sharp(svg).resize(512, 512).png().toFile(join(root, 'public', 'pwa-512x512.png'))

console.log('Icons generated: pwa-192x192.png, pwa-512x512.png')
