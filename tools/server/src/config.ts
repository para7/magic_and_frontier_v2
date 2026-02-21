import path from "node:path";

function defaultStatePath(fileName: string): string {
  return path.resolve(process.cwd(), "../../savedata", fileName);
}

export type ServerConfig = {
  port: number;
  itemStatePath: string;
  spellbookStatePath: string;
  allowedOrigin: string;
};

export function loadServerConfig(): ServerConfig {
  const rawPort = Number.parseInt(process.env.PORT ?? "8787", 10);
  return {
    port: Number.isInteger(rawPort) ? rawPort : 8787,
    itemStatePath: process.env.ITEM_STATE_PATH ?? defaultStatePath("form-state.json"),
    spellbookStatePath:
      process.env.SPELLBOOK_STATE_PATH ?? defaultStatePath("spellbook-state.json"),
    allowedOrigin: process.env.ALLOWED_ORIGIN ?? "http://localhost:4200"
  };
}
