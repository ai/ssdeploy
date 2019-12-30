import chalk from 'chalk'

function print (...lines) {
  process.stdout.write(lines.join('\n') + '\n')
}

let y = chalk.yellow
let g = chalk.green
let b = chalk.bold

export default function showHelp () {
  print(
    b('Usage: ') + 'npx solid-state-deploy ' + g('COMMAND') + y(' [OPTION]'),
    '',
    b('Commands:'),
    '  ' + g('deploy') + '      Deploy website to the cloud',
    '  ' + g('run') + '         Run Docker image locally',
    '  ' + g('sign') + ' ' + y('FILE') + '   Sign security.txt',
    '',
    b('Examples:'),
    '  npx solid-state-deploy deploy',
    '  npx solid-state-deploy run',
    '  npx solid-state-deploy sign ./src/well-known/security.txt'
  )
}
