import { basename, dirname, join } from 'path'
import { existsSync } from 'fs'
import cosmiconfig from 'cosmiconfig'
import pkgUp from 'pkg-up'

const DEFAULTS = {
  dockerfile: 'Dockerfile',
  nginxConfig: 'nginx.conf'
}

export default async function loadConfig () {
  let explorer = cosmiconfig.cosmiconfig('solid-state-deploy')
  let result = await explorer.search()
  if (result === null) {
    result = {
      config: { },
      filepath: await pkgUp()
    }
  }
  let root = dirname(result.filepath)
  for (let i in DEFAULTS) {
    if (result.config[i]) {
      result.config[i] = join(root, result.config[i])
    } else {
      let defaultPath = join(root, DEFAULTS[i])
      if (existsSync(defaultPath)) {
        result.config[i] = defaultPath
      }
    }
  }
  result.config.name = basename(root)
  return result.config
}
