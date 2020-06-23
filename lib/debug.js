import colorette from 'colorette'

export let isDebug = process.argv.some(i => i === '--verbose')

export function debugCmd (cmd) {
  debug(colorette.gray('$ ' + cmd) + '\n')
}

export default function debug (text) {
  if (isDebug) {
    process.stderr.write(text)
  }
}
