import { writeFile, copyFile, unlink } from 'fs/promises'
import { basename, join } from 'path'
import { spawn, exec } from 'child_process'
import { existsSync } from 'fs'
import bytes from 'bytes'
import pico from 'picocolors'

import debug, { debugCmd } from './debug.js'
import { findPackageDir } from './find-package-up.js'
import detectDocker from './detect-docker.js'
import showSpinner from './show-spinner.js'
import { CONFIGS } from './dirs.js'

function getSize(bin, name, env) {
  return new Promise(resolve => {
    exec(
      `${bin} image inspect ${name}:latest --format='{{.Size}}'`,
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

export default async function build(name, env = process.env, forceDocker) {
  let root = await findPackageDir()
  if (!name) name = basename(root)
  let bin = forceDocker ? 'docker' : await detectDocker()

  let customDocker = join(root, 'Dockerfile')
  let localDocker = join(CONFIGS, 'Dockerfile')
  let customNginxTemplate = join(root, 'nginx-template.conf')
  let localNginxTemplate = join(CONFIGS, 'nginx-template.conf')
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
      await copyFile(localIgnore, customIgnore)
      temp.push(customIgnore)
    }
    if (!existsSync(nginxPath)) {
      await writeFile(nginxPath, '\n')
      temp.push(nginxPath)
    }
    if (!existsSync(customNginxTemplate)) {
      await copyFile(localNginxTemplate, customNginxTemplate)
      temp.push(customNginxTemplate)
    }

    await new Promise((resolve, reject) => {
      let docker = spawn(bin, args, { env })
      let steps = 0
      docker.stdout.on('data', data => {
        if (!process.env.CI && !process.env.GITHUB_ACTIONS) {
          if (data.toString().startsWith('STEP ')) {
            steps += 1
            process.stdout.write(`${text}: step ${steps}\n`)
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
          process.stderr.write(pico.red(output))
          let err = new Error('Docker error ' + code)
          err.own = true
          reject(err)
        }
      })
    })
  } finally {
    await Promise.all(temp.map(i => unlink(i)))
  }

  let size = await getSize(bin, name, env)
  if (size) {
    spinner.succeed(`Built ${bytes(size, { unitSeparator: ' ' })} image`)
  }

  return name
}
