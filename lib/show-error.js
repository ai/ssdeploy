import { yellow, red } from 'nanocolors'

export function showWarning(...lines) {
  lines = lines.map(line => {
    return line.replace(/`[^`]+`/g, i => yellow(i.slice(1, -1)))
  })
  process.stderr.write(red(lines.join('\n')) + '\n')
}

export default function showError(...lines) {
  showWarning(...lines)
  let err = new Error('show error')
  err.own = true
  return err
}
