import { spawn } from 'child_process'
import pico from 'picocolors'

import debug, { isDebug, debugCmd } from './debug.js'
import { wrap } from './show-spinner.js'
import showError from './show-error.js'
import build from './build.js'
import purge from './purge.js'

let safeEnv = {}
for (let i in process.env) {
  if (!/^(GCLOUD_|CLOUDFLARE_)/.test(i)) safeEnv[i] = process.env[i]
}

async function exec(command, opts) {
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
      debug(pico.yellow(data))
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

async function push(image) {
  await wrap('Pushing image to Google Cloud Registry', async () => {
    await exec('gcloud auth configure-docker --quiet')
    await exec(`docker push ${image}`)
  })
}

async function run(image, project, app, region = 'us-east1', preview) {
  await wrap('Starting image on Google Cloud Run', async spinner => {
    let out = await exec(
      `gcloud run deploy ${app} --image ${image} ` +
        `--project ${project} --region=${region.trim()} ` +
        '--platform managed --allow-unauthenticated' +
        (preview ? ` --tag preview-${preview} --no-traffic` : '')
    )
    spinner.succeed(`Image was deployed at ${region} server`)
    if (preview) {
      let match = out.match(/The revision can be reached directly at ([^\s]+)/)
      if (match) {
        process.stdout.write(`::set-output name=url::${match[1]}\n`)
      } else {
        process.stdout.write(out)
        process.stdout.write(pico.red('Can’t find revision URL in output\n'))
      }
    }
  })
}

async function cleanOldImages(image) {
  await wrap('Cleaning registry from old images', async spinner => {
    let removed = 0
    let out = await exec(
      'gcloud container images list-tags ' +
        `${image} --filter='-tags:*' --format='get(digest)'`
    )
    if (out !== '') {
      await Promise.all(
        out.split('\n').map(i => {
          removed += 1
          return exec(`gcloud container images delete '${image}@${i}' --quiet`)
        })
      )
    }
    spinner.succeed(`Removed ${removed} images`)
  })
}

export default async function deploy(preview) {
  if (!process.env.GCLOUD_PROJECT || !process.env.GCLOUD_APP) {
    throw showError(
      'Set `GCLOUD_PROJECT` and `GCLOUD_APP` environment variables at your CI'
    )
  }

  let project = process.env.GCLOUD_PROJECT.trim()
  let app = process.env.GCLOUD_APP.trim()
  let image = `gcr.io/${project}/${app}`
  if (preview) image += `:preview-${preview}`

  await build(image, safeEnv, true, preview)
  await push(image)
  await run(image, project, app, process.env.GCLOUD_REGION, preview)
  if (!preview) await purge()
  await cleanOldImages(image)
}

export async function cleanDeploy() {}
