import callCloudflare from './call-cloudflare.js'
import showError from './show-error.js'
import { wrap } from './show-spinner.js'

export default async function purge () {
  if (!process.env.CLOUDFLARE_ZONE || !process.env.CLOUDFLARE_TOKEN) {
    throw showError(
      'Get zone ID and API token in CLoudflare dashboard',
      'and set `CLOUDFLARE_TOKEN` and `CLOUDFLARE_ZONE`',
      'environment variables at your CI'
    )
  }
  await wrap('Cleaning CDN cache', async () => {
    await callCloudflare('purge_cache', { purge_everything: true })
  })
}
