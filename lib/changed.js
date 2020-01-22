import { existsSync, promises as fs } from 'fs'
import { dirname, join } from 'path'
import folderHash from 'folder-hash'
import { get } from 'https'
import hasha from 'hasha'
import pkgUp from 'pkg-up'
import chalk from 'chalk'

import showError, { showWarning } from './show-error.js'
import showSpinner, { wrap } from './show-spinner.js'

async function loadPrev (url) {
  if (url.startsWith('http://')) {
    throw showError('`ssdeploy changed` supports only https:// websites')
  }
  if (!url.startsWith('https://')) {
    url = 'https://' + url
  }

  try {
    new URL(url)
  } catch (e) {
    if (e.code === 'ERR_INVALID_URL') {
      throw showError(
        'Ivalid URL `' + url + '` in `WEBSITE_URL` environment variables'
      )
    } else {
      throw e
    }
  }

  if (!url.endsWith('/')) url += '/'
  let hashUrl = url + 'ssdeploy-hash.txt'

  let spinner = showSpinner('Loading hash from previous deploy')

  return new Promise(resolve => {
    function error (e) {
      spinner.fail()
      if (typeof e === 'string') {
        showWarning(e)
      } else {
        showWarning(e.message)
      }
      resolve('')
    }

    let req = get(hashUrl, res => {
      if (res.statusCode === 404) {
        error(
          '`' + hashUrl + '` file was not found.\n' +
          'It is OK for first deploy.'
        )
        return
      } else if (res.statusCode !== 200) {
        error(
          'Your website return ' + res.statusCode + ' code ' +
          'on `' + hashUrl + '` request'
        )
      }
      let data = ''
      res.on('data', chunk => {
        data += chunk.toString()
      })
      res.on('end', () => {
        if (data.endsWith('=')) {
          spinner.succeed()
          resolve(data)
        } else {
          error('Wrong data found at `' + hashUrl + '`')
        }
      })
    })
    req.on('error', error)
    req.end()
  })
}

async function calcCurrent () {
  let root = join(dirname(await pkgUp()))
  let dist = join(root, 'dist')
  let ignoreFile = join(root, '.dockerignore')
  let dockerFile = join(root, 'Dockerfile')
  let nginxFile = join(root, 'nginx.conf')
  let workflowFile = join(root, '.github', 'workflows', 'deploy.yml')
  let [{ hash }, workflow, ignore, docker, nginx] = await Promise.all([
    folderHash.hashElement(dist),
    hasha.fromFile(workflowFile),
    existsSync(ignoreFile) ? hasha.fromFile(ignoreFile) : '',
    existsSync(dockerFile) ? hasha.fromFile(dockerFile) : '',
    existsSync(nginxFile) ? hasha.fromFile(nginxFile) : ''
  ])
  return [dist, hasha(hash + workflow + ignore + docker + nginx) + '=']
}

export default async function changed () {
  if (!process.env.WEBSITE_URL) {
    showWarning(
      'Set `WEBSITE_URL` environment variables at your CI ',
      'to deploy websites only when files will be changed'
    )
    return
  }

  let [prev, [dist, current]] = await Promise.all([
    loadPrev(process.env.WEBSITE_URL.trim()),
    calcCurrent()
  ])
  await wrap('Writing ssdeploy-hash.txt', async () => {
    await fs.writeFile(join(dist, 'ssdeploy-hash.txt'), current)
  })
  if (prev === current) {
    process.stderr.write(
      chalk.yellow('Files were not changed from latest deploy. Stop deploy.\n')
    )
    process.stdout.write('::set-output name=noChanges::1\n')
  } else {
    if (prev !== '') {
      process.stderr.write('Files was changed. ')
    }
    process.stderr.write('Continue deploy.\n')
  }
}
