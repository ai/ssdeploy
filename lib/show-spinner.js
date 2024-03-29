import pico from 'picocolors'

export default function showSpinner(text) {
  process.stdout.write(pico.gray('- ') + text + '\n')
  let finished = false
  return {
    succeed(newText = text) {
      if (!finished) {
        finished = true
        process.stdout.write(pico.green('✔ ') + newText + '\n')
      }
    },
    fail(newText = text) {
      if (!finished) {
        finished = true
        process.stdout.write(pico.red('✖ ') + newText + '\n')
      }
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
