import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = path.join(root, 'public')

const assets = [
  {
    source: path.join(root, 'data', 'CeciliaBot.github.io-master', 'data', 'HeroDatabase.json'),
    target: path.join(publicDir, 'data', 'CeciliaBot.github.io-master', 'data', 'HeroDatabase.json'),
  },
  {
    source: path.join(root, 'E7Assets-Temp-main', 'assets', 'face'),
    target: path.join(publicDir, 'E7Assets-Temp-main', 'assets', 'face'),
  },
]

for (const asset of assets) {
  fs.mkdirSync(path.dirname(asset.target), { recursive: true })
  fs.cpSync(asset.source, asset.target, { recursive: true })
}
