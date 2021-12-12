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

  let config = template.toString()
  if (existsSync(join(root, 'yarn.lock'))) {
    config = config
      .replace('cache: npm', 'cache: yarn')
      .replace(' npm ', ' yarn ')
  } else if (existsSync(join(root, 'pnpm-lock.yaml'))) {
    config = config
      .replace('cache: npm', 'cache: pnpm')
      .replace(' npm ', ' pnpm ')
  }

  await fs.writeFile(deployPath, config)
}
