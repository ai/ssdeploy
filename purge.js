import callCloudflare from './call-cloudflare.js'
import { showWarning } from './show-error.js'
import { wrap } from './show-spinner.js'

export default async function purge () {
  if (!process.env.CLOUDFLARE_ZONE || !process.env.CLOUDFLARE_TOKEN) {
    showWarning(
      'Get zone ID and API token in CLoudflare dashboard',
      'and set `CLOUDFLARE_TOKEN` and `CLOUDFLARE_ZONE`',
      'environment variables at your CI'
    )
  } else {
    await wrap('Cleaning CDN cache', async spinner => {
      await callCloudflare('purge_cache', { purge_everything: true })
      spinner.succeed('CDN cache was cleaned')
    })
  }
}
