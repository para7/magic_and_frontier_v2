/// <reference types="@solidjs/start/env" />

declare const Bun: {
	file(path: string): { text(): Promise<string> };
	write(path: string, data: string): Promise<number>;
};
