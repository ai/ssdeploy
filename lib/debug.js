import chalk from 'chalk'

export let isDebug = process.argv.some(i => i === '--verbose')

export function debugCmd (cmd) {
  debug(chalk.gray('$ ' + cmd) + '\n')
}

export default function debug (text) {
  if (isDebug) {
    process.stderr.write(text)
  }
}
