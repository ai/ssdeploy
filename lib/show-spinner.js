import { green, gray, red } from 'nanocolors'

export default function showSpinner(text) {
  process.stdout.write(gray('- ') + text + '\n')
  return {
    succeed(newText = text) {
      process.stdout.write(green('✔ ') + newText + '\n')
    },
    fail(newText = text) {
      process.stdout.write(red('✖ ') + newText + '\n')
    }
  }
}

export async function wrap(text, cb) {
  let spinner = showSpinner(text)
  try {
    let result = await cb(spinner)
    spinner.succeed()
    return result
  } catch (e) {
    spinner.fail()
    throw e
  }
}
