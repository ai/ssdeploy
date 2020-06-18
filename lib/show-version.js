import { promises as fs } from 'fs'
import { join } from 'path'
import kleur from 'kleur'

import { ROOT } from './dirs.js'

export default async function showVersion () {
  let packagePath = join(ROOT, 'package.json')
  let packageJson = await fs.readFile(packagePath)
  let { version } = JSON.parse(packageJson)
  process.stdout.write(`ssdeploy ${kleur.bold(version)}\n`)
}
