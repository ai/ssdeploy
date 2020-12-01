import { promises as fs } from 'fs'
import { promisify } from 'util'
import child from 'child_process'

let exec = promisify(child.exec)

export default async function sign (path) {
  let content = await fs.readFile(path)
  let cleared = content
    .toString()
    .replace(/-----BEGIN PGP SIGNED MESSAGE-----\nHash:[^\n]+\n\n/, '')
    .replace(/-----BEGIN PGP SIGNATURE-----\n\n[\W\w]+$/m, '')
  await fs.writeFile(path, cleared)
  await exec(`gpg --clearsign ${path}`)
  await fs.unlink(path)
  await fs.rename(path + '.asc', path)
}
