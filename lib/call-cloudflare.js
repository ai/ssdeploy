import { request } from 'https'

export default async function callCloudflare (command, opts) {
  await new Promise((resolve, reject) => {
    let req = request(
      {
        method: 'POST',
        hostname: 'api.cloudflare.com',
        path: `/client/v4/zones/${process.env.CLOUDFLARE_ZONE}/${command}`,
        headers: {
          'Authorization': `Bearer ${process.env.CLOUDFLARE_TOKEN}`,
          'Content-Type': 'application/json'
        }
      },
      res => {
        let data = ''
        res.on('data', chunk => {
          data += chunk
        })
        res.on('end', () => {
          let answer
          try {
            answer = JSON.parse(data)
          } catch {
            console.error(data)
            process.exit(1)
          }
          if (answer.success) {
            resolve()
          } else {
            reject(new Error(answer.errors[0].message))
          }
        })
      }
    )
    if (opts) req.write(JSON.stringify(opts))
    req.on('error', reject)
    req.end()
  })
}
