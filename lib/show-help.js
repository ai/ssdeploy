import { yellow as y, green as g, bold as b } from 'colorette'

function print (...lines) {
  process.stdout.write(lines.join('\n') + '\n')
}

export default function showHelp () {
  print(
    b('Usage: ') + 'npx ssdeploy ' + g('COMMAND') + y(' [OPTION]'),
    'Deploy simple websites with Google Cloud and Cloudflare',
    '',
    b('Commands:'),
    '  ' + g('init') + '        Create .github/workflow/deploy.yml',
    '  ' + g('deploy') + '      Deploy website to the cloud',
    '  ' + g('run') + '         Run Docker image locally',
    '  ' + g('shell') + '       Run shell inside Docker image',
    '  ' + g('purge') + '       Clean CDN cache',
    '  ' + g('changed') + '     Check changes between dist/ and website',
    '  ' + g('sign') + ' ' + y('FILE') + '   Sign security.txt',
    '',
    b('Arguments:'),
    '  ' + y('--verbose') + '   Show debug information',
    '',
    b('Examples:'),
    '  npx ssdeploy deploy',
    '  npx ssdeploy run',
    '  npx ssdeploy sign ./src/well-known/security.txt'
  )
}
