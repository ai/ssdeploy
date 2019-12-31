import { spawn } from 'child_process'
import open from 'open'

import detectDocker from './detect-docker.js'
import build from './build.js'

export default async function runImage () {
  let name = await build()
  spawn(await detectDocker(), [
    'run',
    '-v', './dist/:/var/www/',
    '--privileged',
    '--rm',
    '-p', '8000:80',
    '-e', 'PORT=80',
    '-it', name
  ], { stdio: 'inherit' })
  open('http://localhost:8000/')
}
