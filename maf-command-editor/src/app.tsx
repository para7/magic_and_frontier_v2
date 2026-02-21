import { MetaProvider, Title } from "@solidjs/meta";
import { A, Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./app.css";

export default function App() {
	return (
		<Router
			root={(props) => (
				<MetaProvider>
					<Title>Form Sample</Title>
					<div class="app-shell">
						<header class="site-header">
							<details class="hamburger-menu">
								<summary aria-label="menu">
									<span class="hamburger-icon" aria-hidden="true">
										☰
									</span>
								</summary>
								<nav class="site-nav">
									<A href="/item">アイテム</A>
								</nav>
							</details>
							<p class="site-title">MAF Command Editor</p>
						</header>
						<Suspense>{props.children}</Suspense>
					</div>
				</MetaProvider>
			)}
		>
			<FileRoutes />
		</Router>
	);
}
