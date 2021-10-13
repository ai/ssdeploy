import pico from 'picocolors'

export let isDebug = process.argv.includes('--verbose')

export function debugCmd(cmd) {
  debug(pico.gray('$ ' + cmd) + '\n')
}

export default function debug(text) {
  if (isDebug) {
    process.stderr.write(text)
  }
}
