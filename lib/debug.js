import kleur from 'kleur'

export let isDebug = process.argv.some(i => i === '--verbose')

export function debugCmd (cmd) {
  debug(kleur.gray('$ ' + cmd) + '\n')
}

export default function debug (text) {
  if (isDebug) {
    process.stderr.write(text)
  }
}
