import { resolve, parse, dirname } from 'path'
import { existsSync } from 'fs'

import showError from './show-error.js'

async function findUp(name, cwd = '') {
  let directory = resolve(cwd)
  let { root } = parse(directory)

  while (true) {
    let foundPath = await resolve(directory, name)

    if (existsSync(foundPath)) {
      return foundPath
    }

    if (directory === root) {
      return undefined
    }

    directory = dirname(directory)
  }
}

export async function findPackageUp(cwd) {
  let path = await findUp('package.json', cwd)
  if (!path) throw showError('Can’t find package.json')
  return path
}

export async function findPackageDir(cwd) {
  return dirname(await findPackageUp(cwd))
}
