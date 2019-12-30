import runDocker from './run-docker.js'

export default async function runImage () {
  await runDocker('--version')
}
