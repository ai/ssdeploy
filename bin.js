#!/usr/bin/env node

import dotenv from 'dotenv'
import chalk from 'chalk'

import showVersion from './lib/show-version.js'
import showHelp from './lib/show-help.js'
import runImage from './lib/run-image.js'
import deploy from './lib/deploy.js'
import purge from './lib/purge.js'
import init from './lib/init.js'
import sign from './lib/sign.js'

dotenv.config()

async function run () {
  let command = process.argv[2]
  if (command === '--version') {
    await showVersion()
  } else if (!command || command === 'help' || command === '--help') {
    showHelp()
  } else if (command === 'init') {
    await init()
  } else if (command === 'shell') {
    await runImage('/bin/sh')
  } else if (command === 'run') {
    await runImage()
  } else if (command === 'purge') {
    await purge()
  } else if (command === 'deploy') {
    await deploy()
  } else if (command === 'sign') {
    let file = process.argv[3]
    if (!file) {
      process.stderr.write(chalk.red('Missed file to sign') + '\n')
      process.exit(1)
    }
    await sign(file)
  } else {
    process.stderr.write(chalk.red(`Unknown command ${ command }`) + '\n\n')
    showHelp()
    process.exit(1)
  }
}

run().catch(e => {
  if (!e.own) process.stderr.write(chalk.red(e.stack) + '\n')
  process.exit(1)
})
