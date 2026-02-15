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
	@if ! docker compose ps --status running --services minecraft | grep -qx minecraft; then \
		echo "minecraft service is not running" >&2; \
		exit 1; \
	fi
	@if ! docker compose ps --status running --services backup | grep -qx backup; then \
		echo "backup service is not running" >&2; \
		exit 1; \
	fi
	@RCON_PASSWORD="$$(docker compose exec -T minecraft sh -lc "sed -n 's/^rcon\\.password=//p' /mc/data/server.properties | tail -n1")"; \
	RCON_PORT="$$(docker compose exec -T minecraft sh -lc "sed -n 's/^rcon\\.port=//p' /mc/data/server.properties | tail -n1")"; \
	RCON_PORT="$${RCON_PORT:-25575}"; \
	if [ -z "$$RCON_PASSWORD" ]; then \
		echo "Could not read rcon.password from /mc/data/server.properties" >&2; \
		exit 1; \
	fi; \
	exec docker compose exec -T backup rconclt "$$RCON_PASSWORD@minecraft:$$RCON_PORT" "$(CMD)"

mc-shell:
	@docker exec -it minecraft /bin/sh
