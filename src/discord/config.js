require('dotenv').config();

// Discord bot token and configuration
const DISCORD_CONFIG = {
  token: process.env.DISCORD_TOKEN,
  guildId: process.env.DISCORD_GUILD_ID,
  clientId: process.env.DISCORD_CLIENT_ID,
  prefix: process.env.COMMAND_PREFIX || '!',
};

module.exports = { DISCORD_CONFIG };
