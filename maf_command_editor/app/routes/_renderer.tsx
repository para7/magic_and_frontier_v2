import { reactRenderer } from '@hono/react-renderer'

export default reactRenderer(({ children, title }) => {
  return (
    <html lang="ja">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title ?? 'Honox React Sample'}</title>
        <style>{`
          :root {
            font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
            color: #111827;
            background: linear-gradient(130deg, #f3f4f6, #dbeafe);
          }
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 24px;
          }
          .card {
            width: min(720px, 100%);
            background: rgba(255, 255, 255, 0.92);
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 12px 28px rgba(17, 24, 39, 0.12);
          }
          h1 {
            margin: 0 0 8px;
            font-size: 28px;
          }
          p {
            margin: 0;
            color: #4b5563;
          }
          ul {
            margin: 20px 0 0;
            padding-left: 20px;
            color: #1f2937;
            line-height: 1.8;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
})
