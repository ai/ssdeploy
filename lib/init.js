import { readFile, mkdir, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

import { findPackageDir } from './find-package-up.js'
import { CONFIGS } from './dirs.js'

async function copyTemplate(manager, name, to) {
  await mkdir(dirname(to), { recursive: true })
  let template = await readFile(join(CONFIGS, name))

  let config = template.toString()
  if (manager === 'yarn') {
    config = config
      .replace('cache: npm', 'cache: yarn')
      .replace(' npm ', ' yarn ')
  } else if (manager === 'pnpm') {
    config = config
      .replace('cache: npm', 'cache: pnpm')
      .replace(' npm ', ' pnpm ')
  }

  await writeFile(join(to, name), config)
}

export default async function init() {
  let root = await findPackageDir()
  let workflows = join(root, '.github', 'workflows')

  let manager = 'npm'
  if (existsSync(join(root, 'yarn.lock'))) {
    manager = 'yarn'
  } else if (existsSync(join(root, 'pnpm-lock.yaml'))) {
    manager = 'pnpm'
  }

  await Promise.all([
    copyTemplate(manager, workflows, 'deploy.yml'),
    copyTemplate(manager, workflows, 'preview.yml'),
    copyTemplate(manager, workflows, 'close.yml')
  ])
}
