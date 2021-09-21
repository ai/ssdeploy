import { gray } from 'nanocolors'

export let isDebug = process.argv.includes('--verbose')

export function debugCmd(cmd) {
  debug(gray('$ ' + cmd) + '\n')
}

export default function debug(text) {
  if (isDebug) {
    process.stderr.write(text)
  }
}
