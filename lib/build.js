import { existsSync, promises as fs } from 'fs'
import { basename, dirname, join } from 'path'
import { spawn, exec } from 'child_process'
import pkgUp from 'pkg-up'
import chalk from 'chalk'
import bytes from 'bytes'

import detectDocker from './detect-docker.js'
import showSpinner from './show-spinner.js'
import { CONFIGS } from './dirs.js'
import debug, { debugCmd } from './debug.js'

function getSize (bin, name, env) {
  return new Promise(resolve => {
    exec(
      `${ bin } image inspect ${ name }:latest --format='{{.Size}}'`,
      { env },
      (error, stdout) => {
        if (error) {
          resolve()
        } else {
          resolve(parseInt(stdout))
        }
      }
    )
  })
}

export default async function build (name, env = process.env, forceDocker) {
  let root = dirname(await pkgUp())
  if (!name) name = basename(root)
  let bin = forceDocker ? 'docker' : await detectDocker()

  let customDocker = join(root, 'Dockerfile')
  let localDocker = join(CONFIGS, 'Dockerfile')
  let customIgnore = join(root, '.dockerignore')
  let localIgnore = join(CONFIGS, '.dockerignore')
  let nginxPath = join(root, 'nginx.conf')

  let dockerfile = localDocker
  if (existsSync(customDocker)) dockerfile = customDocker

  let args = ['build', '-f', dockerfile, '-t', name, '.']
  debugCmd(bin + ' ' + args.join(' '))

  let text = 'Building Docker image'
  if (bin === 'podman') text = 'Building Podman image'
  let spinner = showSpinner(text)

  let temp = []
  try {
    if (!existsSync(customIgnore)) {
      await fs.copyFile(localIgnore, customIgnore)
      temp.push(customIgnore)
    }
    if (!existsSync(nginxPath)) {
      await fs.writeFile(nginxPath, '\n')
      temp.push(nginxPath)
    }

    await new Promise((resolve, reject) => {
      let docker = spawn(bin, args, { env })
      let steps = 0
      docker.stdout.on('data', data => {
        if (!process.env.CI && !process.env.GITHUB_ACTIONS) {
          if (data.toString().startsWith('STEP ')) {
            steps += 1
            spinner.text = `${ text }: step ${ steps }`
          }
        }
        debug(data)
      })
      let output = ''
      docker.stderr.on('data', data => {
        output += data.toString()
      })
      docker.on('exit', code => {
        if (code === 0) {
          resolve()
        } else {
          spinner.fail()
          process.stderr.write(chalk.red(output))
          let err = new Error('Docker error ' + code)
          err.own = true
          reject(err)
        }
      })
    })
  } finally {
    await Promise.all(temp.map(i => fs.unlink(i)))
  }

  let size = await getSize(bin, name, env)
  if (size) {
    spinner.succeed(`Built ${ bytes(size, { unitSeparator: ' ' }) } image`)
  }

  return name
}
