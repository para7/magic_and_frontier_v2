import { jsxRenderer } from 'hono/jsx-renderer'
import { Script } from 'honox/server'

export default jsxRenderer(({ children }) => {
  return (
    <html lang='en'>
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <title>HonoX Solid Form Sample</title>
        <link
          rel='stylesheet'
          href='https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css'
        />
        {import.meta.env.PROD ? (
          <Script src='/app/client.tsx' />
        ) : (
          <script type='module' src='/app/client.tsx'></script>
        )}
      </head>
      <body>
        <main class='container'>{children}</main>
      </body>
    </html>
  )
})
