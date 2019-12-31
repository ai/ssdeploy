import chalk from 'chalk'

import callCloudflare from './call-cloudflare.js'

export default async function purge () {
  if (!process.env.CLOUDFLARE_ZONE || !process.env.CLOUDFLARE_TOKEN) {
    process.stderr.write(chalk.red(
      'Get zone ID and API token in CLoudflare dashboard \n' +
      `and set ${ chalk.yellow('CLOUDFLARE_TOKEN') } ` +
      `and ${ chalk.yellow('CLOUDFLARE_ZONE') } \n` +
      'environment variables at your CI\n'
    ))
    let err = new Error('Cloudflare error')
    err.own = true
    throw err
  }
  await callCloudflare('purge_cache', { purge_everything: true })
}
