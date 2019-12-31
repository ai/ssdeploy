import { promises as fs } from 'fs'
import { join } from 'path'
import child from 'child_process'
import chalk from 'chalk'

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
    child.exec(command, { ...opts, env: safeEnv }, (error, stdout, stderr) => {
      if (error) {
        process.stderr.write(chalk.red(stderr))
        reject(error)
      } else {
        resolve(stdout)
      }
    })
  })
}

async function installGcloud () {
  await wrap('Installing Google Cloud', async () => {
    await exec('curl https://sdk.cloud.google.com | bash')
    await exec('exec /bin/sh gcloud components install beta')
  })
}

async function auth (gauth) {
  let key = (Buffer.from(gauth, 'base64')).toString('utf-8')
  let keyPath = join(process.env.HOME, 'gcloud-key.json')
  await fs.writeFile(keyPath, key)
  await exec(`gcloud auth activate-service-account --key-file=${ keyPath }`)
  await fs.unlink(keyPath)
  await exec('gcloud auth configure-docker')
}

async function push (image) {
  await wrap('Pushing image to Google Cloud Registry', async () => {
    await exec(`docker push ${ image }`)
  })
}

async function run (image, project, app, region = 'us-east1') {
  await wrap('Starting image on Google Cloud Run', async () => {
    await exec(
      `gcloud beta run deploy ${ app } --image ${ image } ` +
      `--project ${ project } --region=${ region } --platform managed`
    )
  })
}

async function cleanOldImages (image) {
  await wrap('Cleaning old images', async spinner => {
    let removed = 0
    let out = await exec(
      'gcloud container images list-tags ' +
      `${ image } --filter='-tags:*' --format='get(digest)'`
    )
    await Promise.all(out.strip().split('\n').map(i => {
      return exec(`gcloud container images delete '${ image }@${ i }'`)
    }))
    spinner.succeed(`Removed ${ removed } images`)
  })
}

export default async function deploy () {
  if (!process.env.GCLOUD_PROJECT || !process.env.GCLOUD_APP) {
    throw showError(
      'Set `GCLOUD_PROJECT` and `GCLOUD_APP` environment variables at your CI'
    )
  }
  if (!process.env.GCLOUD_AUTH) {
    throw showError(
      'Check our docs to set `GCLOUD_AUTH` environment variables at your CI:',
      'https://github.com/ai/solid-state-deploy'
    )
  }

  let project = process.env.GCLOUD_PROJECT
  let app = process.env.GCLOUD_APP
  let image = `gcr.io/${ project }/${ app }`

  await build(image, safeEnv)
  await installGcloud()
  await auth(process.env.GCLOUD_AUTH)
  await push(image)
  await run(image, project, app, process.env.GCLOUD_REGION)
  await purge()
  await cleanOldImages(image)
}
