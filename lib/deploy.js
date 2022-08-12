import { spawn, execSync } from 'child_process'
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
      let out = data.toString()
      stdout += out
      debug(out)
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

async function setPreviewUrl(project, app, region = 'us-east1', preview) {
  let base = execSync(
    `gcloud run services describe ${app} ` +
      `--project ${project} --region ${region} --format 'value(status.url)'`
  )
  let url = base.replace('https://', `https://preview-${preview}--`)
  process.stdout.write(`::set-output name=url::${url}\n`)
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
        console.log(out)
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
  let taggedImage = preview ? `${image}:preview-${preview}` : image

  await build(taggedImage, safeEnv, true, preview)
  await push(taggedImage)
  await run(taggedImage, project, app, process.env.GCLOUD_REGION, preview)
  if (preview) {
    await setPreviewUrl(project, app, process.env.GCLOUD_REGION, preview)
  } else {
    await purge()
  }
  await cleanOldImages(image)
}

export async function stopPreview(preview) {
  let project = process.env.GCLOUD_PROJECT.trim()
  let app = process.env.GCLOUD_APP.trim()
  let image = `gcr.io/${project}/${app}`

  await exec(
    `gcloud run services update-traffic ${app} --project ${project} ` +
      `--remove-tags preview-${preview}`
  )
  await cleanOldImages(image)
}
