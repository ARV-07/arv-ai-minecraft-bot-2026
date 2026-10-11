require('dotenv').config();
const { startServer } = require('./server/server');
const { BotManager } = require('./bot/connection');
const { MemoryStore } = require('./db/memory');
const { CommandRouter } = require('./bot/commands');
const { AIManager } = require('./bot/ai');

async function main() {
  const memory = new MemoryStore();
  const botManager = new BotManager({
    host: process.env.MC_HOST || 'localhost',
    port: Number(process.env.MC_PORT || 25565),
    username: process.env.MC_USERNAME || 'ARVBot',
    version: process.env.MC_VERSION || '1.20.4',
    auth: process.env.MC_AUTH || 'offline',
    reconnect: process.env.MC_RECONNECT !== 'false',
    reconnectDelay: Number(process.env.MC_RECONNECT_DELAY || 5000),
    retryLimit: Number(process.env.MC_RETRY_LIMIT || 5),
    memory
  });

  const ai = new AIManager();
  const commands = new CommandRouter(botManager, memory, ai);

  const { app, server } = await startServer({
    port: Number(process.env.PORT || 3000),
    host: process.env.HOST || '0.0.0.0',
    botManager,
    memory,
    ai,
    commands
  });

  app.locals.botManager = botManager;
  app.locals.memory = memory;
  app.locals.ai = ai;
  app.locals.commands = commands;

  if (process.env.MC_HOST || process.env.MC_PORT) {
    await botManager.connect();
  }

  const shutdown = async (signal) => {
    console.log(`Received ${signal}, shutting down`);
    if (botManager.isConnected()) {
      await botManager.disconnect();
    }
    server.close(() => process.exit(0));
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  console.log(`ARV AI Minecraft Bot is running on http://${process.env.HOST || '0.0.0.0'}:${process.env.PORT || 3000}`);
}

main().catch((error) => {
  console.error('Failed to start system:', error);
  process.exit(1);
});
