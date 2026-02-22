# MAF Tools Monorepo

`tools` is a pnpm workspace.

## Packages

- `@maf/domain`: core domain logic (valibot schemas, usecases, types)
- `@maf/server`: Hono API server (JSON file adapter)
- `@maf/frontend`: Angular app (Hono RPC client)

## Setup

```bash
cd tools
pnpm install
```

## Run

```bash
pnpm dev
```

`pnpm dev` starts both `@maf/server` and `@maf/frontend` via Turborepo.

## Typecheck and test

```bash
pnpm typecheck
pnpm test
```

## Lint and format

```bash
pnpm lint
pnpm format
```
