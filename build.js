import { existsSync, promises as fs } from 'fs'
import { basename, dirname, join } from 'path'
import { spawn } from 'child_process'
import pkgUp from 'pkg-up'
import chalk from 'chalk'

import detectDocker from './detect-docker.js'
import showSpinner from './show-spinner.js'
import { ROOT } from './dirs.js'
import debug, { debugCmd } from './debug.js'

export default async function build (name, env = process.env, forceDocker) {
  let root = dirname(await pkgUp())
  if (!name) name = basename(root)

  let customDocker = join(root, 'Dockerfile')
  let localDocker = join(ROOT, 'Dockerfile')
  let customIgnore = join(root, '.dockerignore')
  let localIgnore = join(ROOT, '.dockerignore')
  let nginxPath = join(root, 'nginx.conf')

  let temp = []
  try {
    let dockerfile = localDocker
    if (existsSync(customDocker)) dockerfile = customDocker
    if (!existsSync(customIgnore)) {
      await fs.copyFile(localIgnore, customIgnore)
      temp.push(customIgnore)
    }
    if (!existsSync(nginxPath)) {
      await fs.writeFile(nginxPath, '\n')
      temp.push(nginxPath)
    }

    let bin = forceDocker ? 'docker' : await detectDocker()
    let text = 'Building Docker image'
    if (bin === 'podman') text = 'Building Podman image'

    await new Promise((resolve, reject) => {
      let args = ['build', '-f', dockerfile, '-t', name, '.']
      debugCmd(bin + ' ' + args.join(' '))
      let docker = spawn(bin, args, { env })
      let spinner = showSpinner(text)
      docker.stdout.on('data', data => {
        debug(data)
      })
      docker.stderr.on('data', data => {
        spinner.fail()
        process.stderr.write(chalk.red(data))
      })
      docker.on('exit', code => {
        if (code === 0) {
          spinner.succeed()
          resolve()
        } else {
          let err = new Error('Docker error ' + code)
          err.own = true
          reject(err)
        }
      })
    })
  } finally {
    await Promise.all(temp.map(i => fs.unlink(i)))
  }
  return name
}
