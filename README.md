# ARV AI Minecraft Bot

This project provides a real Java Edition Minecraft bot built with Node.js and Mineflayer. It includes a command system, natural-language task parser, persistent SQLite memory, and a responsive dashboard.

## Features

- Java Edition bot connection with reconnect logic
- Command handling for `!connect`, `!status`, `!inventory`, `!goto`, `!follow`, `!mine`, and more
- Natural-language parser for basic instructions
- SQLite-backed memory store
- Dashboard with live status and logs
- PM2 deployment support
- Safe startup and shutdown behavior

## Supported Scope

This project targets Java Edition Minecraft, primarily 1.20.x compatibility. It is intentionally scoped to a working Java bot rather than claiming universal support for all Minecraft editions or all advanced mechanics.

## Quick start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the example environment file and adjust values:
   ```bash
   cp .env.example .env
   ```

3. Start the app:
   ```bash
   npm start
   ```

4. Open the dashboard:
   ```text
   http://localhost:3000
   ```

## Environment variables

- `MC_HOST`: Minecraft server host
- `MC_PORT`: Minecraft server port
- `MC_USERNAME`: bot username
- `MC_VERSION`: Java client version (for example `1.20.4`)
- `MC_AUTH`: `offline` or `microsoft`
- `PORT`: web dashboard port
- `HOST`: bind address
- `DASHBOARD_USERNAME` and `DASHBOARD_PASSWORD`: dashboard auth

## Common commands

```text
!status
!connect localhost 25565
!disconnect
!follow
!coords
!inventory
!goto 100 64 100
!mine diamond_ore 3
!collect oak_log 16
!craft iron_pickaxe 1
!stop
!tasks
!logs
!help
```

## Natural-language examples

- "Follow me"
- "Gather 16 oak logs"
- "Go to 100 64 100"
- "Mine iron ore"
- "Stop and return home"

## PM2 deployment

```bash
npm install -g pm2
pm2 start pm2.config.js
pm2 logs arv-ai-bot
```

## Notes

- This app works against a real Java Minecraft server when configured.
- It does not fake command success — it only reports successful actions when the bot state confirms them.
- Some advanced survival features depend on server mechanics and resources available in the connected world.

## Troubleshooting

- If the bot cannot connect, check host/port/version and server availability.
- If the server requires authentication, use a valid Microsoft or offline configuration as supported by the server.
- If the dashboard does not load, verify Express is running and the port is open.
