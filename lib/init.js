import { existsSync, promises as fs } from 'fs'
import { dirname, join } from 'path'
import makeDir from 'make-dir'

import { findPackageDir } from './find-package-up.js'
import { CONFIGS } from './dirs.js'

export default async function init() {
  let root = await findPackageDir()
  let deployPath = join(root, '.github', 'workflows', 'deploy.yml')
  await makeDir(dirname(deployPath))
  let template = await fs.readFile(join(CONFIGS, 'deploy.yml'))
  let isYarn = existsSync(join(root, 'yarn.lock'))
  let config = template
    .toString()
    .split('\n')
    .flatMap(i => {
      if (i.startsWith('YARN')) {
        return isYarn ? [i.slice(4)] : []
      } else if (i.startsWith('NPM ')) {
        return isYarn ? [] : [i.slice(4)]
      } else {
        return [i]
      }
    })
    .join('\n')
  await fs.writeFile(deployPath, config)
}
