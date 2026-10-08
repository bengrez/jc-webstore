import 'dotenv/config'
import { createServer } from 'node:http'
import { env } from './lib/env.js'
import { createApp } from './server/app.js'

const app = createApp()
const server = createServer(app)

const onListening = () => {
  console.log(`[server] listening on http://${env.HOST ?? 'localhost'}:${env.PORT}`)
}

if (env.HOST) server.listen(env.PORT, env.HOST, onListening)
else server.listen(env.PORT, onListening)

process.on('SIGTERM', () => {
  server.close(() => process.exit(0))
})
