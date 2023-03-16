import { writeFile, unlink, rename, readFile } from 'fs/promises'
import { promisify } from 'util'
import child from 'child_process'

let exec = promisify(child.exec)

export default async function sign(path) {
  let content = await readFile(path)
  let cleared = content
    .toString()
    .replace(/-----BEGIN PGP SIGNED MESSAGE-----\nHash:[^\n]+\n\n/, '')
    .replace(/-----BEGIN PGP SIGNATURE-----\n\n[\W\w]+$/m, '')
  await writeFile(path, cleared)
  await exec(`gpg --clearsign ${path}`)
  await unlink(path)
  await rename(path + '.asc', path)
}
