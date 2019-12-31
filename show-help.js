import chalk from 'chalk'

function print (...lines) {
  process.stdout.write(lines.join('\n') + '\n')
}

let y = chalk.yellow
let g = chalk.green
let b = chalk.bold

export default function showHelp () {
  print(
    b('Usage: ') + 'npx ssdeploy ' + g('COMMAND') + y(' [OPTION]'),
    '',
    b('Commands:'),
    '  ' + g('init') + '        Create .github/workflow/deploy.yml',
    '  ' + g('deploy') + '      Deploy website to the cloud',
    '  ' + g('run') + '         Run Docker image locally',
    '  ' + g('shell') + '       Run shell inside Docker image',
    '  ' + g('purge') + '       Clean CDN cache',
    '  ' + g('sign') + ' ' + y('FILE') + '   Sign security.txt',
    '',
    b('Arguments:'),
    '  ' + g('--verbose') + '   Show debug information',
    '',
    b('Examples:'),
    '  npx ssdeploy deploy',
    '  npx ssdeploy run',
    '  npx ssdeploy sign ./src/well-known/security.txt'
  )
}
