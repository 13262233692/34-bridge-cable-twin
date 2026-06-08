import { createServer } from 'http'
import app from './app.js'
import { setupWebSocket } from './services/websocketHandler.js'

const PORT = process.env.PORT || 3001

const server = createServer(app)

setupWebSocket(server, 40)

server.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`)
})

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT signal received')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})
