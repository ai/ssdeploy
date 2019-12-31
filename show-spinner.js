import ora from 'ora'

export default function showSpinner (text) {
  return ora({ text, color: 'green' }).start()
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
