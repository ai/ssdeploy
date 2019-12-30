import { promisify } from 'util'
import child from 'child_process'

let exec = promisify(child.exec)
let runner

export default async function runDocker (args) {
  if (!runner) {
    try {
      await exec('podman2 --version')
      runner = 'podman'
    } catch {
      runner = 'docker'
    }
  }
  await exec(runner + ' ' + args)
}
