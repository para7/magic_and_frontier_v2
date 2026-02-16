## HonoX + SolidJS + PicoCSS + Valibot Sample

### Setup

```sh
bun install
```

### Run

```sh
bun run dev
```

Open `http://localhost:5173`.

### Behavior

- `GET /`: contact form page (SolidJS + PicoCSS)
- `POST /api/contact`: JSON API validated by Valibot

### Request example

```sh
curl -i -X POST http://localhost:5173/api/contact \\
  -H 'Content-Type: application/json' \\
  -d '{"name":"Alex","email":"alex@example.com","message":"Hello"}'
```

### Success response example

```json
{
  "ok": true,
  "data": {
    "name": "Alex",
    "email": "alex@example.com",
    "message": "Hello"
  }
}
```

### Error response example

```json
{
  "ok": false,
  "errors": [
    {
      "path": "email",
      "message": "Email must be a valid address"
    }
  ]
}
```
