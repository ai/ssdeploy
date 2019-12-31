import showError from './show-error.js'

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
}
