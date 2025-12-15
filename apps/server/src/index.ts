import 'dotenv/config'
import { createServer } from 'node:http'
import { env } from './lib/env.js'
import { createApp } from './server/app.js'

const app = createApp()
const server = createServer(app)

server.listen(env.PORT, () => {
  console.log(`[server] listening on http://localhost:${env.PORT}`)
})

process.on('SIGTERM', () => {
  server.close(() => process.exit(0))
})
