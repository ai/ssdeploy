import { spawn } from 'child_process'
import chalk from 'chalk'
import open from 'open'

import detectDocker from './detect-docker.js'
import build from './build.js'

let y = chalk.yellow

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
  let ctrlC = 'Ctrl+C'
  if (process.platform === 'darwin') ctrlC = 'Cmd + .'
  process.stdout.write(
    `Website is available to test at ${ y('http://localhost:8000/') }\n` +
    `Press ${ y(ctrlC) } to stop the server\n`
  )
  open('http://localhost:8000/')
}
