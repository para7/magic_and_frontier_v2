.DEFAULT_GOAL := help

.PHONY: help mc-cmd mc-shell

help:
	@echo "Available targets:"
	@echo "  make mc-cmd CMD='list'        # Run a Minecraft command via RCON"
	@echo "  make mc-shell                 # Open interactive shell in minecraft container"

mc-cmd:
	@if [ -z "$(CMD)" ]; then \
		echo "Usage: make mc-cmd CMD='<minecraft command>'" >&2; \
		exit 2; \
	fi
	@if ! command -v python3 >/dev/null 2>&1; then \
		echo "python3 is required" >&2; \
		exit 1; \
	fi
	@if ! docker compose ps --status running --services minecraft | grep -qx minecraft; then \
		echo "minecraft service is not running" >&2; \
		exit 1; \
	fi
	@RCON_PASSWORD="$$(docker compose exec -T minecraft sh -lc "sed -n 's/^rcon\\.password=//p' /mc/data/server.properties | tail -n1")"; \
	RCON_PORT="$$(docker compose exec -T minecraft sh -lc "sed -n 's/^rcon\\.port=//p' /mc/data/server.properties | tail -n1")"; \
	RCON_PORT="$${RCON_PORT:-25575}"; \
	MC_IP="$$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' minecraft)"; \
	if [ -z "$$RCON_PASSWORD" ]; then \
		echo "Could not read rcon.password from /mc/data/server.properties" >&2; \
		exit 1; \
	fi; \
	if [ -z "$$MC_IP" ]; then \
		echo "Could not resolve minecraft container IP" >&2; \
		exit 1; \
	fi; \
	exec python3 scripts/rcon.py --host "$$MC_IP" --port "$$RCON_PORT" --password "$$RCON_PASSWORD" --command "$(CMD)"

mc-shell:
	@docker exec -it minecraft /bin/sh
