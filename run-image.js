import loadConfig from './load-config.js'
import runDocker from './run-docker.js'

export default async function runImage () {
  let config = await loadConfig()
  await runDocker('--version')
  console.log(config.name)
}
