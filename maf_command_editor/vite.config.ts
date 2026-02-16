import { defineConfig } from 'vite'
import build from '@hono/vite-build/bun'
import adapter from '@hono/vite-dev-server/bun'
import honox from 'honox/vite'
import solid from 'vite-plugin-solid'

export default defineConfig(() => {
  return {
    plugins: [
      solid({
        include: [/app\/client\.tsx$/],
      }),
      honox({
        devServer: { adapter },
        client: { input: ['/app/client.tsx'] },
      }),
      build(),
    ],
  }
})
