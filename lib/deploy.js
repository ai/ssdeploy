import { spawn } from 'child_process'
import chalk from 'chalk'

import debug, { isDebug, debugCmd } from './debug.js'
import { wrap } from './show-spinner.js'
import showError from './show-error.js'
import build from './build.js'
import purge from './purge.js'

let safeEnv = { }
for (let i in process.env) {
  if (!/^(GCLOUD_|CLOUDFLARE_)/.test(i)) safeEnv[i] = process.env[i]
}

async function exec (command, opts) {
  return new Promise((resolve, reject) => {
    debugCmd(command)
    let cmd = spawn(command, { ...opts, env: safeEnv, shell: '/bin/bash' })
    let stdout = ''
    let stderr = ''
    cmd.stdout.on('data', data => {
      stdout += data.toString()
      debug(data.toString())
    })
    cmd.stderr.on('data', data => {
      stderr += data.toString()
      debug(chalk.red(data))
    })
    cmd.on('exit', code => {
      if (code === 0) {
        resolve(stdout.trim())
      } else if (isDebug) {
        reject(showError('Exit code ' + code))
      } else {
        reject(showError(stderr))
      }
    })
  })
}

async function push (image) {
  await wrap('Pushing image to Google Cloud Registry', async () => {
    await exec('gcloud auth configure-docker --quiet')
    await exec(`docker push ${ image }`)
  })
}

async function run (image, project, app, region = 'us-east1') {
  await wrap('Starting image on Google Cloud Run', async spinner => {
    try {
      await exec('gcloud components install beta --quiet')
    } catch { }
    await exec(
      `gcloud beta run deploy ${ app } --image ${ image } ` +
      `--project ${ project } --region=${ region } ` +
      '--platform managed  --allow-unauthenticated'
    )
    spinner.succeed(`Image was deployed at ${ region } server`)
  })
}

async function cleanOldImages (image) {
  await wrap('Cleaning registry from old images', async spinner => {
    let removed = 0
    let out = await exec(
      'gcloud container images list-tags ' +
      `${ image } --filter='-tags:*' --format='get(digest)'`
    )
    if (out !== '') {
      await Promise.all(out.split('\n').map(i => {
        removed += 1
        return exec(
          `gcloud container images delete '${ image }@${ i }' --quiet`
        )
      }))
    }
    spinner.succeed(`Removed ${ removed } images`)
  })
}

export default async function deploy () {
  if (!process.env.GCLOUD_PROJECT || !process.env.GCLOUD_APP) {
    throw showError(
      'Set `GCLOUD_PROJECT` and `GCLOUD_APP` environment variables at your CI'
    )
  }

  let project = process.env.GCLOUD_PROJECT
  let app = process.env.GCLOUD_APP
  let image = `gcr.io/${ project }/${ app }`

  await build(image, safeEnv, true)
  await push(image)
  await run(image, project, app, process.env.GCLOUD_REGION)
  await purge()
  await cleanOldImages(image)
}
