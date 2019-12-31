import { promisify } from 'util'
import child from 'child_process'

let exec = promisify(child.exec)
let runner

export default async function detectDocker () {
  if (!runner) {
    try {
      await exec('podman --version')
      runner = 'podman'
    } catch {
      runner = 'docker'
    }
  }
  return runner
}
