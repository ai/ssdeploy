import { promises as fs } from 'fs'
import { dirname, join } from 'path'
import makeDir from 'make-dir'
import pkgUp from 'pkg-up'

import { CONFIGS } from './dirs.js'

export default async function init () {
  let root = dirname(await pkgUp())
  let deployPath = join(root, '.github', 'workflows', 'deploy.yml')
  await makeDir(dirname(deployPath))
  await fs.copyFile(join(CONFIGS, 'deploy.yml'), deployPath)
}
