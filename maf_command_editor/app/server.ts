import { showRoutes } from 'hono/dev'
import { createApp } from 'honox/server'

const app = createApp()

app.use('/api/*', async (c, next) => {
  const startedAt = Date.now()
  const method = c.req.method
  const path = c.req.path

  await next()

  const durationMs = Date.now() - startedAt
  console.log(
    `[API] ${method} ${path} -> ${c.res.status} (${durationMs}ms)`
  )
})

showRoutes(app)

export default app
