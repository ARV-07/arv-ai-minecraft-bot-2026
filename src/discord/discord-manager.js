const { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class DiscordBotManager {
  constructor(config = {}) {
    this.token = config.token || process.env.DISCORD_TOKEN;
    this.guildId = config.guildId || process.env.DISCORD_GUILD_ID;
    this.commandPrefix = config.prefix || process.env.COMMAND_PREFIX || '!';
    this.mcBotManager = null;
    this.commands = new Map();
    this.client = null;
    this.isReady = false;
    this.config = config;
  }

  async initialize(mcBotManager) {
    if (!this.token) {
      console.warn('⚠️ Discord token not provided. Discord integration disabled.');
      return false;
    }

    this.mcBotManager = mcBotManager;

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
      ],
    });

    this.registerCommands();
    this.setupEventListeners();

    try {
      await this.client.login(this.token);
      console.log('✅ Discord bot logged in successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to login to Discord:', error.message);
      return false;
    }
  }

  registerCommands() {
    // Minecraft control commands
    this.commands.set('status', this.statusCommand.bind(this));
    this.commands.set('connect', this.connectCommand.bind(this));
    this.commands.set('disconnect', this.disconnectCommand.bind(this));
    this.commands.set('coords', this.coordsCommand.bind(this));
    this.commands.set('inventory', this.inventoryCommand.bind(this));
    this.commands.set('follow', this.followCommand.bind(this));
    this.commands.set('goto', this.gotoCommand.bind(this));
    this.commands.set('mine', this.mineCommand.bind(this));
    this.commands.set('collect', this.collectCommand.bind(this));
    this.commands.set('stop', this.stopCommand.bind(this));
    this.commands.set('say', this.sayCommand.bind(this));
    this.commands.set('health', this.healthCommand.bind(this));
    this.commands.set('food', this.foodCommand.bind(this));

    // Control commands
    this.commands.set('bothelp', this.botHelpCommand.bind(this));
    this.commands.set('config', this.configCommand.bind(this));
    this.commands.set('logs', this.logsCommand.bind(this));
  }

  setupEventListeners() {
    this.client.on('ready', () => {
      this.isReady = true;
      console.log(`🤖 Discord bot ready! Logged in as ${this.client.user.tag}`);
      this.client.user.setActivity('Minecraft Bot | !bothelp', { type: 'PLAYING' });
    });

    this.client.on('messageCreate', (message) => this.handleMessage(message));

    this.client.on('error', (error) => {
      console.error('❌ Discord client error:', error);
    });

    this.client.on('disconnect', () => {
      console.warn('⚠️ Discord bot disconnected');
      this.isReady = false;
    });
  }

  async handleMessage(message) {
    // Ignore bot messages
    if (message.author.bot) return;

    // Only respond to DMs or messages with prefix
    if (!message.content.startsWith(this.commandPrefix) && !message.isDMMessage) return;

    const content = message.isDMMessage ? message.content : message.content.slice(this.commandPrefix.length);
    const [commandName, ...args] = content.split(/\s+/);

    if (!commandName) return;

    const command = this.commands.get(commandName.toLowerCase());

    if (!command) {
      await message.reply({
        content: `❌ Unknown command: \`${commandName}\`. Use \`!bothelp\` for available commands.`,
        allowedMentions: { repliedUser: false },
      });
      return;
    }

    try {
      await command(message, args);
    } catch (error) {
      console.error(`Error executing command ${commandName}:`, error);
      await message.reply({
        content: `❌ Error executing command: ${error.message}`,
        allowedMentions: { repliedUser: false },
      });
    }
  }

  // ==================== STATUS & INFO COMMANDS ====================

  async statusCommand(message) {
    if (!this.mcBotManager) {
      await message.reply('❌ Minecraft bot manager not initialized');
      return;
    }

    const state = this.mcBotManager.getState ? this.mcBotManager.getState() : { status: { connected: false } };
    const connected = state.status?.connected || this.mcBotManager.isConnected?.();

    const embed = new EmbedBuilder()
      .setTitle('⛏️ Minecraft Bot Status')
      .setColor(connected ? '#00FF00' : '#FF0000')
      .addFields(
        { name: 'Status', value: connected ? '🟢 Connected' : '🔴 Offline', inline: true },
        { name: 'Health', value: `${state.status?.health || 0} ❤️`, inline: true },
        { name: 'Food', value: `${state.status?.food || 0} 🍗`, inline: true },
        { name: 'Dimension', value: state.status?.dimension || 'Unknown', inline: true },
        { name: 'Position', value: state.status?.position ? `X: ${Math.round(state.status.position.x)}, Y: ${Math.round(state.status.position.y)}, Z: ${Math.round(state.status.position.z)}` : 'Unknown', inline: false }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }

  async coordsCommand(message) {
    if (!this.mcBotManager?.isConnected?.()) {
      await message.reply('❌ Bot is not connected to Minecraft');
      return;
    }

    const state = this.mcBotManager.getState?.();
    const pos = state?.status?.position;

    if (!pos) {
      await message.reply('❌ No position data available');
      return;
    }

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('📍 Bot Location')
          .setColor('#0099FF')
          .addFields(
            { name: 'X', value: Math.round(pos.x).toString(), inline: true },
            { name: 'Y', value: Math.round(pos.y).toString(), inline: true },
            { name: 'Z', value: Math.round(pos.z).toString(), inline: true }
          )
          .setTimestamp(),
      ],
    });
  }

  async healthCommand(message) {
    const state = this.mcBotManager?.getState?.();
    const health = state?.status?.health || 0;
    const food = state?.status?.food || 0;

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('💚 Bot Health & Food')
          .setColor('#00DD00')
          .addFields(
            { name: 'Health', value: `${health}/20 ❤️`, inline: true },
            { name: 'Food', value: `${food}/20 🍗`, inline: true }
          )
          .setTimestamp(),
      ],
    });
  }

  async foodCommand(message) {
    const state = this.mcBotManager?.getState?.();
    const food = state?.status?.food || 0;
    await message.reply(`🍗 Food level: **${food}/20**`);
  }

  async inventoryCommand(message) {
    if (!this.mcBotManager?.isConnected?.()) {
      await message.reply('❌ Bot is not connected');
      return;
    }

    const items = this.mcBotManager.getInventorySummary?.() || {};
    const itemList = Object.entries(items).map(([name, count]) => `• ${name}: **${count}**`).join('\n');

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('🎒 Bot Inventory')
          .setColor('#FFAA00')
          .setDescription(itemList || 'Empty')
          .setTimestamp(),
      ],
    });
  }

  // ==================== CONTROL COMMANDS ====================

  async connectCommand(message, args) {
    const [host, port] = args;
    if (!host) {
      await message.reply('❌ Usage: `!connect <host> [port]`');
      return;
    }

    await message.reply(`⏳ Connecting to ${host}:${port || 25565}...`);

    try {
      await this.mcBotManager.connect();
      await message.reply(`✅ Connected to **${host}:${port || 25565}**`);
    } catch (error) {
      await message.reply(`❌ Failed to connect: ${error.message}`);
    }
  }

  async disconnectCommand(message) {
    try {
      await this.mcBotManager.disconnect?.();
      await message.reply('✅ Disconnected from Minecraft server');
    } catch (error) {
      await message.reply(`❌ Error disconnecting: ${error.message}`);
    }
  }

  async followCommand(message, args) {
    if (!this.mcBotManager?.isConnected?.()) {
      await message.reply('❌ Bot is not connected');
      return;
    }

    const target = args[0] || message.author.username;
    await message.reply(`👀 Following **${target}**...`);

    try {
      await this.mcBotManager.followPlayer?.(target);
      await message.reply(`✅ Now following **${target}**`);
    } catch (error) {
      await message.reply(`❌ Error: ${error.message}`);
    }
  }

  async gotoCommand(message, args) {
    if (!this.mcBotManager?.isConnected?.()) {
      await message.reply('❌ Bot is not connected');
      return;
    }

    const [x, y, z] = args;
    if (!x || !y || !z) {
      await message.reply('❌ Usage: `!goto <x> <y> <z>`');
      return;
    }

    await message.reply(`🗺️ Moving to **${x}, ${y}, ${z}**...`);

    try {
      await this.mcBotManager.safeMoveTo?.(Number(x), Number(y), Number(z));
      await message.reply(`✅ Reached **${x}, ${y}, ${z}**`);
    } catch (error) {
      await message.reply(`❌ Error: ${error.message}`);
    }
  }

  async mineCommand(message, args) {
    if (!this.mcBotManager?.isConnected?.()) {
      await message.reply('❌ Bot is not connected');
      return;
    }

    const [blockName, amountArg] = args;
    const amount = Number(amountArg || 1);

    if (!blockName) {
      await message.reply('❌ Usage: `!mine <block> [amount]`');
      return;
    }

    await message.reply(`⛏️ Mining **${amount}x ${blockName}**...`);

    try {
      const mined = await this.mcBotManager.mineBlock?.(blockName, amount);
      await message.reply(`✅ Mined **${mined || amount}x ${blockName}**`);
    } catch (error) {
      await message.reply(`❌ Error: ${error.message}`);
    }
  }

  async collectCommand(message, args) {
    if (!this.mcBotManager?.isConnected?.()) {
      await message.reply('❌ Bot is not connected');
      return;
    }

    const [itemName, amountArg] = args;
    const amount = Number(amountArg || 1);

    if (!itemName) {
      await message.reply('❌ Usage: `!collect <item> [amount]`');
      return;
    }

    await message.reply(`🔍 Collecting **${amount}x ${itemName}**...`);

    try {
      const collected = await this.mcBotManager.collectItem?.(itemName, amount);
      await message.reply(`✅ Collected **${collected || amount}x ${itemName}**`);
    } catch (error) {
      await message.reply(`❌ Error: ${error.message}`);
    }
  }

  async stopCommand(message) {
    try {
      await this.mcBotManager.stopMovement?.();
      await message.reply('🛑 Bot stopped');
    } catch (error) {
      await message.reply(`❌ Error: ${error.message}`);
    }
  }

  async sayCommand(message, args) {
    const text = args.join(' ');
    if (!text) {
      await message.reply('❌ Usage: `!say <message>`');
      return;
    }

    try {
      this.mcBotManager.sendMessage?.(text);
      await message.reply(`💬 Said: **${text}**`);
    } catch (error) {
      await message.reply(`❌ Error: ${error.message}`);
    }
  }

  // ==================== HELP & CONFIG ====================

  async botHelpCommand(message) {
    const helpText = `
🤖 **Minecraft Bot Commands**

**STATUS:**
\`!status\` - Show bot status
\`!coords\` - Get bot location
\`!health\` - Show health & food
\`!inventory\` - Show inventory

**CONTROL:**
\`!connect <host> [port]\` - Connect to server
\`!disconnect\` - Disconnect
\`!follow [player]\` - Follow a player
\`!goto <x> <y> <z>\` - Move to coordinates
\`!stop\` - Stop movement
\`!mine <block> [amount]\` - Mine blocks
\`!collect <item> [amount]\` - Collect items
\`!say <message>\` - Send chat message

**INFO:**
\`!config\` - Show current config
\`!bothelp\` - Show this message
\`!logs\` - Get recent logs
`;

    await message.reply({ content: helpText, allowedMentions: { repliedUser: false } });
  }

  async configCommand(message) {
    const embed = new EmbedBuilder()
      .setTitle('⚙️ Bot Configuration')
      .setColor('#9900FF')
      .addFields(
        { name: 'Prefix', value: this.commandPrefix, inline: true },
        { name: 'Discord Tag', value: this.client?.user?.tag || 'Unknown', inline: true },
        { name: 'Bot Status', value: this.mcBotManager?.isConnected?.() ? '🟢 Online' : '🔴 Offline', inline: true },
        { name: 'Discord Status', value: this.isReady ? '🟢 Connected' : '🔴 Disconnected', inline: true }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }

  async logsCommand(message) {
    try {
      const logs = this.mcBotManager.getLogs?.() || [];
      const recentLogs = logs.slice(-10).map(log => `\`${log}\``).join('\n');

      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('📋 Recent Logs')
            .setColor('#00FFFF')
            .setDescription(recentLogs || 'No logs available')
            .setTimestamp(),
        ],
      });
    } catch (error) {
      await message.reply(`❌ Error fetching logs: ${error.message}`);
    }
  }

  // ==================== UTILITIES ====================

  async sendStatus() {
    if (!this.isReady || !this.guildId) return;

    try {
      const guild = await this.client.guilds.fetch(this.guildId);
      const statusChannel = guild.channels.cache.find(c => c.name === 'bot-status' && c.type === ChannelType.GuildText);

      if (statusChannel) {
        const state = this.mcBotManager?.getState?.();
        const connected = this.mcBotManager?.isConnected?.();

        const embed = new EmbedBuilder()
          .setTitle('🤖 Bot Status Update')
          .setColor(connected ? '#00FF00' : '#FF0000')
          .addFields(
            { name: 'Status', value: connected ? '🟢 Online' : '🔴 Offline', inline: true },
            { name: 'Updated', value: new Date().toLocaleTimeString(), inline: true }
          );

        await statusChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error sending status:', error);
    }
  }

  async close() {
    if (this.client) {
      await this.client.destroy();
      this.isReady = false;
      console.log('Discord bot closed');
    }
  }
}

module.exports = { DiscordBotManager };
