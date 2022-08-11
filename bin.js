#!/usr/bin/env node

import dotenv from 'dotenv'
import pico from 'picocolors'

import deploy, { cleanDeploy } from './lib/deploy.js'
import showVersion from './lib/show-version.js'
import showHelp from './lib/show-help.js'
import runImage from './lib/run-image.js'
import changed from './lib/changed.js'
import purge from './lib/purge.js'
import init from './lib/init.js'
import sign from './lib/sign.js'

dotenv.config()

function getPullRequestId() {
  let pr = process.argv[3]
  if (!pr) {
    process.stderr.write(pico.red('Missed pull request ID') + '\n')
    process.exit(1)
  }
  return pr
}

async function run() {
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
  } else if (command === 'changed') {
    await changed()
  } else if (command === 'deploy') {
    await deploy()
  } else if (command === 'preview') {
    await deploy(getPullRequestId())
  } else if (command === 'close') {
    await cleanDeploy(getPullRequestId())
  } else if (command === 'sign') {
    let file = process.argv[3]
    if (!file) {
      process.stderr.write(pico.red('Missed file to sign') + '\n')
      process.exit(1)
    }
    await sign(file)
  } else {
    process.stderr.write(pico.red(`Unknown command ${command}`) + '\n\n')
    showHelp()
    process.exit(1)
  }
}

run().catch(e => {
  if (!e.own) process.stderr.write(pico.red(e.stack) + '\n')
  process.exit(1)
})
