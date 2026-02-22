import { serve } from "@hono/node-server";
import { createApp } from "./app.js";

const { app, config } = createApp();

serve(
	{
		fetch: app.fetch,
		port: config.port,
	},
	(info) => {
		console.log(`@maf/server listening on http://localhost:${info.port}`);
	},
);
