import { gray } from 'colorette'

export let isDebug = process.argv.some(i => i === '--verbose')

export function debugCmd (cmd) {
  debug(gray('$ ' + cmd) + '\n')
}

export default function debug (text) {
  if (isDebug) {
    process.stderr.write(text)
  }
}
