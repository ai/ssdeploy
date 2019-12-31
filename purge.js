#!/usr/bin/env node

import callCloudflare from './lib/call-cloudflare.js'

callCloudflare('purge_cache', { purge_everything: true }).catch(e => {
  process.stderr.write(e.stack + '\n')
  process.exit(1)
})
