// @refresh reload
import { mount, StartClient } from "@solidjs/start/client";

const appRoot = document.getElementById("app");
if (!appRoot) {
	throw new Error('App root element "#app" was not found.');
}

mount(() => <StartClient />, appRoot);
