import { spawn } from 'child_process'
import open from 'open'
import pico from 'picocolors'

import detectDocker from './detect-docker.js'
import { debugCmd } from './debug.js'
import build from './build.js'

let y = pico.yellow

export default async function runImage(script) {
  let bin = await detectDocker()
  let name = await build()
  let args = [
    'run',
    '-v',
    './dist/:/var/www/',
    '--privileged',
    '--rm',
    '-p',
    '8000:80',
    '-e',
    'PORT=80',
    '-it',
    name
  ]
  if (script) args.push(script)
  debugCmd(bin + ' ' + args.join(' '))
  spawn(bin, args, { stdio: 'inherit' })
  if (!script) {
    let ctrlC = 'Ctrl+C'
    if (process.platform === 'darwin') ctrlC = 'Cmd + .'
    process.stderr.write(
      `  Website is available to test at ${y('http://localhost:8000/')}\n` +
        `  Press ${y(ctrlC)} to stop the server\n`
    )
    open('http://localhost:8000/')
  }
}
