# SolidStart

Everything you need to build a Solid project, powered by [`solid-start`](https://start.solidjs.com);

## Creating a project

```bash
# create a new project in the current directory
bun create solid@latest

# create a new project in my-app
bun create solid@latest my-app
```

## Developing

Once you've created a project and installed dependencies with `bun install`, start a development server:

```bash
bun install
bun run dev

# or start the server and open the app in a new browser tab
bun run dev -- --open
```

## Configuration

This app loads storage settings from `config.json`.

```json
{
  "storage": {
    "itemStatePath": "/tmp/form-state.json"
  }
}
```

Update `storage.itemStatePath` to change where item state JSON is saved.

## Building

Solid apps are built with _presets_, which optimise your project for deployment to different environments.

By default, `bun run build` generates an app you can run with `bun run start`.

## This project was created with the [Solid CLI](https://github.com/solidjs-community/solid-cli)
