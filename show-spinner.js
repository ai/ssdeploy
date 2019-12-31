import ora from 'ora'

import { isDebug } from './debug.js'

export default function showSpinner (text) {
  let opts = { text, color: 'green' }
  if (isDebug) opts.isEnabled = false
  return ora(opts).start()
}

export async function wrap (text, cb) {
  let spinner
  try {
    spinner = showSpinner(text)
    let result = await cb(spinner)
    spinner.succeed()
    return result
  } catch (e) {
    spinner.fail()
    throw e
  }
}
