import { readFile } from 'fs/promises'
import { join } from 'path'
import pico from 'picocolors'

import { ROOT } from './dirs.js'

export default async function showVersion() {
  let packagePath = join(ROOT, 'package.json')
  let packageJson = await readFile(packagePath)
  let { version } = JSON.parse(packageJson)
  process.stdout.write(`ssdeploy ${pico.bold(version)}\n`)
}
