/// <reference types="@solidjs/start/env" />

declare const Bun: {
	file(path: string): { text(): Promise<string> };
	write(path: string, data: string): Promise<number>;
};

declare module "node:fs/promises" {
	export function mkdir(
		path: string,
		options?: { recursive?: boolean },
	): Promise<void>;
}

declare module "node:path" {
	export function dirname(path: string): string;
}
